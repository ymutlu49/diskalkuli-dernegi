/**
 * OfflineQueue — durable IndexedDB queue for deferred mutations.
 *
 * When the user is offline (or the backend returns a network error),
 * ApiService can hand a mutation to OfflineQueue.enqueue(). When the
 * browser reconnects, OfflineQueue.flush() replays everything in
 * FIFO order.
 *
 * Status: **SCAFFOLD**. ApiService already knows how to enqueue; the
 * replay side is hooked up in main.js on the `online` event. This is
 * intentionally minimal — a full sync-with-conflict-resolution
 * strategy lives in Sprint 2 of the backend integration.
 *
 * Schema:
 *   database: 'diskalkuli-offline'
 *   version:  1
 *   store:    'mutations' (keyPath: 'id', autoIncrement: true)
 *     { id, method, path, body, at, attempts }
 */
import { logger } from './logger.js';

const DB_NAME  = 'diskalkuli-offline';
const DB_VER   = 1;
const STORE    = 'mutations';
const MAX_ATTEMPTS = 5;

export class OfflineQueue {
  constructor() {
    this._db = null;
    this._api = null;
    this._isOpening = null;
  }

  attach({ api }) {
    this._api = api || null;
  }

  /** Open (or create) the IndexedDB. */
  async open() {
    if (this._db) return this._db;
    if (this._isOpening) return this._isOpening;

    this._isOpening = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not available in this environment'));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = () => {
        this._db = req.result;
        resolve(this._db);
      };
      req.onerror = () => reject(req.error);
    });

    return this._isOpening;
  }

  /**
   * Add a mutation to the tail of the queue.
   * @param {{method:string,path:string,body?:any,at?:number}} entry
   */
  async enqueue(entry) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const req = store.add({
        method:   entry.method,
        path:     entry.path,
        body:     entry.body ?? null,
        at:       entry.at || Date.now(),
        attempts: 0,
      });
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  }

  /** Count pending mutations. */
  async size() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  }

  /** List all pending mutations in FIFO order. */
  async list() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = () => reject(req.error);
    });
  }

  /** Remove a single entry by id. */
  async remove(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const req = tx.objectStore(STORE).delete(id);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  /** Increment the attempt counter on an entry. */
  async markFailed(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const entry = getReq.result;
        if (!entry) { resolve(); return; }
        entry.attempts = (entry.attempts || 0) + 1;
        const putReq = store.put(entry);
        putReq.onsuccess = () => resolve(entry.attempts);
        putReq.onerror   = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  /** Wipe everything. */
  async clear() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const req = tx.objectStore(STORE).clear();
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  /**
   * Replay every pending mutation. Stops on the first network error
   * so the queue order is preserved. Entries that fail more than
   * MAX_ATTEMPTS times are dropped to prevent poison-pill loops.
   *
   * @returns {Promise<{ sent: number, failed: number, dropped: number }>}
   */
  async flush() {
    if (!this._api) {
      logger.warn('OfflineQueue', 'flush() called without ApiService');
      return { sent: 0, failed: 0, dropped: 0 };
    }
    const entries = await this.list();
    let sent = 0, failed = 0, dropped = 0;

    for (const entry of entries) {
      try {
        await this._api._request(entry.method, entry.path, entry.body ?? undefined);
        await this.remove(entry.id);
        sent++;
      } catch (err) {
        // Network error → stop so order is preserved
        if (err && err.isNetwork) {
          logger.info('OfflineQueue', 'still offline, stopping flush');
          break;
        }
        const attempts = await this.markFailed(entry.id);
        if (attempts >= MAX_ATTEMPTS) {
          logger.warn('OfflineQueue', `dropping poison-pill entry ${entry.id} after ${attempts} attempts`);
          await this.remove(entry.id);
          dropped++;
        } else {
          failed++;
        }
      }
    }

    if (sent || dropped) {
      logger.info('OfflineQueue', `flush: sent=${sent}, failed=${failed}, dropped=${dropped}`);
    }
    return { sent, failed, dropped };
  }
}
