/**
 * Service worker — offline-first cache for the Diskalkuli Derneği PWA.
 *
 * Strategy:
 *   • App shell files are pre-cached on install using `Promise.allSettled`
 *     so a single missing file never blocks the whole install.
 *   • Same-origin navigations: network-first with index.html fallback.
 *   • Same-origin assets: cache-first with background refresh.
 *   • Cross-origin (Google Fonts): stale-while-revalidate.
 *   • On activate, old cache versions are purged and all clients are
 *     claimed.
 *
 * Update flow:
 *   When a new worker installs, the `waiting` worker can be activated
 *   by posting { type: 'SKIP_WAITING' } from the page. The page uses
 *   this to show the "Yeni sürüm hazır, güncelle?" toast.
 *
 * Bump CACHE_VERSION whenever you ship breaking changes so that
 * installed clients pull the new bundle.
 */

const CACHE_VERSION = 'diskalkuli-v17';

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',

  './styles/tokens.css',
  './styles/app.css',
  './styles/mobile.css',
  './styles/enhancements.css',

  './icons/logo.png',
  './icons/logo-small.png',
  './icons/logo-round.png',

  './src/main.js',
  './src/compat.js',

  './src/core/App.js',
  './src/core/ApiService.js',
  './src/core/BaseScreen.js',
  './src/core/BroadcastSync.js',
  './src/core/ErrorBoundary.js',
  './src/core/EventBus.js',
  './src/core/OfflineQueue.js',
  './src/core/Router.js',
  './src/core/Store.js',
  './src/core/escapeHtml.js',
  './src/core/format.js',
  './src/core/i18n.js',
  './src/core/logger.js',

  './src/i18n/tr.json',
  './src/i18n/en.json',

  './src/data/audit-actions.js',
  './src/data/content-taxonomy.js',
  './src/data/content.js',
  './src/data/mock-content.js',
  './src/data/mock-dues.js',
  './src/data/modules.js',
  './src/data/notifications.js',
  './src/data/org.js',
  './src/data/permissions.js',
  './src/data/roles.js',
  './src/data/user-lifecycle.js',
  './src/data/users.js',

  './src/services/ApplicationService.js',
  './src/services/AuditService.js',
  './src/services/AuthService.js',
  './src/services/ConfirmService.js',
  './src/services/ContentService.js',
  './src/services/DuesService.js',
  './src/services/ModalService.js',
  './src/services/NotificationService.js',
  './src/services/PermissionService.js',
  './src/services/StorageService.js',
  './src/services/ToastService.js',
  './src/services/UserService.js',
  './src/services/ValidationService.js',

  './src/admin/AidatPanel.js',
  './src/admin/DenetimPanel.js',
  './src/admin/IcerikPanel.js',
  './src/admin/RaporPanel.js',
  './src/admin/UyeEditor.js',

  './src/screens/AdimScreen.js',
  './src/screens/AraclarScreen.js',
  './src/screens/AuthScreen.js',
  './src/screens/DokunsayScreen.js',
  './src/screens/EgitimScreen.js',
  './src/screens/FarkindalikScreen.js',
  './src/screens/HaberlerScreen.js',
  './src/screens/HomeScreen.js',
  './src/screens/IlerlemeScreen.js',
  './src/screens/KongreScreen.js',
  './src/screens/LoginScreen.js',
  './src/screens/ProfilScreen.js',
  './src/screens/SplashScreen.js',
  './src/screens/TemsilciBasvuruScreen.js',
  './src/screens/ToplulukScreen.js',
  './src/screens/UyeBasvuruScreen.js',
  './src/screens/UyeScreen.js',
  './src/screens/YayinlarScreen.js',
  './src/screens/YonetimScreen.js',

  './src/ui/adminPanelInjector.js',
  './src/ui/chips.js',
];

/**
 * Attempt to precache every URL individually, logging but not failing
 * on 404s. This prevents a single missing file from breaking install.
 */
async function precacheAll(cache, urls) {
  const results = await Promise.allSettled(
    urls.map((url) => cache.add(new Request(url, { cache: 'reload' })))
  );
  const failed = results
    .map((r, i) => ({ r, url: urls[i] }))
    .filter((x) => x.r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(
      `[SW] ${failed.length}/${urls.length} precache entries failed:`,
      failed.map((x) => x.url)
    );
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => precacheAll(cache, PRECACHE))
  );
  // Do NOT skip waiting automatically — let the page decide via
  // postMessage. This enables the "update available" toast flow.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

/** Listen for the page asking us to activate immediately. */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * Fetch strategy switcher.
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Cross-origin (e.g. Google Fonts) — stale-while-revalidate.
  if (url.origin !== self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((res) => {
            if (res && res.ok) {
              caches.open(CACHE_VERSION).then((c) => c.put(request, res.clone()));
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Same-origin navigation: network-first, fall back to cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) =>
            cached || caches.match('./index.html')
          )
        )
    );
    return;
  }

  // Same-origin asset: cache-first with background refresh.
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((res) => {
          if (res && res.ok) {
            caches.open(CACHE_VERSION).then((c) => c.put(request, res.clone()));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
