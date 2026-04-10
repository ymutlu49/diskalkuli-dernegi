/**
 * Lightweight toast notifications — variants + optional action button.
 *
 * Usage:
 *   toast.show('Saved')                         → neutral (green)
 *   toast.success('Kaydedildi')                 → green
 *   toast.error('Hata oluştu')                  → red
 *   toast.warning('Dikkat')                     → brown
 *   toast.info('Bilgi')                         → blue
 *   toast.show({ message, variant, action })    → full control
 *
 * Calling show() while another toast is visible immediately replaces
 * it (no stacking). Each toast dismisses itself after `duration` ms.
 *
 * Accessibility:
 *   • A single persistent live region (role="status") is reused so
 *     screen readers announce each toast message without fighting
 *     over focus.
 *   • Error toasts use `role="alert"` (assertive) so they interrupt
 *     the user immediately.
 */
const VARIANTS = {
  neutral: { bg: 'var(--green-dark)', icon: '',  role: 'status', live: 'polite' },
  success: { bg: 'var(--green-dark)', icon: '✓', role: 'status', live: 'polite' },
  error:   { bg: 'var(--danger)',     icon: '⚠', role: 'alert',  live: 'assertive' },
  warning: { bg: 'var(--brown-dark)', icon: '!', role: 'status', live: 'polite' },
  info:    { bg: '#1565C0',           icon: 'ℹ', role: 'status', live: 'polite' },
};

export class ToastService {
  constructor({ duration = 2800 } = {}) {
    this._duration = duration;
    this._activeEl = null;
    this._dismissTimer = null;
    this._liveRegion = null;
  }

  attach() {
    this._ensureLiveRegion();
  }

  /** Shared live region used for SR announcement only (visually hidden). */
  _ensureLiveRegion() {
    if (this._liveRegion) return;
    const r = document.createElement('div');
    r.className = 'sr-only';
    r.setAttribute('aria-live', 'polite');
    r.setAttribute('aria-atomic', 'true');
    r.id = 'toast-live-region';
    document.body.appendChild(r);
    this._liveRegion = r;
  }

  /* ── Convenience variants ────────────────────────────────── */
  success(message, options = {}) { return this.show({ message, variant: 'success', ...options }); }
  error(message, options = {})   { return this.show({ message, variant: 'error',   ...options }); }
  warning(message, options = {}) { return this.show({ message, variant: 'warning', ...options }); }
  info(message, options = {})    { return this.show({ message, variant: 'info',    ...options }); }

  /**
   * Main show() — accepts a string or an options bag.
   */
  show(input) {
    const opts = typeof input === 'string'
      ? { message: input, variant: 'neutral' }
      : (input || {});
    const { message = '', variant = 'neutral', action = null, duration } = opts;
    const v = VARIANTS[variant] || VARIANTS.neutral;

    this._removeActive();
    this._ensureLiveRegion();

    // Push text into the live region so screen readers announce it.
    // We clear first to guarantee the change event fires for repeats.
    this._liveRegion.textContent = '';
    // Allow the DOM to register the clear before we set the new text.
    setTimeout(() => {
      if (this._liveRegion) this._liveRegion.textContent = message;
    }, 30);

    const el = document.createElement('div');
    el.className = `app-toast toast-${variant}`;
    el.setAttribute('role', v.role);
    el.setAttribute('aria-live', v.live);
    el.setAttribute('aria-atomic', 'true');
    el.style.cssText = [
      'position:fixed',
      'left:50%',
      'bottom:calc(90px + env(safe-area-inset-bottom))',
      'transform:translateX(-50%)',
      `background:${v.bg}`,
      'color:#fff',
      'padding:12px 18px',
      'border-radius:999px',
      'font-family:var(--font-d)',
      'font-size:13px',
      'font-weight:700',
      'z-index:9999',
      'box-shadow:0 6px 24px rgba(0,0,0,.25)',
      'max-width:calc(100% - 32px)',
      'display:flex',
      'align-items:center',
      'gap:10px',
      'opacity:0',
      'transition:opacity .25s, transform .25s',
    ].join(';');

    if (v.icon) {
      const iconEl = document.createElement('span');
      iconEl.textContent = v.icon;
      iconEl.setAttribute('aria-hidden', 'true');
      iconEl.style.cssText = 'font-size:15px;flex-shrink:0';
      el.appendChild(iconEl);
    }

    const text = document.createElement('span');
    text.textContent = message;
    text.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
    el.appendChild(text);

    if (action && action.label && typeof action.onClick === 'function') {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = action.label;
      btn.style.cssText = 'background:rgba(255,255,255,.2);color:#fff;border:none;padding:5px 12px;border-radius:999px;font-family:var(--font-d);font-size:12px;font-weight:800;cursor:pointer;margin-left:6px;flex-shrink:0';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        try { action.onClick(); } catch { /* ignore */ }
        this._removeActive();
      });
      el.appendChild(btn);
    }

    document.body.appendChild(el);
    this._activeEl = el;
    // Force a reflow so the transition fires
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translate(-50%, -4px)';
    });

    const ms = Number.isFinite(duration) ? duration : this._duration;
    this._dismissTimer = setTimeout(() => this._fadeOut(el), ms);
  }

  _fadeOut(el) {
    if (this._activeEl !== el) return;
    el.style.opacity = '0';
    el.style.transform = 'translate(-50%, 8px)';
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
      if (this._activeEl === el) this._activeEl = null;
    }, 260);
  }

  _removeActive() {
    if (this._dismissTimer) {
      clearTimeout(this._dismissTimer);
      this._dismissTimer = null;
    }
    if (this._activeEl && this._activeEl.parentNode) {
      this._activeEl.parentNode.removeChild(this._activeEl);
    }
    this._activeEl = null;
  }

  /** Tear-down used in tests / HMR. */
  destroy() {
    this._removeActive();
    if (this._liveRegion && this._liveRegion.parentNode) {
      this._liveRegion.parentNode.removeChild(this._liveRegion);
    }
    this._liveRegion = null;
  }
}
