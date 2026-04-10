/**
 * Dynamic admin panel injector.
 *
 * The original index.html ships six admin tabs (Özet / Üyeler /
 * Başvurular / Finans / Etkinlikler / YK). This helper appends four
 * new tabs to the same tab row and four new `.ap-panel` containers
 * to the same panel wrapper — without editing the HTML file.
 *
 * The four new panels are:
 *   - icerik  → Content manager
 *   - aidat   → Dues management
 *   - denetim → Audit log viewer
 *   - rapor   → Reports & analytics
 *
 * Each injected tab fires the existing `adminTab()` compat function
 * so it integrates seamlessly with the original tab-switching logic.
 *
 * The injected panels are empty <div>s — their Panel controller
 * (IcerikPanel, AidatPanel, DenetimPanel, …) takes care of
 * rendering content when the tab is activated.
 */

const EXTRA_TABS = [
  { id: 'icerik',  label: 'İçerik',  icon: '📝' },
  { id: 'aidat',   label: 'Aidat',   icon: '💰' },
  { id: 'denetim', label: 'Denetim', icon: '📋' },
  { id: 'rapor',   label: 'Rapor',   icon: '📊' },
];

export function injectAdminPanels() {
  const tabRow = document.querySelector('#screen-yonetim .admin-panel-tabs');
  if (!tabRow) return;

  // Avoid double-injection on repeated bootstraps
  if (tabRow.dataset.extrasInjected === '1') return;
  tabRow.dataset.extrasInjected = '1';

  for (const { id, label } of EXTRA_TABS) {
    const tab = document.createElement('div');
    tab.className = 'ap-tab';
    tab.textContent = label;
    tab.dataset.tab = id;
    // Route through the existing compat shim so behavior matches the
    // built-in tabs exactly.
    tab.setAttribute('onclick', `adminTab('${id}', this)`);
    tabRow.appendChild(tab);
  }

  // Place the new panels inside the same panel wrapper that already
  // hosts ap-ozet, ap-uyeler, ….
  const sample = document.getElementById('ap-ozet');
  const panelWrapper = sample ? sample.parentElement : null;
  if (!panelWrapper) return;

  for (const { id } of EXTRA_TABS) {
    if (document.getElementById('ap-' + id)) continue; // already exists
    const panel = document.createElement('div');
    panel.className = 'ap-panel';
    panel.id = 'ap-' + id;
    // Placeholder; Panel controllers render into this on first activation.
    panel.innerHTML = `<div class="panel-placeholder">Yükleniyor…</div>`;
    panelWrapper.appendChild(panel);
  }
}
