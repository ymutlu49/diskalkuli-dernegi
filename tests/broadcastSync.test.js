import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals } from './setup.js';
installBrowserGlobals();

// BroadcastChannel in Node keeps the event loop alive. Stub it out
// before importing the module so tests use the storage-event fallback.
const realBroadcastChannel = global.BroadcastChannel;
global.BroadcastChannel = undefined;

const { EventBus } = await import('../src/core/EventBus.js');
const { BroadcastSync } = await import('../src/core/BroadcastSync.js');

after(() => {
  // Restore for any other tests that might care.
  global.BroadcastChannel = realBroadcastChannel;
});

test('BroadcastSync: relays whitelisted events via fake channel', () => {
  const bus = new EventBus();
  const sync = new BroadcastSync('test', bus);

  let captured = null;
  // Stub the channel so we capture outgoing messages
  sync._channel = {
    postMessage: (msg) => { captured = msg; },
    close: () => {},
  };

  bus.emit('users:changed', { id: 1 });
  assert.ok(captured);
  assert.equal(captured.event, 'users:changed');
  assert.deepEqual(captured.payload, { id: 1 });
  assert.ok(captured.sessionId);
  sync.destroy();
});

test('BroadcastSync: does NOT relay non-whitelisted events', () => {
  const bus = new EventBus();
  const sync = new BroadcastSync('test', bus);

  let captured = null;
  sync._channel = {
    postMessage: (msg) => { captured = msg; },
    close: () => {},
  };

  bus.emit('router:navigated', { to: 'home' });
  assert.equal(captured, null);
  sync.destroy();
});

test('BroadcastSync: rejects echoed messages from the same session', () => {
  const bus = new EventBus();
  const sync = new BroadcastSync('test', bus);

  let localCalls = 0;
  bus.on('users:changed', () => localCalls++);

  // Simulate a message arriving from the same session
  sync._onMessage({
    event: 'users:changed',
    payload: {},
    sessionId: sync._sessionId,
    at: Date.now(),
  });
  assert.equal(localCalls, 0);
  sync.destroy();
});

test('BroadcastSync: accepts messages from another session', () => {
  const bus = new EventBus();
  const sync = new BroadcastSync('test', bus);

  let payload = null;
  bus.on('users:changed', (p) => { payload = p; });

  sync._onMessage({
    event: 'users:changed',
    payload: { id: 42 },
    sessionId: 'some-other-tab',
    at: Date.now(),
  });
  assert.deepEqual(payload, { id: 42 });
  sync.destroy();
});

test('BroadcastSync: addRelay() expands the whitelist', () => {
  const bus = new EventBus();
  const sync = new BroadcastSync('test', bus);

  let captured = null;
  sync._channel = { postMessage: (msg) => { captured = msg; }, close: () => {} };

  sync.addRelay('custom:event');
  bus.emit('custom:event', { foo: 1 });
  assert.ok(captured);
  assert.equal(captured.event, 'custom:event');
  sync.destroy();
});

test('BroadcastSync: safe serialize drops functions', () => {
  const bus = new EventBus();
  const sync = new BroadcastSync('test', bus);

  let captured = null;
  sync._channel = { postMessage: (msg) => { captured = msg; }, close: () => {} };

  bus.emit('users:changed', { id: 1, onClick: () => {} });
  assert.ok(captured);
  // Functions must not survive JSON round-trip
  assert.equal(typeof captured.payload.onClick, 'undefined');
  sync.destroy();
});
