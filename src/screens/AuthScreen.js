import { BaseScreen } from '../core/BaseScreen.js';
import { t } from '../core/i18n.js';

/**
 * Demo-role picker + email/password form.
 * Tapping a role card calls AuthService.loginAs(); tapping the
 * primary button submits the email form.
 */
export class AuthScreen extends BaseScreen {
  init() {
    this.ctx.bus.on('auth:error', ({ message }) => {
      if (this.ctx.router.current === 'auth') this._showError(message);
    });

    // Wire Enter key on the email form inputs.
    if (this.el) {
      this.delegate('keydown', '#auth-email, #auth-password', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); this.submit(); }
      });
    }
  }

  onEnter() {
    this._hideError();
    this._updateLabels();
  }

  submit() {
    const email    = (document.getElementById('auth-email') || {}).value || '';
    const password = (document.getElementById('auth-password') || {}).value || '';
    const btn      = this.$('.auth-btn-primary');

    if (btn) {
      btn.textContent = t('auth.loggingIn');
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
    }

    this.ctx.services.auth.loginWithEmail(email, password, (result) => {
      if (btn) {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        btn.innerHTML =
          `<span>${t('auth.login')}</span>` +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
          '<polyline points="9 18 15 12 9 6"/></svg>';
      }
      if (!result.ok) this._showError(result.message);
    });
  }

  _togglePassword() {
    const inp = document.getElementById('auth-password');
    if (!inp) return;
    inp.type = inp.type === 'password' ? 'text' : 'password';
    const btn = document.getElementById('pw-toggle-btn');
    if (btn) {
      btn.style.opacity = inp.type === 'text' ? '1' : '0.5';
      btn.setAttribute('aria-label',
        inp.type === 'text' ? t('auth.hidePassword') : t('auth.showPassword')
      );
    }
  }

  _showError(message) {
    const el = document.getElementById('auth-error');
    if (el) {
      el.textContent = '⚠ ' + message;
      el.style.display = 'flex';
      el.setAttribute('role', 'alert');
    }
  }

  _hideError() {
    const el = document.getElementById('auth-error');
    if (el) { el.style.display = 'none'; el.removeAttribute('role'); }
  }

  _updateLabels() {
    const btn = this.$('.auth-btn-primary');
    if (btn && !btn.disabled) {
      const span = btn.querySelector('span');
      if (span) span.textContent = t('auth.login');
    }
    const demoLabel = this.$('.auth-demo-label');
    if (demoLabel) demoLabel.textContent = t('auth.viewAsDemo');
  }
}
