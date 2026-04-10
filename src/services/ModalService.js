/**
 * Helper for the bottom-sheet modals defined in index.html.
 *
 * Every modal follows the same markup pattern:
 *   <div class="modal-bg" id="{id}">…</div>
 * and is shown/hidden by toggling the `open` class.
 *
 * Accessibility:
 *   • On open, modals get role="dialog" + aria-modal
 *   • Escape key closes the topmost open modal
 *   • Focus restored to the element that triggered open()
 */
import { logger } from '../core/logger.js';

export class ModalService {
  constructor() {
    this._bound = false;
    this._focusStack = [];
    this._escHandler = null;
  }

  attach() {
    if (this._bound) return;
    document.querySelectorAll('.modal-bg').forEach((bg) => {
      // Click outside dismisses
      bg.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) this._closeEl(bg);
      });

      // Promote to role="dialog" if not already set
      if (!bg.hasAttribute('role')) bg.setAttribute('role', 'dialog');
      if (!bg.hasAttribute('aria-modal')) bg.setAttribute('aria-modal', 'true');
      if (!bg.hasAttribute('aria-hidden')) bg.setAttribute('aria-hidden', 'true');
    });

    // Global Escape handler closes the topmost modal
    this._escHandler = (e) => {
      if (e.key !== 'Escape') return;
      const open = Array.from(document.querySelectorAll('.modal-bg.open'));
      if (open.length === 0) return;
      e.preventDefault();
      this._closeEl(open[open.length - 1]);
    };
    document.addEventListener('keydown', this._escHandler);

    this._bound = true;
  }

  open(id) {
    const el = document.getElementById(id);
    if (!el) return;
    this._focusStack.push(document.activeElement);
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    // Focus the first focusable element inside the modal.
    setTimeout(() => {
      const target = el.querySelector(
        'input, textarea, select, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (target) {
        try { target.focus(); } catch (err) { logger.warn('ModalService', err); }
      }
    }, 60);
  }

  close(id) {
    const el = document.getElementById(id);
    if (el) this._closeEl(el);
  }

  toggle(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.classList.contains('open')) this._closeEl(el);
    else this.open(id);
  }

  _closeEl(el) {
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
    // Restore the focus that was active when we opened the modal.
    const prev = this._focusStack.pop();
    if (prev && typeof prev.focus === 'function') {
      try { prev.focus(); } catch { /* ignore */ }
    }
  }
}
