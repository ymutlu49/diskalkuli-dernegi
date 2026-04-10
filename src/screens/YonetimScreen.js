import { BaseScreen } from '../core/BaseScreen.js';
import { escapeHtml } from '../core/escapeHtml.js';
import { logger } from '../core/logger.js';
import { ROLE_LABELS, ROLE_COLORS } from '../data/roles.js';
import { LIFECYCLE_STATES } from '../data/user-lifecycle.js';
import { injectAdminPanels } from '../ui/adminPanelInjector.js';
import { IcerikPanel }  from '../admin/IcerikPanel.js';
import { AidatPanel }   from '../admin/AidatPanel.js';
import { DenetimPanel } from '../admin/DenetimPanel.js';
import { RaporPanel }   from '../admin/RaporPanel.js';
import { UyeEditor }    from '../admin/UyeEditor.js';

/**
 * Yönetim (Admin) panel.
 *
 * Hosts four original tabs from the HTML (Özet / Üyeler / Başvurular /
 * Finans / Etkinlikler / YK) and injects four new tabs at runtime:
 *   - İçerik  (CMS)
 *   - Aidat   (dues management)
 *   - Denetim (audit log)
 *   - Rapor   (reports & CSV export)
 *
 * Each injected tab is owned by its own Panel class. YonetimScreen
 * orchestrates: it tells the right panel to `mount()` the first time
 * its tab is activated.
 */
export class YonetimScreen extends BaseScreen {
  init() {
    // Inject the 4 extra tabs + panels before anything else
    injectAdminPanels();

    // Instantiate panel controllers (lazy-mounted on first tab activation)
    this._icerikPanel  = new IcerikPanel(this.ctx);
    this._aidatPanel   = new AidatPanel(this.ctx);
    this._denetimPanel = new DenetimPanel(this.ctx);
    this._raporPanel   = new RaporPanel(this.ctx);
    this._uyeEditor    = new UyeEditor(this.ctx);
    this._mounted = new Set();

    // Expose the editor via ctx.services so other screens can reach it
    this.ctx.services.uyeEditor = this._uyeEditor;

    // Intercept new-admin-tab clicks to mount panels lazily.
    // adminTab() in compat.js handles the class toggling; we just
    // need to call mount() when our panels become visible.
    document.querySelectorAll('#screen-yonetim .ap-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const key = tab.dataset.tab;
        this._maybeMount(key);
      });
    });

    // User list: filters + search
    this.$$('.usr-filter').forEach((f) => {
      f.addEventListener('click', () => {
        this.$$('.usr-filter').forEach((x) => x.classList.remove('on'));
        f.classList.add('on');
        this._renderUsers();
      });
    });
    const search = document.getElementById('usr-search');
    if (search) search.addEventListener('input', () => this._renderUsers());

    // Application list: filters
    this.$$('.bsv-filter').forEach((f) => {
      f.addEventListener('click', () => {
        this.$$('.bsv-filter').forEach((x) => x.classList.remove('on'));
        f.classList.add('on');
        this._renderApps();
      });
    });

    // Live updates
    this.ctx.bus.on('users:changed',        () => this._renderUsers());
    this.ctx.bus.on('applications:changed', () => this._renderApps());

    this._renderOverview();
    this._renderUsers();
    this._renderApps();
  }

  onEnter() {
    this._renderRoleLabel();
    this._renderOverview();
    this._renderUsers();
    this._renderApps();
  }

  _maybeMount(key) {
    if (this._mounted.has(key)) return;
    const map = {
      icerik:  this._icerikPanel,
      aidat:   this._aidatPanel,
      denetim: this._denetimPanel,
      rapor:   this._raporPanel,
    };
    const panel = map[key];
    if (!panel) return;
    try {
      panel.mount();
      this._mounted.add(key);
    } catch (err) {
      logger.error('YonetimScreen', `panel "${key}" mount failed:`, err);
    }
  }

  /* ── Public API for compat shim ─────────────────────────── */

  async openAddUser() {
    await this._uyeEditor.open();
  }

  async openEditUser(id) {
    await this._uyeEditor.open(id);
  }

  _renderRoleLabel() {
    const user = this.ctx.store.get('currentUser');
    if (!user) return;
    const label = document.getElementById('admin-role-label');
    if (!label) return;
    label.textContent = user.superadmin
      ? (user.id === 5 ? 'Denetleme K. Başkanı · Tam Yetkili' : 'YK Başkanı · Tam Yetkili')
      : 'Yönetim Kurulu';
    label.style.background = user.superadmin ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.12)';
  }

  _renderOverview() {
    const el = document.getElementById('activity-list-admin');
    if (!el) return;
    const items = [
      { color: 'var(--green)',     text: 'Yeni üye kaydı: Dr. Fatma Özcan (Konya)',           time: '14 dk önce' },
      { color: 'var(--brown)',     text: 'Bildiri gönderimi: Diskalkuli ve Oyun Temelli Öğrenme', time: '1 saat önce' },
      { color: 'var(--green-mid)', text: 'Eğitime kayıt: YZ Destekli Stratejiler (92 kişi)',  time: '3 saat önce' },
      { color: 'var(--brown-mid)', text: 'Temsilcilik başvurusu: Fatma Şahin — İzmir',         time: '5 saat önce' },
    ];
    el.innerHTML = items.map((a) => `
      <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--gray-100)">
        <div aria-hidden="true" style="width:8px;height:8px;border-radius:50%;background:${escapeHtml(a.color)};margin-top:4px;flex-shrink:0"></div>
        <div>
          <div style="font-size:13px;color:var(--gray-800)">${escapeHtml(a.text)}</div>
          <div style="font-size:11px;color:var(--gray-400);margin-top:1px">${escapeHtml(a.time)}</div>
        </div>
      </div>`).join('');
  }

  _renderUsers() {
    const el = document.getElementById('usr-list');
    if (!el) return;
    const users = this.ctx.services.users;
    const activeFilter = this.$('.usr-filter.on');
    const cat   = activeFilter ? activeFilter.getAttribute('data-cat') || 'tumu' : 'tumu';
    const query = (document.getElementById('usr-search') || {}).value || '';
    const list  = users.search(query, cat);

    if (list.length === 0) {
      el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--gray-400)">Kullanıcı bulunamadı</div>';
      return;
    }

    el.innerHTML = list.map((u) => {
      const color = ROLE_COLORS[u.role] || 'var(--gray-400)';
      const label = ROLE_LABELS[u.role] || u.role;
      const lc    = LIFECYCLE_STATES[u.lifecycle || 'aktif'] || LIFECYCLE_STATES.aktif;
      const initials = escapeHtml(u.initials);
      const name  = escapeHtml(u.name);
      const email = escapeHtml(u.email);
      const meta  = escapeHtml((u.city || '') + (u.kurum ? ' · ' + u.kurum : ''));
      return `
      <div class="usr-card" role="group" aria-label="Kullanıcı: ${name}">
        <div class="usr-av" aria-hidden="true" style="background:${u.active ? escapeHtml(color) : 'var(--gray-300)'}">${initials}</div>
        <div class="usr-info">
          <div class="usr-name">${name}</div>
          <div class="usr-email">${email}</div>
          <div class="usr-meta">${meta}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px">
          <span style="font-size:10px;font-weight:700;background:${escapeHtml(color)}22;color:${escapeHtml(color)};padding:2px 7px;border-radius:999px">${escapeHtml(label)}</span>
          <span style="font-size:9px;font-weight:700;background:${escapeHtml(lc.bg)};color:${escapeHtml(lc.color)};padding:2px 6px;border-radius:999px">${escapeHtml(lc.icon)} ${escapeHtml(lc.label)}</span>
          <div style="display:flex;gap:4px">
            <button type="button" class="usr-action-btn"               data-action="edit"   data-id="${u.id}" aria-label="${name} düzenle" title="Düzenle">✏</button>
            <button type="button" class="usr-action-btn ${u.active ? 'usr-btn-deact' : 'usr-btn-act'}" data-action="toggle" data-id="${u.id}" aria-label="${name} ${u.active ? 'pasifleştir' : 'aktifleştir'}" title="Aktif/Pasif">${u.active ? '⊘' : '✓'}</button>
            <button type="button" class="usr-action-btn usr-btn-del"   data-action="delete" data-id="${u.id}" aria-label="${name} sil" title="Sil">🗑</button>
          </div>
        </div>
      </div>`;
    }).join('');

    // Delegated click handler for admin action buttons
    el.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        const action = btn.dataset.action;
        if (action === 'edit')    return this.openEditUser(id);
        if (action === 'toggle')  return this._toggleUser(id);
        if (action === 'delete')  return this._deleteUser(id);
      });
    });
  }

  _renderApps() {
    const el = document.getElementById('bsv-list');
    if (!el) return;
    const apps = this.ctx.services.applications;
    const activeFilter = this.$('.bsv-filter.on');
    const cat = activeFilter ? activeFilter.getAttribute('data-bcat') || 'tumu' : 'tumu';
    const list = apps.filter(cat);

    const sBg = { bekliyor: '#FEF3C7', kabul: 'var(--green-light)', red: '#FFEBEE' };
    const sTx = { bekliyor: '⏳ Bekliyor', kabul: '✓ Kabul',         red: '✗ Red' };
    const sCl = { bekliyor: '#92400E',    kabul: 'var(--green-dark)', red: 'var(--danger)' };

    if (list.length === 0) {
      el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--gray-400)">Başvuru yok</div>';
    } else {
      el.innerHTML = list.map((a) => {
        const tl = a.type === 'temsilci' ? 'Temsilcilik' : 'Üyelik';
        const name    = escapeHtml(a.name);
        const meslek  = escapeHtml(a.meslek || '');
        const city    = escapeHtml(a.city || '');
        const kurum   = a.kurum ? ' · ' + escapeHtml(a.kurum) : '';
        const email   = escapeHtml(a.email || '');
        const date    = escapeHtml(a.date || '');
        const deneyim = escapeHtml(a.deneyim || '');
        return `
        <article class="bsv-card" aria-label="Başvuru: ${name}">
          <div style="display:flex;gap:6px;margin-bottom:6px">
            <span style="font-size:10px;font-weight:700;background:var(--gray-100);color:var(--gray-600);padding:2px 7px;border-radius:999px">${tl}</span>
            <span style="font-size:10px;font-weight:700;background:${escapeHtml(sBg[a.status])};color:${escapeHtml(sCl[a.status])};padding:2px 7px;border-radius:999px">${escapeHtml(sTx[a.status])}</span>
          </div>
          <div style="font-family:var(--font-d);font-size:14px;font-weight:800;color:var(--green-dark)">${name}</div>
          <div style="font-size:12px;color:var(--gray-400);margin-top:2px">${meslek} · ${city}${kurum}</div>
          <div style="font-size:11px;color:var(--gray-400);margin-top:2px">${email} · ${date}</div>
          ${deneyim ? `<div style="font-size:12px;color:var(--gray-600);margin-top:6px;padding:8px;background:var(--gray-50);border-radius:var(--r-sm)">${deneyim}</div>` : ''}
          ${a.status === 'bekliyor'
            ? `<div style="display:flex;gap:6px;margin-top:10px">
                 <button type="button" class="bsv-btn-kabul" data-action="approve" data-id="${a.id}" aria-label="${name} başvurusunu onayla">✓ Onayla</button>
                 <button type="button" class="bsv-btn-red"   data-action="reject"  data-id="${a.id}" aria-label="${name} başvurusunu reddet">✗ Reddet</button>
               </div>`
            : ''}
        </article>`;
      }).join('');
    }

    const badge = document.getElementById('bsv-bekleyen-count');
    if (badge) badge.textContent = String(apps.pendingCount());

    el.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        const action = btn.dataset.action;
        if (action === 'approve') return this._approveApp(id);
        if (action === 'reject')  return this._rejectApp(id);
      });
    });
  }

  /* ── Action guards ─────────────────────────────────────────── */

  _assertAdmin() {
    if (!this.ctx.services.permissions.isSuperadmin()) {
      this.ctx.services.toast.error('Yetersiz yetki.');
      return false;
    }
    return true;
  }

  _toggleUser(id) {
    if (!this._assertAdmin()) return;
    const u = this.ctx.services.users.toggleActive(id);
    if (u) this.ctx.services.toast.info(u.active ? `✓ ${u.name} aktif` : `⊘ ${u.name} pasif`);
  }

  async _deleteUser(id) {
    if (!this._assertAdmin()) return;
    const u = this.ctx.services.users.findById(id);
    if (!u) return;
    const ok = await this.ctx.services.confirm.ask({
      title: `${u.name} silinsin mi?`,
      message: 'Bu işlem geri alınamaz. Üyeye ait tüm kayıtlar kaybolur.',
      icon: '🗑',
      danger: true,
      confirmLabel: 'Evet, sil',
    });
    if (!ok) return;
    this.ctx.services.users.remove(id);
    this.ctx.services.toast.warning(`${u.name} silindi`);
  }

  async _approveApp(id) {
    if (!this._assertAdmin()) return;
    const a = this.ctx.services.applications.findById(id);
    if (!a) return;
    const note = await this.ctx.services.confirm.prompt({
      title: `Başvuruyu onayla: ${a.name}`,
      message: 'Yönetim Kurulu kararınızla ilgili not ekleyebilirsiniz (isteğe bağlı).',
      placeholder: 'ör: Mesleki tecrübe yeterli, onaylandı.',
      multiline: true,
      confirmLabel: '✓ Onayla',
    });
    if (note == null) return;
    this.ctx.services.applications.approve(id, note);
    this.ctx.services.toast.success(`${a.name} onaylandı`);
  }

  async _rejectApp(id) {
    if (!this._assertAdmin()) return;
    const a = this.ctx.services.applications.findById(id);
    if (!a) return;
    const reason = await this.ctx.services.confirm.prompt({
      title: `Başvuruyu reddet: ${a.name}`,
      message: 'Reddetme gerekçesi (denetim kaydına işlenecek)',
      placeholder: 'Kısa bir açıklama yazın...',
      multiline: true,
      confirmLabel: '✗ Reddet',
    });
    if (reason == null) return;
    this.ctx.services.applications.reject(id, reason);
    this.ctx.services.toast.warning(`${a.name} reddedildi`);
  }
}
