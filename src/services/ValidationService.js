/**
 * Tiny form validation helpers.
 *
 * A "rule" is a function `(value, values) => string | null`; it returns
 * an error message or null. `validateForm(fields, rules)` runs all the
 * rules and returns a plain object `{ field: errorMessage }`.
 *
 * The helpers are intentionally bare-bones — just enough to get
 * consistent inline error messages without a dependency.
 *
 * Accessibility:
 *   • `paintErrors()` also writes `aria-invalid` / `aria-describedby`
 *     onto the input so screen readers announce errors correctly.
 */

export const RULES = {
  required: (msg = 'Bu alan zorunludur.') => (value) =>
    (value == null || String(value).trim() === '') ? msg : null,

  email: (msg = 'Geçerli bir e-posta adresi girin.') => (value) => {
    if (!value) return null;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(value).trim()) ? null : msg;
  },

  minLength: (n, msg) => (value) => {
    if (!value) return null;
    return String(value).length >= n
      ? null
      : (msg || `En az ${n} karakter olmalı.`);
  },

  maxLength: (n, msg) => (value) => {
    if (!value) return null;
    return String(value).length <= n
      ? null
      : (msg || `En fazla ${n} karakter olabilir.`);
  },

  phoneTR: (msg = 'Telefon numarası geçersiz.') => (value) => {
    if (!value) return null;
    // Accept "+90 5xx xxx xxxx" or "05xxxxxxxxx" variants
    const digits = String(value).replace(/\D/g, '');
    return (digits.length >= 10 && digits.length <= 13) ? null : msg;
  },

  tcKimlik: (msg = 'TC Kimlik No geçersiz.') => (value) => {
    if (!value) return null;
    const s = String(value).trim();
    if (!/^\d{11}$/.test(s)) return msg;
    if (s[0] === '0') return msg;
    // Algorithm check (MoE standard)
    const d = s.split('').map(Number);
    const sumOdd  = d[0] + d[2] + d[4] + d[6] + d[8];
    const sumEven = d[1] + d[3] + d[5] + d[7];
    const c10 = (sumOdd * 7 - sumEven) % 10;
    const c11 = (sumOdd + sumEven + d[9]) % 10;
    return (c10 === d[9] && c11 === d[10]) ? null : msg;
  },

  checked: (msg = 'Bu alanı işaretlemelisiniz.') => (value) =>
    value ? null : msg,

  match: (otherField, msg = 'İki değer eşleşmiyor.') => (value, values) =>
    value === values[otherField] ? null : msg,
};

/**
 * Run a rule-set over a values object.
 *
 * @param {object} values               { name: 'Ali', email: '', ... }
 * @param {object} ruleset               { name: [RULES.required()], email: [RULES.required(), RULES.email()] }
 * @returns {{ valid: boolean, errors: Record<string,string> }}
 */
export function validateForm(values, ruleset) {
  const errors = {};
  for (const field in ruleset) {
    const rules = ruleset[field];
    if (!Array.isArray(rules)) continue;
    for (const rule of rules) {
      const err = rule(values[field], values);
      if (err) { errors[field] = err; break; }
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Convenience: collect values from DOM inputs by id.
 * @param {Record<string,string>} map  { name: 'nu-name', email: 'nu-email' }
 */
export function collectValues(map) {
  const out = {};
  for (const field in map) {
    const el = document.getElementById(map[field]);
    if (!el) { out[field] = ''; continue; }
    out[field] = el.type === 'checkbox' ? el.checked : el.value;
  }
  return out;
}

/**
 * Paint error messages next to fields.
 *
 * Expects each field to have a sibling element with class
 * `.form-error-{field}`. Clears any error message for fields not
 * present in `errors`. Also writes a11y attributes on the input:
 *   • `aria-invalid="true"` on error, removed on clear
 *   • `aria-describedby="form-error-{field}"` pointing at the
 *     sibling error element (which also gets an `id`)
 *   • `role="alert"` on the error container so SRs announce it
 *
 * @param {Record<string,string>} errors   { field: message }
 * @param {Record<string,string>} fieldMap { field: 'input-id' }
 */
export function paintErrors(errors, fieldMap) {
  for (const field in fieldMap) {
    const holder = document.querySelector('.form-error-' + field);
    const input  = document.getElementById(fieldMap[field]);
    const errorId = `form-error-${field}`;

    if (holder && !holder.id) holder.id = errorId;
    if (holder && !holder.hasAttribute('role')) holder.setAttribute('role', 'alert');
    if (holder && !holder.hasAttribute('aria-live')) holder.setAttribute('aria-live', 'polite');

    if (errors[field]) {
      if (holder) {
        holder.textContent = '⚠ ' + errors[field];
        holder.style.display = 'block';
      }
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', errorId);
      }
    } else {
      if (holder) {
        holder.textContent = '';
        holder.style.display = 'none';
      }
      if (input) {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
      }
    }
  }
}

/**
 * Focus the first input that has an error.
 * Useful to call after paintErrors() when the form is invalid.
 */
export function focusFirstError(errors, fieldMap) {
  for (const field in fieldMap) {
    if (errors[field]) {
      const input = document.getElementById(fieldMap[field]);
      if (input && typeof input.focus === 'function') {
        try { input.focus(); } catch { /* ignore */ }
      }
      return;
    }
  }
}
