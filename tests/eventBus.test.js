import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals } from './setup.js';
installBrowserGlobals();

const { EventBus } = await import('../src/core/EventBus.js');

test('EventBus: emit() notifies subscribers', () => {
  const bus = new EventBus();
  let payload = null;
  bus.on('foo', (p) => { payload = p; });
  bus.emit('foo', { value: 42 });
  assert.deepEqual(payload, { value: 42 });
});

test('EventBus: multiple subscribers', () => {
  const bus = new EventBus();
  let a = 0, b = 0;
  bus.on('foo', () => a++);
  bus.on('foo', () => b++);
  bus.emit('foo');
  assert.equal(a, 1);
  assert.equal(b, 1);
});

test('EventBus: off() removes subscriber', () => {
  const bus = new EventBus();
  let called = 0;
  const handler = () => called++;
  bus.on('foo', handler);
  bus.emit('foo');
  bus.off('foo', handler);
  bus.emit('foo');
  assert.equal(called, 1);
});

test('EventBus: on() returns unsubscribe fn', () => {
  const bus = new EventBus();
  let called = 0;
  const unsub = bus.on('foo', () => called++);
  bus.emit('foo');
  unsub();
  bus.emit('foo');
  assert.equal(called, 1);
});

test('EventBus: once() fires exactly once', () => {
  const bus = new EventBus();
  let called = 0;
  bus.once('foo', () => called++);
  bus.emit('foo');
  bus.emit('foo');
  bus.emit('foo');
  assert.equal(called, 1);
});

test('EventBus: handler error is isolated', () => {
  const bus = new EventBus();
  let ok = 0;
  bus.on('foo', () => { throw new Error('boom'); });
  bus.on('foo', () => { ok++; });
  const origErr = console.error;
  console.error = () => {};
  try {
    bus.emit('foo');
  } finally {
    console.error = origErr;
  }
  assert.equal(ok, 1);
});

test('EventBus: clear() drops all subscribers', () => {
  const bus = new EventBus();
  let called = 0;
  bus.on('foo', () => called++);
  bus.on('bar', () => called++);
  bus.clear();
  bus.emit('foo');
  bus.emit('bar');
  assert.equal(called, 0);
});

test('EventBus: emit unknown event is a no-op', () => {
  const bus = new EventBus();
  assert.doesNotThrow(() => bus.emit('unknown', { x: 1 }));
});
