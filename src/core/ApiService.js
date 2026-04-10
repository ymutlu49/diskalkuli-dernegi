/**
 * ApiService — thin fetch wrapper for talking to a backend.
 *
 * Status: **SCAFFOLD** — no backend is wired up yet. This file exists
 * so the rest of the app can gradually migrate off its localStorage-
 * only data layer. Every method is fully implemented on the transport
 * level; the consumers (UserService, ContentService, …) haven't been
 * flipped yet.
 *
 * Configuration
 * ─────────────
 *   ApiService respects the following env-ish switches:
 *
 *   • `localStorage.getItem('diskalkuli:api-base')`
 *       → Base URL for the backend. Defaults to `/api` (same-origin).
 *   • `localStorage.getItem('diskalkuli:api-token')`
 *       → Bearer token for authenticated requests. Cleared on logout.
 *
 *   Everything else is hard-coded for now — multi-environment config
 *   belongs in a real env file once a build step is introduced.
 *
 * Error model
 * ───────────
 *   All methods reject with an `ApiError` that carries:
 *     { status, message, body }
 *   Callers can branch on `err.status` for 401/403/404/5xx handling.
 *
 * Offline behavior
 * ────────────────
 *   If the fetch fails with a TypeError (network) **and** an
 *   OfflineQueue instance is attached, mutations are enqueued and
 *   replayed when connectivity returns. Reads simply fail.
 */
import { logger } from './logger.js';

/** Custom error class with a readable `status` and optional body. */
export class ApiError extends Error {
  constructor(message, { status = 0, body = null, cause = null } = {}) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;
    this.body   = body;
    if (cause) this.cause = cause;
  }
  get isNetwork()   { return this.status === 0; }
  get isAuth()      { return this.status === 401 || this.status === 403; }
  get isNotFound()  { return this.status === 404; }
  get isServer()    { return this.status >= 500; }
}

const DEFAULT_TIMEOUT_MS = 15_000;

export class ApiService {
  constructor({ baseUrl, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    this._baseUrl   = baseUrl || this._readBaseUrl();
    this._timeoutMs = timeoutMs;
    this._token     = this._readToken();
    this._queue     = null;
  }

  /** App.bootstrap() passes { bus, store } here. */
  attach({ bus, store }) {
    this._bus = bus;
    this._store = store;

    // Clear token on logout
    if (bus) {
      bus.on('auth:logout', () => this.clearToken());
    }
  }

  /** Optional IndexedDB queue for offline mutations. */
  useOfflineQueue(queue) {
    this._queue = queue;
  }

  /* ── Token management ──────────────────────────────────────── */

  setToken(token) {
    this._token = token;
    try { localStorage.setItem('diskalkuli:api-token', token); }
    catch { /* private mode */ }
  }

  clearToken() {
    this._token = null;
    try { localStorage.removeItem('diskalkuli:api-token'); }
    catch { /* ignore */ }
  }

  get token() { return this._token; }

  /* ── HTTP verbs ────────────────────────────────────────────── */

  get(path, opts)          { return this._request('GET',    path, undefined, opts); }
  delete(path, opts)       { return this._request('DELETE', path, undefined, opts); }
  post(path, body, opts)   { return this._request('POST',   path, body, opts); }
  put(path, body, opts)    { return this._request('PUT',    path, body, opts); }
  patch(path, body, opts)  { return this._request('PATCH',  path, body, opts); }

  /* ── Domain helpers ────────────────────────────────────────
   *
   * These are thin convenience wrappers so that UserService etc.
   * don't have to know URL layout. Returns the raw JSON body.
   * ────────────────────────────────────────────────────────── */

  async login(email, password) {
    const res = await this.post('/auth/login', { email, password }, { skipAuth: true });
    if (res && res.token) this.setToken(res.token);
    return res;
  }

  async logout() {
    try { await this.post('/auth/logout', {}); }
    catch (err) { logger.warn('ApiService', 'logout ignore', err); }
    this.clearToken();
  }

  listUsers(params)     { return this.get('/users' + this._qs(params)); }
  createUser(user)      { return this.post('/users', user); }
  updateUser(id, patch) { return this.patch(`/users/${id}`, patch); }
  deleteUser(id)        { return this.delete(`/users/${id}`); }

  listContent(params)   { return this.get('/content' + this._qs(params)); }
  createContent(item)   { return this.post('/content', item); }
  updateContent(id, p)  { return this.patch(`/content/${id}`, p); }

  listApplications()    { return this.get('/applications'); }
  approveApp(id, note)  { return this.post(`/applications/${id}/approve`, { note }); }
  rejectApp(id, reason) { return this.post(`/applications/${id}/reject`, { reason }); }

  /* ── Internal plumbing ─────────────────────────────────────── */

  _readBaseUrl() {
    try {
      const v = localStorage.getItem('diskalkuli:api-base');
      if (v) return v.replace(/\/$/, '');
    } catch { /* ignore */ }
    return '/api';
  }

  _readToken() {
    try { return localStorage.getItem('diskalkuli:api-token') || null; }
    catch { return null; }
  }

  _qs(params) {
    if (!params) return '';
    const entries = Object.entries(params).filter(([, v]) => v != null && v !== '');
    if (entries.length === 0) return '';
    return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  }

  async _request(method, path, body, opts = {}) {
    const url = this._baseUrl + path;
    const headers = { 'Accept': 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (this._token && !opts.skipAuth) {
      headers['Authorization'] = `Bearer ${this._token}`;
    }

    const init = {
      method,
      headers,
      credentials: 'same-origin',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    };

    // Abort support
    const controller = new AbortController();
    init.signal = controller.signal;
    const timeoutId = setTimeout(() => controller.abort(), this._timeoutMs);

    let res;
    try {
      res = await fetch(url, init);
    } catch (err) {
      clearTimeout(timeoutId);
      // Network failure — try to enqueue mutations for later replay.
      if (method !== 'GET' && this._queue) {
        try {
          await this._queue.enqueue({ method, path, body, at: Date.now() });
          logger.info('ApiService', `offline, queued ${method} ${path}`);
          return { queued: true };
        } catch (qe) {
          logger.warn('ApiService', 'queue enqueue failed', qe);
        }
      }
      throw new ApiError(
        err.name === 'AbortError'
          ? 'İstek zaman aşımına uğradı.'
          : 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.',
        { status: 0, cause: err }
      );
    }
    clearTimeout(timeoutId);

    // Parse body regardless of status so errors carry useful content.
    let parsedBody = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try { parsedBody = await res.json(); }
      catch { /* empty body */ }
    } else {
      try { parsedBody = await res.text(); }
      catch { /* empty body */ }
    }

    if (!res.ok) {
      const msg =
        (parsedBody && parsedBody.message) ||
        (typeof parsedBody === 'string' && parsedBody) ||
        `HTTP ${res.status}`;
      throw new ApiError(msg, { status: res.status, body: parsedBody });
    }

    return parsedBody;
  }
}
