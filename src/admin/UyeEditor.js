/**
 * Member editor modal.
 *
 * A reusable overlay for "Yeni Üye Ekle" and "Üye Düzenle" flows.
 * Uses the ConfirmService-style backdrop but with a scrolling
 * multi-field form.  Validation is done via ValidationService.
 *
 * Usage:
 *   const u = await uyeEditor.open();              // create
 *   const u = await uyeEditor.open(existingUserId); // edit
 *
 * Accessibility:
 *   • role="dialog" + aria-modal + aria-labelledby
 *   • Escape closes, focus restored on close
 *   • Backdrop click closes
 *   • Fields paint aria-invalid / aria-describedby via ValidationService
 */
import { RULES, validateForm, collectValues, paintErrors, focusFirstError } from '../services/ValidationService.js';
import { LIFECYCLE_LIST } from '../data/user-lifecycle.js';
import { escapeHtml } from '../core/escapeHtml.js';
import { logger } from '../core/logger.js';

/** Map of form field → input id. Reused by validation and paint. */
const FIELD_MAP = {
  name:      'ue-name',
  email:     'ue-email',
  phone:     'ue-phone',
  tc:        'ue-tc',
  role:      'ue-role',
  lifecycle: 'ue-lifecycle',
  city:      'ue-city',
  kurum:     'ue-kurum',
  notes:     'ue-notes',
};

export class UyeEditor {
  constructor(ctx) {
    this.ctx = ctx;
    this._overlay = null;
    this._lastFocused = null;
    this._keydownHandler = null;
  }

  /**
   * @param {number|null} [userId]  edit existing user when provided
   * @returns {Promise<object|null>} the resulting user, or null on cancel
   */
  open(userId = null) {
    // Permission check — only superadmins may edit members.
    if (!this.ctx.services.permissions.isSuperadmin()) {
      this.ctx.services.toast.error('Yetersiz yetki.');
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      const users = this.ctx.services.users;
      const existing = userId ? users.findById(userId) : null;
      this._render(existing);
      this._bind(resolve, existing);
      this._show();
    });
  }

  /* ── Rendering ───────────────────────────────────────────── */

  _render(u) {
    this._ensureOverlay();
    const isEdit = !!u;
    const values = u || {
      name: '', email: '', phone: '', role: 'uye',
      city: '', kurum: '', tc: '', notes: '', lifecycle: 'aktif',
    };

    // Shell is static HTML, user values pass through escapeHtml.
    this._overlay.querySelector('.ue-sheet').innerHTML = `
      <div class="ue-head">
        <h2 class="ue-title" id="ue-title">${isEdit ? '✏ Üye Düzenle' : '➕ Yeni Üye Ekle'}</h2>
        <button type="button" class="ue-close" data-action="close" aria-label="Kapat">✗</button>
      </div>
      <div class="ue-body">
        <div class="ue-field">
          <label for="ue-name">Ad Soyad <span class="ue-req" aria-hidden="true">*</span></label>
          <input type="text" id="ue-name" value="${escapeHtml(values.name)}" placeholder="ör: Dr. Ali Veli" required autocomplete="name">
          <div class="form-error-name ue-error"></div>
        </div>

        <div class="ue-field">
          <label for="ue-email">E-posta <span class="ue-req" aria-hidden="true">*</span></label>
          <input type="email" id="ue-email" value="${escapeHtml(values.email)}" placeholder="ornek@mail.com" inputmode="email" autocomplete="email" required>
          <div class="form-error-email ue-error"></div>
        </div>

        <div class="ue-field-row">
          <div class="ue-field">
            <label for="ue-phone">Telefon</label>
            <input type="tel" id="ue-phone" value="${escapeHtml(values.phone || '')}" placeholder="+90 5__ ___ __ __" inputmode="tel" autocomplete="tel">
            <div class="form-error-phone ue-error"></div>
          </div>
          <div class="ue-field">
            <label for="ue-tc">TC Kimlik No</label>
            <input type="text" id="ue-tc" value="${escapeHtml(values.tc || '')}" placeholder="11 hane" inputmode="numeric" maxlength="11" autocomplete="off">
            <div class="form-error-tc ue-error"></div>
          </div>
        </div>

        <div class="ue-field-row">
          <div class="ue-field">
            <label for="ue-role">Rol</label>
            <select id="ue-role">
              <option value="yonetim"${values.role === 'yonetim' ? ' selected' : ''}>YK Üyesi (superadmin)</option>
              <option value="temsilci"${values.role === 'temsilci' ? ' selected' : ''}>İl Temsilcisi</option>
              <option value="uye"${values.role === 'uye' ? ' selected' : ''}>Dernek Üyesi</option>
              <option value="genel"${values.role === 'genel' ? ' selected' : ''}>Genel Ziyaretçi</option>
            </select>
          </div>
          <div class="ue-field">
            <label for="ue-lifecycle">Durum</label>
            <select id="ue-lifecycle">
              ${LIFECYCLE_LIST.map((s) =>
                `<option value="${escapeHtml(s.key)}"${(values.lifecycle || 'aktif') === s.key ? ' selected' : ''}>${escapeHtml(s.icon)} ${escapeHtml(s.label)}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <div class="ue-field-row">
          <div class="ue-field">
            <label for="ue-city">Şehir</label>
            <input type="text" id="ue-city" value="${escapeHtml(values.city || '')}" placeholder="İl" autocomplete="address-level1">
          </div>
          <div class="ue-field">
            <label for="ue-kurum">Kurum</label>
            <input type="text" id="ue-kurum" value="${escapeHtml(values.kurum || '')}" placeholder="Okul / Üniversite" autocomplete="organization">
          </div>
        </div>

        <div class="ue-field">
          <label for="ue-notes">Notlar</label>
          <textarea id="ue-notes" rows="2" placeholder="Dahili notlar (üye görmez)">${escapeHtml(values.notes || '')}</textarea>
        </div>

        ${isEdit ? '' : `
        <div class="ue-kvkk">
          <label class="ue-checkbox-row">
            <input type="checkbox" id="ue-kvkk" checked>
            <span>KVKK aydınlatma metnini üyeye iletildi olarak işaretle</span>
          </label>
        </div>`}
      </div>
      <div class="ue-actions">
        <button type="button" class="ue-btn ue-btn-cancel" data-action="close">İptal</button>
        <button type="button" class="ue-btn ue-btn-save"   data-action="save">${isEdit ? '💾 Güncelle' : '✓ Ekle'}</button>
      </div>
    `;
  }

  _bind(resolve, existing) {
    const o = this._overlay;
    const close = () => { this._hide(); resolve(null); };
    const save  = () => this._handleSave(existing, resolve);

    o.querySelectorAll('[data-action="close"]').forEach((el) =>
      el.addEventListener('click', close)
    );
    const saveBtn = o.querySelector('[data-action="save"]');
    if (saveBtn) saveBtn.addEventListener('click', save);

    // Backdrop click closes
    o.addEventListener('click', (e) => {
      if (e.target === o) close();
    });

    // Global Escape + basic focus trap while open
    this._keydownHandler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'Tab') {
        const focusables = Array.from(
          o.querySelectorAll('input, textarea, select, button:not([disabled])')
        ).filter((n) => n.offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last  = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', this._keydownHandler, true);

    // Focus the first field.
    setTimeout(() => {
      const input = document.getElementById('ue-name');
      if (input) input.focus();
    }, 60);
  }

  _handleSave(existing, resolve) {
    const values = collectValues({
      name:      'ue-name',
      email:     'ue-email',
      phone:     'ue-phone',
      tc:        'ue-tc',
      role:      'ue-role',
      lifecycle: 'ue-lifecycle',
      city:      'ue-city',
      kurum:     'ue-kurum',
      notes:     'ue-notes',
    });

    // Validation rules
    const { valid, errors } = validateForm(values, {
      name:  [RULES.required(), RULES.minLength(3)],
      email: [RULES.required(), RULES.email()],
      phone: [RULES.phoneTR('Telefon geçersiz (zorunlu değil).')],
      tc:    [RULES.tcKimlik()],
    });
    paintErrors(errors, FIELD_MAP);
    if (!valid) {
      focusFirstError(errors, FIELD_MAP);
      return;
    }

    // Uniqueness (create mode)
    const users = this.ctx.services.users;
    if (!existing) {
      if (users.findByEmail(values.email)) {
        paintErrors({ email: 'Bu e-posta zaten kayıtlı.' }, FIELD_MAP);
        focusFirstError({ email: 'x' }, FIELD_MAP);
        return;
      }
    }

    try {
      let user;
      if (existing) {
        user = users.update(existing.id, values);
        this.ctx.services.toast.success('Güncellendi ✓');
      } else {
        user = users.create(values);
        // Honour the lifecycle dropdown even for new users
        if (values.lifecycle && values.lifecycle !== 'aktif') {
          users.changeLifecycle(user.id, values.lifecycle);
        }
        this.ctx.services.toast.success(`${user.name} eklendi ✓`);
      }
      this._hide();
      resolve(user);
    } catch (err) {
      logger.error('UyeEditor', 'save failed', err);
      this.ctx.services.toast.error(err.message);
    }
  }

  /* ── Overlay plumbing ────────────────────────────────────── */

  _ensureOverlay() {
    if (this._overlay) return;
    const el = document.createElement('div');
    el.className = 'ue-overlay';
    el.innerHTML = `<div class="ue-sheet" role="dialog" aria-modal="true" aria-labelledby="ue-title"></div>`;
    document.body.appendChild(el);
    this._overlay = el;
  }

  _show() {
    this._lastFocused = document.activeElement;
    this._overlay.classList.add('open');
    const app = document.getElementById('app');
    if (app) app.setAttribute('aria-hidden', 'true');
  }

  _hide() {
    this._overlay.classList.remove('open');
    const app = document.getElementById('app');
    if (app) app.removeAttribute('aria-hidden');
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler, true);
      this._keydownHandler = null;
    }
    if (this._lastFocused && typeof this._lastFocused.focus === 'function') {
      try { this._lastFocused.focus(); } catch { /* ignore */ }
    }
    this._lastFocused = null;
  }
}
