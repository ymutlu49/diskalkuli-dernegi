/**
 * Role identifiers and human-readable labels.
 * These are the canonical role keys used throughout the app.
 */
export const ROLES = Object.freeze({
  YONETIM:  'yonetim',
  IHSAN:    'ihsan',
  TEMSILCI: 'temsilci',
  UYE:      'uye',
  GENEL:    'genel',
});

export const ROLE_LABELS = Object.freeze({
  yonetim:  'YK Üyesi',
  ihsan:    'Denetleme K. Başkanı',
  temsilci: 'İl Temsilcisi',
  uye:      'Dernek Üyesi',
  genel:    'Genel Ziyaretçi',
});

export const ROLE_COLORS = Object.freeze({
  yonetim:  'var(--green-dark)',
  ihsan:    'var(--green-dark)',
  temsilci: 'var(--brown)',
  uye:      'var(--green-mid)',
  genel:    'var(--gray-400)',
});
