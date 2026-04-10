/**
 * Content taxonomy: types, statuses, categories, audiences.
 *
 * These frozen dictionaries are the single source of truth for the
 * CMS (ContentService) and its admin UI. Adding a new content type
 * only requires adding an entry here — the rest of the app picks it
 * up automatically.
 */

/* ── Content types (kind of item) ───────────────────────────── */
export const CONTENT_TYPES = Object.freeze({
  haber:    { key: 'haber',    label: 'Haber',     icon: '📰', color: 'var(--green)',     bg: 'var(--green-light)' },
  duyuru:   { key: 'duyuru',   label: 'Duyuru',    icon: '📢', color: 'var(--brown-dark)', bg: 'var(--brown-light)' },
  egitim:   { key: 'egitim',   label: 'Eğitim',    icon: '🎓', color: '#E65100',           bg: '#FFF3E0' },
  etkinlik: { key: 'etkinlik', label: 'Etkinlik',  icon: '📅', color: '#1565C0',           bg: '#E3F2FD' },
  sayfa:    { key: 'sayfa',    label: 'Sayfa',     icon: '📄', color: '#3949AB',           bg: '#E8EAF6' },
});

export const CONTENT_TYPE_LIST = Object.freeze(Object.values(CONTENT_TYPES));

/* ── Workflow states ─────────────────────────────────────────── */
/**
 * Content lifecycle:
 *
 *           ┌──────── reject ────────┐
 *           ▼                        │
 *   taslak → inceleme → zamanlanmış  │
 *     ▲          │                   │
 *     │          ▼                   │
 *     │       yayinda ◄──────────────┘
 *     │          │
 *     │          ▼
 *     └──────  arsiv
 *
 * Transitions are enforced in ContentService.
 */
export const CONTENT_STATUS = Object.freeze({
  taslak:      { key: 'taslak',      label: 'Taslak',       icon: '📝', color: 'var(--gray-600)',   bg: 'var(--gray-100)' },
  inceleme:    { key: 'inceleme',    label: 'İncelemede',   icon: '👁',  color: '#92400E',           bg: '#FEF3C7' },
  zamanlanmis: { key: 'zamanlanmis', label: 'Zamanlanmış',  icon: '⏰', color: '#1565C0',            bg: '#E3F2FD' },
  yayinda:     { key: 'yayinda',     label: 'Yayında',      icon: '✓',  color: 'var(--green-dark)',  bg: 'var(--green-light)' },
  arsiv:       { key: 'arsiv',       label: 'Arşiv',        icon: '📦', color: 'var(--gray-400)',    bg: 'var(--gray-100)' },
});

export const CONTENT_STATUS_LIST = Object.freeze(Object.values(CONTENT_STATUS));

/* ── Categories (topical tags) ───────────────────────────────── */
export const CONTENT_CATEGORIES = Object.freeze([
  'Genel', 'Kongre', 'Eğitim', 'Araştırma', 'Farkındalık',
  'Duyuru', 'Etkinlik', 'Yayın', 'Haber', 'Aile', 'Müdahale',
]);

/* ── Audiences (push notification targeting) ─────────────────── */
export const CONTENT_AUDIENCES = Object.freeze({
  all:       { key: 'all',       label: 'Tüm üyeler',        roles: ['yonetim', 'temsilci', 'uye', 'genel'] },
  members:   { key: 'members',   label: 'Dernek üyeleri',    roles: ['yonetim', 'temsilci', 'uye'] },
  leaders:   { key: 'leaders',   label: 'Yönetim & Temsilci', roles: ['yonetim', 'temsilci'] },
  yonetim:   { key: 'yonetim',   label: 'Yalnız Yönetim',    roles: ['yonetim'] },
  temsilci:  { key: 'temsilci',  label: 'Yalnız Temsilciler', roles: ['temsilci'] },
});
