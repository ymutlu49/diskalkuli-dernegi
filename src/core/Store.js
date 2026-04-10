/**
 * Tiny observable key/value store.
 *
 * Acts as the single source of truth for global session state
 * (current user, current screen, pending nav history, etc.).
 * Subscribers are notified whenever a slice of state changes.
 *
 * Why not a framework?  The app only has ~5 pieces of shared state,
 * so a 40-line Store beats pulling in Redux/Zustand.
 */
export class Store {
  constructor(initialState = {}) {
    this._state = { ...initialState };
    /** @type {Set<Function>} */
    this._subscribers = new Set();
  }

  /** @returns a read-only snapshot of the full state. */
  get state() {
    return this._state;
  }

  /**
   * Returns a single slice. Shorthand for `store.state[key]`.
   */
  get(key) {
    return this._state[key];
  }

  /**
   * Shallow-merge `patch` into state and notify subscribers.
   * Subscribers receive `(newState, changedKeys)`.
   */
  set(patch) {
    const changed = [];
    for (const key in patch) {
      if (this._state[key] !== patch[key]) {
        this._state[key] = patch[key];
        changed.push(key);
      }
    }
    if (changed.length > 0) this._notify(changed);
  }

  /**
   * Subscribe to state changes. Returns unsubscribe fn.
   */
  subscribe(handler) {
    this._subscribers.add(handler);
    return () => this._subscribers.delete(handler);
  }

  _notify(changedKeys) {
    for (const handler of this._subscribers) {
      try {
        handler(this._state, changedKeys);
      } catch (err) {
        console.error('[Store] subscriber threw:', err);
      }
    }
  }
}
