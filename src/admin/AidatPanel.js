/**
 * Admin → Aidat (dues) panel.
 *
 * Displays, for the selected year:
 *   - Summary: collected / outstanding / count
 *   - Member list with payment status and inline actions
 *     (Mark Paid, Remind, Exempt)
 */
import { DUES_METHODS } from '../data/mock-dues.js';
import { escapeHtml } from '../core/escapeHtml.js';
import { formatCurrency } from '../core/format.js';

export class AidatPanel {
  constructor(ctx) {
    this.ctx = ctx;
    this._root = null;
    this._year = new Date().getFullYear();
    this._filter = 'tumu'; // 'tumu' | 'odendi' | 'bekliyor' | 'muaf'
    this._bound = false;
  }

  mount() {
    this._root = document.getElementById('ap-aidat');
    if (!this._root) return;
    if (!this._bound) {
      this.ctx.bus.on('dues:changed',  () => this._render());
      this.ctx.bus.on('users:changed', () => this._render());
      this._bound = true;
    }
    // Ensure every user has a dues record for the current year
    this._ensureRecordsForYear();
    this._render();
  }

  _ensureRecordsForYear() {
    const users = this.ctx.services.users.list();
    const dues  = this.ctx.services.dues;
    for (const u of users) {
      dues.issue(u.id, this._year, u.role);
    }
  }

  _render() {
    if (!this._root) return;
    const dues  = this.ctx.services.dues;
    const users = this.ctx.services.users.list();
    const summary = dues.summary({ year: this._year });
    const records = dues.list({ year: this._year });

    // Attach user info to each record for easy rendering
    const rows = records.map((r) => {
      const u = users.find((x) => x.id === r.userId);
      return { ...r, user: u };
    }).filter((r) => r.user);

    // Apply filter
    const filtered = rows.filter((r) => {
      if (this._filter === 'tumu')     return true;
      if (this._filter === 'odendi')   return r.paid && r.method !== 'muaf';
      if (this._filter === 'bekliyor') return !r.paid;
      if (this._filter === 'muaf')     return r.method === 'muaf';
      return true;
    });

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

    this._root.innerHTML = `
      <div class="aidat-panel">
        <!-- Year selector -->
        <div class="aidat-year-row">
          <label>Yıl:</label>
          <select class="aidat-year-sel" data-action="year">
            ${years.map((y) => `<option value="${y}"${y === this._year ? ' selected' : ''}>${y}</option>`).join('')}
          </select>
        </div>

        <!-- Summary cards -->
        <div class="aidat-summary">
          <div class="aidat-card aidat-card-collected">
            <div class="aidat-card-num">${formatCurrency(summary.collected)}</div>
            <div class="aidat-card-label">Tahsil Edilen</div>
            <div class="aidat-card-sub">${summary.paidCount} ödeme</div>
          </div>
          <div class="aidat-card aidat-card-outstanding">
            <div class="aidat-card-num">${formatCurrency(summary.outstanding)}</div>
            <div class="aidat-card-label">Bekleyen</div>
            <div class="aidat-card-sub">${summary.unpaidCount} üye</div>
          </div>
          <div class="aidat-card aidat-card-total">
            <div class="aidat-card-num">${summary.total}</div>
            <div class="aidat-card-label">Toplam Kayıt</div>
            <div class="aidat-card-sub">${this._year} yılı</div>
          </div>
        </div>

        <!-- Filter chips -->
        <div class="aidat-chip-row">
          <div class="aidat-chip${this._filter === 'tumu' ? ' on' : ''}" data-action="filter" data-val="tumu">Tümü</div>
          <div class="aidat-chip${this._filter === 'odendi' ? ' on' : ''}" data-action="filter" data-val="odendi">✓ Ödendi</div>
          <div class="aidat-chip${this._filter === 'bekliyor' ? ' on' : ''}" data-action="filter" data-val="bekliyor">⏳ Bekliyor</div>
          <div class="aidat-chip${this._filter === 'muaf' ? ' on' : ''}" data-action="filter" data-val="muaf">⭐ Muaf</div>
        </div>

        <!-- Row list -->
        <div class="aidat-list">
          ${filtered.length === 0
            ? '<div class="aidat-empty">Bu filtreye uygun kayıt yok.</div>'
            : filtered.map((r) => this._renderRow(r)).join('')}
        </div>
      </div>
    `;
    this._wireEvents();
  }

  _renderRow(r) {
    const u = r.user;
    const status = r.paid
      ? (r.method === 'muaf'
        ? { cls: 'muaf',   label: '⭐ Muaf' }
        : { cls: 'odendi', label: '✓ Ödendi' })
      : { cls: 'bekliyor', label: '⏳ Bekliyor' };

    const roleColor = {
      yonetim: 'var(--green-dark)',
      temsilci: 'var(--brown)',
      uye: 'var(--green-mid)',
    }[u.role] || 'var(--gray-400)';

    const details = r.paid
      ? `${DUES_METHODS[r.method]?.label || r.method || ''}${r.receiptNo ? ' · ' + r.receiptNo : ''}${r.paidAt ? ' · ' + new Date(r.paidAt).toLocaleDateString('tr-TR') : ''}`
      : (r.notes || 'Henüz ödeme yok');

    const actions = !r.paid ? `
      <div class="aidat-row-actions">
        <button class="aidat-btn aidat-btn-pay" data-action="mark-paid" data-id="${u.id}">💰 Öde</button>
        <button class="aidat-btn aidat-btn-remind" data-action="remind" data-id="${u.id}">📨 Hatırlat</button>
        <button class="aidat-btn aidat-btn-exempt" data-action="exempt" data-id="${u.id}">⭐ Muaf</button>
      </div>` : '';

    return `
      <div class="aidat-row aidat-row-${status.cls}">
        <div class="aidat-row-head">
          <div class="aidat-av" style="background:${roleColor}">${u.initials}</div>
          <div class="aidat-row-info">
            <div class="aidat-row-name">${escapeHtml(u.name)}</div>
            <div class="aidat-row-meta">${escapeHtml(u.city || '')}${u.kurum ? ' · ' + escapeHtml(u.kurum) : ''}</div>
          </div>
          <div class="aidat-row-amount">${formatCurrency(r.amount)}</div>
        </div>
        <div class="aidat-row-status">
          <span class="aidat-status-badge aidat-status-${status.cls}">${status.label}</span>
          <span class="aidat-row-detail">${escapeHtml(details)}</span>
        </div>
        ${actions}
      </div>
    `;
  }

  _wireEvents() {
    this._root.querySelectorAll('[data-action]').forEach((el) => {
      const action = el.dataset.action;
      const handler = this._handlers[action];
      if (!handler) return;
      if (el.tagName === 'SELECT') {
        el.addEventListener('change', (e) => handler.call(this, e, el));
      } else {
        el.addEventListener('click', (e) => handler.call(this, e, el));
      }
    });
  }

  get _handlers() {
    return {
      'year':      this._handleYear,
      'filter':    this._handleFilter,
      'mark-paid': this._handleMarkPaid,
      'remind':    this._handleRemind,
      'exempt':    this._handleExempt,
    };
  }

  _handleYear(_e, el) {
    this._year = Number(el.value);
    this._ensureRecordsForYear();
    this._render();
  }

  _handleFilter(_e, el) {
    this._filter = el.dataset.val;
    this._render();
  }

  async _handleMarkPaid(_e, el) {
    const userId = Number(el.dataset.id);
    const user = this.ctx.services.users.findById(userId);
    if (!user) return;

    // Simple method picker via prompt
    const methodKey = await this.ctx.services.confirm.prompt({
      title: `${user.name} — Ödeme Yöntemi`,
      message: 'havale / kredi / nakit',
      placeholder: 'havale',
      defaultValue: 'havale',
    });
    if (!methodKey) return;
    if (!['havale', 'kredi', 'nakit'].includes(methodKey)) {
      this.ctx.services.toast.error('Geçersiz yöntem. havale, kredi, nakit kullanın.');
      return;
    }
    try {
      const rec = this.ctx.services.dues.markPaid(userId, this._year, { method: methodKey });
      this.ctx.services.toast.success(`Ödendi ✓ · Makbuz: ${rec.receiptNo}`);
    } catch (err) {
      this.ctx.services.toast.error(err.message);
    }
  }

  async _handleRemind(_e, el) {
    const userId = Number(el.dataset.id);
    const user = this.ctx.services.users.findById(userId);
    if (!user) return;
    this.ctx.services.dues.reminder(userId, this._year);
    this.ctx.services.toast.info(`Hatırlatma kaydedildi · ${user.name}`);
  }

  async _handleExempt(_e, el) {
    const userId = Number(el.dataset.id);
    const user = this.ctx.services.users.findById(userId);
    if (!user) return;
    const reason = await this.ctx.services.confirm.prompt({
      title: `${user.name} — Muafiyet Gerekçesi`,
      placeholder: 'ör: Yönetim Kurulu Üyesi',
    });
    if (reason == null) return;
    try {
      this.ctx.services.dues.markExempt(userId, this._year, reason);
      this.ctx.services.toast.success('Muafiyet uygulandı ⭐');
    } catch (err) {
      this.ctx.services.toast.error(err.message);
    }
  }

}
