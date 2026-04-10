/**
 * Locale-aware formatting helpers.
 *
 * Centralized so every screen displays dates/currency/numbers the
 * same way, and so switching the locale (tr → en) later is a single
 * change instead of a project-wide grep.
 */

const LOCALE = 'tr-TR';

const DATE_SHORT = new Intl.DateTimeFormat(LOCALE, {
  day:   '2-digit',
  month: '2-digit',
  year:  'numeric',
});

const DATE_LONG = new Intl.DateTimeFormat(LOCALE, {
  day:   'numeric',
  month: 'long',
  year:  'numeric',
});

const DATE_TIME = new Intl.DateTimeFormat(LOCALE, {
  day:    '2-digit',
  month:  '2-digit',
  year:   'numeric',
  hour:   '2-digit',
  minute: '2-digit',
});

const CURRENCY_TRY = new Intl.NumberFormat(LOCALE, {
  style:                 'currency',
  currency:              'TRY',
  maximumFractionDigits: 0,
});

const NUMBER = new Intl.NumberFormat(LOCALE);

/**
 * Parse a date-ish input and return a Date or null.
 * Accepts Date instances, ISO strings, and millisecond timestamps.
 *
 * @param {unknown} input
 * @returns {Date | null}
 */
function toDate(input) {
  if (input == null || input === '') return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(input, fallback = '—') {
  const d = toDate(input);
  return d ? DATE_SHORT.format(d) : fallback;
}

export function formatDateLong(input, fallback = '—') {
  const d = toDate(input);
  return d ? DATE_LONG.format(d) : fallback;
}

export function formatDateTime(input, fallback = '—') {
  const d = toDate(input);
  return d ? DATE_TIME.format(d) : fallback;
}

export function formatCurrency(value, fallback = '—') {
  if (value == null || isNaN(Number(value))) return fallback;
  return CURRENCY_TRY.format(Number(value));
}

export function formatNumber(value, fallback = '—') {
  if (value == null || isNaN(Number(value))) return fallback;
  return NUMBER.format(Number(value));
}

/**
 * Human-readable "time ago" string, e.g. "2 saat önce".
 */
export function timeAgo(input) {
  const d = toDate(input);
  if (!d) return '—';
  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  if (seconds < 0)     return formatDate(d);
  if (seconds < 60)    return `${seconds} saniye önce`;
  if (seconds < 3600)  return `${Math.floor(seconds / 60)} dakika önce`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} saat önce`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} gün önce`;
  return formatDate(d);
}
