/**
 * Aidat (dues) tracking.
 *
 * Stores one record per (userId, year) and exposes helpers for:
 *   - marking a dues record paid / unpaid / exempt
 *   - computing a member's outstanding balance
 *   - listing records for the admin panel (filter by year/status)
 *   - issuing a simple auto-incrementing receipt number
 *
 * Receipt numbers follow "D-{year}-{seq}" or "M-{year}-{seq}"
 * (M for muafiyet).  Sequence per method per year.
 */
import { INITIAL_DUES, YEARLY_DUES_AMOUNT, DUES_BY_ROLE, DUES_METHODS } from '../data/mock-dues.js';

export class DuesService {
  constructor() {
    this._records = [];
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
    const saved = storage.get('dues', null);
    if (Array.isArray(saved) && saved.length > 0) {
      this._records = saved;
    } else {
      this._records = INITIAL_DUES.map((r) => ({ ...r }));
      this._persist();
    }
  }

  useAudit(audit) {
    this._audit = audit;
  }

  /* ── Queries ──────────────────────────────────────────────── */

  /** All records, newest year first. */
  list({ year, status, userId } = {}) {
    let list = this._records.slice().sort((a, b) => b.year - a.year);
    if (year)   list = list.filter((r) => r.year === year);
    if (userId) list = list.filter((r) => r.userId === userId);
    if (status === 'paid')   list = list.filter((r) => r.paid);
    if (status === 'unpaid') list = list.filter((r) => !r.paid);
    return list;
  }

  /** Dues record for a specific user+year, or null. */
  findByUserYear(userId, year) {
    return this._records.find((r) => r.userId === userId && r.year === year) || null;
  }

  /**
   * Cumulative balance for a user across all years they had records.
   * Returns { paid, unpaid, balance, records }
   */
  balanceFor(userId) {
    const records = this._records.filter((r) => r.userId === userId);
    let paid = 0, unpaid = 0;
    for (const r of records) {
      if (r.paid) paid += r.amount;
      else        unpaid += r.amount;
    }
    return { paid, unpaid, balance: unpaid, records };
  }

  /** Total dues collected / outstanding across all members. */
  summary({ year = new Date().getFullYear() } = {}) {
    const list = this._records.filter((r) => r.year === year);
    let collected = 0, outstanding = 0, paidCount = 0, unpaidCount = 0;
    for (const r of list) {
      if (r.paid) { collected += r.amount; paidCount++; }
      else        { outstanding += r.amount; unpaidCount++; }
    }
    return { year, collected, outstanding, paidCount, unpaidCount, total: list.length };
  }

  /* ── Mutations ────────────────────────────────────────────── */

  /**
   * Create a new unpaid dues record for (userId, year) with the
   * default amount for their role.  Idempotent — returns the
   * existing record if one is already there.
   */
  issue(userId, year, role) {
    let rec = this.findByUserYear(userId, year);
    if (rec) return rec;
    const amount = DUES_BY_ROLE[role] ?? YEARLY_DUES_AMOUNT;
    rec = {
      userId, year, amount,
      paid: amount === 0,                   // muafiyet otomatik ödenmiş sayılır
      paidAt: amount === 0 ? Date.now() : null,
      method: amount === 0 ? 'muaf' : null,
      receiptNo: amount === 0 ? this._nextReceipt('muaf', year) : null,
      notes: amount === 0 ? 'Rolü gereği muaf' : '',
    };
    this._records.push(rec);
    this._persist();
    if (amount === 0) {
      this._audit?.log('DUES_EXEMPT', `Kullanıcı #${userId} · ${year}`, { userId, year });
    }
    this._emit();
    return rec;
  }

  /** Mark a dues record paid. Auto-issues a receipt number. */
  markPaid(userId, year, { method = 'havale', notes = '' } = {}) {
    const user = this._currentUser();
    if (!user || !user.superadmin) throw new Error('Yetersiz yetki.');
    const rec = this.findByUserYear(userId, year);
    if (!rec) return null;
    rec.paid   = true;
    rec.paidAt = Date.now();
    rec.method = method;
    rec.notes  = notes || rec.notes;
    rec.receiptNo = rec.receiptNo || this._nextReceipt(method, year);
    this._persist();
    this._audit?.log('DUES_MARK_PAID',
      `Aidat: #${userId} · ${year} · ${rec.amount}₺`,
      { userId, year, method, receiptNo: rec.receiptNo }
    );
    this._emit();
    return rec;
  }

  /** Undo a previous payment (corrections only). */
  markUnpaid(userId, year) {
    const user = this._currentUser();
    if (!user || !user.superadmin) throw new Error('Yetersiz yetki.');
    const rec = this.findByUserYear(userId, year);
    if (!rec) return null;
    rec.paid = false;
    rec.paidAt = null;
    rec.method = null;
    rec.receiptNo = null;
    this._persist();
    this._audit?.log('DUES_MARK_UNPAID', `Aidat: #${userId} · ${year}`, { userId, year });
    this._emit();
    return rec;
  }

  /** Mark user exempt for a given year (e.g. YK Üyesi, onursal). */
  markExempt(userId, year, reason = '') {
    const user = this._currentUser();
    if (!user || !user.superadmin) throw new Error('Yetersiz yetki.');
    let rec = this.findByUserYear(userId, year);
    if (!rec) {
      rec = { userId, year, amount: 0, paid: false, paidAt: null, method: null, receiptNo: null, notes: '' };
      this._records.push(rec);
    }
    rec.amount = 0;
    rec.paid   = true;
    rec.paidAt = Date.now();
    rec.method = 'muaf';
    rec.receiptNo = this._nextReceipt('muaf', year);
    rec.notes  = reason || 'Muafiyet uygulandı';
    this._persist();
    this._audit?.log('DUES_EXEMPT', `Aidat muafiyet: #${userId} · ${year}`, { userId, year, reason });
    this._emit();
    return rec;
  }

  /** Append a reminder note + audit entry. */
  reminder(userId, year) {
    const rec = this.findByUserYear(userId, year);
    if (!rec || rec.paid) return null;
    const stamp = new Date().toISOString().slice(0, 10);
    rec.notes = (rec.notes ? rec.notes + ' · ' : '') + `Hatırlatma: ${stamp}`;
    this._persist();
    this._audit?.log('DUES_REMINDER', `Aidat hatırlatma: #${userId} · ${year}`, { userId, year });
    this._emit();
    return rec;
  }

  /* ── Helpers ──────────────────────────────────────────────── */

  methodLabel(key)       { return DUES_METHODS[key]?.label || key; }
  defaultAmountFor(role) { return DUES_BY_ROLE[role] ?? YEARLY_DUES_AMOUNT; }

  _currentUser() { return this._store ? this._store.get('currentUser') : null; }

  _persist() {
    if (this._storage) this._storage.set('dues', this._records);
  }

  _emit() {
    if (this._bus) this._bus.emit('dues:changed', this._records.length);
  }

  _nextReceipt(method, year) {
    const prefix = method === 'muaf' ? 'M' : 'D';
    const sameYearSameKind = this._records.filter((r) => {
      if (r.year !== year || !r.receiptNo) return false;
      return r.receiptNo.startsWith(prefix + '-');
    });
    const maxSeq = sameYearSameKind.reduce((m, r) => {
      const match = /-(\d+)$/.exec(r.receiptNo);
      return match ? Math.max(m, Number(match[1])) : m;
    }, 0);
    const seq = String(maxSeq + 1).padStart(3, '0');
    return `${prefix}-${year}-${seq}`;
  }
}
