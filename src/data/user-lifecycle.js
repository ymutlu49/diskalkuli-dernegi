/**
 * Member lifecycle states & the valid transitions between them.
 *
 * UserService enforces transitions: you can only move a user from
 * state X to state Y if Y ∈ TRANSITIONS[X]. This prevents impossible
 * edits (e.g. reviving a 'ayrildi' record without going through
 * re-registration).
 */
export const LIFECYCLE_STATES = Object.freeze({
  aktif:   { key: 'aktif',   label: 'Aktif',       color: 'var(--green-dark)', bg: 'var(--green-light)', icon: '✓'  },
  askida:  { key: 'askida',  label: 'Askıda',      color: '#92400E',            bg: '#FEF3C7',             icon: '⏸'  },
  pasif:   { key: 'pasif',   label: 'Pasif',       color: 'var(--gray-600)',    bg: 'var(--gray-100)',     icon: '⊘' },
  ayrildi: { key: 'ayrildi', label: 'Ayrıldı',     color: 'var(--danger)',      bg: '#FFEBEE',             icon: '✗'  },
});

export const LIFECYCLE_LIST = Object.freeze(Object.values(LIFECYCLE_STATES));

/**
 * Allowed forward transitions. An absent key = terminal state.
 */
export const LIFECYCLE_TRANSITIONS = Object.freeze({
  aktif:   ['askida', 'pasif', 'ayrildi'],
  askida:  ['aktif', 'pasif', 'ayrildi'],
  pasif:   ['aktif', 'ayrildi'],
  ayrildi: [],
});
