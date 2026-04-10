/**
 * Content service — full CMS with a strict lifecycle.
 *
 *                  ┌─── reject(back to draft) ───┐
 *                  ▼                             │
 *   taslak ──submit── inceleme ──approve──┬→ zamanlanmis (publishAt > now)
 *      ▲                                   └→ yayinda      (publishAt ≤ now / immediate)
 *      │                                                             │
 *      │                                                             ▼
 *      │                                                      yayinda
 *      │                                                             │
 *      └── unpublish ◄──────────────────────────────────────────── yayinda
 *                                                                     │
 *                                                                     ▼
 *                                                                   arsiv
 *                                                                     │
 *                                                                     ▼
 *                                                               (soft-delete)
 *
 * Permissions:
 *   - Everyone can create drafts and save them.
 *   - Only super-admins can approve, publish, or delete.
 *   - Authors cannot approve their own drafts.
 *
 * Persistence:
 *   - Content is held in-memory and optionally mirrored to
 *     localStorage via StorageService. Drafts auto-save on every
 *     mutation.
 *
 * Events:
 *   - content:changed   — fired on any mutation
 *   - content:published — when an item goes live
 *   - content:archived  — when an item is archived
 */
import { INITIAL_CONTENT }   from '../data/mock-content.js';
import { CONTENT_STATUS, CONTENT_TYPES } from '../data/content-taxonomy.js';

export class ContentService {
  constructor() {
    /** @type {Array<object>} */
    this._items  = [];
    this._nextId = 2000;
    this._bus = null;
    this._store = null;
    this._storage = null;
    this._audit = null;
    this._timer = null;
  }

  attach({ bus, store }) {
    this._bus = bus;
    this._store = store;
  }

  useStorage(storage) {
    this._storage = storage;
    const saved = storage.get('content', null);
    if (Array.isArray(saved) && saved.length > 0) {
      this._items = saved;
      this._nextId = Math.max(...saved.map((i) => i.id), 1999) + 1;
    } else {
      // First run — seed with mock content.
      this._items = INITIAL_CONTENT.map((i) => ({ ...i }));
      this._nextId = Math.max(...INITIAL_CONTENT.map((i) => i.id), 1999) + 1;
      this._persist();
    }
  }

  useAudit(audit) {
    this._audit = audit;
  }

  /**
   * Start the background task that promotes scheduled items to published.
   * Safe to call multiple times — a second call is a no-op.
   */
  startScheduler() {
    if (this._timer) return;
    const tick = () => {
      try { this._promoteScheduled(); }
      catch (err) { console.warn('[ContentService] scheduler tick failed:', err); }
    };
    tick();
    this._timer = setInterval(tick, 30_000); // 30s tick

    // Auto-cleanup on page unload so we never leak timers during HMR / tests.
    if (!this._unloadHandler && typeof window !== 'undefined') {
      this._unloadHandler = () => this.stopScheduler();
      window.addEventListener('beforeunload', this._unloadHandler, { once: true });
    }
  }

  stopScheduler() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    if (this._unloadHandler && typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this._unloadHandler);
      this._unloadHandler = null;
    }
  }

  /* ── Queries ──────────────────────────────────────────────── */

  list({ status, type, category, search, authorId } = {}) {
    let items = this._items.slice().sort((a, b) => b.updatedAt - a.updatedAt);
    if (status)   items = items.filter((i) => i.status === status);
    if (type)     items = items.filter((i) => i.type === type);
    if (category) items = items.filter((i) => i.category === category);
    if (authorId) items = items.filter((i) => i.authorId === authorId);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        (i.excerpt || '').toLowerCase().includes(q)
      );
    }
    return items;
  }

  findById(id) { return this._items.find((i) => i.id === id) || null; }

  countByStatus() {
    const out = { taslak: 0, inceleme: 0, zamanlanmis: 0, yayinda: 0, arsiv: 0 };
    for (const i of this._items) out[i.status] = (out[i.status] || 0) + 1;
    return out;
  }

  /** Last N published items (for the "Son Yayınlar" widget). */
  recentPublished(limit = 5) {
    return this._items
      .filter((i) => i.status === 'yayinda')
      .sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0))
      .slice(0, limit);
  }

  /* ── Mutations ────────────────────────────────────────────── */

  /**
   * Create a brand-new content item in the 'taslak' state.
   */
  create(patch = {}) {
    const user = this._currentUser();
    if (!user) throw new Error('Oturum gerekli.');
    const now = Date.now();
    const item = {
      id:          this._nextId++,
      type:        patch.type     || 'haber',
      title:       patch.title    || 'Yeni Taslak',
      body:        patch.body     || '',
      excerpt:     patch.excerpt  || '',
      category:    patch.category || 'Genel',
      tags:        Array.isArray(patch.tags) ? patch.tags.slice() : [],
      audience:    patch.audience || 'all',
      status:      'taslak',
      authorId:    user.id,
      authorName:  user.name,
      reviewedBy:  null,
      reviewedAt:  null,
      publishedAt: null,
      scheduledAt: null,
      createdAt:   now,
      updatedAt:   now,
      views:       0,
    };
    this._items.unshift(item);
    this._persist();
    this._audit?.log('CONTENT_CREATE', `İçerik: ${item.title}`, { id: item.id });
    this._emit();
    return item;
  }

  /** Merge a patch into an existing item. Never changes status. */
  update(id, patch = {}) {
    const item = this.findById(id);
    if (!item) return null;
    const allowed = ['title', 'body', 'excerpt', 'type', 'category', 'tags', 'audience'];
    for (const key of allowed) {
      if (key in patch) item[key] = patch[key];
    }
    item.updatedAt = Date.now();
    this._persist();
    this._audit?.log('CONTENT_UPDATE', `İçerik: ${item.title}`, { id: item.id });
    this._emit();
    return item;
  }

  /** Move a draft to 'inceleme'. */
  submitForReview(id) {
    const item = this.findById(id);
    if (!item) return null;
    if (item.status !== 'taslak') throw new Error('Yalnızca taslaklar incelemeye gönderilebilir.');
    item.status = 'inceleme';
    item.updatedAt = Date.now();
    this._persist();
    this._audit?.log('CONTENT_SUBMIT', `İçerik: ${item.title}`, { id: item.id });
    this._emit();
    return item;
  }

  /**
   * Super-admin approval. If `at` is in the future, item goes to
   * 'zamanlanmis'; otherwise it's published immediately.
   */
  approve(id, { at = null } = {}) {
    const user = this._currentUser();
    if (!user || !user.superadmin) throw new Error('Yetersiz yetki.');
    const item = this.findById(id);
    if (!item) return null;
    if (item.status === 'yayinda') return item;

    const now = Date.now();
    item.reviewedBy = user.id;
    item.reviewedAt = now;
    item.updatedAt  = now;

    if (at && at > now) {
      item.status      = 'zamanlanmis';
      item.scheduledAt = at;
      this._audit?.log('CONTENT_SCHEDULE', `İçerik: ${item.title}`, { id: item.id, at });
    } else {
      item.status      = 'yayinda';
      item.publishedAt = now;
      item.scheduledAt = null;
      this._audit?.log('CONTENT_PUBLISH', `İçerik: ${item.title}`, { id: item.id });
      if (this._bus) this._bus.emit('content:published', item);
    }

    this._persist();
    this._emit();
    return item;
  }

  /** Send a draft back from 'inceleme' to 'taslak' with an optional note. */
  reject(id, reason = '') {
    const user = this._currentUser();
    if (!user || !user.superadmin) throw new Error('Yetersiz yetki.');
    const item = this.findById(id);
    if (!item) return null;
    if (item.status !== 'inceleme') return item;
    item.status = 'taslak';
    item.updatedAt = Date.now();
    this._persist();
    this._audit?.log('CONTENT_REJECT', `İçerik: ${item.title}`, { id: item.id, reason });
    this._emit();
    return item;
  }

  /** Instant publish (skips review). Requires super-admin. */
  publishNow(id) {
    return this.approve(id, { at: null });
  }

  /** Reschedule an already-approved item. */
  schedule(id, at) {
    const user = this._currentUser();
    if (!user || !user.superadmin) throw new Error('Yetersiz yetki.');
    const item = this.findById(id);
    if (!item) return null;
    const now = Date.now();
    item.status      = at > now ? 'zamanlanmis' : 'yayinda';
    item.scheduledAt = at > now ? at : null;
    if (item.status === 'yayinda') item.publishedAt = now;
    item.updatedAt   = now;
    this._persist();
    this._audit?.log('CONTENT_SCHEDULE', `İçerik: ${item.title}`, { id: item.id, at });
    this._emit();
    return item;
  }

  unpublish(id) {
    const user = this._currentUser();
    if (!user || !user.superadmin) throw new Error('Yetersiz yetki.');
    const item = this.findById(id);
    if (!item) return null;
    item.status = 'taslak';
    item.publishedAt = null;
    item.updatedAt = Date.now();
    this._persist();
    this._audit?.log('CONTENT_UNPUBLISH', `İçerik: ${item.title}`, { id: item.id });
    this._emit();
    return item;
  }

  archive(id) {
    const user = this._currentUser();
    if (!user || !user.superadmin) throw new Error('Yetersiz yetki.');
    const item = this.findById(id);
    if (!item) return null;
    item.status = 'arsiv';
    item.updatedAt = Date.now();
    this._persist();
    this._audit?.log('CONTENT_ARCHIVE', `İçerik: ${item.title}`, { id: item.id });
    if (this._bus) this._bus.emit('content:archived', item);
    this._emit();
    return item;
  }

  restore(id) {
    const user = this._currentUser();
    if (!user || !user.superadmin) throw new Error('Yetersiz yetki.');
    const item = this.findById(id);
    if (!item) return null;
    if (item.status !== 'arsiv') return item;
    item.status = 'taslak';
    item.updatedAt = Date.now();
    this._persist();
    this._audit?.log('CONTENT_RESTORE', `İçerik: ${item.title}`, { id: item.id });
    this._emit();
    return item;
  }

  /** Permanent delete. Used for abandoned drafts only. */
  remove(id) {
    const user = this._currentUser();
    if (!user || !user.superadmin) throw new Error('Yetersiz yetki.');
    const idx = this._items.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    const [removed] = this._items.splice(idx, 1);
    this._persist();
    this._audit?.log('CONTENT_DELETE', `İçerik: ${removed.title}`, { id });
    this._emit();
    return true;
  }

  /** Increment view counter (called from the public-facing screens). */
  touchView(id) {
    const item = this.findById(id);
    if (!item) return;
    item.views = (item.views || 0) + 1;
    this._persist();
  }

  /* ── Helpers ──────────────────────────────────────────────── */

  statusLabel(key) { return CONTENT_STATUS[key]?.label || key; }
  typeLabel(key)   { return CONTENT_TYPES[key]?.label  || key; }

  _currentUser() { return this._store ? this._store.get('currentUser') : null; }

  _persist() {
    if (this._storage) this._storage.set('content', this._items);
  }

  _emit() {
    if (this._bus) this._bus.emit('content:changed', this._items.length);
  }

  _promoteScheduled() {
    const now = Date.now();
    let changed = false;
    for (const item of this._items) {
      if (item.status === 'zamanlanmis' && item.scheduledAt && item.scheduledAt <= now) {
        item.status      = 'yayinda';
        item.publishedAt = now;
        item.scheduledAt = null;
        item.updatedAt   = now;
        this._audit?.log('CONTENT_PUBLISH', `İçerik (zamanlanmış): ${item.title}`, { id: item.id, auto: true });
        if (this._bus) this._bus.emit('content:published', item);
        changed = true;
      }
    }
    if (changed) { this._persist(); this._emit(); }
  }
}
