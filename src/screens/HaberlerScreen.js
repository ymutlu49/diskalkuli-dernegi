import { BaseScreen } from '../core/BaseScreen.js';
import { escapeHtml } from '../core/escapeHtml.js';
import { HABERLER } from '../data/content.js';
import { renderChips } from '../ui/chips.js';

/**
 * News & announcements list.
 */
export class HaberlerScreen extends BaseScreen {
  init() {
    renderChips('news-chips', ['Tümü', 'Kongre', 'Eğitim', 'Haber']);
    this._render();
  }

  onEnter() {
    this._render();
  }

  _render() {
    const list = document.getElementById('news-list');
    if (!list) return;
    list.innerHTML = HABERLER.map((h) => `
      <article style="margin:0 16px 12px">
        <div class="card" style="border-radius:var(--r-lg);padding:14px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span class="ann-cat ${escapeHtml(h.catCss)}">${escapeHtml(h.catLabel)}</span>
            <span style="font-size:11px;color:var(--gray-400)">${escapeHtml(h.date)}</span>
          </div>
          <h3 style="font-family:var(--font-d);font-size:14px;font-weight:800;color:var(--green-dark);margin:0 0 6px">${escapeHtml(h.title)}</h3>
          <p style="font-size:13px;color:var(--gray-600);line-height:1.6;margin:0">${escapeHtml(h.excerpt)}</p>
        </div>
      </article>`).join('');
  }
}
