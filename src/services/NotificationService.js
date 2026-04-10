/**
 * In-session notification centre.
 *
 * Owns the mutable list of notifications, exposes read/mark-read APIs,
 * and updates the unread-count badge in the topbar. Other modules should
 * never poke the notification DOM directly.
 */
import { INITIAL_NOTIFICATIONS } from '../data/notifications.js';
import { escapeHtml } from '../core/escapeHtml.js';

export class NotificationService {
  constructor() {
    /** @type {Array<object>} */
    this._items = INITIAL_NOTIFICATIONS.map((n) => ({ ...n }));
    this._bus = null;
  }

  attach({ bus }) {
    this._bus = bus;
  }

  /** @returns read-only snapshot */
  list() {
    return this._items.slice();
  }

  unreadCount() {
    return this._items.filter((n) => n.unread).length;
  }

  /** Mark a single item read and return the navigation target (if any). */
  markRead(id) {
    for (const n of this._items) {
      if (n.id === id) {
        n.unread = false;
        if (this._bus) this._bus.emit('notif:changed', this._items);
        return n.screen || null;
      }
    }
    return null;
  }

  markAllRead() {
    for (const n of this._items) n.unread = false;
    if (this._bus) this._bus.emit('notif:changed', this._items);
  }

  /**
   * Paint the current unread count into the DOM: topbar dot +
   * "N okunmamış" label in the modal header.
   */
  renderBadge() {
    const unread = this.unreadCount();
    const dot = document.getElementById('notif-dot');
    if (dot) {
      dot.className = 'notif-dot' + (unread > 0 ? ' show' : '');
      dot.setAttribute('aria-label', `${unread} okunmamış bildirim`);
    }
    const label = document.getElementById('notif-unread-count');
    if (label) label.textContent = unread > 0 ? `${unread} okunmamış` : 'Tümü okundu';

    // Update the bell button's aria-label so SR users know the count.
    const bell = document.getElementById('notif-bell') || document.querySelector('[data-notif-bell]');
    if (bell) bell.setAttribute('aria-label', `Bildirimler (${unread} okunmamış)`);
  }

  /**
   * Render the full notification list inside #notif-list.
   * Clicking an item (or pressing Enter/Space) marks it read and,
   * if it carries a `screen`, navigates there.
   */
  renderList(onNavigate = () => {}) {
    const root = document.getElementById('notif-list');
    if (!root) return;
    root.setAttribute('role', 'list');

    root.innerHTML = this._items.map((n) => `
      <div class="notif-item${n.unread ? ' unread' : ''}"
           data-notif-id="${n.id}"
           role="listitem"
           tabindex="0"
           aria-label="${escapeHtml(n.title)}. ${escapeHtml(n.text)}. ${escapeHtml(n.time)}${n.unread ? '. Okunmamış' : ''}">
        <div class="notif-icon" aria-hidden="true" style="background:${escapeHtml(n.iconBg)}">${escapeHtml(n.icon)}</div>
        <div class="notif-body">
          <div class="notif-title">${escapeHtml(n.title)}</div>
          <div class="notif-text">${escapeHtml(n.text)}</div>
          <div class="notif-time">${escapeHtml(n.time)}</div>
        </div>
      </div>`).join('');

    const activate = (el) => {
      const id = Number(el.dataset.notifId);
      const screen = this.markRead(id);
      this.renderBadge();
      // Close the modal overlay
      const modal = document.getElementById('notif-modal');
      if (modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
      }
      if (screen) setTimeout(() => onNavigate(screen), 150);
    };

    root.querySelectorAll('.notif-item').forEach((el) => {
      el.addEventListener('click', () => activate(el));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate(el);
        }
      });
    });
  }
}
