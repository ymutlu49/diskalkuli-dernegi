/**
 * Minimal i18n helper.
 *
 * Usage:
 *   import { i18n, t } from './core/i18n.js';
 *
 *   await i18n.load('tr');                      // load catalog
 *   t('nav.home')                                // → "Ana Sayfa"
 *   t('admin.member.deleted', { name: 'Ali' })   // interpolation
 *   t('admin.nonexistent')                        // → "admin.nonexistent"
 *
 * Conventions:
 *   • Keys are dot-separated paths into the JSON catalog.
 *   • Unknown keys return the key itself — never undefined — so
 *     missing translations are visible in QA without crashing.
 *   • Placeholders use `{name}` syntax (no extra dependencies).
 *   • The active locale is persisted to localStorage so the
 *     user's preference survives reloads.
 *
 * The t() free function is bound to the singleton, so callers can
 * destructure it without losing `this`.
 */
import { logger } from './logger.js';

const STORAGE_KEY = 'diskalkuli:locale';
const DEFAULT_LOCALE = 'tr';
const SUPPORTED_LOCALES = ['tr', 'en'];

class I18n {
  constructor() {
    this._catalogs = new Map();    // locale → flattened object
    this._locale   = this._readLocale();
    this._listeners = new Set();
  }

  /** Currently-active locale. */
  get locale() { return this._locale; }

  /** The list of locales we know about. Cheap, sync. */
  get supported() { return SUPPORTED_LOCALES.slice(); }

  /**
   * Load and activate a locale. Idempotent — calling with an
   * already-loaded locale is a no-op.
   *
   * @param {string} locale  'tr' | 'en'
   */
  async load(locale) {
    if (!SUPPORTED_LOCALES.includes(locale)) {
      logger.warn('i18n', `unsupported locale: ${locale}`);
      locale = DEFAULT_LOCALE;
    }
    if (!this._catalogs.has(locale)) {
      try {
        const url = new URL(`../i18n/${locale}.json`, import.meta.url);
        const res = await fetch(url.href);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        this._catalogs.set(locale, this._flatten(json));
      } catch (err) {
        logger.error('i18n', `failed to load ${locale}`, err);
        // Fall back to empty catalog so keys echo back.
        this._catalogs.set(locale, {});
      }
    }
    this._locale = locale;
    try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* private mode */ }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir  = 'ltr';
    }
    this._notify();
  }

  /**
   * Translate a key. Returns the key verbatim on miss so the
   * missing translation shows up in QA.
   *
   * @param {string} key
   * @param {Record<string,string|number>} [vars]
   * @returns {string}
   */
  t(key, vars) {
    const catalog = this._catalogs.get(this._locale) || {};
    const value = catalog[key];
    if (value == null) return key;
    if (!vars) return value;
    return value.replace(/\{(\w+)\}/g, (_, name) => {
      return vars[name] != null ? String(vars[name]) : `{${name}}`;
    });
  }

  /**
   * Subscribe to locale-change events. Handler is called with the
   * new locale string. Returns an unsubscribe fn.
   */
  onChange(handler) {
    this._listeners.add(handler);
    return () => this._listeners.delete(handler);
  }

  _notify() {
    for (const fn of this._listeners) {
      try { fn(this._locale); }
      catch (err) { logger.warn('i18n', 'listener threw', err); }
    }
  }

  _readLocale() {
    // Explicit user preference in localStorage wins.
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED_LOCALES.includes(stored)) return stored;
    } catch { /* ignore */ }

    // This is a Turkish association's app. Default to Turkish
    // unless the user explicitly picks another locale from the
    // profile screen. Auto-detection from navigator.language is
    // intentionally avoided — a German user traveling through an
    // English-locale browser still gets the primary (Turkish)
    // experience, which is what the stakeholders expect.
    return DEFAULT_LOCALE;
  }

  /**
   * Flatten a nested catalog into a dot-path lookup:
   *   { admin: { title: 'X' } } → { 'admin.title': 'X' }
   */
  _flatten(obj, prefix = '', out = {}) {
    for (const key of Object.keys(obj)) {
      const full = prefix ? `${prefix}.${key}` : key;
      const val = obj[key];
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        this._flatten(val, full, out);
      } else {
        out[full] = String(val);
      }
    }
    return out;
  }
}

/** Shared singleton. Import `i18n` for methods, `t` for quick lookups. */
export const i18n = new I18n();
export const t = i18n.t.bind(i18n);
