import { BaseScreen } from '../core/BaseScreen.js';
import { i18n, t } from '../core/i18n.js';

/**
 * Email/password login screen + link to the demo-role "auth" screen.
 *
 * Owns the TR/EN language switcher in the top-right corner of the
 * hero. Wires it so the whole screen (and every [data-i18n] element
 * in the app) updates immediately on change.
 */
export class LoginScreen extends BaseScreen {
  init() {
    this.ctx.bus.on('auth:error', ({ message }) => {
      if (this.ctx.router.current === 'login') this._showError(message);
    });

    if (this.el) {
      // Enter key submits from either field.
      this.delegate('keydown', '#login-email, #login-password', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); this.submit(); }
      });

      // Language switcher (TR/EN) — wire all buttons that carry
      // data-set-lang. Click + keyboard activation.
      this.delegate('click', '[data-set-lang]', async (_e, btn) => {
        const lang = btn.getAttribute('data-set-lang');
        if (!lang || lang === i18n.locale) return;
        await i18n.load(lang);
        this._highlightLang(lang);
        this._updateLabels();
      });
    }

    // Also re-highlight whenever the locale flips from anywhere
    // else in the app (e.g. the Profil screen switcher).
    i18n.onChange((lang) => {
      if (this.ctx.router.current === 'login') {
        this._highlightLang(lang);
        this._updateLabels();
      }
    });
  }

  onEnter() {
    this._hideError();
    this._highlightLang(i18n.locale);
    this._updateLabels();

    const emailInput = document.getElementById('login-email');
    if (emailInput) emailInput.focus();
  }

  submit() {
    const emailInput = document.getElementById('login-email');
    const pwInput    = document.getElementById('login-password');
    const btn        = document.getElementById('login-submit-btn');

    const email    = (emailInput && emailInput.value) || '';
    const password = (pwInput    && pwInput.value)    || '';

    if (btn) {
      btn.textContent = t('auth.loggingIn');
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
    }

    this.ctx.services.auth.loginWithEmail(email, password, (result) => {
      if (btn) {
        btn.textContent = t('auth.login');
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
      }
      if (!result.ok) this._showError(result.message);
    });
  }

  _togglePassword() {
    const inp = document.getElementById('login-password');
    if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
  }

  _showError(message) {
    const el = document.getElementById('login-error');
    if (el) {
      el.textContent = '⚠ ' + message;
      el.style.display = 'flex';
      el.setAttribute('role', 'alert');
    }
  }

  _hideError() {
    const el = document.getElementById('login-error');
    if (el) { el.style.display = 'none'; el.removeAttribute('role'); }
  }

  /**
   * Mark the active language button as pressed.
   */
  _highlightLang(locale) {
    this.$$('[data-set-lang]').forEach((btn) => {
      const on = btn.getAttribute('data-set-lang') === locale;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  /**
   * Paint every translatable label on the login screen. This is
   * the companion of main.js's global [data-i18n] auto-updater;
   * we call it locally too so the UI flips instantly when the
   * user taps TR/EN, without waiting for a re-render cycle.
   *
   * Supports three attributes:
   *   data-i18n             → textContent
   *   data-i18n-placeholder → input/textarea placeholder
   *   data-i18n-aria        → aria-label
   */
  _updateLabels() {
    if (!this.el) return;

    this.$$('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    this.$$('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.setAttribute('placeholder', t(key));
    });
    this.$$('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      if (key) el.setAttribute('aria-label', t(key));
    });

    // The "or" divider has no stable key (it's local to the form).
    // Translate it inline so we don't need a new catalog entry.
    const divider = this.$('.login-divider span');
    if (divider) {
      divider.textContent = i18n.locale === 'en' ? 'or' : 'veya';
    }

    // Keep the submit button label in sync while not busy.
    const submit = document.getElementById('login-submit-btn');
    if (submit && !submit.disabled) submit.textContent = t('auth.login');
  }
}
