/**
 * Tiny synchronous publish/subscribe bus.
 *
 * Services and screens communicate through named events instead of
 * holding direct references to each other — this keeps modules loosely
 * coupled and unit-testable.
 *
 * Example:
 *   bus.on('auth:login', user => console.log('welcome', user.name));
 *   bus.emit('auth:login', { name: 'Ayşe' });
 */
export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * Subscribe to an event.
   * @param {string} event
   * @param {Function} handler
   * @returns {Function} unsubscribe fn
   */
  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  /**
   * Subscribe for a single invocation.
   */
  once(event, handler) {
    const unsub = this.on(event, (payload) => {
      unsub();
      handler(payload);
    });
    return unsub;
  }

  /**
   * Remove a subscription.
   */
  off(event, handler) {
    const set = this._listeners.get(event);
    if (set) set.delete(handler);
  }

  /**
   * Fire an event synchronously. Handler errors are isolated so
   * a single bad listener can't break the chain.
   */
  emit(event, payload) {
    const set = this._listeners.get(event);
    if (!set) return;
    for (const handler of set) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[EventBus] handler for "${event}" threw:`, err);
      }
    }
  }

  /**
   * Drop all subscribers. Primarily used in tests.
   */
  clear() {
    this._listeners.clear();
  }
}
