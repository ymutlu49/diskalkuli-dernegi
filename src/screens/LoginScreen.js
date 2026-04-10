import { BaseScreen } from '../core/BaseScreen.js';
import { t } from '../core/i18n.js';

/**
 * Email/password login screen + link to the demo-role "auth" screen.
 */
export class LoginScreen extends BaseScreen {
  init() {
    this.ctx.bus.on('auth:error', ({ message }) => {
      if (this.ctx.router.current === 'login') this._showError(message);
    });

    // Wire submit via delegation so the inline onclick in HTML
    // still works as a fallback, but we also support Enter key.
    if (this.el) {
      this.delegate('keydown', '#login-email, #login-password', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); this.submit(); }
      });
    }
  }

  onEnter() {
    this._hideError();
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

  /** Re-paint translatable labels when the locale might have changed. */
  _updateLabels() {
    const btn = document.getElementById('login-submit-btn');
    if (btn && !btn.disabled) btn.textContent = t('auth.login');
  }
}
