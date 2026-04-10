import { BaseScreen } from '../core/BaseScreen.js';
import { escapeHtml } from '../core/escapeHtml.js';
import { MANIPULATIFLER } from '../data/content.js';

/**
 * DokunSay digital manipulatives grid.
 */
export class DokunsayScreen extends BaseScreen {
  init() {
    const el = document.getElementById('manip-grid');
    if (!el) return;
    el.innerHTML = MANIPULATIFLER.map((m) => `
      <button type="button" class="card manip-card" style="border-radius:var(--r-lg);padding:18px;cursor:pointer;text-align:left;border:none;background:#fff;width:100%"
              aria-label="${escapeHtml(m.name)}: ${escapeHtml(m.desc)}">
        <div aria-hidden="true" style="width:48px;height:48px;background:var(--green-light);border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;margin-bottom:10px">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--green-dark)" stroke-width="2" width="24" height="24">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
        </div>
        <div style="font-family:var(--font-d);font-size:13px;font-weight:800;color:var(--green-dark);margin-bottom:4px">${escapeHtml(m.name)}</div>
        <div style="font-size:11px;color:var(--gray-400);line-height:1.4">${escapeHtml(m.desc)}</div>
        <div style="display:inline-block;margin-top:8px;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--green-light);color:var(--green-dark)">${escapeHtml(m.tag)}</div>
      </button>`).join('');
  }
}
