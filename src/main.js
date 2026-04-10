/**
 * Application entry point.
 *
 * Wires together core + services + screens, boots the app, and
 * registers the service worker.
 */
import { App } from './core/App.js';
import { logger } from './core/logger.js';
import { i18n, t } from './core/i18n.js';
import { ErrorBoundary } from './core/ErrorBoundary.js';
import { BroadcastSync } from './core/BroadcastSync.js';
import { ApiService } from './core/ApiService.js';
import { OfflineQueue } from './core/OfflineQueue.js';

import { StorageService }      from './services/StorageService.js';
import { AuditService }        from './services/AuditService.js';
import { ConfirmService }      from './services/ConfirmService.js';
import { ContentService }      from './services/ContentService.js';
import { DuesService }         from './services/DuesService.js';
import { AuthService }         from './services/AuthService.js';
import { ToastService }        from './services/ToastService.js';
import { NotificationService } from './services/NotificationService.js';
import { PermissionService }   from './services/PermissionService.js';
import { UserService }         from './services/UserService.js';
import { ApplicationService }  from './services/ApplicationService.js';
import { ModalService }        from './services/ModalService.js';

import { SplashScreen }           from './screens/SplashScreen.js';
import { LoginScreen }            from './screens/LoginScreen.js';
import { AuthScreen }             from './screens/AuthScreen.js';
import { HomeScreen }             from './screens/HomeScreen.js';
import { HaberlerScreen }         from './screens/HaberlerScreen.js';
import { FarkindalikScreen }      from './screens/FarkindalikScreen.js';
import { EgitimScreen }           from './screens/EgitimScreen.js';
import { AdimScreen }             from './screens/AdimScreen.js';
import { DokunsayScreen }         from './screens/DokunsayScreen.js';
import { AraclarScreen }          from './screens/AraclarScreen.js';
import { YayinlarScreen }         from './screens/YayinlarScreen.js';
import { KongreScreen }           from './screens/KongreScreen.js';
import { IlerlemeScreen }         from './screens/IlerlemeScreen.js';
import { ToplulukScreen }         from './screens/ToplulukScreen.js';
import { UyeScreen }              from './screens/UyeScreen.js';
import { ProfilScreen }           from './screens/ProfilScreen.js';
import { YonetimScreen }          from './screens/YonetimScreen.js';
import { UyeBasvuruScreen }       from './screens/UyeBasvuruScreen.js';
import { TemsilciBasvuruScreen }  from './screens/TemsilciBasvuruScreen.js';

import { installCompatShims } from './compat.js';

/* ── Services ─────────────────────────────────────────────────── */
const storage      = new StorageService({ namespace: 'diskalkuli', version: 2 });
const audit        = new AuditService();
const confirmSvc   = new ConfirmService();
const content      = new ContentService();
const dues         = new DuesService();
const users        = new UserService();
const applications = new ApplicationService();
const toast        = new ToastService();
const api          = new ApiService();
const offlineQueue = new OfflineQueue();

// Wire the API ↔ queue link early so all services see a consistent
// fetch path from their first call.
api.useOfflineQueue(offlineQueue);
offlineQueue.attach({ api });

const services = {
  storage,
  audit,
  confirm:       confirmSvc,
  content,
  dues,
  auth:          new AuthService(),
  toast,
  notifications: new NotificationService(),
  permissions:   new PermissionService(),
  users,
  applications,
  modals:        new ModalService(),
  api,
  offlineQueue,
};

/* ── Screen registry ─────────────────────────────────────────── */
const screenDefs = [
  ['splash',           SplashScreen],
  ['login',            LoginScreen],
  ['auth',             AuthScreen],
  ['home',             HomeScreen],
  ['haberler',         HaberlerScreen],
  ['farkindalik',      FarkindalikScreen],
  ['egitim',           EgitimScreen],
  ['adim',             AdimScreen],
  ['dokunsay',         DokunsayScreen],
  ['araclar',          AraclarScreen],
  ['yayinlar',         YayinlarScreen],
  ['kongre',           KongreScreen],
  ['ilerleme',         IlerlemeScreen],
  ['topluluk',         ToplulukScreen],
  ['uye',              UyeScreen],
  ['profil',           ProfilScreen],
  ['yonetim',          YonetimScreen],
  ['uye-basvuru',      UyeBasvuruScreen],
  ['temsilci-basvuru', TemsilciBasvuruScreen],
];

/* ── Bootstrap ────────────────────────────────────────────────── */
const app = new App({ screenDefs, services });

async function start() {
  // Install the error boundary BEFORE any other code runs so even
  // bootstrap exceptions are captured.
  const boundary = new ErrorBoundary({ toast });
  boundary.install();

  // Load the user's preferred locale. We intentionally don't block
  // on this — the first render uses catalog keys if it races, which
  // is benign ("nav.home" is visible in QA).
  i18n.load(i18n.locale).catch((err) => logger.warn('i18n', 'initial load failed', err));

  // Auto-translate declarative i18n attributes when the locale changes.
  // Covers any element in the HTML with:
  //   data-i18n              → textContent
  //   data-i18n-placeholder  → input/textarea placeholder
  //   data-i18n-aria         → aria-label
  //   data-i18n-title        → title tooltip
  const applyTranslations = () => {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.setAttribute('placeholder', t(key));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      if (key) el.setAttribute('aria-label', t(key));
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (key) el.setAttribute('title', t(key));
    });
  };
  i18n.onChange(applyTranslations);
  // Run once immediately so the catalog we just loaded is painted.
  // Defer a microtask so initial load() has time to finish.
  queueMicrotask(applyTranslations);

  app.bootstrap();

  // Cross-tab sync: whitelist only the mutation events. This must
  // come after bootstrap() so the bus has no stale singletons.
  const sync = new BroadcastSync('diskalkuli', app.bus);
  services.broadcastSync = sync;

  // Storage-dependent services must be initialised AFTER App.bootstrap()
  // because bootstrap() wires `attach()` in a fixed order.
  audit.useStorage(storage);
  users.useStorage(storage);
  users.useAudit(audit);
  applications.useStorage(storage);
  applications.useAudit(audit);
  content.useStorage(storage);
  content.useAudit(audit);
  dues.useStorage(storage);
  dues.useAudit(audit);

  // Kick off the CMS scheduler so `zamanlanmis` items flip to `yayinda`
  content.startScheduler();

  installCompatShims(app);

  services.notifications.renderList((screen) => app.router.goTo(screen));
  services.notifications.renderBadge();

  // Log successful session start
  app.bus.on('auth:login', (user) => {
    audit.log('AUTH_LOGIN', `Kullanıcı: ${user.name}`, { id: user.id, role: user.role });
  });
  app.bus.on('auth:logout', () => {
    audit.log('AUTH_LOGOUT', 'Oturum sonlandırıldı', {});
  });

  // Online / offline indicator + OfflineQueue flush
  const updateOnlineState = () => {
    const online = navigator.onLine;
    document.documentElement.dataset.online = String(online);
    app.bus.emit(online ? 'net:online' : 'net:offline');
  };
  window.addEventListener('online',  async () => {
    updateOnlineState();
    try {
      const result = await offlineQueue.flush();
      if (result.sent > 0) {
        toast.info(`${result.sent} bekleyen işlem gönderildi.`);
      }
    } catch (err) {
      logger.warn('main', 'offline queue flush failed', err);
    }
  });
  window.addEventListener('offline', () => {
    updateOnlineState();
    toast.warning('Çevrimdışısınız. Değişiklikler yeniden bağlanınca gönderilecek.');
  });
  updateOnlineState();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}

/* ── Service worker registration ──────────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => {
        logger.info('PWA', 'service worker registered:', reg.scope);

        // Check for updates on every load; the new worker (if any)
        // will transition through "installing" → "waiting" states.
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              // A new version is ready. Prompt the user to activate it.
              services.toast.show({
                message: 'Yeni sürüm hazır.',
                variant: 'info',
                duration: 8000,
                action: {
                  label: 'Güncelle',
                  onClick: () => {
                    try { nw.postMessage({ type: 'SKIP_WAITING' }); } catch { /* ignore */ }
                    // Reload once the new worker takes control
                    navigator.serviceWorker.addEventListener(
                      'controllerchange',
                      () => window.location.reload(),
                      { once: true }
                    );
                  },
                },
              });
            }
          });
        });
      })
      .catch((err) => logger.warn('PWA', 'service worker failed:', err));
  });
}
