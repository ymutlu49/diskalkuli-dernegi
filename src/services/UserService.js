/**
 * CRUD for the APP_USERS directory — now with:
 *   - Lifecycle state machine (aktif/askida/pasif/ayrildi)
 *   - KVKK consent tracking
 *   - Audit log integration (all mutations emit AuditService entries)
 *   - Bulk operations
 *   - CSV export
 *   - Persistence via StorageService
 */
import { APP_USERS } from '../data/users.js';
import { PERM_SETS, PERM_LABELS } from '../data/permissions.js';
import { LIFECYCLE_STATES, LIFECYCLE_TRANSITIONS } from '../data/user-lifecycle.js';

export class UserService {
  constructor() {
    /** @type {Array<object>} mutable user list */
    this._users = [];
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
    const saved = storage.get('users', null);
    if (Array.isArray(saved) && saved.length > 0) {
      this._users = saved;
    } else {
      this._users = APP_USERS.map((u) => ({ ...u }));
      this._persist();
    }
  }

  useAudit(audit) { this._audit = audit; }

  /* ── Queries ──────────────────────────────────────────────── */

  list()            { return this._users.slice(); }
  findById(id)      { return this._users.find((u) => u.id === id) || null; }
  findByEmail(email) {
    const needle = (email || '').trim().toLowerCase();
    return this._users.find((u) => u.email.toLowerCase() === needle) || null;
  }

  /** Search by query + role + lifecycle. */
  search(query = '', role = 'tumu', lifecycle = 'tumu') {
    const q = query.toLowerCase();
    return this._users.filter((u) => {
      const roleOk = role === 'tumu' || u.role === role;
      const lcOk   = lifecycle === 'tumu' || (u.lifecycle || 'aktif') === lifecycle;
      const textOk = !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.city || '').toLowerCase().includes(q) ||
        (u.kurum || '').toLowerCase().includes(q);
      return roleOk && lcOk && textOk;
    });
  }

  /** Aggregate counts used by the admin overview. */
  summary() {
    const total = this._users.length;
    const byRole = { yonetim: 0, temsilci: 0, uye: 0, genel: 0 };
    const byLifecycle = { aktif: 0, askida: 0, pasif: 0, ayrildi: 0 };
    for (const u of this._users) {
      byRole[u.role] = (byRole[u.role] || 0) + 1;
      const lc = u.lifecycle || 'aktif';
      byLifecycle[lc] = (byLifecycle[lc] || 0) + 1;
    }
    return { total, byRole, byLifecycle };
  }

  /* ── Mutations ────────────────────────────────────────────── */

  create({ name, email, role, city, kurum, phone = '', tc = '', notes = '' }) {
    if (!name || !email) throw new Error('Ad ve e-posta zorunludur.');
    if (this.findByEmail(email)) throw new Error('Bu e-posta zaten kayıtlı.');

    const nextId  = this._users.reduce((m, u) => Math.max(m, u.id), 0) + 1;
    const parts   = name.trim().split(/\s+/);
    const initials = parts.map((p) => p[0] || '').join('').toUpperCase().slice(0, 2);
    const nowIso  = new Date().toISOString();

    const user = {
      id:           nextId,
      name:         name.trim(),
      email:        email.trim(),
      role,
      city:         city || '',
      kurum:        kurum || '',
      phone:        phone || '',
      tc:           tc || '',
      initials,
      superadmin:   role === 'yonetim',
      active:       true,
      lifecycle:    'aktif',
      joinDate:     nowIso.slice(0, 10),
      kvkkConsent:  nowIso,
      tuzukConsent: nowIso,
      notes:        notes || '',
      perms:        PERM_SETS[role] || [],
    };
    this._users.push(user);
    this._persist();
    this._audit?.log('USER_CREATE', `Üye: ${user.name}`, { id: user.id, role });
    this._emit();
    return user;
  }

  update(id, patch) {
    const u = this.findById(id);
    if (!u) return null;
    const oldRole = u.role;
    Object.assign(u, patch);
    if (patch.role) u.superadmin = patch.role === 'yonetim';
    this._persist();
    this._audit?.log('USER_UPDATE', `Üye: ${u.name}`, { id, patch: Object.keys(patch) });
    if (patch.role && patch.role !== oldRole) {
      this._audit?.log('USER_ROLE_CHANGE', `Üye: ${u.name}`, { id, from: oldRole, to: patch.role });
    }
    this._emit();
    return u;
  }

  /** Toggle active flag (DEPRECATED: use changeLifecycle instead). */
  toggleActive(id) {
    const u = this.findById(id);
    if (!u) return null;
    u.active = !u.active;
    u.lifecycle = u.active ? 'aktif' : 'pasif';
    this._persist();
    this._audit?.log(u.active ? 'USER_ACTIVATE' : 'USER_DEACTIVATE', `Üye: ${u.name}`, { id });
    this._emit();
    return u;
  }

  /**
   * Move a user to a new lifecycle state. Enforces the transition
   * graph — throws if the move isn't allowed from the current state.
   */
  changeLifecycle(id, next) {
    if (!LIFECYCLE_STATES[next]) throw new Error(`Bilinmeyen durum: ${next}`);
    const u = this.findById(id);
    if (!u) return null;
    const cur = u.lifecycle || 'aktif';
    if (cur === next) return u;
    const allowed = LIFECYCLE_TRANSITIONS[cur] || [];
    if (!allowed.includes(next)) {
      throw new Error(`${cur} → ${next} geçişi geçersiz.`);
    }
    u.lifecycle = next;
    u.active    = next === 'aktif';
    this._persist();
    const actionKey = {
      aktif:   'USER_ACTIVATE',
      askida:  'USER_SUSPEND',
      pasif:   'USER_DEACTIVATE',
      ayrildi: 'USER_DEACTIVATE',
    }[next];
    this._audit?.log(actionKey, `Üye: ${u.name}`, { id, from: cur, to: next });
    this._emit();
    return u;
  }

  remove(id) {
    const idx = this._users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    const [removed] = this._users.splice(idx, 1);
    this._persist();
    this._audit?.log('USER_DELETE', `Üye: ${removed.name}`, { id });
    this._emit();
    return true;
  }

  /* ── Bulk operations ────────────────────────────────────── */

  bulkChangeLifecycle(ids, next) {
    const updated = [];
    for (const id of ids) {
      try { const u = this.changeLifecycle(id, next); if (u) updated.push(u); }
      catch { /* ignore individual failures */ }
    }
    return updated;
  }

  /* ── Export ──────────────────────────────────────────────── */

  /**
   * Return a CSV string of the current directory.
   * Safe to pass straight to `URL.createObjectURL(new Blob([...], {type:'text/csv'}))`.
   */
  exportCsv() {
    const header = [
      'id', 'name', 'email', 'phone', 'role', 'lifecycle',
      'city', 'kurum', 'joinDate', 'kvkkConsent',
    ];
    const rows = this._users.map((u) => header.map((k) => this._csvCell(u[k])).join(','));
    return [header.join(','), ...rows].join('\n');
  }

  _csvCell(v) {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return /[,"\n]/.test(s) ? `"${s}"` : s;
  }

  /* ── Helpers ──────────────────────────────────────────────── */

  permLabels(perms) {
    return (perms || []).map((p) => PERM_LABELS[p] || p);
  }

  _persist() {
    if (this._storage) this._storage.set('users', this._users);
  }

  _emit() {
    if (this._bus) this._bus.emit('users:changed', this._users);
  }
}
