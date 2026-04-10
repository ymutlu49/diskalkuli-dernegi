/**
 * Base class for every screen controller.
 *
 * Concrete screens extend this class and override the lifecycle hooks
 * they care about. The Router calls these hooks automatically — no
 * screen should ever wire itself into the Router directly.
 *
 *   class HomeScreen extends BaseScreen {
 *     init()    { this.render(); }
 *     onEnter() { this.render(); }
 *   }
 */
import { logger } from './logger.js';

export class BaseScreen {
  /**
   * @param {string} id   The screen's id, matching <div id="screen-{id}">.
   * @param {object} ctx  Shared app services: { store, bus, router, services, ... }
   */
  constructor(id, ctx) {
    this.id     = id;
    this.ctx    = ctx;
    this.el     = document.getElementById(`screen-${id}`);
    if (!this.el) {
      logger.warn('BaseScreen', `DOM element for "${id}" not found`);
    }
  }

  /**
   * Called exactly once during app bootstrap.
   * Override for: one-time DOM setup, attaching listeners, seed render.
   */
  init() { /* no-op */ }

  /**
   * Called every time this screen becomes active.
   * Override for: refreshing data, restarting timers, focus mgmt.
   */
  onEnter() { /* no-op */ }

  /**
   * Called every time the router navigates AWAY from this screen.
   * Override for: pausing timers, tearing down transient UI.
   */
  onLeave() { /* no-op */ }

  /**
   * Small helper — set an element's textContent if it exists.
   * Screens use this heavily to bind user data into templates.
   */
  setText(id, value) {
    const el = document.getElementById(id);
    if (el != null) el.textContent = value == null ? '' : String(value);
  }

  /**
   * Small helper — query within this screen's DOM subtree only.
   */
  $(selector) {
    return this.el ? this.el.querySelector(selector) : null;
  }

  $$(selector) {
    return this.el ? Array.from(this.el.querySelectorAll(selector)) : [];
  }

  /**
   * Attach a delegated event listener rooted at this screen.
   *
   *   this.delegate('click', '[data-action]', (e, target) => {
   *     const action = target.dataset.action;
   *     …
   *   });
   *
   * This is the preferred way to wire up click / keydown / change
   * handlers for lists that re-render their innerHTML, because we
   * only add one listener instead of N, and the handler survives
   * re-paint automatically.
   *
   * @param {string}   eventName    e.g. 'click' | 'change' | 'keydown'
   * @param {string}   selector     CSS selector to match ancestors
   * @param {Function} handler      (event, matchingElement) => void
   * @param {object}   [opts]       addEventListener options
   * @returns {Function}            unsubscribe callback
   */
  delegate(eventName, selector, handler, opts = {}) {
    const root = this.el;
    if (!root) return () => {};
    const wrapped = (event) => {
      const target = event.target.closest(selector);
      if (target && root.contains(target)) {
        try { handler(event, target); }
        catch (err) { logger.error(`${this.id}:${eventName}`, err); }
      }
    };
    root.addEventListener(eventName, wrapped, opts);
    return () => root.removeEventListener(eventName, wrapped, opts);
  }

  /**
   * Emit an event on the app-wide bus. Shorthand for
   * `this.ctx.bus.emit(name, payload)` so screens don't need to
   * reach through the context chain.
   */
  emit(name, payload) {
    if (this.ctx && this.ctx.bus) this.ctx.bus.emit(name, payload);
  }

  /**
   * Navigate to another screen by id. Shorthand for
   * `this.ctx.router.goTo(id)`.
   */
  goTo(id, opts) {
    if (this.ctx && this.ctx.router) this.ctx.router.goTo(id, opts);
  }
}
