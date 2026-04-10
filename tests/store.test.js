import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals } from './setup.js';
installBrowserGlobals();

const { Store } = await import('../src/core/Store.js');

test('Store: initial state', () => {
  const s = new Store({ a: 1, b: 'two' });
  assert.equal(s.get('a'), 1);
  assert.equal(s.get('b'), 'two');
});

test('Store: set() merges patch', () => {
  const s = new Store({ a: 1 });
  s.set({ b: 2 });
  assert.equal(s.get('a'), 1);
  assert.equal(s.get('b'), 2);
});

test('Store: subscribers fire on change', () => {
  const s = new Store({ a: 1 });
  let called = 0;
  let lastChanged = null;
  s.subscribe((state, changed) => {
    called++;
    lastChanged = changed;
  });
  s.set({ a: 2 });
  assert.equal(called, 1);
  assert.deepEqual(lastChanged, ['a']);
});

test('Store: no subscriber call on no-op set', () => {
  const s = new Store({ a: 1 });
  let called = 0;
  s.subscribe(() => called++);
  s.set({ a: 1 });
  assert.equal(called, 0);
});

test('Store: subscribe returns unsubscribe fn', () => {
  const s = new Store({ a: 1 });
  let called = 0;
  const unsub = s.subscribe(() => called++);
  s.set({ a: 2 });
  unsub();
  s.set({ a: 3 });
  assert.equal(called, 1);
});

test('Store: subscriber error does not break chain', () => {
  const s = new Store({ a: 1 });
  let ok = 0;
  s.subscribe(() => { throw new Error('boom'); });
  s.subscribe(() => { ok++; });
  // Suppress console.error noise
  const origErr = console.error;
  console.error = () => {};
  try {
    s.set({ a: 2 });
  } finally {
    console.error = origErr;
  }
  assert.equal(ok, 1);
});
