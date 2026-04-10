/**
 * Screen router — single-page navigation without URL hashes.
 *
 * Each "screen" is a <div class="screen" id="screen-{id}"> in index.html.
 * The Router adds/removes the `active` class and tracks a back-history
 * stack so that `goBack()` works regardless of how the user got there.
 *
 * It also delegates any post-navigation work to Screen controller
 * objects via `screens[id].onEnter()` / `onLeave()` hooks.
 */
import { NAV_TAB_MAP } from '../data/content.js';
import { logger } from './logger.js';

export class Router {
  /**
   * @param {object} options
   * @param {Map<string, object>} options.screens  id → Screen instance
   * @param {import('./Store.js').Store} options.store
   * @param {import('./EventBus.js').EventBus} options.bus
   */
  constructor({ screens, store, bus }) {
    this._screens = screens;
    this._store   = store;
    this._bus     = bus;
    /** @type {string[]} back-history stack */
    this._history = [];
  }

  /** Currently-active screen id. */
  get current() {
    return this._store.get('currentScreen');
  }

  /**
   * Navigate to a screen by id.
   * @param {string} id    e.g. "home", "profil"
   * @param {object} [opts]
   * @param {boolean} [opts.pushHistory=true] — whether to remember the
   *                  current screen so goBack() can return to it.
   */
  goTo(id, { pushHistory = true } = {}) {
    const previous = this.current;
    const nextEl = document.getElementById(`screen-${id}`);
    if (!nextEl) {
      logger.warn('Router', `unknown screen: ${id}`);
      return;
    }

    // Hide current screen
    const currentEl = document.querySelector('.screen.active');
    if (currentEl) currentEl.classList.remove('active');

    // Track history (but never for splash/auth/login — those are "roots")
    const ROOTS = new Set(['splash', 'auth', 'login']);
    if (pushHistory && previous && !ROOTS.has(previous)) {
      this._history.push(previous);
    }

    // Show next screen & scroll its body to top
    nextEl.classList.add('active');
    const body = nextEl.querySelector('.screen-body');
    if (body) body.scrollTop = 0;

    this._store.set({ currentScreen: id });
    this._updateNavTabs(id);

    // Fire lifecycle hooks
    if (previous) this._notifyLeave(previous);
    this._notifyEnter(id);

    this._bus.emit('router:navigated', { from: previous, to: id });
  }

  /**
   * Return to the previous screen, or home if the stack is empty.
   */
  goBack() {
    if (this._history.length === 0) {
      this.goTo('home', { pushHistory: false });
      return;
    }
    const prev = this._history.pop();
    this.goTo(prev, { pushHistory: false });
  }

  /**
   * Clear the back-history stack. Use after login/logout so the user
   * can't navigate "back" into a stale session.
   */
  resetHistory() {
    this._history = [];
  }

  _notifyEnter(id) {
    const screen = this._screens.get(id);
    if (screen && typeof screen.onEnter === 'function') {
      try { screen.onEnter(); } catch (e) { logger.error(`${id}:onEnter`, e); }
    }
  }

  _notifyLeave(id) {
    const screen = this._screens.get(id);
    if (screen && typeof screen.onLeave === 'function') {
      try { screen.onLeave(); } catch (e) { logger.error(`${id}:onLeave`, e); }
    }
  }

  _updateNavTabs(screenId) {
    const nav = document.getElementById('global-nav');
    const hidden = new Set(['splash', 'auth', 'login']);
    if (nav) {
      nav.style.display = hidden.has(screenId) ? 'none' : 'flex';
    }
    document.querySelectorAll('#global-nav .nav-item').forEach(el => {
      el.classList.remove('active');
    });
    const activeId = NAV_TAB_MAP[screenId];
    if (activeId) {
      const el = document.getElementById(activeId);
      if (el) el.classList.add('active');
    }
  }
}
