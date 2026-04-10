import { BaseScreen } from '../core/BaseScreen.js';
import { escapeHtml, escapeUrl } from '../core/escapeHtml.js';
import { ALL_MODULES } from '../data/modules.js';
import { HABERLER } from '../data/content.js';
import { ROLE_LABELS } from '../data/roles.js';

/**
 * The main home screen: hero greeting, stat cards, module grid,
 * and the latest announcements scroller.
 *
 * Re-renders on every `onEnter()` so the data stays fresh when the
 * user switches accounts via logout/login.
 */
export class HomeScreen extends BaseScreen {
  init() {
    // Also redraw when another service mutates user data / notifications
    this.ctx.bus.on('auth:login', () => this._render());
    this.ctx.bus.on('notif:changed', () => {
      this.ctx.services.notifications.renderBadge();
    });
  }

  onEnter() {
    this._render();
  }

  _render() {
    const user = this.ctx.store.get('currentUser');
    if (!user) return;

    this._renderHero(user);
    this._renderModules(user);
    this._renderAnnouncements();
    this.ctx.services.notifications.renderBadge();
  }

  _renderHero(user) {
    const roleLabel = ROLE_LABELS[user.roleKey] || ROLE_LABELS[user.role] || user.role;
    this.setText('hero-name', user.name);
    this.setText('hero-role', roleLabel);
    this.setText('hero-av',   user.initials || user.name.slice(0, 2).toUpperCase());
    this.setText('tb-role',   roleLabel);
  }

  _renderModules(user) {
    const el = document.getElementById('mod-grid');
    if (!el) return;

    const visible = ALL_MODULES.filter((m) => user.perms && user.perms.includes(m.id));
    el.innerHTML = visible.map((m) => `
      <button type="button" class="mod-card" style="--c:${escapeHtml(m.accent)}"
              data-goto="${escapeHtml(m.id)}"
              aria-label="${escapeHtml(m.name)}: ${escapeHtml(m.desc)}">
        <span class="mod-icon" style="background:${escapeHtml(m.iconBg)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="${escapeHtml(m.iconColor || m.accent)}"
               stroke-width="2" width="22" height="22" aria-hidden="true"><path d="${escapeHtml(m.icon)}"/></svg>
        </span>
        <span class="mod-name">${escapeHtml(m.name)}</span>
        <span class="mod-desc">${escapeHtml(m.desc)}</span>
      </button>`).join('');

    el.querySelectorAll('.mod-card').forEach((card) => {
      card.addEventListener('click', () => {
        const target = card.dataset.goto;
        if (target) this.ctx.router.goTo(target);
      });
    });
  }

  _renderAnnouncements() {
    const scroll = document.getElementById('ann-scroll');
    if (!scroll) return;
    scroll.innerHTML = HABERLER.slice(0, 4).map((h) => `
      <button type="button" class="ann-card" data-goto="haberler"
              aria-label="Haber: ${escapeHtml(h.title)}">
        <span class="ann-cat ${escapeHtml(h.catCss)}">${escapeHtml(h.catLabel)}</span>
        <span class="ann-title">${escapeHtml(h.title)}</span>
        <span class="ann-date">${escapeHtml(h.date)}</span>
      </button>`).join('');
    scroll.querySelectorAll('.ann-card').forEach((c) => {
      c.addEventListener('click', () => this.ctx.router.goTo('haberler'));
    });
  }
}
