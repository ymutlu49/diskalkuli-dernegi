import { BaseScreen } from '../core/BaseScreen.js';

/**
 * ICMLD IV congress screen — live countdown, tabbed sections,
 * abstract submission form, registration form.
 */
export class KongreScreen extends BaseScreen {
  constructor(id, ctx) {
    super(id, ctx);
    /** @type {number|null} interval handle for the countdown */
    this._countdownTimer = null;
    this._target = new Date('2026-10-01T09:00:00');
  }

  init() {
    // The countdown is seeded here; tab / day buttons now delegate
    // to this controller, so compat.js shims remain as no-op BC.
    this._tick();

    if (this.el) {
      this.delegate('click', '.kng-tab',     (_e, el) => this._switchTab(el));
      this.delegate('click', '.kng-day-btn', (_e, el) => this._switchDay(el));
      this.delegate('keydown', '.kng-tab, .kng-day-btn', (e, el) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (el.classList.contains('kng-tab')) this._switchTab(el);
          else this._switchDay(el);
        }
      });

      // Make tabs keyboard-accessible
      this.$$('.kng-tab, .kng-day-btn').forEach((el) => {
        if (!el.hasAttribute('role'))     el.setAttribute('role', 'tab');
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      });
    }
  }

  _switchTab(el) {
    const panel = el.getAttribute('data-panel') || el.dataset.panel;
    if (!panel) return;
    this.$$('.kng-tab').forEach((t) => {
      const on = t === el;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    this.$$('.kng-panel').forEach((p) => p.classList.remove('active'));
    const pan = document.getElementById('kng-' + panel);
    if (pan) pan.classList.add('active');
  }

  _switchDay(el) {
    const day = el.getAttribute('data-day') || el.dataset.day;
    if (!day) return;
    this.$$('.kng-day-btn').forEach((b) => {
      const on = b === el;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    this.$$('.kng-day-panel').forEach((p) => p.classList.remove('active'));
    const pan = document.getElementById('kng-day-' + day);
    if (pan) pan.classList.add('active');
  }

  onEnter() {
    if (this._countdownTimer == null) {
      this._countdownTimer = setInterval(() => this._tick(), 1000);
    }
  }

  onLeave() {
    if (this._countdownTimer != null) {
      clearInterval(this._countdownTimer);
      this._countdownTimer = null;
    }
  }

  _tick() {
    const diff = this._target - new Date();
    if (diff <= 0) return;
    const g = (id) => document.getElementById(id);
    const days = Math.floor(diff / 86400000);
    const hrs  = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (g('cd-g'))  g('cd-g').textContent  = days;
    if (g('cd-s'))  g('cd-s').textContent  = String(hrs).padStart(2, '0');
    if (g('cd-d'))  g('cd-d').textContent  = String(mins).padStart(2, '0');
    if (g('cd-sn')) g('cd-sn').textContent = String(secs).padStart(2, '0');
  }

  _submitBildiri() {
    const baslik = document.getElementById('bld-baslik');
    const yazar  = document.getElementById('bld-yazar');
    const ozet   = document.getElementById('bld-ozet');
    const errEl  = document.getElementById('bld-error');
    const toast  = this.ctx.services.toast;

    const fail = (msg) => {
      if (errEl) { errEl.textContent = '⚠ ' + msg; errEl.style.display = 'block'; }
    };
    if (!baslik || !baslik.value.trim()) return fail('Bildiri başlığı gerekli.');
    if (!yazar  || !yazar.value.trim())  return fail('Yazar bilgisi gerekli.');
    if (!ozet   || !ozet.value.trim())   return fail('Özet gerekli.');
    if (errEl) errEl.style.display = 'none';

    const btn = document.querySelector('#kng-bildiri .cm-publish-btn');
    if (btn) { btn.textContent = 'Gönderiliyor...'; btn.disabled = true; }
    setTimeout(() => {
      if (btn) { btn.textContent = '📨 Bildiri Gönder'; btn.disabled = false; }
      if (baslik) baslik.value = '';
      if (yazar)  yazar.value  = '';
      if (ozet)   ozet.value   = '';
      toast.show('✓ Bildiriniz başarıyla iletildi!');
    }, 800);
  }

  _submitKayit() {
    const ad    = document.getElementById('kyt-ad');
    const email = document.getElementById('kyt-email');
    const errEl = document.getElementById('kyt-error');
    const toast = this.ctx.services.toast;

    const fail = (msg) => {
      if (errEl) { errEl.textContent = '⚠ ' + msg; errEl.style.display = 'block'; }
    };
    if (!ad    || !ad.value.trim())    return fail('Ad soyad gerekli.');
    if (!email || !email.value.trim()) return fail('E-posta gerekli.');
    if (errEl) errEl.style.display = 'none';

    const btn = document.querySelector('#kng-kayit .cm-publish-btn');
    if (btn) { btn.textContent = 'İşleniyor...'; btn.disabled = true; }
    setTimeout(() => {
      if (btn) { btn.textContent = '✓ Kayıt Talebi Gönder'; btn.disabled = false; }
      if (ad)    ad.value    = '';
      if (email) email.value = '';
      toast.show('✓ Kayıt talebiniz alındı!');
    }, 800);
  }
}
