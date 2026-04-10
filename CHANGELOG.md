# Changelog

Bu dosya projedeki onemli degisiklikleri izler.
Format: [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/)

## [0.2.0] - 2026-04-10

### Eklenen
- **i18n sistemi**: `core/i18n.js`, `src/i18n/tr.json`, `src/i18n/en.json` — `t()` helper ile coklu dil destegi
- **ApiService**: Backend entegrasyon icin fetch wrapper (scaffold)
- **BroadcastSync**: Cross-tab event relay (BroadcastChannel + storage fallback)
- **ErrorBoundary**: Global uncaught exception + unhandled rejection handler
- **OfflineQueue**: IndexedDB FIFO queue ile offline mutation kaydetme
- **81 test**: `node:test` ile Store, EventBus, escapeHtml, format, validation, i18n, BroadcastSync, ApiService
- **Dark mode**: `tokens.css` icinde `@media (prefers-color-scheme: dark)` + `data-theme="dark"` override
- **Tablet/desktop breakpoint**: `mobile.css` icinde `min-width: 768px` ve `1024px`
- **Forced-colors mode**: Windows high-contrast destegi
- **Print stylesheet**: Admin paneller yazdirma icin optimize
- **Manifest shortcuts**: Haberler, Egitim, Farkindalik, Uye Ol kisayollari
- **Open Graph + Twitter Card + Schema.org** meta etiketleri
- **Skip-link**: Klavye kullancilari icin `href="#global-nav"`
- **Dil degistirici**: Profil ekraninda TR/EN toggle
- **package.json**: `npm test`, `npm run serve`, `npm run validate`
- `.gitignore`, `.editorconfig`, `.nvmrc`

### Degistirildi
- **Guvenlik**: netlify.toml'a CSP, HSTS, X-Frame-Options, Permissions-Policy eklendi
- **XSS koruma**: 15 dosyada `innerHTML` icindeki kullanici verileri `escapeHtml()` ile escape edildi
- **AuthService**: Demo/API mode switch, rate-limit, timing-safe hata mesajlari, email regex
- **ConfirmService**: Focus trap, Escape kapatma, `aria-labelledby/describedby`, focus restore
- **ModalService**: `aria-modal`, Escape kapatma, focus restore
- **ToastService**: `aria-live="polite"`, `role="alert"` (error), shared SR live region
- **ValidationService**: `aria-invalid`, `aria-describedby`, `focusFirstError()` helper
- **NotificationService**: Keyboard nav (Enter/Space), `escapeHtml`, `aria-label`
- **BaseScreen**: `delegate()` event delegation helper, `emit()`, `goTo()` shortcuts, logger
- **ContentService**: Scheduler `beforeunload` cleanup, try/catch tick
- **Admin paneller**: Duplicate `_escape()` silindi, `formatCurrency()` ve `timeAgo()` kullanildi
- **Ekranlar**: `<article>`, `<h3>`, `role="progressbar"`, `aria-label` semantik iyilestirmeler
- **index.html**: 18 ekrana `role="region"` + `aria-label`, `<html dir="ltr">`, viewport pinch-zoom izni
- **Nav bar**: `role="tab"`, `tabindex`, `aria-label`, `data-i18n`
- **SW**: `Promise.allSettled` precache, manual `SKIP_WAITING` update akisi, v4
- **compat.js**: CM stub'lari silindi, logger, error handling

### Silinen
- ~1 MB legacy monolit HTML (`diskalkuli_app.html`, `diskalkuli_app.cleaned.html`)
- Legacy CMS markup (`.cm-*`) index.html'den
- compat.js'den 10 olu CM stub fonksiyonu
- 3 adet duplicate `_escape()` fonksiyonu
- 3 adet duplicate `_tl()` fonksiyonu

## [0.1.0] - 2026-04-09

### Eklenen
- Ilk modular yapi: monolitten ~40 ES module'a donusum
- Store, EventBus, Router, BaseScreen core sinflari
- AuthService, UserService, ContentService, DuesService, AuditService
- PWA: manifest, service worker, offline cache
- 19 ekran controller'i
- 5 admin paneli (IcerikPanel, AidatPanel, DenetimPanel, RaporPanel, UyeEditor)
