/**
 * HTML escape utilities — shared across the app.
 *
 * Every place that builds markup via template literals and writes it
 * to `innerHTML` MUST pass user-influenced data through `escapeHtml`.
 * When the project migrates off innerHTML, prefer `text(tag, …)` /
 * `el(tag, props, children)` helpers below which use textContent by
 * default and cannot introduce XSS.
 */

const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

/**
 * Escape a value for safe use inside HTML text content or attributes.
 * Accepts any JS value; null/undefined become empty string.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  if (value == null) return '';
  return String(value).replace(/[&<>"'`]/g, (ch) => HTML_ENTITIES[ch]);
}

/**
 * Alias — shorter name for heavy users inside admin panels.
 * @param {unknown} v
 */
export const esc = escapeHtml;

/**
 * Escape a value for use inside an unquoted URL attribute.
 * Strips javascript:, data:, vbscript: prefixes.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeUrl(value) {
  if (value == null) return '';
  const s = String(value).trim();
  // Block dangerous protocols
  if (/^\s*(javascript|data|vbscript|file):/i.test(s)) return '#';
  return escapeHtml(s);
}

/**
 * Create a DOM element programmatically. Safer than innerHTML because
 * all children default to textContent.
 *
 * @param {string} tag              e.g. 'div'
 * @param {object} [props]          { class, id, dataset, on: { click } }
 * @param {(Node|string)[]} [kids]  text strings are textContent, not HTML
 * @returns {HTMLElement}
 */
export function el(tag, props = {}, kids = []) {
  const node = document.createElement(tag);

  for (const key in props) {
    const val = props[key];
    if (val == null) continue;

    if (key === 'class' || key === 'className') {
      node.className = String(val);
    } else if (key === 'style' && typeof val === 'object') {
      Object.assign(node.style, val);
    } else if (key === 'dataset' && typeof val === 'object') {
      for (const dk in val) node.dataset[dk] = val[dk];
    } else if (key === 'on' && typeof val === 'object') {
      for (const evt in val) node.addEventListener(evt, val[evt]);
    } else if (key === 'text') {
      node.textContent = String(val);
    } else if (key === 'html') {
      // Explicit opt-in to innerHTML — callers take responsibility.
      node.innerHTML = String(val);
    } else if (key in node) {
      try { node[key] = val; } catch { node.setAttribute(key, String(val)); }
    } else {
      node.setAttribute(key, String(val));
    }
  }

  // Use duck-typing instead of `kid instanceof Node` so this module
  // can be imported in a Node.js test runner where `Node` is undefined.
  const isDomNode = (x) =>
    x && typeof x === 'object' &&
    typeof x.nodeType === 'number' &&
    typeof x.appendChild === 'function';

  for (const kid of kids) {
    if (kid == null || kid === false) continue;
    if (isDomNode(kid)) node.appendChild(kid);
    else node.appendChild(document.createTextNode(String(kid)));
  }

  return node;
}
