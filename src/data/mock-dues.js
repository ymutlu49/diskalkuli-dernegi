/**
 * Seed dues (aidat) records.
 *
 * DuesService owns the mutable list and the year-to-year balance
 * calculation. Each record represents one user's obligation for one
 * calendar year.
 */

/** Default yearly dues amount for a regular member, in TL. */
export const YEARLY_DUES_AMOUNT = 300;

/** Dues amount per role — yönetim kurulu genellikle muaf tutulur. */
export const DUES_BY_ROLE = Object.freeze({
  yonetim:  0,
  temsilci: 200,
  uye:      300,
  genel:    0,
});

/**
 * Historical records. Each row: { userId, year, amount, paid, paidAt, method, receiptNo, notes }
 * Unpaid records have paid:false and paidAt:null.
 */
const ts = (iso) => new Date(iso).getTime();

export const INITIAL_DUES = [
  // Prof. Yılmaz Mutlu (yonetim) — muaf
  { userId: 1, year: 2026, amount: 0, paid: true, paidAt: ts('2026-01-05'), method: 'muaf',  receiptNo: 'M-2026-001', notes: 'Yönetim Kurulu muafiyeti' },
  { userId: 1, year: 2025, amount: 0, paid: true, paidAt: ts('2025-01-05'), method: 'muaf',  receiptNo: 'M-2025-001', notes: 'Yönetim Kurulu muafiyeti' },

  // Dr. İhsan Söylemez (yonetim) — muaf
  { userId: 2, year: 2026, amount: 0, paid: true, paidAt: ts('2026-01-05'), method: 'muaf',  receiptNo: 'M-2026-002', notes: 'Denetleme Kurulu muafiyeti' },
  { userId: 2, year: 2025, amount: 0, paid: true, paidAt: ts('2025-01-05'), method: 'muaf',  receiptNo: 'M-2025-002', notes: 'Denetleme Kurulu muafiyeti' },

  // Dr. Ayşe Kaya (temsilci) — 2026 ödedi, 2025 ödedi
  { userId: 3, year: 2026, amount: 200, paid: true,  paidAt: ts('2026-02-10'), method: 'havale', receiptNo: 'D-2026-034', notes: '' },
  { userId: 3, year: 2025, amount: 200, paid: true,  paidAt: ts('2025-03-15'), method: 'havale', receiptNo: 'D-2025-028', notes: '' },

  // Mehmet Demir (uye) — 2026 ödenmedi (borçlu), 2025 ödedi
  { userId: 4, year: 2026, amount: 300, paid: false, paidAt: null,             method: null,     receiptNo: null,          notes: '1. hatırlatma gönderildi' },
  { userId: 4, year: 2025, amount: 300, paid: true,  paidAt: ts('2025-04-20'), method: 'kredi',  receiptNo: 'D-2025-041', notes: '' },

  // Dr. Zeynep Arslan (uye) — 2026 ödenmedi, 2025 ödedi
  { userId: 5, year: 2026, amount: 300, paid: false, paidAt: null,             method: null,     receiptNo: null,          notes: '' },
  { userId: 5, year: 2025, amount: 300, paid: true,  paidAt: ts('2025-05-12'), method: 'havale', receiptNo: 'D-2025-056', notes: '' },
];

export const DUES_METHODS = Object.freeze({
  havale: { key: 'havale', label: 'Banka Havalesi', icon: '🏦' },
  kredi:  { key: 'kredi',  label: 'Kredi Kartı',    icon: '💳' },
  nakit:  { key: 'nakit',  label: 'Nakit',          icon: '💵' },
  muaf:   { key: 'muaf',   label: 'Muafiyet',       icon: '⭐' },
});
