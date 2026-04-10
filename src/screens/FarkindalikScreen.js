import { BaseScreen } from '../core/BaseScreen.js';
import { renderChips } from '../ui/chips.js';

/**
 * "Farkındalık" (Awareness) — static content + FAQ accordion.
 *
 * Accordion items originally used inline `onclick="toggleFaq(this)"`
 * routed through the compat shim. We now handle it via event
 * delegation and upgrade each `.faq-q` to a proper button with
 * `aria-expanded` so screen readers announce open/closed state.
 */
export class FarkindalikScreen extends BaseScreen {
  init() {
    renderChips('faq-chips', ['Tümü', 'Tanım', 'Belirtiler', 'Tanılama', 'Müdahale', 'Aile']);

    if (!this.el) return;

    // Upgrade FAQ question rows to accessible buttons.
    this.$$('.faq-q').forEach((q, i) => {
      if (!q.hasAttribute('role')) q.setAttribute('role', 'button');
      if (!q.hasAttribute('tabindex')) q.setAttribute('tabindex', '0');
      const item = q.closest('.faq-item');
      const isOpen = item ? item.classList.contains('open') : false;
      q.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      // Link the question to its answer panel for aria-controls,
      // if the answer has an id already; otherwise synthesize one.
      const answer = item ? item.querySelector('.faq-a') : null;
      if (answer) {
        if (!answer.id) answer.id = `faq-a-${i}`;
        q.setAttribute('aria-controls', answer.id);
      }
    });

    // Delegated click + keyboard activation
    this.delegate('click', '.faq-q', (_e, q) => this._toggleFaq(q));
    this.delegate('keydown', '.faq-q', (e, q) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._toggleFaq(q);
      }
    });
  }

  _toggleFaq(q) {
    const item = q.closest('.faq-item');
    if (!item) return;
    const willOpen = !item.classList.contains('open');
    item.classList.toggle('open', willOpen);
    q.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  }
}
