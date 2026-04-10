/**
 * Global error boundary.
 *
 * Catches uncaught exceptions and unhandled promise rejections, logs
 * them via the logger, shows a toast, and (optionally) forwards them
 * to a remote reporter.
 *
 * This is NOT a React-style component boundary. The app is vanilla
 * JS — there's no render tree to unmount. Instead we do the three
 * things that actually matter in a PWA:
 *   1. Log every uncaught error so bugs are visible during QA
 *   2. Surface a "Bir sorun oluştu" toast so users know something
 *      went wrong (instead of a silent broken UI)
 *   3. Debounce toast flood — if 10 errors fire in 1s we still show
 *      only one "Bir sorun oluştu" message.
 *
 * Usage:
 *   const boundary = new ErrorBoundary({ toast });
 *   boundary.install();
 *   // later, manually:
 *   boundary.capture(err, { scope: 'YonetimScreen._renderUsers' });
 */
import { logger } from './logger.js';

const DEFAULT_TOAST_COOLDOWN_MS = 3000;

export class ErrorBoundary {
  /**
   * @param {object} opts
   * @param {import('../services/ToastService.js').ToastService} [opts.toast]
   * @param {Function} [opts.reporter]  Optional async (err, ctx) => void
   * @param {number}   [opts.cooldown]
   */
  constructor({ toast, reporter, cooldown = DEFAULT_TOAST_COOLDOWN_MS } = {}) {
    this._toast = toast || null;
    this._reporter = reporter || null;
    this._cooldown = cooldown;
    this._lastToastAt = 0;
    this._installed = false;
    this._errorHandler = null;
    this._rejectionHandler = null;
  }

  install() {
    if (this._installed || typeof window === 'undefined') return;

    this._errorHandler = (event) => {
      this.capture(event.error || new Error(event.message || 'unknown'), {
        scope: 'window.onerror',
        source: event.filename,
        line:   event.lineno,
        col:    event.colno,
      });
      // Don't preventDefault — let DevTools still see it.
    };

    this._rejectionHandler = (event) => {
      const reason = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));
      this.capture(reason, { scope: 'unhandledrejection' });
    };

    window.addEventListener('error',            this._errorHandler);
    window.addEventListener('unhandledrejection', this._rejectionHandler);
    this._installed = true;
    logger.info('ErrorBoundary', 'installed');
  }

  uninstall() {
    if (!this._installed) return;
    window.removeEventListener('error',            this._errorHandler);
    window.removeEventListener('unhandledrejection', this._rejectionHandler);
    this._installed = false;
  }

  /**
   * Report an error manually. Use this from try/catch handlers in
   * services when you want central logging without propagating.
   */
  capture(err, context = {}) {
    // Ignore benign errors (user cancellations, AbortController)
    if (err && (err.name === 'AbortError' || err.name === 'CanceledError')) {
      return;
    }

    logger.error(
      context.scope || 'uncaught',
      err && err.message ? err.message : String(err),
      err && err.stack ? err.stack : '',
      context
    );

    // Show a toast (rate-limited)
    const now = Date.now();
    if (this._toast && now - this._lastToastAt > this._cooldown) {
      this._lastToastAt = now;
      try {
        this._toast.error('Bir sorun oluştu. Lütfen tekrar deneyin.');
      } catch { /* toast itself threw — ignore to avoid recursion */ }
    }

    // Forward to remote reporter (Sentry-style)
    if (this._reporter) {
      try {
        const maybePromise = this._reporter(err, context);
        if (maybePromise && typeof maybePromise.catch === 'function') {
          maybePromise.catch(() => { /* swallow */ });
        }
      } catch { /* swallow */ }
    }
  }
}
