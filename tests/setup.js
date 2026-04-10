/**
 * Test setup — stubs browser globals that the core modules touch.
 *
 * The tests are run via `node --test`. Node doesn't provide
 * `document`, `window`, `localStorage`, etc., so we emit the
 * smallest possible shim each test suite needs.
 */

export function installBrowserGlobals() {
  if (!global.localStorage) {
    const store = new Map();
    global.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
      key: (i) => Array.from(store.keys())[i] || null,
      get length() { return store.size; },
    };
  }
  if (!global.document) {
    global.document = {
      getElementById: () => null,
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {},
      removeEventListener: () => {},
      createElement: () => makeFakeEl(),
      createTextNode: (txt) => ({
        nodeType: 3,
        nodeValue: String(txt),
        appendChild: () => {},
      }),
      body: { appendChild: () => {}, removeChild: () => {} },
      documentElement: { lang: 'tr', dir: 'ltr', dataset: {} },
      readyState: 'complete',
      activeElement: null,
    };
  }
  if (!global.window) {
    global.window = {
      addEventListener: () => {},
      removeEventListener: () => {},
      location: { hostname: 'localhost' },
      requestAnimationFrame: (cb) => setTimeout(cb, 0),
    };
  }
  if (!global.requestAnimationFrame) {
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  }
}

function makeFakeEl() {
  const kids = [];
  const attrs = {};
  const listeners = {};
  return {
    nodeType: 1,
    style: {},
    className: '',
    classList: {
      _set: new Set(),
      add(c)    { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      toggle(c, force) {
        const has = this._set.has(c);
        const next = typeof force === 'boolean' ? force : !has;
        if (next) this._set.add(c); else this._set.delete(c);
        return next;
      },
      contains(c) { return this._set.has(c); },
    },
    dataset: {},
    attributes: attrs,
    setAttribute(k, v) { attrs[k] = String(v); },
    getAttribute(k)    { return attrs[k] || null; },
    removeAttribute(k) { delete attrs[k]; },
    hasAttribute(k)    { return k in attrs; },
    appendChild(c)     { kids.push(c); return c; },
    removeChild(c)     { const i = kids.indexOf(c); if (i >= 0) kids.splice(i, 1); return c; },
    querySelector()    { return null; },
    querySelectorAll() { return []; },
    addEventListener(e, h) {
      (listeners[e] || (listeners[e] = [])).push(h);
    },
    removeEventListener(e, h) {
      if (!listeners[e]) return;
      const i = listeners[e].indexOf(h);
      if (i >= 0) listeners[e].splice(i, 1);
    },
    focus() {},
    get parentNode() { return null; },
    get children()   { return kids; },
    get childNodes() { return kids; },
  };
}
