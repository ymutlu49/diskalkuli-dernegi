import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals } from './setup.js';
installBrowserGlobals();

const { ApiService, ApiError } = await import('../src/core/ApiService.js');

function stubFetch(responder) {
  global.fetch = async (url, init) => {
    const res = await responder(url, init);
    return {
      ok: res.ok !== false,
      status: res.status || 200,
      headers: new Map([['content-type', res.contentType || 'application/json']].map(([k, v]) => [k, v])),
      json: async () => res.body,
      text: async () => (typeof res.body === 'string' ? res.body : JSON.stringify(res.body)),
    };
  };
  // headers.get() compatibility
  global.fetch = (original => async (url, init) => {
    const r = await original(url, init);
    r.headers.get = (k) => r.headers.get ? r.headers.get(k) : null;
    return r;
  })(global.fetch);
}

test('ApiService.token: set/clear round-trip', () => {
  const api = new ApiService({ baseUrl: '/api' });
  assert.equal(api.token, null);
  api.setToken('abc123');
  assert.equal(api.token, 'abc123');
  api.clearToken();
  assert.equal(api.token, null);
});

test('ApiService: attach() clears token on auth:logout', async () => {
  const api = new ApiService({ baseUrl: '/api' });
  api.setToken('x');

  const { EventBus } = await import('../src/core/EventBus.js');
  const bus = new EventBus();
  api.attach({ bus, store: {} });
  bus.emit('auth:logout');
  assert.equal(api.token, null);
});

test('ApiService: qs() skips null/undefined values', () => {
  const api = new ApiService({ baseUrl: '/api' });
  assert.equal(api._qs({ a: 1, b: null, c: undefined, d: '' }), '?a=1');
  assert.equal(api._qs(null), '');
  assert.equal(api._qs({}), '');
});

test('ApiService: qs() URL-encodes values', () => {
  const api = new ApiService({ baseUrl: '/api' });
  assert.equal(api._qs({ q: 'hello world' }), '?q=hello%20world');
});

test('ApiError: status classification', () => {
  assert.ok(new ApiError('net', { status: 0 }).isNetwork);
  assert.ok(new ApiError('auth', { status: 401 }).isAuth);
  assert.ok(new ApiError('forbidden', { status: 403 }).isAuth);
  assert.ok(new ApiError('404', { status: 404 }).isNotFound);
  assert.ok(new ApiError('500', { status: 500 }).isServer);
});

test('ApiService: network error wraps into ApiError with queue', async () => {
  const api = new ApiService({ baseUrl: '/api', timeoutMs: 500 });

  // Stub a failing fetch
  const origFetch = global.fetch;
  global.fetch = async () => { throw new TypeError('network down'); };

  const enqueued = [];
  api.useOfflineQueue({
    enqueue: async (entry) => { enqueued.push(entry); },
  });

  const result = await api.post('/users', { name: 'Ali' });
  assert.deepEqual(result, { queued: true });
  assert.equal(enqueued.length, 1);
  assert.equal(enqueued[0].method, 'POST');
  assert.equal(enqueued[0].path, '/users');

  global.fetch = origFetch;
});

test('ApiService: GET network error throws (no queueing reads)', async () => {
  const api = new ApiService({ baseUrl: '/api', timeoutMs: 500 });
  const origFetch = global.fetch;
  global.fetch = async () => { throw new TypeError('network down'); };

  let caught = null;
  try {
    await api.get('/users');
  } catch (err) {
    caught = err;
  }
  assert.ok(caught instanceof ApiError);
  assert.ok(caught.isNetwork);

  global.fetch = origFetch;
});
