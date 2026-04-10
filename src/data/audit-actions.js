/**
 * Canonical set of auditable action codes.
 *
 * Using a frozen dictionary (rather than plain strings scattered
 * through the codebase) gives us two things:
 *   1. Typos surface immediately — a misspelled key throws.
 *   2. The "Denetim" panel can render a human-friendly label for
 *      every possible action without a big switch statement.
 */
export const AUDIT_ACTIONS = Object.freeze({
  /* Üye yönetimi */
  USER_CREATE:        { key: 'USER_CREATE',        label: 'Üye oluşturma',        icon: '➕', color: 'var(--green-dark)' },
  USER_UPDATE:        { key: 'USER_UPDATE',        label: 'Üye güncelleme',       icon: '✏',  color: 'var(--brown-mid)' },
  USER_DELETE:        { key: 'USER_DELETE',        label: 'Üye silme',            icon: '🗑', color: 'var(--danger)' },
  USER_ACTIVATE:      { key: 'USER_ACTIVATE',      label: 'Üyeyi aktifleştirme',  icon: '✓',  color: 'var(--green)' },
  USER_DEACTIVATE:    { key: 'USER_DEACTIVATE',    label: 'Üyeyi pasifleştirme',  icon: '⊘', color: 'var(--brown)' },
  USER_SUSPEND:       { key: 'USER_SUSPEND',       label: 'Üyeyi askıya alma',    icon: '⏸', color: 'var(--danger)' },
  USER_ROLE_CHANGE:   { key: 'USER_ROLE_CHANGE',   label: 'Rol değişikliği',       icon: '🔀', color: 'var(--brown-dark)' },

  /* Başvuru işlemleri */
  APP_APPROVE:        { key: 'APP_APPROVE',        label: 'Başvuru onayı',        icon: '✓',  color: 'var(--green-dark)' },
  APP_REJECT:         { key: 'APP_REJECT',         label: 'Başvuru reddi',        icon: '✗',  color: 'var(--danger)' },
  APP_COMMENT:        { key: 'APP_COMMENT',        label: 'Başvuruya yorum',      icon: '💬', color: 'var(--brown-mid)' },

  /* İçerik yönetimi */
  CONTENT_CREATE:     { key: 'CONTENT_CREATE',     label: 'İçerik oluşturma',     icon: '📝', color: 'var(--green-mid)' },
  CONTENT_UPDATE:     { key: 'CONTENT_UPDATE',     label: 'İçerik güncelleme',    icon: '✏',  color: 'var(--brown-mid)' },
  CONTENT_SUBMIT:     { key: 'CONTENT_SUBMIT',     label: 'İncelemeye gönderme',  icon: '👁',  color: '#92400E' },
  CONTENT_APPROVE:    { key: 'CONTENT_APPROVE',    label: 'İçerik onayı',         icon: '✓',  color: 'var(--green-dark)' },
  CONTENT_REJECT:     { key: 'CONTENT_REJECT',     label: 'İçerik reddi',          icon: '↺', color: 'var(--danger)' },
  CONTENT_PUBLISH:    { key: 'CONTENT_PUBLISH',    label: 'Yayınlama',             icon: '🚀', color: 'var(--green-dark)' },
  CONTENT_SCHEDULE:   { key: 'CONTENT_SCHEDULE',   label: 'Zamanlama',             icon: '⏰', color: '#1565C0' },
  CONTENT_UNPUBLISH:  { key: 'CONTENT_UNPUBLISH',  label: 'Yayından kaldırma',     icon: '⏹', color: 'var(--brown-dark)' },
  CONTENT_ARCHIVE:    { key: 'CONTENT_ARCHIVE',    label: 'Arşivleme',             icon: '📦', color: 'var(--gray-400)' },
  CONTENT_DELETE:     { key: 'CONTENT_DELETE',     label: 'İçerik silme',          icon: '🗑', color: 'var(--danger)' },
  CONTENT_RESTORE:    { key: 'CONTENT_RESTORE',    label: 'Arşivden geri alma',   icon: '♻',  color: 'var(--green-mid)' },

  /* Aidat işlemleri */
  DUES_MARK_PAID:     { key: 'DUES_MARK_PAID',     label: 'Aidat ödendi kaydı',   icon: '💰', color: 'var(--green-dark)' },
  DUES_MARK_UNPAID:   { key: 'DUES_MARK_UNPAID',   label: 'Aidat borç kaydı',     icon: '⚠',  color: 'var(--danger)' },
  DUES_EXEMPT:        { key: 'DUES_EXEMPT',        label: 'Aidat muafiyeti',       icon: '⭐', color: 'var(--brown-mid)' },
  DUES_REMINDER:      { key: 'DUES_REMINDER',      label: 'Aidat hatırlatma',      icon: '📨', color: 'var(--brown-dark)' },

  /* Oturum */
  AUTH_LOGIN:         { key: 'AUTH_LOGIN',         label: 'Giriş yapma',           icon: '🔓', color: 'var(--green-mid)' },
  AUTH_LOGOUT:        { key: 'AUTH_LOGOUT',        label: 'Çıkış yapma',           icon: '🔒', color: 'var(--gray-400)' },
});
