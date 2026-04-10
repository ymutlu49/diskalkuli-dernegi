/**
 * Admin → İçerik (CMS) panel controller.
 *
 * Renders the content library + editor into `#ap-icerik`. The panel
 * has two "views":
 *
 *   1. List view (default):   stats + filter chips + item list
 *   2. Editor view:            full-screen form for create/update
 *
 * The controller has no DOM of its own — it writes into the placeholder
 * div that `adminPanelInjector` created.
 */
import { CONTENT_TYPES, CONTENT_TYPE_LIST, CONTENT_STATUS, CONTENT_STATUS_LIST, CONTENT_CATEGORIES, CONTENT_AUDIENCES } from '../data/content-taxonomy.js';
import { escapeHtml } from '../core/escapeHtml.js';

export class IcerikPanel {
  constructor(ctx) {
    this.ctx = ctx;
    this._root = null;
    this._editingId = null;      // null = create mode, number = edit mode
    this._view = 'list';          // 'list' | 'editor'
    this._filter = { status: 'tumu', type: 'tumu', search: '' };
    this._bound = false;
  }

  mount() {
    this._root = document.getElementById('ap-icerik');
    if (!this._root) return;

    if (!this._bound) {
      // Re-render on content changes (from scheduler or other tabs)
      this.ctx.bus.on('content:changed',  () => this._render());
      this.ctx.bus.on('content:published', (item) => {
        this.ctx.services.toast.success(`Yayınlandı: ${item.title}`);
      });
      this._bound = true;
    }

    this._render();
  }

  /* ── Rendering ────────────────────────────────────────────── */

  _render() {
    if (!this._root) return;
    this._root.innerHTML = this._view === 'editor'
      ? this._renderEditor()
      : this._renderList();
    this._wireEvents();
  }

  _renderList() {
    const svc = this.ctx.services.content;
    const counts = svc.countByStatus();
    const items = this._filteredItems();

    const statItem = (label, value, color) => `
      <div class="cms-stat" style="--c:${color}">
        <div class="cms-stat-num">${value}</div>
        <div class="cms-stat-label">${label}</div>
      </div>`;

    return `
      <div class="cms-panel">
        <!-- Stats -->
        <div class="cms-stats">
          ${statItem('Yayında',     counts.yayinda || 0,     'var(--green-dark)')}
          ${statItem('Taslak',      counts.taslak || 0,      'var(--gray-600)')}
          ${statItem('İncelemede',  counts.inceleme || 0,    '#92400E')}
          ${statItem('Zamanlanmış', counts.zamanlanmis || 0, '#1565C0')}
          ${statItem('Arşiv',       counts.arsiv || 0,       'var(--gray-400)')}
        </div>

        <!-- Toolbar -->
        <div class="cms-toolbar">
          <button class="cms-new-btn" data-action="create-new">
            <span>➕</span> Yeni İçerik
          </button>
          <input type="search" class="cms-search" placeholder="🔍 İçerik ara..."
                 value="${escapeHtml(this._filter.search)}" data-action="search">
        </div>

        <!-- Status filter chips -->
        <div class="cms-chip-row">
          <div class="cms-chip${this._filter.status === 'tumu' ? ' on' : ''}" data-action="filter-status" data-val="tumu">Tümü</div>
          ${CONTENT_STATUS_LIST.map((s) => `
            <div class="cms-chip${this._filter.status === s.key ? ' on' : ''}"
                 data-action="filter-status" data-val="${s.key}"
                 style="--chip-c:${s.color};--chip-bg:${s.bg}">
              ${s.icon} ${s.label}
            </div>`).join('')}
        </div>

        <!-- Type filter chips -->
        <div class="cms-chip-row">
          <div class="cms-chip${this._filter.type === 'tumu' ? ' on' : ''}" data-action="filter-type" data-val="tumu">Tür: Tümü</div>
          ${CONTENT_TYPE_LIST.map((t) => `
            <div class="cms-chip${this._filter.type === t.key ? ' on' : ''}"
                 data-action="filter-type" data-val="${t.key}">
              ${t.icon} ${t.label}
            </div>`).join('')}
        </div>

        <!-- Item list -->
        <div class="cms-list">
          ${items.length === 0
            ? '<div class="cms-empty">📭 Hiç içerik bulunamadı.</div>'
            : items.map((item) => this._renderItemRow(item)).join('')}
        </div>
      </div>`;
  }

  _renderItemRow(item) {
    const type   = CONTENT_TYPES[item.type]   || {};
    const status = CONTENT_STATUS[item.status] || {};
    const date   = this._formatDate(item.updatedAt);
    const scheduledInfo = item.status === 'zamanlanmis' && item.scheduledAt
      ? ` · ${this._formatDate(item.scheduledAt)} için zamanlandı`
      : '';

    const actions = this._actionsFor(item);
    return `
      <div class="cms-row" data-id="${item.id}">
        <div class="cms-row-head">
          <span class="cms-type-badge" style="background:${type.bg};color:${type.color}">${type.icon} ${type.label}</span>
          <span class="cms-status-badge" style="background:${status.bg};color:${status.color}">${status.icon} ${status.label}</span>
        </div>
        <div class="cms-row-title">${escapeHtml(item.title)}</div>
        <div class="cms-row-meta">
          ${escapeHtml(item.authorName)} · ${date} · ${item.views} görüntülenme${scheduledInfo}
        </div>
        ${item.excerpt
          ? `<div class="cms-row-excerpt">${escapeHtml(item.excerpt)}</div>`
          : ''}
        ${actions.length
          ? `<div class="cms-row-actions">${actions.join('')}</div>`
          : ''}
      </div>`;
  }

  _actionsFor(item) {
    const perms = this.ctx.services.permissions;
    const isSuper = perms.isSuperadmin();
    const actions = [];

    actions.push(`<button class="cms-btn cms-btn-edit" data-action="edit" data-id="${item.id}">✏ Düzenle</button>`);

    if (item.status === 'taslak') {
      actions.push(`<button class="cms-btn cms-btn-review" data-action="submit" data-id="${item.id}">👁 İncelemeye Gönder</button>`);
      if (isSuper) {
        actions.push(`<button class="cms-btn cms-btn-publish" data-action="publish" data-id="${item.id}">🚀 Yayınla</button>`);
      }
    } else if (item.status === 'inceleme' && isSuper) {
      actions.push(`<button class="cms-btn cms-btn-publish" data-action="publish" data-id="${item.id}">✓ Onayla & Yayınla</button>`);
      actions.push(`<button class="cms-btn cms-btn-reject"  data-action="reject"  data-id="${item.id}">↺ Reddet</button>`);
    } else if (item.status === 'zamanlanmis' && isSuper) {
      actions.push(`<button class="cms-btn cms-btn-publish" data-action="publish-now" data-id="${item.id}">🚀 Şimdi Yayınla</button>`);
      actions.push(`<button class="cms-btn cms-btn-reject"  data-action="unpublish"   data-id="${item.id}">⏸ İptal</button>`);
    } else if (item.status === 'yayinda' && isSuper) {
      actions.push(`<button class="cms-btn" data-action="unpublish" data-id="${item.id}">⏸ Yayından Kaldır</button>`);
      actions.push(`<button class="cms-btn" data-action="archive"   data-id="${item.id}">📦 Arşivle</button>`);
    } else if (item.status === 'arsiv' && isSuper) {
      actions.push(`<button class="cms-btn" data-action="restore" data-id="${item.id}">♻ Geri Al</button>`);
    }

    if (item.status === 'taslak' && isSuper) {
      actions.push(`<button class="cms-btn cms-btn-danger" data-action="delete" data-id="${item.id}">🗑 Sil</button>`);
    }
    return actions;
  }

  /* ── Editor view ─────────────────────────────────────────── */

  _renderEditor() {
    const svc = this.ctx.services.content;
    const item = this._editingId ? svc.findById(this._editingId) : null;

    // Values default to existing item or empty draft
    const v = item || { type: 'haber', title: '', body: '', excerpt: '', category: 'Genel', tags: [], audience: 'all' };
    const isEdit = !!item;

    return `
      <div class="cms-editor">
        <div class="cms-editor-head">
          <button class="cms-back-btn" data-action="back-to-list">← Geri</button>
          <div class="cms-editor-title">${isEdit ? 'İçerik Düzenle' : 'Yeni İçerik'}</div>
        </div>

        <div class="cms-form-card">
          <!-- Type selector -->
          <div class="cms-field">
            <label>İçerik Türü</label>
            <div class="cms-type-row">
              ${CONTENT_TYPE_LIST.map((t) => `
                <button type="button" class="cms-type-btn${v.type === t.key ? ' on' : ''}"
                        data-action="set-type" data-val="${t.key}">
                  ${t.icon} ${t.label}
                </button>`).join('')}
            </div>
          </div>

          <!-- Title -->
          <div class="cms-field">
            <label>Başlık <span class="cms-req">*</span></label>
            <input type="text" id="cms-ed-title" value="${escapeHtml(v.title)}" class="cms-input" placeholder="Başlık yazın..." maxlength="120">
            <div class="form-error-title cms-error"></div>
          </div>

          <!-- Excerpt -->
          <div class="cms-field">
            <label>Kısa Özet</label>
            <input type="text" id="cms-ed-excerpt" value="${escapeHtml(v.excerpt)}" class="cms-input" placeholder="Listelerde görünecek kısa özet..." maxlength="200">
          </div>

          <!-- Body -->
          <div class="cms-field">
            <label>İçerik <span class="cms-req">*</span></label>
            <textarea id="cms-ed-body" class="cms-input cms-textarea" rows="8" placeholder="İçeriği buraya yazın...">${escapeHtml(v.body)}</textarea>
            <div class="form-error-body cms-error"></div>
          </div>

          <!-- Category & Audience -->
          <div class="cms-field-row">
            <div class="cms-field">
              <label>Kategori</label>
              <select id="cms-ed-category" class="cms-input cms-select">
                ${CONTENT_CATEGORIES.map((c) =>
                  `<option${c === v.category ? ' selected' : ''}>${c}</option>`
                ).join('')}
              </select>
            </div>
            <div class="cms-field">
              <label>Hedef Kitle</label>
              <select id="cms-ed-audience" class="cms-input cms-select">
                ${Object.values(CONTENT_AUDIENCES).map((a) =>
                  `<option value="${a.key}"${a.key === v.audience ? ' selected' : ''}>${a.label}</option>`
                ).join('')}
              </select>
            </div>
          </div>

          <!-- Tags -->
          <div class="cms-field">
            <label>Etiketler (virgülle ayırın)</label>
            <input type="text" id="cms-ed-tags" value="${escapeHtml((v.tags || []).join(', '))}" class="cms-input" placeholder="ör: kongre, eğitim, 2026">
          </div>

          <!-- Schedule -->
          <div class="cms-field">
            <label>Yayın Zamanı (isteğe bağlı)</label>
            <input type="datetime-local" id="cms-ed-schedule" class="cms-input">
            <div class="cms-hint">Boş bırakılırsa "Yayınla" basıldığında anında yayınlanır.</div>
          </div>

          <!-- Actions -->
          <div class="cms-actions-row">
            <button type="button" class="cms-btn" data-action="save-draft">💾 Taslak Kaydet</button>
            ${this.ctx.services.permissions.isSuperadmin()
              ? `<button type="button" class="cms-btn cms-btn-publish" data-action="save-and-publish">🚀 Yayınla</button>`
              : `<button type="button" class="cms-btn cms-btn-review" data-action="save-and-submit">👁 İncelemeye Gönder</button>`}
          </div>
        </div>
      </div>`;
  }

  /* ── Event wiring ─────────────────────────────────────────── */

  _wireEvents() {
    this._root.querySelectorAll('[data-action]').forEach((el) => {
      const action = el.dataset.action;
      const handler = this._actionHandlers[action];
      if (!handler) return;

      if (action === 'search') {
        el.addEventListener('input', (e) => handler.call(this, e, el));
      } else {
        el.addEventListener('click', (e) => handler.call(this, e, el));
      }
    });
  }

  // Map of action name → handler method
  get _actionHandlers() {
    return {
      'create-new':        this._handleCreateNew,
      'back-to-list':      this._handleBackToList,
      'filter-status':     this._handleFilterStatus,
      'filter-type':       this._handleFilterType,
      'search':            this._handleSearch,
      'edit':              this._handleEdit,
      'submit':            this._handleSubmit,
      'publish':           this._handlePublish,
      'publish-now':       this._handlePublish,
      'reject':            this._handleReject,
      'unpublish':         this._handleUnpublish,
      'archive':           this._handleArchive,
      'restore':           this._handleRestore,
      'delete':            this._handleDelete,
      'set-type':          this._handleSetType,
      'save-draft':        this._handleSaveDraft,
      'save-and-publish':  this._handleSaveAndPublish,
      'save-and-submit':   this._handleSaveAndSubmit,
    };
  }

  /* ── Action handlers ─────────────────────────────────────── */

  _handleCreateNew() {
    this._editingId = null;
    this._view = 'editor';
    this._render();
  }

  _handleBackToList() {
    this._editingId = null;
    this._view = 'list';
    this._render();
  }

  _handleFilterStatus(_e, el) {
    this._filter.status = el.dataset.val;
    this._render();
  }

  _handleFilterType(_e, el) {
    this._filter.type = el.dataset.val;
    this._render();
  }

  _handleSearch(_e, el) {
    this._filter.search = el.value;
    // Live filter — re-render just the list, not the whole panel,
    // otherwise we'd blow away the input focus.
    const list = this._root.querySelector('.cms-list');
    if (list) {
      const items = this._filteredItems();
      list.innerHTML = items.length === 0
        ? '<div class="cms-empty">📭 Hiç içerik bulunamadı.</div>'
        : items.map((item) => this._renderItemRow(item)).join('');
      list.querySelectorAll('[data-action]').forEach((b) => {
        const act = b.dataset.action;
        const handler = this._actionHandlers[act];
        if (handler) b.addEventListener('click', (e) => handler.call(this, e, b));
      });
    }
  }

  _handleEdit(_e, el) {
    this._editingId = Number(el.dataset.id);
    this._view = 'editor';
    this._render();
  }

  _handleSetType(_e, el) {
    this._root.querySelectorAll('.cms-type-btn').forEach((b) => b.classList.remove('on'));
    el.classList.add('on');
    el.dataset.selected = '1';
  }

  async _handleSubmit(_e, el) {
    const id = Number(el.dataset.id);
    try {
      this.ctx.services.content.submitForReview(id);
      this.ctx.services.toast.info('İnceleme kuyruğuna eklendi.');
    } catch (err) {
      this.ctx.services.toast.error(err.message);
    }
  }

  async _handlePublish(_e, el) {
    const id = Number(el.dataset.id);
    const ok = await this.ctx.services.confirm.ask({
      title: 'Yayınlamak istediğinize emin misiniz?',
      message: 'İçerik tüm hedef kitleye anında gönderilecek.',
      icon: '🚀',
      confirmLabel: 'Yayınla',
    });
    if (!ok) return;
    try {
      this.ctx.services.content.publishNow(id);
      this.ctx.services.toast.success('Yayınlandı ✓');
    } catch (err) {
      this.ctx.services.toast.error(err.message);
    }
  }

  async _handleReject(_e, el) {
    const id = Number(el.dataset.id);
    const reason = await this.ctx.services.confirm.prompt({
      title: 'Reddetme gerekçesi',
      message: 'Yazar bu notu görecek.',
      placeholder: 'Kısa bir açıklama yazın...',
      multiline: true,
    });
    if (reason == null) return;
    try {
      this.ctx.services.content.reject(id, reason);
      this.ctx.services.toast.warning('Taslağa geri gönderildi.');
    } catch (err) {
      this.ctx.services.toast.error(err.message);
    }
  }

  async _handleUnpublish(_e, el) {
    const id = Number(el.dataset.id);
    const ok = await this.ctx.services.confirm.ask({
      title: 'Yayından kaldır',
      message: 'İçerik taslaklara geri taşınacak.',
      icon: '⏸',
    });
    if (!ok) return;
    try {
      this.ctx.services.content.unpublish(id);
      this.ctx.services.toast.info('Yayından kaldırıldı.');
    } catch (err) { this.ctx.services.toast.error(err.message); }
  }

  async _handleArchive(_e, el) {
    const id = Number(el.dataset.id);
    const ok = await this.ctx.services.confirm.ask({
      title: 'Arşivle',
      message: 'İçerik arşive taşınacak. Geri alınabilir.',
      icon: '📦',
    });
    if (!ok) return;
    try {
      this.ctx.services.content.archive(id);
      this.ctx.services.toast.info('Arşivlendi.');
    } catch (err) { this.ctx.services.toast.error(err.message); }
  }

  _handleRestore(_e, el) {
    const id = Number(el.dataset.id);
    try {
      this.ctx.services.content.restore(id);
      this.ctx.services.toast.success('Taslağa geri alındı.');
    } catch (err) { this.ctx.services.toast.error(err.message); }
  }

  async _handleDelete(_e, el) {
    const id = Number(el.dataset.id);
    const ok = await this.ctx.services.confirm.ask({
      title: 'Kalıcı olarak silinsin mi?',
      message: 'Bu işlem geri alınamaz.',
      icon: '🗑',
      danger: true,
      confirmLabel: 'Evet, sil',
    });
    if (!ok) return;
    try {
      this.ctx.services.content.remove(id);
      this.ctx.services.toast.warning('Silindi.');
    } catch (err) { this.ctx.services.toast.error(err.message); }
  }

  /* ── Editor save handlers ──────────────────────────────── */

  _collectEditorValues() {
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value : '';
    };
    const selectedType = this._root.querySelector('.cms-type-btn.on')?.dataset.val || 'haber';
    const tagsRaw = getVal('cms-ed-tags');
    const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
    const scheduleRaw = getVal('cms-ed-schedule');
    const scheduleAt = scheduleRaw ? new Date(scheduleRaw).getTime() : null;

    return {
      type:     selectedType,
      title:    getVal('cms-ed-title').trim(),
      excerpt:  getVal('cms-ed-excerpt').trim(),
      body:     getVal('cms-ed-body').trim(),
      category: getVal('cms-ed-category'),
      audience: getVal('cms-ed-audience'),
      tags,
      scheduleAt,
    };
  }

  _validateEditor(values) {
    if (!values.title) { this.ctx.services.toast.error('Başlık zorunlu.'); return false; }
    if (!values.body)  { this.ctx.services.toast.error('İçerik boş olamaz.'); return false; }
    return true;
  }

  _saveOrCreate(values) {
    const svc = this.ctx.services.content;
    if (this._editingId) {
      return svc.update(this._editingId, values);
    }
    return svc.create(values);
  }

  _handleSaveDraft() {
    const v = this._collectEditorValues();
    if (!this._validateEditor(v)) return;
    this._saveOrCreate(v);
    this.ctx.services.toast.success('Taslak kaydedildi ✓');
    this._view = 'list';
    this._editingId = null;
    this._render();
  }

  async _handleSaveAndPublish() {
    const v = this._collectEditorValues();
    if (!this._validateEditor(v)) return;
    const item = this._saveOrCreate(v);
    try {
      if (v.scheduleAt && v.scheduleAt > Date.now()) {
        this.ctx.services.content.schedule(item.id, v.scheduleAt);
        this.ctx.services.toast.info('Zamanlandı ⏰');
      } else {
        this.ctx.services.content.publishNow(item.id);
        this.ctx.services.toast.success('Yayınlandı 🚀');
      }
    } catch (err) {
      this.ctx.services.toast.error(err.message);
      return;
    }
    this._view = 'list';
    this._editingId = null;
    this._render();
  }

  _handleSaveAndSubmit() {
    const v = this._collectEditorValues();
    if (!this._validateEditor(v)) return;
    const item = this._saveOrCreate(v);
    try {
      this.ctx.services.content.submitForReview(item.id);
      this.ctx.services.toast.info('İncelemeye gönderildi 👁');
    } catch (err) {
      this.ctx.services.toast.error(err.message);
      return;
    }
    this._view = 'list';
    this._editingId = null;
    this._render();
  }

  /* ── Helpers ──────────────────────────────────────────────── */

  _filteredItems() {
    return this.ctx.services.content.list({
      status: this._filter.status === 'tumu' ? undefined : this._filter.status,
      type:   this._filter.type   === 'tumu' ? undefined : this._filter.type,
      search: this._filter.search || undefined,
    });
  }

  _formatDate(ms) {
    if (!ms) return '—';
    const d = new Date(ms);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

}
