/**
 * Admin → Rapor (Reports) panel.
 *
 * Overview charts + CSV export. Deliberately text-heavy rather than
 * pushing in a charting library for the sake of a preview dataset.
 */
import { formatCurrency } from '../core/format.js';

export class RaporPanel {
  constructor(ctx) {
    this.ctx = ctx;
    this._root = null;
    this._bound = false;
  }

  mount() {
    this._root = document.getElementById('ap-rapor');
    if (!this._root) return;
    if (!this._bound) {
      this.ctx.bus.on('users:changed',        () => this._render());
      this.ctx.bus.on('dues:changed',         () => this._render());
      this.ctx.bus.on('content:changed',      () => this._render());
      this.ctx.bus.on('applications:changed', () => this._render());
      this._bound = true;
    }
    this._render();
  }

  _render() {
    if (!this._root) return;
    const users = this.ctx.services.users.summary();
    const dues  = this.ctx.services.dues.summary({ year: new Date().getFullYear() });
    const content = this.ctx.services.content.countByStatus();
    const apps = this.ctx.services.applications.list();
    const pendingApps = apps.filter((a) => a.status === 'bekliyor').length;

    const barChart = (label, value, total, color) => {
      const pct = total > 0 ? Math.round((value / total) * 100) : 0;
      return `
        <div class="rp-bar-row">
          <div class="rp-bar-label">${label}</div>
          <div class="rp-bar-track">
            <div class="rp-bar-fill" style="width:${pct}%;background:${color}"></div>
          </div>
          <div class="rp-bar-val">${value}</div>
        </div>`;
    };

    this._root.innerHTML = `
      <div class="rapor-panel">
        <!-- Üyelik -->
        <div class="rp-card">
          <div class="rp-card-title">👥 Üyelik Dağılımı</div>
          ${barChart('Yönetim Kurulu', users.byRole.yonetim,   users.total, 'var(--green-dark)')}
          ${barChart('İl Temsilcisi',  users.byRole.temsilci,  users.total, 'var(--brown)')}
          ${barChart('Dernek Üyesi',   users.byRole.uye,       users.total, 'var(--green-mid)')}
          <div class="rp-card-footer">Toplam ${users.total} kayıt</div>
        </div>

        <div class="rp-card">
          <div class="rp-card-title">📊 Üye Yaşam Döngüsü</div>
          ${barChart('Aktif',    users.byLifecycle.aktif,    users.total, 'var(--green)')}
          ${barChart('Askıda',   users.byLifecycle.askida,   users.total, '#F59E0B')}
          ${barChart('Pasif',    users.byLifecycle.pasif,    users.total, 'var(--gray-400)')}
          ${barChart('Ayrıldı',  users.byLifecycle.ayrildi,  users.total, 'var(--danger)')}
        </div>

        <!-- Aidat -->
        <div class="rp-card">
          <div class="rp-card-title">💰 ${dues.year} Aidat Durumu</div>
          <div class="rp-metric-grid">
            <div class="rp-metric">
              <div class="rp-metric-num">${formatCurrency(dues.collected)}</div>
              <div class="rp-metric-label">Tahsil Edilen</div>
            </div>
            <div class="rp-metric">
              <div class="rp-metric-num" style="color:var(--danger)">${formatCurrency(dues.outstanding)}</div>
              <div class="rp-metric-label">Bekleyen</div>
            </div>
          </div>
          ${barChart('Ödeyen',    dues.paidCount,   dues.total, 'var(--green-dark)')}
          ${barChart('Bekleyen',  dues.unpaidCount, dues.total, 'var(--danger)')}
        </div>

        <!-- İçerik -->
        <div class="rp-card">
          <div class="rp-card-title">📝 İçerik Durumu</div>
          <div class="rp-metric-grid" style="grid-template-columns:repeat(5,1fr);gap:6px">
            <div class="rp-mini"><div class="rp-mini-num">${content.yayinda || 0}</div><div class="rp-mini-label">Yayında</div></div>
            <div class="rp-mini"><div class="rp-mini-num">${content.taslak || 0}</div><div class="rp-mini-label">Taslak</div></div>
            <div class="rp-mini"><div class="rp-mini-num">${content.inceleme || 0}</div><div class="rp-mini-label">İnceleme</div></div>
            <div class="rp-mini"><div class="rp-mini-num">${content.zamanlanmis || 0}</div><div class="rp-mini-label">Planlı</div></div>
            <div class="rp-mini"><div class="rp-mini-num">${content.arsiv || 0}</div><div class="rp-mini-label">Arşiv</div></div>
          </div>
        </div>

        <!-- Başvurular -->
        <div class="rp-card">
          <div class="rp-card-title">📥 Başvurular</div>
          <div class="rp-big-num">${pendingApps}</div>
          <div class="rp-card-footer">Bekleyen karar</div>
        </div>

        <!-- Export -->
        <div class="rp-card">
          <div class="rp-card-title">📤 Dışa Aktar</div>
          <button class="rp-export-btn" data-action="export-users">👥 Üye Listesi (CSV)</button>
        </div>
      </div>
    `;
    this._wireEvents();
  }

  _wireEvents() {
    const btn = this._root.querySelector('[data-action="export-users"]');
    if (btn) btn.addEventListener('click', () => this._exportUsers());
  }

  _exportUsers() {
    const csv = this.ctx.services.users.exportCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diskalkuli-uyeler-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    this.ctx.services.toast.success('CSV indirildi ✓');
  }

}
