/**
 * Authentication service — mock email/password auth.
 *
 * This is a DEMO implementation. It intentionally keeps a
 * hardcoded email→role table and a single shared password so the
 * offline PWA can be evaluated end-to-end without a backend.
 *
 * SECURITY NOTE
 * ─────────────
 * Before going to production:
 *   1. Replace `loginWithEmail` with a real API call (see
 *      `ApiService` — TODO) that returns a session token.
 *   2. Set `AUTH_MODE = 'api'` below.
 *   3. Remove `DEMO_PASSWORD` and `EMAIL_MAP` from the bundle.
 *   4. Move the demo users into a seed file loaded only in dev.
 *
 * Events emitted:
 *   - auth:login   — payload: user object
 *   - auth:logout  — payload: null
 *   - auth:error   — payload: { message }
 */
import { DEMO_USERS } from '../data/users.js';
import { logger } from '../core/logger.js';

/**
 * Auth mode switch.
 *   'demo' — use the local EMAIL_MAP / DEMO_PASSWORD table (offline PWA).
 *   'api'  — delegate to ApiService.login() (requires backend).
 *
 * You can flip this at runtime from DevTools for QA:
 *   localStorage.setItem('diskalkuli:auth-mode', 'api')
 */
function readAuthMode() {
  try {
    const override = localStorage.getItem('diskalkuli:auth-mode');
    if (override === 'demo' || override === 'api') return override;
  } catch { /* ignore */ }
  return 'demo';
}

const EMAIL_MAP = {
  'y.mutlu@alparslan.edu.tr':      'yonetim',
  'yilmaz.mutlu@alparslan.edu.tr': 'yonetim',
  'ihsan.soylemez@mail.com':        'ihsan',
  'ayse.kaya@mail.com':             'temsilci',
  'mehmet@okul.edu.tr':             'uye',
  'ziyaretci@mail.com':             'genel',
  'admin@diskalkulidernegi.org':    'yonetim',
  'yilmaz@diskalkuli.org':          'yonetim',
};

/**
 * A single shared password for all demo roles. In a real app this would
 * come from a backend and would never live in the bundle.
 */
const DEMO_PASSWORD = 'diskalkulider2017';

/** Minimum delay before success/failure callback, in ms. */
const FAKE_LATENCY_MS = 500;

/** Minimum password length we'd accept once a real backend is wired in. */
const MIN_PASSWORD_LENGTH = 8;

/** Basic email shape check — mirrors ValidationService. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthService {
  constructor() {
    this._bus = null;
    this._store = null;
    this._router = null;
    this._mode = readAuthMode();
    this._pendingLogin = false;
  }

  attach({ bus, store, router }) {
    this._bus = bus;
    this._store = store;
    this._router = router;
    logger.info('AuthService', `mode=${this._mode}`);
  }

  /** The currently-signed-in user, or null. */
  get currentUser() {
    return this._store ? this._store.get('currentUser') : null;
  }

  /** Returns 'demo' | 'api'. */
  get mode() { return this._mode; }

  /**
   * Log in as a canned demo user by role key.
   * @param {'yonetim'|'ihsan'|'temsilci'|'uye'|'genel'} roleKey
   */
  loginAs(roleKey) {
    const user = DEMO_USERS[roleKey];
    if (!user) {
      this._fail(`Demo rol bulunamadı: ${roleKey}`);
      return;
    }
    this._bus.emit('auth:login', user);
  }

  /**
   * Log in with an email/password pair.
   * Returns { ok: true } on success, { ok: false, message } on failure.
   * Callers may pass `onResult` to receive the outcome asynchronously
   * (matches the original 600 ms "loading" animation in the monolith).
   */
  loginWithEmail(rawEmail, password, onResult = () => {}) {
    // Rate-limit: prevent back-to-back submissions from double-binding.
    if (this._pendingLogin) {
      onResult({ ok: false, message: 'Zaten bir giriş işlemi devam ediyor.' });
      return;
    }

    const email = (rawEmail || '').trim().toLowerCase();

    if (!email) {
      const msg = 'E-posta adresinizi girin.';
      this._fail(msg);
      onResult({ ok: false, message: msg });
      return;
    }
    if (!EMAIL_RE.test(email)) {
      const msg = 'Geçerli bir e-posta adresi girin.';
      this._fail(msg);
      onResult({ ok: false, message: msg });
      return;
    }
    if (!password) {
      const msg = 'Şifrenizi girin.';
      this._fail(msg);
      onResult({ ok: false, message: msg });
      return;
    }

    if (this._mode === 'api') {
      // Real-backend path is not implemented yet; fail loudly so nobody
      // ships a broken login flow by accident.
      const msg = 'Canlı giriş modu henüz hazır değil. Lütfen demo modu kullanın.';
      logger.error('AuthService', msg);
      this._fail(msg);
      onResult({ ok: false, message: msg });
      return;
    }

    // ── DEMO MODE ──────────────────────────────────────────────
    this._pendingLogin = true;

    const roleKey = EMAIL_MAP[email];
    if (!roleKey) {
      // Simulate a normal network round-trip so timing doesn't leak
      // "this email is unknown" before "wrong password".
      setTimeout(() => {
        this._pendingLogin = false;
        const msg = 'E-posta veya şifre hatalı.';
        this._fail(msg);
        onResult({ ok: false, message: msg });
      }, FAKE_LATENCY_MS);
      return;
    }

    if (password !== DEMO_PASSWORD) {
      setTimeout(() => {
        this._pendingLogin = false;
        const msg = 'E-posta veya şifre hatalı.';
        this._fail(msg);
        onResult({ ok: false, message: msg });
      }, FAKE_LATENCY_MS);
      return;
    }

    // Optional soft warning for weak passwords — useful once the field
    // is no longer shared across all demo accounts.
    if (password.length < MIN_PASSWORD_LENGTH) {
      logger.warn('AuthService', 'password below recommended length (demo)');
    }

    // Simulate a small network delay like the original, then succeed.
    setTimeout(() => {
      this._pendingLogin = false;
      const user = DEMO_USERS[roleKey];
      this._bus.emit('auth:login', user);
      onResult({ ok: true, user });
    }, FAKE_LATENCY_MS);
  }

  logout() {
    this._bus.emit('auth:logout', null);
  }

  _fail(message) {
    if (this._bus) this._bus.emit('auth:error', { message });
  }
}
