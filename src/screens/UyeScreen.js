import { BaseScreen } from '../core/BaseScreen.js';
import { escapeHtml } from '../core/escapeHtml.js';
import { TIERS } from '../data/content.js';

/**
 * Membership-tier hierarchy overview.
 *
 * The cards highlight whichever tier matches the current user's role
 * with a subtle ring, so the user always sees where they stand.
 */
export class UyeScreen extends BaseScreen {
  init() {
    this.ctx.bus.on('auth:login', () => this._render());
  }

  onEnter() {
    this._render();
  }

  _render() {
    const el = document.getElementById('tier-list');
    if (!el) return;
    const user = this.ctx.store.get('currentUser');
    if (!user) return;

    const ICON = { yonetim: '★', temsilci: '◆', uye: '●', genel: '○' };
    el.innerHTML = TIERS.map((t) => {
      const isActive = t.role === user.role;
      const isDark   = t.role === 'genel';
      const badge    = isActive
        ? ' <span style="font-size:10px;background:rgba(255,255,255,.25);padding:2px 8px;border-radius:999px">Aktif</span>'
        : '';
      const titleColor = isDark ? 'var(--green-dark)' : 'white';
      const subColor   = isDark ? 'var(--gray-400)'   : 'rgba(255,255,255,.6)';
      const permColor  = isDark ? 'var(--gray-600)'   : 'rgba(255,255,255,.85)';
      const icon       = ICON[t.role] || '•';

      return `
      <article class="tier-card ${escapeHtml(t.css)}" ${isActive ? 'aria-current="true"' : ''} style="${isActive ? 'outline:2px solid rgba(255,255,255,.5);outline-offset:2px' : ''}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div aria-hidden="true" style="width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <span style="font-size:16px">${escapeHtml(icon)}</span>
          </div>
          <div>
            <h3 style="font-family:var(--font-d);font-size:15px;font-weight:900;color:${titleColor};margin:0">${escapeHtml(t.name)}${badge}</h3>
            <div style="font-size:11px;color:${subColor}">${escapeHtml(t.desc)}</div>
          </div>
        </div>
        ${t.perms.map((p) => `<div style="display:flex;align-items:center;gap:7px;font-size:12px;color:${permColor};font-weight:600;margin-bottom:4px">✓ ${escapeHtml(p)}</div>`).join('')}
      </article>`;
    }).join('');
  }
}
