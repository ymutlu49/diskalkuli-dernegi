import { BaseScreen } from '../core/BaseScreen.js';

/**
 * Province-representative application form (single page + success state).
 */
export class TemsilciBasvuruScreen extends BaseScreen {
  init() {
    // Submit button uses inline onclick → compat shim.
  }

  onEnter() {
    const form = document.getElementById('temsilci-form');
    if (form) form.style.display = '';
    const success = document.getElementById('temsilci-success');
    if (success) success.style.display = 'none';
  }

  _submit() {
    const kvkk  = document.getElementById('t-kvkk');
    const gorev = document.getElementById('t-gorev');
    if (!kvkk || !kvkk.checked || !gorev || !gorev.checked) {
      this.ctx.services.toast.show('Lütfen onay kutucuklarını işaretleyiniz.');
      return;
    }
    const form = document.getElementById('temsilci-form');
    if (form) form.style.display = 'none';
    const success = document.getElementById('temsilci-success');
    if (success) success.style.display = 'flex';
  }
}
