/**
 * Namespaced + versioned wrapper over localStorage.
 *
 * Every key looks like `diskalkuli:v1:<name>`, so bumping the version
 * transparently invalidates all old records without breaking other
 * apps that might share the same origin.
 *
 * API:
 *   get(key, fallback)   — returns parsed JSON or fallback
 *   set(key, value)      — stringifies and writes
 *   remove(key)          — single-key delete
 *   clear()              — delete ALL keys under this namespace+version
 *
 * Never throws. If localStorage is unavailable (private mode, disk
 * full), reads return the fallback and writes return false.
 */
export class StorageService {
  constructor({ namespace = 'diskalkuli', version = 1 } = {}) {
    this._ns      = namespace;
    this._version = version;
    this._prefix  = `${namespace}:v${version}:`;
    this._available = this._probe();
  }

  /** Required by App.bootstrap — no dependencies. */
  attach() { /* no-op */ }

  get(key, fallback = null) {
    if (!this._available) return fallback;
    try {
      const raw = localStorage.getItem(this._prefix + key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`[Storage] get("${key}") failed:`, err);
      return fallback;
    }
  }

  set(key, value) {
    if (!this._available) return false;
    try {
      localStorage.setItem(this._prefix + key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`[Storage] set("${key}") failed:`, err);
      return false;
    }
  }

  remove(key) {
    if (!this._available) return;
    try { localStorage.removeItem(this._prefix + key); }
    catch (err) { /* ignore */ }
  }

  /** Wipe every key under this namespace+version. */
  clear() {
    if (!this._available) return;
    try {
      const victims = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this._prefix)) victims.push(k);
      }
      for (const k of victims) localStorage.removeItem(k);
    } catch (err) { /* ignore */ }
  }

  /**
   * Test whether localStorage is actually writable. Private-mode Safari
   * has a `localStorage` object that throws on every write.
   */
  _probe() {
    try {
      const key = this._prefix + '__probe__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
}
