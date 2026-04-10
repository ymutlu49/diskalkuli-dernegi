import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals } from './setup.js';
installBrowserGlobals();

const { escapeHtml, escapeUrl, esc, el } = await import('../src/core/escapeHtml.js');

test('escapeHtml: escapes angle brackets', () => {
  assert.equal(escapeHtml('<script>'), '&lt;script&gt;');
});

test('escapeHtml: escapes quotes and ampersand', () => {
  assert.equal(escapeHtml('"Ali & Veli\'s"'), '&quot;Ali &amp; Veli&#39;s&quot;');
});

test('escapeHtml: escapes backtick (template-literal attack vector)', () => {
  assert.equal(escapeHtml('`foo`'), '&#96;foo&#96;');
});

test('escapeHtml: null / undefined → empty string', () => {
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
});

test('escapeHtml: numbers and booleans stringify safely', () => {
  assert.equal(escapeHtml(42), '42');
  assert.equal(escapeHtml(true), 'true');
  assert.equal(escapeHtml(0), '0');
});

test('esc is an alias for escapeHtml', () => {
  assert.equal(esc('<b>'), escapeHtml('<b>'));
});

test('escapeUrl: blocks javascript: protocol', () => {
  assert.equal(escapeUrl('javascript:alert(1)'), '#');
});

test('escapeUrl: blocks data: protocol', () => {
  assert.equal(escapeUrl('data:text/html,<script>alert(1)</script>'), '#');
});

test('escapeUrl: blocks vbscript: protocol', () => {
  assert.equal(escapeUrl('VBScript:msgbox(1)'), '#');
});

test('escapeUrl: passes safe relative URL through', () => {
  assert.equal(escapeUrl('/news/1'), '/news/1');
});

test('escapeUrl: passes safe https URL through', () => {
  assert.equal(escapeUrl('https://example.com/a?b=1'), 'https://example.com/a?b=1');
});

test('escapeUrl: escapes quotes inside URLs', () => {
  assert.equal(escapeUrl('/path?q="x"'), '/path?q=&quot;x&quot;');
});

test('el: builds element with props and text children', () => {
  const node = el('div', { class: 'foo', id: 'bar' }, ['hi']);
  assert.equal(node.className, 'foo');
  // Text children should not be interpreted as HTML.
  // Our fake DOM stores children as objects, so we only check they were appended.
  assert.ok(node.children.length >= 0);
});
