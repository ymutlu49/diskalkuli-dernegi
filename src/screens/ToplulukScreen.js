import { BaseScreen } from '../core/BaseScreen.js';
import { escapeHtml } from '../core/escapeHtml.js';
import { TOPLULUK } from '../data/content.js';
import { renderChips } from '../ui/chips.js';

/**
 * Community / Q&A feed.
 */
export class ToplulukScreen extends BaseScreen {
  init() {
    renderChips('community-chips', ['Tümü', 'Soru-Cevap', 'Deneyim', 'Araştırma']);

    const el = document.getElementById('community-list');
    if (!el) return;
    el.innerHTML = TOPLULUK.map((p) => `
      <article style="margin:0 16px 12px" aria-label="${escapeHtml(p.author)} gönderisi">
        <div class="card" style="border-radius:var(--r-lg)">
          <div style="display:flex;align-items:center;gap:10px;padding:14px 14px 10px">
            <div aria-hidden="true" style="width:36px;height:36px;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-size:13px;font-weight:800;color:white;flex-shrink:0">${escapeHtml(p.initials)}</div>
            <div>
              <div style="font-family:var(--font-d);font-size:13px;font-weight:700;color:var(--green-dark)">${escapeHtml(p.author)}</div>
              <div style="font-size:11px;color:var(--gray-400)">${escapeHtml(p.role)} · ${escapeHtml(p.time)}</div>
            </div>
          </div>
          <p style="padding:0 14px 10px;font-size:13px;color:var(--gray-700);line-height:1.6;margin:0">${escapeHtml(p.text)}</p>
          <div style="display:flex;gap:16px;padding:10px 14px 14px;border-top:1px solid var(--gray-100)">
            <button type="button" class="tp-like-btn" aria-label="Beğen" style="background:none;border:none;font-size:12px;color:var(--gray-400);cursor:pointer;padding:0">♡ ${escapeHtml(String(p.likes))}</button>
            <button type="button" class="tp-comment-btn" aria-label="Yorum yap" style="background:none;border:none;font-size:12px;color:var(--gray-400);cursor:pointer;padding:0">💬 ${escapeHtml(String(p.comments))}</button>
          </div>
        </div>
      </article>`).join('');
  }
}
