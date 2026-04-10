/**
 * Compatibility bridge: exposes select app methods as free `window.*`
 * functions so that existing inline `onclick="…"` handlers in the HTML
 * templates keep working without rewriting every card.
 *
 * As screens are migrated to addEventListener, entries here can be
 * deleted. For now this is the thinnest possible shim — each exposed
 * function is a one-liner that forwards to the appropriate service.
 *
 * DEPRECATION:
 *   The inline `onclick=""` pattern forces CSP to include
 *   `'unsafe-inline'` in script-src. When all screens are migrated
 *   to event delegation (see BaseScreen.delegate()) and the legacy
 *   CMS / kararVer sections in index.html are removed, this whole
 *   file — and the `'unsafe-inline'` CSP allowance — can go.
 *
 * IMPORTANT: This file must be imported AFTER App.bootstrap() so that
 * services and the router exist when the first inline handler fires.
 */
import { logger } from './core/logger.js';

/**
 * @param {import('./core/App.js').App} app
 */
export function installCompatShims(app) {
  const { router, services } = app;

  /* ── Navigation ───────────────────────────────────── */
  window.goTo   = (id) => router.goTo(id);
  window.goBack = () => router.goBack();
  window.setTab = (_el, id) => {
    router.resetHistory();
    router.goTo(id);
  };

  /* ── Modals ───────────────────────────────────────── */
  const modals = services.modals;
  window.openModal  = (id) => modals.open(id);
  window.closeModal = (id, e) => {
    if (!e || e.target === e.currentTarget) modals.close(id);
  };

  /* ── Auth ─────────────────────────────────────────── */
  window.login  = (role) => services.auth.loginAs(role);
  window.logout = () => services.auth.logout();
  window.loginWithEmail = () => {
    const screen = app.screens.get('auth');
    if (screen && typeof screen.submit === 'function') screen.submit();
  };
  window.doLogin = () => {
    const screen = app.screens.get('login');
    if (screen && typeof screen.submit === 'function') screen.submit();
  };
  const togglePwVisibility = (inputId) => {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    inp.type = inp.type === 'password' ? 'text' : 'password';
  };
  window.togglePw      = () => togglePwVisibility('auth-password');
  window.toggleLoginPw = () => togglePwVisibility('login-password');

  /* ── Toast ────────────────────────────────────────── */
  window.showToast = (msg) => services.toast.show(msg);

  /* ── Notifications ────────────────────────────────── */
  window.markAllRead = () => {
    services.notifications.markAllRead();
    services.notifications.renderBadge();
    services.notifications.renderList((screen) => router.goTo(screen));
  };
  window.notifClick = (id) => {
    const next = services.notifications.markRead(id);
    services.notifications.renderBadge();
    modals.close('notif-modal');
    if (next) setTimeout(() => router.goTo(next), 150);
  };

  /* ── Admin tab switcher ──────────────────────────── */
  window.adminTab = (tabId, el) => {
    document.querySelectorAll('#screen-yonetim .ap-panel').forEach((p) => p.classList.remove('active'));
    document.querySelectorAll('#screen-yonetim .ap-tab').forEach((t) => t.classList.remove('active'));
    const panel = document.getElementById('ap-' + tabId);
    if (panel) panel.classList.add('active');
    // The tab reference comes either via inline `this` or we find it
    // by data-tab attribute (for dynamically injected tabs).
    const tab = el ||
                document.querySelector(`#screen-yonetim .ap-tab[data-tab="${tabId}"]`);
    if (tab) tab.classList.add('active');
    // Tell YonetimScreen to lazily mount this panel (IcerikPanel etc.)
    const yonetim = app.screens.get('yonetim');
    if (yonetim && typeof yonetim._maybeMount === 'function') {
      yonetim._maybeMount(tabId);
    }
  };

  /* ── User editor hooks ─────────────────────────────── */
  window.openAddUser = () => {
    const yonetim = app.screens.get('yonetim');
    if (yonetim && typeof yonetim.openAddUser === 'function') yonetim.openAddUser();
  };
  window.editUser = (id) => {
    const yonetim = app.screens.get('yonetim');
    if (yonetim && typeof yonetim.openEditUser === 'function') yonetim.openEditUser(id);
  };
  window.closeAddUser = () => {
    // The new UyeEditor overlay closes itself; this is only kept
    // so any stray inline onclick="closeAddUser()" in the HTML
    // doesn't throw.
  };

  /* ── Legacy kararVer (hard-coded bsv items in original markup) ── */
  window.kararVer = (btn, karar) => {
    const item = btn && btn.closest ? btn.closest('.basvuru-item') : null;
    if (!item) return;
    const dot   = item.querySelector('.basvuru-status');
    const badge = item.querySelector('.basvuru-badge');
    const acts  = item.querySelector('.basvuru-actions');
    if (karar === 'kabul') {
      if (dot)   dot.className = 'basvuru-status status-kabul';
      if (badge) {
        badge.textContent = 'Kabul';
        badge.style.background = 'var(--green-light)';
        badge.style.color = 'var(--green-dark)';
      }
      services.toast.success('Başvuru onaylandı');
    } else {
      if (dot)   dot.className = 'basvuru-status status-red';
      if (badge) {
        badge.textContent = 'Reddedildi';
        badge.style.background = '#FFEBEE';
        badge.style.color = 'var(--danger)';
      }
      services.toast.warning('Başvuru reddedildi');
    }
    if (acts) acts.remove();
  };
  window.onaylaBasvuru = (id) => {
    try { services.applications.approve(id, ''); }
    catch (err) { logger.error('compat', 'approve', err); }
  };
  window.reddetBasvuru = (id) => {
    try { services.applications.reject(id, ''); }
    catch (err) { logger.error('compat', 'reject', err); }
  };

  /* ── Application form entrypoints (Uye / Temsilci) ── */
  window.uyeStep = (n) => {
    const screen = app.screens.get('uye-basvuru');
    if (screen && typeof screen._goToStep === 'function') screen._goToStep(n);
  };
  window.submitUyeBasvuru = () => {
    const screen = app.screens.get('uye-basvuru');
    if (screen && typeof screen._submit === 'function') screen._submit();
  };
  window.submitTemsilciBasvuru = () => {
    const screen = app.screens.get('temsilci-basvuru');
    if (screen && typeof screen._submit === 'function') screen._submit();
  };

  /* ── Kongre form submits ─────────────────────────── */
  window.submitBildiri = () => {
    const screen = app.screens.get('kongre');
    if (screen && typeof screen._submitBildiri === 'function') screen._submitBildiri();
  };
  window.submitKayit = () => {
    const screen = app.screens.get('kongre');
    if (screen && typeof screen._submitKayit === 'function') screen._submitKayit();
  };

  /* ── Profile stubs ────────────────────────────────── */
  window.editPfField = () => services.toast.show('Profil düzenleme yakında');

  /* ── Expose the app for debugging in the browser console ── */
  window.__app = app;
}
