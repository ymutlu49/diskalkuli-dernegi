import { BaseScreen } from '../core/BaseScreen.js';
import { escapeHtml, escapeUrl } from '../core/escapeHtml.js';
import { i18n, t } from '../core/i18n.js';
import { ROLE_LABELS, ROLE_COLORS } from '../data/roles.js';
import { ORGANIZATION } from '../data/org.js';

/**
 * Profile screen — user info, stats, settings, language switcher, logout.
 */
export class ProfilScreen extends BaseScreen {
  init() {
    this.ctx.bus.on('auth:login', () => this._render());
    this._injectSocialLinks();
    this._injectLanguageSwitcher();
  }

  onEnter() {
    this._render();
  }

  _render() {
    const user = this.ctx.store.get('currentUser');
    if (!user) return;

    const roleLabel = ROLE_LABELS[user.roleKey] || ROLE_LABELS[user.role] || user.role;
    const initials  = user.initials || user.name.slice(0, 2).toUpperCase();
    const permCount = Array.isArray(user.perms) ? user.perms.length : 0;

    this.setText('pf-av',       initials);
    this.setText('pf-name',     user.name);
    this.setText('pf-email',    user.email);
    this.setText('pf-fullname', user.name);
    this.setText('pf-mail',     user.email);
    this.setText('pf-city',     user.city || '-');
    this.setText('pf-role-name', roleLabel);
    this.setText('pf-role-count', `${permCount} yetki`);

    // Role badge color
    const badge = document.getElementById('pf-badge-role');
    if (badge) {
      const displayLabel = user.id === 1
        ? 'YK Başkanı'
        : user.id === 5
          ? 'Denetleme K. Başkanı'
          : roleLabel;
      badge.textContent = displayLabel;
      badge.style.background = ROLE_COLORS[user.roleKey] || ROLE_COLORS[user.role] || 'var(--green-mid)';
    }

    // Admin shortcut visibility
    const adminBtn = document.getElementById('admin-home-btn');
    if (adminBtn) adminBtn.style.display = user.superadmin ? 'flex' : 'none';
    const adminSec = document.getElementById('admin-pf-section');
    if (adminSec) adminSec.style.display = user.superadmin ? '' : 'none';
    const shortcut = document.getElementById('admin-shortcut');
    if (shortcut) shortcut.style.display = user.superadmin ? '' : 'none';

    // Role-based stat counts
    const yilMap  = { yonetim: '7', ihsan: '6', temsilci: '4', uye: '2', genel: '1' };
    const sertMap = { yonetim: '8', ihsan: '5', temsilci: '4', uye: '3', genel: '0' };
    this.setText('pf-stat-yil',   yilMap[user.roleKey]  || yilMap[user.role]  || '1');
    this.setText('pf-stat-sert',  sertMap[user.roleKey] || sertMap[user.role] || '0');
    this.setText('pf-stat-yetki', String(permCount));

    // Update language selector highlight
    this._highlightLang(i18n.locale);
  }

  /* ── Language switcher ──────────────────────────────── */

  _injectLanguageSwitcher() {
    if (!this.el) return;
    // Find the settings section (or the screen-body) and prepend the switcher
    const body = this.$('.screen-body');
    if (!body) return;

    // Build the language widget
    const widget = document.createElement('div');
    widget.id = 'pf-lang-switch';
    widget.className = 'pf-lang-switch';
    widget.setAttribute('role', 'radiogroup');
    widget.setAttribute('aria-label', 'Dil / Language');
    widget.innerHTML = `
      <div class="pf-lang-title" style="font-family:var(--font-d);font-size:13px;font-weight:800;color:var(--green-dark);margin:0 16px 8px;padding-top:14px">🌐 ${escapeHtml(t('nav.settings'))} — Dil / Language</div>
      <div style="display:flex;gap:8px;margin:0 16px 14px">
        <button type="button" class="pf-lang-btn" data-lang="tr"
                role="radio" aria-checked="${i18n.locale === 'tr'}"
                style="flex:1;padding:10px;border-radius:var(--r-md);border:2px solid var(--gray-200);background:var(--surface,#fff);cursor:pointer;text-align:center;font-size:13px;font-weight:700;transition:border-color .15s">
          🇹🇷 Türkçe
        </button>
        <button type="button" class="pf-lang-btn" data-lang="en"
                role="radio" aria-checked="${i18n.locale === 'en'}"
                style="flex:1;padding:10px;border-radius:var(--r-md);border:2px solid var(--gray-200);background:var(--surface,#fff);cursor:pointer;text-align:center;font-size:13px;font-weight:700;transition:border-color .15s">
          🇬🇧 English
        </button>
      </div>
    `;

    // Insert before the logout button or at the end
    const logoutSection = body.querySelector('.pf-logout-section, .logout-section');
    if (logoutSection) {
      body.insertBefore(widget, logoutSection);
    } else {
      body.appendChild(widget);
    }

    // Wire click handlers
    widget.querySelectorAll('.pf-lang-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const lang = btn.dataset.lang;
        if (lang === i18n.locale) return;
        await i18n.load(lang);
        this._highlightLang(lang);
        this.ctx.services.toast.success(
          lang === 'tr' ? 'Dil Türkçe olarak değiştirildi.' : 'Language changed to English.'
        );
        // Re-render screens that are visible
        this._render();
      });
    });
  }

  _highlightLang(locale) {
    const widget = document.getElementById('pf-lang-switch');
    if (!widget) return;
    widget.querySelectorAll('.pf-lang-btn').forEach((btn) => {
      const on = btn.dataset.lang === locale;
      btn.style.borderColor = on ? 'var(--green)' : 'var(--gray-200)';
      btn.style.background  = on ? 'var(--green-light)' : 'var(--surface,#fff)';
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }

  /* ── Social links section ─────────────────────────────── */

  /**
   * Inject a "Bize ulaşın" (Contact / Follow) section listing the
   * organization's public presence: website + Instagram. Each entry
   * opens in a new tab. On mobile, the Instagram entry is picked up
   * by the installed Instagram app via Android intent / iOS
   * Universal Links.
   */
  _injectSocialLinks() {
    if (!this.el) return;
    const body = this.$('.screen-body');
    if (!body) return;

    const section = document.createElement('div');
    section.id = 'pf-social';
    section.className = 'pf-social-section';
    section.setAttribute('aria-label', 'Dernek bağlantıları');

    const titleTr = 'Bizi Takip Edin';
    const titleEn = 'Follow Us';
    const title = i18n.locale === 'en' ? titleEn : titleTr;

    const cards = ORGANIZATION.social.map((s) => {
      const desc = i18n.locale === 'en'
        ? (s.descriptionEn || s.description || '')
        : (s.description || '');
      return `
        <a class="pf-social-card"
           href="${escapeUrl(s.url)}"
           target="_blank"
           rel="noopener noreferrer"
           aria-label="${escapeHtml(s.name)}: ${escapeHtml(s.displayName)}">
          <span class="pf-social-icon" aria-hidden="true"
                style="background:${escapeHtml(s.bg)};color:#fff">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="${escapeHtml(s.iconPath)}"/>
            </svg>
          </span>
          <span class="pf-social-text">
            <span class="pf-social-name">${escapeHtml(s.name)}</span>
            <span class="pf-social-handle">${escapeHtml(s.displayName)}</span>
            ${desc ? `<span class="pf-social-desc">${escapeHtml(desc)}</span>` : ''}
          </span>
          <svg class="pf-social-arrow" aria-hidden="true"
               viewBox="0 0 24 24" width="18" height="18"
               fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 17L17 7M9 7h8v8"/>
          </svg>
        </a>
      `;
    }).join('');

    section.innerHTML = `
      <div class="pf-social-title">🔗 ${escapeHtml(title)}</div>
      <div class="pf-social-grid">${cards}</div>
    `;

    body.appendChild(section);
  }
}
