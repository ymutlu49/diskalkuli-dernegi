/**
 * BroadcastSync — cross-tab event relay.
 *
 * Wraps the `BroadcastChannel` API (with a `storage`-event fallback
 * for Safari < 15.4) so multiple open tabs of the app stay in sync.
 *
 * Usage:
 *   const sync = new BroadcastSync('diskalkuli', bus);
 *   sync.broadcast('users:changed', { id: 42 });
 *   // In another tab, the bus automatically receives the same event.
 *
 * Loop prevention:
 *   Each tab tags its own broadcasts with a session id. Events coming
 *   back from the channel that carry this tab's session id are
 *   dropped, so re-broadcasting a locally-emitted event never loops.
 *
 * Event filter:
 *   The app-wide bus has lots of chatty events (router:navigated,
 *   notif:changed …) that shouldn't leak across tabs. Only events in
 *   the `relay` set are forwarded.
 */
import { logger } from './logger.js';

/** Events that deserve cross-tab sync. */
const DEFAULT_RELAY = new Set([
  'users:changed',
  'applications:changed',
  'content:changed',
  'dues:changed',
  'audit:logged',
  'auth:login',
  'auth:logout',
]);

export class BroadcastSync {
  /**
   * @param {string} channelName
   * @param {import('./EventBus.js').EventBus} bus
   * @param {object} [opts]
   * @param {Iterable<string>} [opts.relay]  Override the default event list.
   */
  constructor(channelName = 'diskalkuli', bus, opts = {}) {
    this._name = channelName;
    this._bus  = bus;
    this._relay = new Set(opts.relay || DEFAULT_RELAY);
    this._sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    this._channel = null;
    this._storageHandler = null;

    this._install();
  }

  /** Currently-relayed event names. */
  get relayedEvents() { return Array.from(this._relay); }

  /** Add an event name to the relay list at runtime. */
  addRelay(event) { this._relay.add(event); }

  /** Send an event to other tabs. Local listeners are NOT re-invoked. */
  broadcast(event, payload) {
    if (!this._relay.has(event)) return;
    const message = {
      event,
      payload: this._safeSerialize(payload),
      sessionId: this._sessionId,
      at: Date.now(),
    };
    try {
      if (this._channel) {
        this._channel.postMessage(message);
      } else {
        // storage-event fallback
        const key = `${this._name}:broadcast`;
        localStorage.setItem(key, JSON.stringify(message));
        localStorage.removeItem(key);
      }
    } catch (err) {
      logger.warn('BroadcastSync', 'postMessage failed', err);
    }
  }

  destroy() {
    if (this._channel) {
      try { this._channel.close(); } catch { /* ignore */ }
      this._channel = null;
    }
    if (this._storageHandler) {
      window.removeEventListener('storage', this._storageHandler);
      this._storageHandler = null;
    }
  }

  /* ── Internals ─────────────────────────────────────────── */

  _install() {
    // Hook into the bus's emit() so any relayed event is automatically
    // broadcast. We monkey-patch emit() — but only for forwarding; the
    // original call still runs first.
    const originalEmit = this._bus.emit.bind(this._bus);
    this._bus.emit = (event, payload) => {
      originalEmit(event, payload);
      if (this._relay.has(event)) this.broadcast(event, payload);
    };

    // BroadcastChannel path
    if (typeof BroadcastChannel === 'function') {
      try {
        this._channel = new BroadcastChannel(this._name);
        this._channel.addEventListener('message', (e) => this._onMessage(e.data));
        logger.info('BroadcastSync', `channel "${this._name}" active`);
        return;
      } catch (err) {
        logger.warn('BroadcastSync', 'BroadcastChannel unavailable, falling back', err);
      }
    }

    // storage-event fallback
    this._storageHandler = (e) => {
      if (e.key !== `${this._name}:broadcast` || !e.newValue) return;
      try {
        const message = JSON.parse(e.newValue);
        this._onMessage(message);
      } catch { /* malformed */ }
    };
    window.addEventListener('storage', this._storageHandler);
    logger.info('BroadcastSync', 'storage-event fallback active');
  }

  _onMessage(message) {
    if (!message || typeof message !== 'object') return;
    if (message.sessionId === this._sessionId) return; // echo
    if (!this._relay.has(message.event)) return;
    // Re-emit locally. Use a mutex so BroadcastSync doesn't re-broadcast.
    // The patched emit() above will try to broadcast again; we guard
    // by temporarily removing the event from the relay list.
    this._relay.delete(message.event);
    try {
      this._bus.emit(message.event, message.payload);
    } finally {
      this._relay.add(message.event);
    }
  }

  /**
   * Payloads must be structured-cloneable. This filter drops DOM
   * nodes, functions, and other unserializable cruft.
   */
  _safeSerialize(payload) {
    if (payload == null) return payload;
    try {
      return JSON.parse(JSON.stringify(payload));
    } catch {
      return null;
    }
  }
}
