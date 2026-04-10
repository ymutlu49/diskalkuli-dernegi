/**
 * Audit log — every meaningful admin action is recorded here.
 *
 * Why every action, not just destructive ones?  Because in a dernek
 * (association) context the audit log doubles as a compliance record
 * for the Denetleme Kurulu and is expected to show who did what, when.
 *
 * Events emitted:
 *   - audit:logged(entry)
 *   - audit:cleared()
 */
import { AUDIT_ACTIONS } from '../data/audit-actions.js';

const MAX_ENTRIES = 500;

export class AuditService {
  constructor() {
    /** @type {Array<object>} newest first */
    this._log = [];
    this._nextId = 1;
    this._bus = null;
    this._store = null;
    this._storage = null;
  }

  attach({ bus, store }) {
    this._bus = bus;
    this._store = store;
  }

  /**
   * Inject the StorageService after both services exist (ordering matters).
   * Called from main.js bootstrap — this loads any persisted log entries.
   */
  useStorage(storage) {
    this._storage = storage;
    const saved = storage.get('audit', null);
    if (Array.isArray(saved) && saved.length > 0) {
      this._log = saved;
      this._nextId = Math.max(...saved.map((e) => e.id), 0) + 1;
    }
  }

  /**
   * Record an action. `actionKey` must be a key from AUDIT_ACTIONS.
   *
   * @param {string} actionKey
   * @param {string} target     — human-readable target ("Üye: Ali Veli")
   * @param {object} [meta]     — arbitrary JSON, e.g. { oldRole, newRole }
   */
  log(actionKey, target, meta = {}) {
    const action = AUDIT_ACTIONS[actionKey];
    if (!action) {
      console.warn(`[Audit] unknown action key: ${actionKey}`);
      return null;
    }

    const currentUser = this._store ? this._store.get('currentUser') : null;
    const entry = {
      id:        this._nextId++,
      action:    actionKey,
      target:    String(target || ''),
      meta:      meta || {},
      actorId:   currentUser ? currentUser.id   : null,
      actorName: currentUser ? currentUser.name : 'Sistem',
      actorRole: currentUser ? currentUser.role : null,
      timestamp: Date.now(),
    };
    this._log.unshift(entry);
    if (this._log.length > MAX_ENTRIES) this._log.length = MAX_ENTRIES;
    this._persist();
    if (this._bus) this._bus.emit('audit:logged', entry);
    return entry;
  }

  /**
   * Return a filtered slice of the log.
   * @param {object} [filter]
   * @param {string} [filter.action]    — exact action key
   * @param {number} [filter.actorId]   — only this user's actions
   * @param {number} [filter.since]     — ms-since-epoch lower bound
   * @param {string} [filter.search]    — text match in target/actorName
   */
  list(filter = {}) {
    let list = this._log.slice();
    if (filter.action)  list = list.filter((e) => e.action === filter.action);
    if (filter.actorId) list = list.filter((e) => e.actorId === filter.actorId);
    if (filter.since)   list = list.filter((e) => e.timestamp >= filter.since);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((e) =>
        e.target.toLowerCase().includes(q) ||
        e.actorName.toLowerCase().includes(q)
      );
    }
    return list;
  }

  count() { return this._log.length; }

  /** Most common actions by frequency — used by the overview tab. */
  topActions(limit = 5) {
    const counts = new Map();
    for (const e of this._log) {
      counts.set(e.action, (counts.get(e.action) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([action, count]) => ({ action, count, def: AUDIT_ACTIONS[action] }));
  }

  clear() {
    this._log = [];
    this._persist();
    if (this._bus) this._bus.emit('audit:cleared', null);
  }

  _persist() {
    if (this._storage) this._storage.set('audit', this._log);
  }
}
