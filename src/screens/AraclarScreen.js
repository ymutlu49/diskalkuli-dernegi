import { BaseScreen } from '../core/BaseScreen.js';

/**
 * Somut Araçlar — chips + tool cards.
 *
 * The tool cards are pre-rendered in index.html. Filtering was
 * historically done by inline `onclick="filterArac(this, cat)"`
 * handlers routed through compat.js; the compat shim is still there
 * for backwards compatibility, but this controller now owns the
 * wiring via event delegation. Inline handlers still work (they set
 * the same class), so the migration is additive and safe.
 */
export class AraclarScreen extends BaseScreen {
  init() {
    if (!this.el) return;

    // Wire chip clicks via delegation so future re-renders just work.
    this.delegate('click', '.arac-chip', (_e, chip) => {
      this._applyFilter(chip);
    });
    this.delegate('keydown', '.arac-chip', (e, chip) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._applyFilter(chip);
      }
    });

    // Make chips keyboard-focusable and properly labelled for SR.
    this.$$('.arac-chip').forEach((chip) => {
      if (!chip.hasAttribute('tabindex')) chip.setAttribute('tabindex', '0');
      if (!chip.hasAttribute('role'))     chip.setAttribute('role', 'button');
      if (!chip.hasAttribute('aria-pressed')) {
        chip.setAttribute('aria-pressed', chip.classList.contains('on') ? 'true' : 'false');
      }
    });
  }

  _applyFilter(chip) {
    const cat = chip.getAttribute('data-cat') || chip.dataset.cat;
    const scope = this.el;
    scope.querySelectorAll('.arac-chip').forEach((c) => {
      const on = c === chip;
      c.classList.toggle('on', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    scope.querySelectorAll('.arac-card').forEach((card) => {
      const cardCat = card.getAttribute('data-cat');
      card.classList.toggle('hidden', cat && cat !== 'tumu' && cardCat !== cat);
    });
  }
}
