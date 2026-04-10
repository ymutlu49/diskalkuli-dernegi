import { BaseScreen } from '../core/BaseScreen.js';
import { escapeHtml } from '../core/escapeHtml.js';
import { KURSLAR } from '../data/content.js';
import { renderChips } from '../ui/chips.js';

/**
 * Course catalog (Eğitim LMS).
 */
export class EgitimScreen extends BaseScreen {
  init() {
    renderChips('course-chips', ['Tümü', 'Canlı Ders', 'Kayıtlı', 'Ücretsiz']);
    this._render();
  }

  onEnter() {
    this._render();
  }

  _render() {
    const el = document.getElementById('course-list');
    if (!el) return;
    el.innerHTML = KURSLAR.map((k) => `
      <article class="course-card-wrap" style="margin:0 16px 12px">
        <div class="card course-card" style="border-radius:var(--r-lg);overflow:hidden">
          <div class="course-stripe" style="height:4px;background:${escapeHtml(k.typeColor)}"></div>
          <div style="padding:14px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
              <span class="course-type-badge" style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px;background:${escapeHtml(k.typeColor)}22;color:${escapeHtml(k.typeColor)}">${escapeHtml(k.typLabel)}</span>
              <span style="font-size:11px;color:var(--gray-400)">${escapeHtml(k.date)}</span>
            </div>
            <h3 style="font-family:var(--font-d);font-size:14px;font-weight:800;color:var(--green-dark);margin:0 0 4px">${escapeHtml(k.title)}</h3>
            <div style="font-size:12px;color:var(--gray-400);margin-bottom:11px">Eğitmen: <strong style="color:var(--green-mid)">${escapeHtml(k.inst)}</strong></div>
            <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--gray-100);padding-top:11px">
              <span style="font-size:11px;color:var(--gray-400)">${escapeHtml(String(k.enrolled))} kayıtlı</span>
              ${k.pct > 0
                ? `<div role="progressbar" aria-valuenow="${escapeHtml(String(k.pct))}" aria-valuemin="0" aria-valuemax="100" aria-label="Kurs ilerlemesi" style="flex:1;margin:0 10px;height:4px;background:var(--gray-100);border-radius:999px;overflow:hidden"><div style="width:${escapeHtml(String(k.pct))}%;height:100%;background:var(--green)"></div></div><span style="font-size:11px;font-weight:700;color:var(--green)">${escapeHtml(String(k.pct))}%</span>`
                : `<button type="button" class="course-enroll-btn" style="background:var(--green-light);color:var(--green-dark);padding:5px 13px;border-radius:999px;font-size:11px;font-weight:700;border:none;cursor:pointer">Kayıt Ol</button>`}
            </div>
          </div>
        </div>
      </article>`).join('');
  }
}
