import { BaseScreen } from '../core/BaseScreen.js';
import { escapeHtml } from '../core/escapeHtml.js';
import { YAYINLAR } from '../data/content.js';
import { renderChips } from '../ui/chips.js';

/**
 * Publications list + filter chips.
 * Inline pub-card markup is kept in index.html for design fidelity;
 * filter chips use inline `onclick="filterPub(this, cat)"` which
 * routes through the compat shim. This controller only paints the
 * #pub-list container if it exists.
 */
export class YayinlarScreen extends BaseScreen {
  init() {
    renderChips('pub-chips', ['Tümü', 'Kitap', 'Makale', 'Kitap Bölümü']);

    // Wire legacy pub-chip filtering via delegation so we don't need
    // the inline onclick="filterPub(this, cat)" anymore. The compat
    // shim stays in place for BC.
    if (this.el) {
      this.delegate('click', '.pub-chip', (_e, chip) => this._applyPubFilter(chip));
      this.delegate('keydown', '.pub-chip', (e, chip) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this._applyPubFilter(chip);
        }
      });
      this.$$('.pub-chip').forEach((chip) => {
        if (!chip.hasAttribute('tabindex')) chip.setAttribute('tabindex', '0');
        if (!chip.hasAttribute('role'))     chip.setAttribute('role', 'button');
        if (!chip.hasAttribute('aria-pressed')) {
          chip.setAttribute('aria-pressed', chip.classList.contains('on') ? 'true' : 'false');
        }
      });
    }

    // Paint the dynamic list (pub-list) if it exists in the markup
    const el = document.getElementById('pub-list');
    if (el) {
      el.innerHTML = YAYINLAR.map((p) => `
        <article style="margin:0 16px 12px">
          <div class="card" style="border-radius:var(--r-lg);padding:14px;display:flex;gap:12px">
            <div aria-hidden="true" style="width:52px;height:68px;background:var(--green-light);border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--green-dark)" stroke-width="2" width="24" height="24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div style="flex:1">
              <h3 style="font-family:var(--font-d);font-size:13px;font-weight:800;color:var(--green-dark);line-height:1.35;margin:0 0 4px">${escapeHtml(p.title)}</h3>
              <div style="font-size:11px;color:var(--gray-400);margin-bottom:6px">${escapeHtml(p.author)} · ${escapeHtml(String(p.year))}</div>
              <span style="font-size:10px;font-weight:700;padding:2px 9px;border-radius:999px;background:var(--brown-light);color:var(--brown-dark)">${escapeHtml(p.type)}</span>
            </div>
          </div>
        </article>`).join('');
    }
  }

  _applyPubFilter(chip) {
    const cat = chip.getAttribute('data-cat') || chip.dataset.cat;
    const scope = this.el;
    scope.querySelectorAll('.pub-chip').forEach((c) => {
      const on = c === chip;
      c.classList.toggle('on', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    scope.querySelectorAll('.pub-card').forEach((card) => {
      const cardCat = card.getAttribute('data-pubcat');
      card.classList.toggle('hidden', cat && cat !== 'tumu' && cardCat !== cat);
    });
  }
}
