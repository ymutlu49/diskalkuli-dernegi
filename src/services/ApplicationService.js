/**
 * Membership / representative application review queue.
 *
 * New fields beyond the original mock:
 *   - reviewedBy    (userId of the YK member who acted)
 *   - reviewedAt    (timestamp)
 *   - reviewComment (optional note, e.g. reason for rejection)
 *
 * The approve() / reject() methods take a comment and the current user
 * so the audit log can attribute the decision to a specific reviewer.
 */
import { APPLICATIONS } from '../data/users.js';

export class ApplicationService {
  constructor() {
    this._items = [];
    this._bus = null;
    this._store = null;
    this._storage = null;
    this._audit = null;
  }

  attach({ bus, store }) {
    this._bus = bus;
    this._store = store;
  }

  useStorage(storage) {
    this._storage = storage;
    const saved = storage.get('applications', null);
    if (Array.isArray(saved) && saved.length > 0) {
      this._items = saved;
    } else {
      this._items = APPLICATIONS.map((a) => ({ ...a }));
      this._persist();
    }
  }

  useAudit(audit) { this._audit = audit; }

  /* ── Queries ──────────────────────────────────────────────── */

  list() { return this._items.slice(); }

  pendingCount() { return this._items.filter((a) => a.status === 'bekliyor').length; }

  findById(id) { return this._items.find((a) => a.id === id) || null; }

  filter(cat = 'tumu') {
    return this._items.filter((a) => {
      if (cat === 'tumu')      return true;
      if (cat === 'uye')       return a.type === 'uye';
      if (cat === 'temsilci')  return a.type === 'temsilci';
      if (cat === 'bekliyor')  return a.status === 'bekliyor';
      if (cat === 'kabul')     return a.status === 'kabul';
      if (cat === 'red')       return a.status === 'red';
      return true;
    });
  }

  /* ── Mutations ────────────────────────────────────────────── */

  approve(id, comment = '') {
    const user = this._currentUser();
    if (!user || !user.superadmin) throw new Error('Yetersiz yetki.');
    const a = this.findById(id);
    if (!a) return null;
    a.status        = 'kabul';
    a.reviewedBy    = user.id;
    a.reviewedAt    = new Date().toISOString();
    a.reviewComment = comment || a.reviewComment || '';
    this._persist();
    this._audit?.log('APP_APPROVE', `Başvuru: ${a.name}`, { id, type: a.type, comment });
    this._emit();
    return a;
  }

  reject(id, comment = '') {
    const user = this._currentUser();
    if (!user || !user.superadmin) throw new Error('Yetersiz yetki.');
    const a = this.findById(id);
    if (!a) return null;
    a.status        = 'red';
    a.reviewedBy    = user.id;
    a.reviewedAt    = new Date().toISOString();
    a.reviewComment = comment || a.reviewComment || '';
    this._persist();
    this._audit?.log('APP_REJECT', `Başvuru: ${a.name}`, { id, type: a.type, comment });
    this._emit();
    return a;
  }

  /** Reset a decided application back to 'bekliyor' (mistake recovery). */
  reopen(id) {
    const user = this._currentUser();
    if (!user || !user.superadmin) throw new Error('Yetersiz yetki.');
    const a = this.findById(id);
    if (!a) return null;
    a.status        = 'bekliyor';
    a.reviewedBy    = null;
    a.reviewedAt    = null;
    a.reviewComment = '';
    this._persist();
    this._audit?.log('APP_COMMENT', `Başvuru yeniden açıldı: ${a.name}`, { id });
    this._emit();
    return a;
  }

  _currentUser() { return this._store ? this._store.get('currentUser') : null; }

  _persist() {
    if (this._storage) this._storage.set('applications', this._items);
  }

  _emit() {
    if (this._bus) this._bus.emit('applications:changed', this._items);
  }
}
