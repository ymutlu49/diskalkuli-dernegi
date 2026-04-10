import { BaseScreen } from '../core/BaseScreen.js';
import { escapeHtml } from '../core/escapeHtml.js';
import { i18n, t } from '../core/i18n.js';
import { ROLE_LABELS, ROLE_COLORS } from '../data/roles.js';

/**
 * Profile screen — user info, stats, settings, language switcher, logout.
 */
export class ProfilScreen extends BaseScreen {
  init() {
    this.ctx.bus.on('auth:login', () => this._render());
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
}
