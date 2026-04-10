import { BaseScreen } from '../core/BaseScreen.js';
import { escapeHtml, escapeUrl } from '../core/escapeHtml.js';
import { i18n } from '../core/i18n.js';
import { ALL_MODULES } from '../data/modules.js';
import { HABERLER } from '../data/content.js';
import { ROLE_LABELS } from '../data/roles.js';
import { ORGANIZATION } from '../data/org.js';

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
    // One-time DOM setup: logo watermark + contact footer.
    this._injectHeroWatermark();
    this._injectSocialFooter();
    // Re-label on locale change.
    i18n.onChange(() => this._refreshSocialFooterLabels());
  }

  /**
   * Drop a large, very transparent copy of the association logo
   * into the hero card as a watermark. Gives the screen a clear
   * visual brand anchor without fighting the greeting text.
   */
  _injectHeroWatermark() {
    if (!this.el) return;
    const hero = this.el.querySelector('.hero');
    if (!hero) return;
    if (hero.querySelector('.home-hero-logo-wrap')) return; // once

    const wrap = document.createElement('div');
    wrap.className = 'home-hero-logo-wrap';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = `<img src="./icons/logo-round.png" alt="">`;
    // Insert as the very first child so it sits behind everything.
    hero.insertBefore(wrap, hero.firstChild);
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
    this._refreshSocialFooterLabels();
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

  /* ── Social / contact footer ──────────────────────────── */

  _injectSocialFooter() {
    if (!this.el) return;
    if (this.el.querySelector('#home-social-footer')) return; // once

    const body = this.$('.screen-body');
    if (!body) return;

    const section = document.createElement('div');
    section.id = 'home-social-footer';
    section.className = 'pf-social-section';
    section.setAttribute('aria-label', 'Dernek bağlantıları');

    const cards = ORGANIZATION.social.map((s) => `
      <a class="pf-social-card"
         href="${escapeUrl(s.url)}"
         target="_blank"
         rel="noopener noreferrer"
         data-social="${escapeHtml(s.id)}"
         aria-label="${escapeHtml(s.name)}: ${escapeHtml(s.displayName)}">
        <span class="pf-social-icon" aria-hidden="true"
              style="background:${escapeHtml(s.bg)};color:#fff">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="${escapeHtml(s.iconPath)}"/>
          </svg>
        </span>
        <span class="pf-social-text">
          <span class="pf-social-name" data-social-name>${escapeHtml(s.name)}</span>
          <span class="pf-social-handle">${escapeHtml(s.displayName)}</span>
          <span class="pf-social-desc" data-social-desc>${escapeHtml(s.description || '')}</span>
        </span>
        <svg class="pf-social-arrow" aria-hidden="true"
             viewBox="0 0 24 24" width="18" height="18"
             fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 17L17 7M9 7h8v8"/>
        </svg>
      </a>
    `).join('');

    section.innerHTML = `
      <div class="pf-social-title" data-social-title>🔗 Bizi Takip Edin</div>
      <div class="pf-social-grid">${cards}</div>
      <div style="height:24px"></div>
    `;

    body.appendChild(section);
  }

  /**
   * Update the social footer's translatable labels without
   * rebuilding the markup. Leaves the href / icons alone so the
   * transition is instant.
   */
  _refreshSocialFooterLabels() {
    if (!this.el) return;
    const section = this.el.querySelector('#home-social-footer');
    if (!section) return;

    const isEn = i18n.locale === 'en';
    const titleEl = section.querySelector('[data-social-title]');
    if (titleEl) titleEl.textContent = '🔗 ' + (isEn ? 'Follow Us' : 'Bizi Takip Edin');

    const cards = section.querySelectorAll('.pf-social-card');
    cards.forEach((card, i) => {
      const meta = ORGANIZATION.social[i];
      if (!meta) return;
      const nameEl = card.querySelector('[data-social-name]');
      const descEl = card.querySelector('[data-social-desc]');
      if (nameEl) nameEl.textContent = (isEn && meta.nameEn) ? meta.nameEn : meta.name;
      if (descEl) descEl.textContent = isEn
        ? (meta.descriptionEn || meta.description || '')
        : (meta.description || '');
    });
  }
}
