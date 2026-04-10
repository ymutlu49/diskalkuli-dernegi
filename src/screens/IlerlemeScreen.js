import { BaseScreen } from '../core/BaseScreen.js';
import { escapeHtml } from '../core/escapeHtml.js';
import { ILERLEME } from '../data/content.js';

/**
 * User course-progress list.
 */
export class IlerlemeScreen extends BaseScreen {
  init() {
    const el = document.getElementById('progress-list');
    if (!el) return;
    el.innerHTML = ILERLEME.map((p) => {
      const status = p.pct === 100 ? '✓ Tamamlandı' : p.pct > 0 ? 'Devam ediyor' : 'Başlanmadı';
      return `
      <article style="margin:0 16px 12px">
        <div class="card" style="border-radius:var(--r-lg);padding:16px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <h3 style="font-family:var(--font-d);font-size:14px;font-weight:800;color:var(--green-dark);margin:0">${escapeHtml(p.title)}</h3>
            <div style="font-family:var(--font-d);font-size:18px;font-weight:900;color:var(--green)" aria-hidden="true">${escapeHtml(String(p.pct))}%</div>
          </div>
          <div role="progressbar" aria-valuenow="${escapeHtml(String(p.pct))}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(p.title)} ilerlemesi" style="height:8px;background:var(--green-light);border-radius:999px;overflow:hidden;margin-bottom:8px">
            <div style="width:${escapeHtml(String(p.pct))}%;height:100%;background:var(--green);border-radius:999px"></div>
          </div>
          <div style="font-size:12px;color:var(--gray-400)">
            ${escapeHtml(status)} · ${escapeHtml(p.date)}
          </div>
        </div>
      </article>`;
    }).join('');
  }
}
