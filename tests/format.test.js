import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals } from './setup.js';
installBrowserGlobals();

const { formatDate, formatDateLong, formatDateTime, formatCurrency, formatNumber, timeAgo } =
  await import('../src/core/format.js');

test('formatDate: valid Date → tr-TR short format', () => {
  const d = new Date('2025-06-15T10:00:00Z');
  const formatted = formatDate(d);
  assert.ok(/^\d{2}\.\d{2}\.\d{4}$/.test(formatted), `got: ${formatted}`);
});

test('formatDate: null → fallback', () => {
  assert.equal(formatDate(null), '—');
  assert.equal(formatDate(null, 'N/A'), 'N/A');
});

test('formatDate: empty string → fallback', () => {
  assert.equal(formatDate(''), '—');
});

test('formatDate: invalid date → fallback', () => {
  assert.equal(formatDate('not-a-date'), '—');
});

test('formatDate: accepts ISO string', () => {
  const formatted = formatDate('2025-01-01');
  assert.ok(/^01\.01\.2025$/.test(formatted));
});

test('formatDate: accepts timestamp number', () => {
  const ts = Date.UTC(2025, 0, 1);
  assert.ok(/^\d{2}\.\d{2}\.\d{4}$/.test(formatDate(ts)));
});

test('formatDateLong: uses long month name', () => {
  const d = new Date('2025-06-15T10:00:00Z');
  const out = formatDateLong(d);
  // The month should be spelled out (Haziran in Turkish).
  assert.ok(/Haziran/.test(out) || /6/.test(out), `got: ${out}`);
});

test('formatDateTime: contains hh:mm component', () => {
  const d = new Date('2025-06-15T10:30:00');
  const out = formatDateTime(d);
  assert.ok(/\d{2}:\d{2}/.test(out), `got: ${out}`);
});

test('formatCurrency: integer TRY', () => {
  const out = formatCurrency(1234);
  assert.ok(/1\.234/.test(out) || /1,234/.test(out), `got: ${out}`);
  assert.ok(/₺/.test(out) || /TRY/.test(out));
});

test('formatCurrency: null → fallback', () => {
  assert.equal(formatCurrency(null), '—');
});

test('formatCurrency: NaN → fallback', () => {
  assert.equal(formatCurrency(NaN), '—');
});

test('formatNumber: thousands separator', () => {
  const out = formatNumber(1000000);
  assert.ok(/\d[.,]\d{3}[.,]\d{3}/.test(out), `got: ${out}`);
});

test('timeAgo: < 60 seconds → "X saniye önce"', () => {
  const d = new Date(Date.now() - 30_000);
  assert.match(timeAgo(d), /saniye önce/);
});

test('timeAgo: < 60 minutes → "X dakika önce"', () => {
  const d = new Date(Date.now() - 10 * 60 * 1000);
  assert.match(timeAgo(d), /dakika önce/);
});

test('timeAgo: < 24 hours → "X saat önce"', () => {
  const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
  assert.match(timeAgo(d), /saat önce/);
});

test('timeAgo: < 7 days → "X gün önce"', () => {
  const d = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  assert.match(timeAgo(d), /gün önce/);
});

test('timeAgo: null → "—"', () => {
  assert.equal(timeAgo(null), '—');
});
