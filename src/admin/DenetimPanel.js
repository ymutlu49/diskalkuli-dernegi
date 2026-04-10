/**
 * Admin → Denetim (Audit log) panel.
 *
 * Read-only viewer for the AuditService log. Filterable by action
 * category and searchable by target/actor. Intentionally minimal —
 * an association's Denetleme Kurulu only needs "who, what, when".
 */
import { AUDIT_ACTIONS } from '../data/audit-actions.js';
import { escapeHtml } from '../core/escapeHtml.js';
import { timeAgo } from '../core/format.js';

// Group actions by category for the filter pills
const CATEGORIES = [
  { key: 'tumu',    label: 'Tümü',         prefixes: null },
  { key: 'user',    label: 'Üye',          prefixes: ['USER_'] },
  { key: 'app',     label: 'Başvuru',      prefixes: ['APP_'] },
  { key: 'content', label: 'İçerik',       prefixes: ['CONTENT_'] },
  { key: 'dues',    label: 'Aidat',        prefixes: ['DUES_'] },
  { key: 'auth',    label: 'Oturum',       prefixes: ['AUTH_'] },
];

export class DenetimPanel {
  constructor(ctx) {
    this.ctx = ctx;
    this._root = null;
    this._category = 'tumu';
    this._search = '';
    this._bound = false;
  }

  mount() {
    this._root = document.getElementById('ap-denetim');
    if (!this._root) return;
    if (!this._bound) {
      this.ctx.bus.on('audit:logged', () => this._render());
      this.ctx.bus.on('audit:cleared', () => this._render());
      this._bound = true;
    }
    this._render();
  }

  _render() {
    if (!this._root) return;
    const audit = this.ctx.services.audit;
    const all = audit.list({ search: this._search || undefined });
    const cat = CATEGORIES.find((c) => c.key === this._category);
    const filtered = cat && cat.prefixes
      ? all.filter((e) => cat.prefixes.some((p) => e.action.startsWith(p)))
      : all;

    const top = audit.topActions(4);

    this._root.innerHTML = `
      <div class="audit-panel">
        <div class="audit-head">
          <div class="audit-head-title">Denetim Kayıtları</div>
          <div class="audit-head-sub">${audit.count()} toplam kayıt · Denetleme Kurulu erişimine açık</div>
        </div>

        ${top.length > 0 ? `
        <div class="audit-top">
          <div class="audit-top-title">En Sık Eylemler</div>
          <div class="audit-top-grid">
            ${top.map((t) => `
              <div class="audit-top-item" title="${t.def?.label || t.action}">
                <div class="audit-top-icon" style="color:${t.def?.color || 'var(--gray-600)'}">${t.def?.icon || '•'}</div>
                <div class="audit-top-count">${t.count}</div>
                <div class="audit-top-label">${t.def?.label || t.action}</div>
              </div>`).join('')}
          </div>
        </div>` : ''}

        <input type="search" class="audit-search" placeholder="🔍 Kayıt / kullanıcı ara..." value="${escapeHtml(this._search)}" data-action="search">

        <div class="audit-chip-row">
          ${CATEGORIES.map((c) => `
            <div class="audit-chip${this._category === c.key ? ' on' : ''}" data-action="category" data-val="${c.key}">${c.label}</div>
          `).join('')}
        </div>

        <div class="audit-list">
          ${filtered.length === 0
            ? '<div class="audit-empty">Bu filtreye uygun kayıt yok.</div>'
            : filtered.slice(0, 200).map((e) => this._renderEntry(e)).join('')}
        </div>

        ${filtered.length > 200
          ? `<div class="audit-more-note">İlk 200 kayıt gösteriliyor · toplam ${filtered.length}</div>`
          : ''}
      </div>
    `;
    this._wireEvents();
  }

  _renderEntry(e) {
    const def = AUDIT_ACTIONS[e.action] || { label: e.action, icon: '•', color: 'var(--gray-600)' };
    const when = this._relativeTime(e.timestamp);
    const metaStr = e.meta && Object.keys(e.meta).length > 0
      ? Object.entries(e.meta)
          .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
          .join(' · ')
      : '';
    return `
      <div class="audit-entry">
        <div class="audit-entry-icon" style="color:${def.color}">${def.icon}</div>
        <div class="audit-entry-body">
          <div class="audit-entry-action">${def.label}</div>
          <div class="audit-entry-target">${escapeHtml(e.target || '—')}</div>
          <div class="audit-entry-meta">
            <span class="audit-actor">${escapeHtml(e.actorName || 'Sistem')}</span>
            <span class="audit-sep">·</span>
            <span class="audit-when">${when}</span>
          </div>
          ${metaStr ? `<div class="audit-entry-extra">${escapeHtml(metaStr)}</div>` : ''}
        </div>
      </div>
    `;
  }

  _wireEvents() {
    this._root.querySelectorAll('[data-action]').forEach((el) => {
      const act = el.dataset.action;
      if (act === 'category') el.addEventListener('click', () => { this._category = el.dataset.val; this._render(); });
      if (act === 'search')   el.addEventListener('input', () => { this._search = el.value; this._render(); });
    });
  }

  _relativeTime(ms) {
    return ms ? timeAgo(new Date(ms)) : '—';
  }
}
