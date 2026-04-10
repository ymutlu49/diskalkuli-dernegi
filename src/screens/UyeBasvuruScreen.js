import { BaseScreen } from '../core/BaseScreen.js';

/**
 * Multi-step membership application form.
 * Step navigation is handled locally; the final submit just shows the
 * success panel since the backend isn't real.
 */
export class UyeBasvuruScreen extends BaseScreen {
  init() {
    // Step buttons and submit use inline onclick → compat shim.
  }

  onEnter() {
    this._goToStep(1);
    this._hideSuccess();
  }

  _goToStep(n) {
    [1, 2, 3].forEach((i) => {
      const panel = document.getElementById('uye-step' + i);
      if (panel) panel.style.display = i === n ? '' : 'none';
      const dot = document.getElementById('ustep' + i);
      if (dot) {
        dot.className =
          i < n ? 'step-item done' :
          i === n ? 'step-item active' :
          'step-item';
      }
    });
  }

  _submit() {
    const kvkk  = document.getElementById('u-kvkk');
    const tuzuk = document.getElementById('u-tuzuk');
    if (!kvkk || !kvkk.checked || !tuzuk || !tuzuk.checked) {
      this.ctx.services.toast.show('Lütfen onay kutucuklarını işaretleyiniz.');
      return;
    }
    const step3 = document.getElementById('uye-step3');
    if (step3) step3.style.display = 'none';
    const success = document.getElementById('uye-success');
    if (success) success.style.display = 'flex';
  }

  _hideSuccess() {
    const success = document.getElementById('uye-success');
    if (success) success.style.display = 'none';
  }
}
