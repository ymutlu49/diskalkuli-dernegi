import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals } from './setup.js';
installBrowserGlobals();

// Preload the catalog manually so we don't hit fetch() in Node.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Stub fetch to read from disk
const originalFetch = global.fetch;
global.fetch = async (url) => {
  const u = String(url);
  const match = u.match(/i18n\/(\w+)\.json$/);
  if (!match) throw new Error(`unexpected fetch: ${u}`);
  const file = path.join(__dirname, '..', 'src', 'i18n', `${match[1]}.json`);
  const text = await fs.readFile(file, 'utf8');
  return {
    ok: true,
    status: 200,
    json: async () => JSON.parse(text),
    text: async () => text,
  };
};

const { i18n, t } = await import('../src/core/i18n.js');

test('i18n: load("tr") and translate', async () => {
  await i18n.load('tr');
  assert.equal(i18n.locale, 'tr');
  assert.equal(t('nav.home'), 'Ana Sayfa');
  assert.equal(t('auth.login'), 'Giriş Yap');
});

test('i18n: load("en") and translate', async () => {
  await i18n.load('en');
  assert.equal(i18n.locale, 'en');
  assert.equal(t('nav.home'), 'Home');
  assert.equal(t('auth.login'), 'Log in');
});

test('i18n: placeholder interpolation', async () => {
  await i18n.load('tr');
  assert.equal(
    t('admin.member.deleteConfirmTitle', { name: 'Ayşe' }),
    'Ayşe silinsin mi?'
  );
});

test('i18n: unknown key returns the key itself', async () => {
  await i18n.load('tr');
  assert.equal(t('no.such.key'), 'no.such.key');
});

test('i18n: unknown placeholder stays as literal', async () => {
  await i18n.load('tr');
  // notifications.unreadCount is "{n} okunmamış"
  assert.equal(t('notifications.unreadCount', {}), '{n} okunmamış');
});

test('i18n: onChange fires on locale switch', async () => {
  let fired = null;
  const unsub = i18n.onChange((loc) => { fired = loc; });
  await i18n.load('en');
  assert.equal(fired, 'en');
  unsub();
});

test('i18n: supported list', () => {
  assert.deepEqual(i18n.supported, ['tr', 'en']);
});

// Restore global fetch
test.after(() => { global.fetch = originalFetch; });
