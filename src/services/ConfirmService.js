/**
 * Promise-based custom confirm / prompt dialogs.
 *
 * Replaces native `window.confirm()` / `prompt()`, which render as
 * system-chrome bars that look out of place inside an installed PWA.
 *
 *   await confirm.ask({
 *     title: 'Silmek istediğinize emin misiniz?',
 *     message: 'Bu işlem geri alınamaz.',
 *     danger: true,
 *     confirmLabel: 'Evet, sil',
 *   });
 *
 *   const reason = await confirm.prompt({
 *     title: 'Reddetme gerekçesi',
 *     placeholder: 'Kısa bir not yazın...',
 *     multiline: true,
 *   });
 *
 * Accessibility:
 *   • role="dialog" + aria-modal + aria-labelledby/aria-describedby
 *   • Escape key cancels, Enter confirms
 *   • Focus trap between Cancel ↔ OK
 *   • Previously-focused element is restored on close
 */
import { logger } from '../core/logger.js';

/** Elements that can receive keyboard focus inside the dialog. */
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), ' +
  'textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export class ConfirmService {
  constructor() {
    this._overlay = null;
    this._lastFocused = null;
    this._keydownHandler = null;
  }

  attach() {
    this._ensureOverlay();
  }

  /**
   * Yes/No confirmation.
   * @returns {Promise<boolean>}
   */
  ask({
    title        = 'Onayla',
    message      = '',
    icon         = '?',
    confirmLabel = 'Onayla',
    cancelLabel  = 'Vazgeç',
    danger       = false,
  } = {}) {
    return new Promise((resolve) => {
      this._ensureOverlay();
      this._paint({ title, message, icon, danger, promptMode: false });
      this._bind(resolve, false);
      this._show();

      this._overlay.querySelector('.confirm-ok').textContent = confirmLabel;
      this._overlay.querySelector('.confirm-cancel').textContent = cancelLabel;

      // Focus the confirm button by default. For destructive actions
      // we focus Cancel to reduce the risk of accidental confirmation.
      setTimeout(() => {
        const target = danger
          ? this._overlay.querySelector('.confirm-cancel')
          : this._overlay.querySelector('.confirm-ok');
        if (target) target.focus();
      }, 50);
    });
  }

  /**
   * Text input prompt.
   * @returns {Promise<string|null>} null when the user cancels
   */
  prompt({
    title        = 'Bilgi girin',
    message      = '',
    placeholder  = '',
    defaultValue = '',
    multiline    = false,
    confirmLabel = 'Tamam',
    cancelLabel  = 'İptal',
  } = {}) {
    return new Promise((resolve) => {
      this._ensureOverlay();
      this._paint({ title, message, icon: '✎', danger: false, promptMode: true, multiline });
      this._show();

      const input = this._overlay.querySelector('.confirm-input');
      input.placeholder = placeholder;
      input.value = defaultValue;
      input.setAttribute('aria-label', title);
      setTimeout(() => input.focus(), 50);

      this._overlay.querySelector('.confirm-ok').textContent = confirmLabel;
      this._overlay.querySelector('.confirm-cancel').textContent = cancelLabel;

      this._bind(
        (ok) => resolve(ok ? input.value : null),
        true
      );
    });
  }

  /* ── internals ──────────────────────────────────────────── */

  _ensureOverlay() {
    if (this._overlay) return;
    const el = document.createElement('div');
    el.className = 'confirm-overlay';
    // NOTE: static shell, no user data — innerHTML is safe here.
    el.innerHTML = `
      <div class="confirm-sheet" role="dialog" aria-modal="true"
           aria-labelledby="confirm-title" aria-describedby="confirm-message">
        <div class="confirm-icon" aria-hidden="true"></div>
        <h2 class="confirm-title" id="confirm-title"></h2>
        <p class="confirm-message" id="confirm-message"></p>
        <textarea class="confirm-input" style="display:none"></textarea>
        <div class="confirm-actions">
          <button type="button" class="confirm-cancel"></button>
          <button type="button" class="confirm-ok"></button>
        </div>
      </div>
    `;
    document.body.appendChild(el);
    this._overlay = el;

    // Dismiss on backdrop click
    el.addEventListener('click', (e) => {
      if (e.target === el) this._dismissAs(false);
    });
  }

  _paint({ title, message, icon, danger, promptMode, multiline = false }) {
    const o = this._overlay;
    o.querySelector('.confirm-icon').textContent = icon;
    o.querySelector('.confirm-icon').classList.toggle('danger', !!danger);
    o.querySelector('.confirm-title').textContent = title;
    o.querySelector('.confirm-message').textContent = message;

    const input = o.querySelector('.confirm-input');
    if (promptMode) {
      input.style.display = 'block';
      input.rows = multiline ? 4 : 1;
      input.classList.toggle('multiline', !!multiline);
    } else {
      input.style.display = 'none';
      input.value = '';
    }

    const ok = o.querySelector('.confirm-ok');
    ok.classList.toggle('danger', !!danger);
  }

  _bind(resolve, isPrompt) {
    const o = this._overlay;
    const ok     = o.querySelector('.confirm-ok');
    const cancel = o.querySelector('.confirm-cancel');
    const input  = o.querySelector('.confirm-input');

    const cleanup = () => {
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      document.removeEventListener('keydown', this._keydownHandler, true);
      this._keydownHandler = null;
      if (isPrompt) input.removeEventListener('keydown', onInputKey);
    };
    const finish = (result) => {
      cleanup();
      this._hide();
      // Restore focus to the element that opened the dialog.
      if (this._lastFocused && typeof this._lastFocused.focus === 'function') {
        try { this._lastFocused.focus(); } catch (err) {
          logger.warn('ConfirmService', 'focus restore failed', err);
        }
      }
      this._lastFocused = null;
      resolve(result);
    };
    const onOk     = () => finish(true);
    const onCancel = () => finish(false);
    const onInputKey = (e) => {
      // In single-line prompt, Enter submits; in multiline, Ctrl+Enter.
      if (e.key === 'Enter' && !e.shiftKey && input.rows <= 1) {
        e.preventDefault();
        onOk();
      }
    };

    // Global keydown: Escape dismisses, Tab is trapped inside the dialog.
    const trap = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === 'Tab') {
        const focusables = Array.from(
          o.querySelectorAll(FOCUSABLE_SELECTOR)
        ).filter((n) => n.offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last  = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    this._keydownHandler = trap;
    document.addEventListener('keydown', trap, true);

    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
    if (isPrompt) input.addEventListener('keydown', onInputKey);

    // Remember the resolver so backdrop click can cancel
    this._dismissAs = onCancel;
  }

  _show() {
    // Remember focus so we can restore it on close.
    this._lastFocused = document.activeElement;
    this._overlay.classList.add('open');
    // Hide background content from assistive tech.
    const app = document.getElementById('app');
    if (app) app.setAttribute('aria-hidden', 'true');
  }

  _hide() {
    this._overlay.classList.remove('open');
    const app = document.getElementById('app');
    if (app) app.removeAttribute('aria-hidden');
  }
}
