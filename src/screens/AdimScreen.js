import { BaseScreen } from '../core/BaseScreen.js';
import { escapeHtml } from '../core/escapeHtml.js';
import { ADIM_STEPS } from '../data/content.js';

/**
 * ADIM 6-step intervention reference.
 */
export class AdimScreen extends BaseScreen {
  init() {
    const el = document.getElementById('adim-list');
    if (!el) return;
    el.innerHTML = ADIM_STEPS.map((s, i) => `
      <div class="adim-step" style="display:flex;gap:14px;margin-bottom:16px">
        <div aria-hidden="true" style="display:flex;flex-direction:column;align-items:center">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-size:15px;font-weight:900;color:white;flex-shrink:0">${escapeHtml(String(s.n))}</div>
          ${i < ADIM_STEPS.length - 1 ? '<div style="width:2px;flex:1;background:var(--gray-200);margin:4px 0"></div>' : ''}
        </div>
        <article class="card" style="flex:1;border-radius:var(--r-md);padding:13px;margin-bottom:4px" aria-labelledby="adim-step-${s.n}-title">
          <h3 id="adim-step-${s.n}-title" style="font-family:var(--font-d);font-size:14px;font-weight:800;color:var(--green-dark);margin:0 0 4px">${escapeHtml(s.title)}</h3>
          <p style="font-size:12px;color:var(--gray-400);line-height:1.5;margin:0">${escapeHtml(s.desc)}</p>
          <div style="display:inline-block;margin-top:8px;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--green-light);color:var(--green-dark)">${escapeHtml(s.tag)}</div>
        </article>
      </div>`).join('');
  }
}
