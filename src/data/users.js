/**
 * Demo user accounts used by the mock auth service.
 * Key = role slug · Value = user profile object.
 * These are keyed by ROLE, not by email — the email→role map in
 * AuthService.js handles the lookup.
 */
import { PERM_SETS } from './permissions.js';

export const DEMO_USERS = Object.freeze({
  ihsan: {
    id:         5,
    name:       'Dr. İhsan Söylemez',
    email:      'ihsan.soylemez@mail.com',
    role:       'yonetim',
    roleKey:    'ihsan',
    city:       'Muş',
    initials:   'İS',
    superadmin: true,
    perms:      PERM_SETS.yonetim,
  },
  yonetim: {
    id:         1,
    name:       'Prof. Dr. Yılmaz Mutlu',
    email:      'yilmaz@alparslan.edu.tr',
    role:       'yonetim',
    roleKey:    'yonetim',
    city:       'Muş',
    initials:   'YM',
    superadmin: true,
    perms:      PERM_SETS.yonetim,
  },
  temsilci: {
    id:         2,
    name:       'Dr. Ayşe Kaya',
    email:      'ayse.kaya@mail.com',
    role:       'temsilci',
    roleKey:    'temsilci',
    city:       'Ankara',
    initials:   'AK',
    superadmin: false,
    perms:      PERM_SETS.temsilci,
  },
  uye: {
    id:         3,
    name:       'Mehmet Demir',
    email:      'mehmet@okul.edu.tr',
    role:       'uye',
    roleKey:    'uye',
    city:       'İstanbul',
    initials:   'MD',
    superadmin: false,
    perms:      PERM_SETS.uye,
  },
  genel: {
    id:         4,
    name:       'Ziyaretçi',
    email:      'ziyaretci@mail.com',
    role:       'genel',
    roleKey:    'genel',
    city:       '-',
    initials:   'ZY',
    superadmin: false,
    perms:      PERM_SETS.genel,
  },
});

/**
 * Full user directory used by the admin panel (Yönetim).
 * Mutable — the app lets admins add/edit/delete users at runtime.
 *
 * Lifecycle values:
 *   - 'aktif'      → normal member, full access
 *   - 'pasif'      → account disabled, cannot log in
 *   - 'askida'     → temporarily suspended (dues outstanding, review)
 *   - 'ayrildi'    → resigned / left the association
 */
export const APP_USERS = [
  { id: 1, name: 'Prof. Dr. Yılmaz Mutlu',    email: 'y.mutlu@alparslan.edu.tr',      role: 'yonetim',  city: 'Muş',       kurum: 'Muş Alparslan Üniversitesi', initials: 'YM', superadmin: true,  active: true, joinDate: '2017-01-01', phone: '+90 555 000 0001', lifecycle: 'aktif', kvkkConsent: '2017-01-01T10:00:00Z', tuzukConsent: '2017-01-01T10:00:00Z', tc: '', notes: 'Dernek kurucusu' },
  { id: 2, name: 'Dr. İhsan Söylemez',        email: 'ihsan.soylemez@mail.com',       role: 'yonetim',  city: 'Muş',       kurum: 'Denetleme Kurulu',           initials: 'İS', superadmin: true,  active: true, joinDate: '2017-01-01', phone: '+90 555 000 0002', lifecycle: 'aktif', kvkkConsent: '2017-01-01T10:00:00Z', tuzukConsent: '2017-01-01T10:00:00Z', tc: '', notes: '' },
  { id: 3, name: 'Dr. Ayşe Kaya',              email: 'ayse.kaya@mail.com',            role: 'temsilci', city: 'Ankara',    kurum: 'Ankara Üniversitesi',         initials: 'AK', superadmin: false, active: true, joinDate: '2022-03-15', phone: '+90 555 000 0003', lifecycle: 'aktif', kvkkConsent: '2022-03-15T09:00:00Z', tuzukConsent: '2022-03-15T09:00:00Z', tc: '', notes: 'Ankara bölge temsilcisi' },
  { id: 4, name: 'Mehmet Demir',               email: 'mehmet@okul.edu.tr',            role: 'uye',      city: 'İstanbul',  kurum: 'Kadıköy İlkokulu',            initials: 'MD', superadmin: false, active: true, joinDate: '2024-09-01', phone: '+90 555 000 0004', lifecycle: 'askida', kvkkConsent: '2024-09-01T12:00:00Z', tuzukConsent: '2024-09-01T12:00:00Z', tc: '', notes: '2026 aidat borcu' },
  { id: 5, name: 'Dr. Zeynep Arslan',          email: 'zeynep.arslan@erzurum.edu.tr',  role: 'uye',      city: 'Erzurum',   kurum: 'Atatürk Üniversitesi',        initials: 'ZA', superadmin: false, active: true, joinDate: '2025-01-10', phone: '+90 555 000 0005', lifecycle: 'aktif',  kvkkConsent: '2025-01-10T14:30:00Z', tuzukConsent: '2025-01-10T14:30:00Z', tc: '', notes: '' },
];

/**
 * Pending membership / representative applications awaiting review.
 *
 * Fields added beyond the original monolith:
 *   - reviewedBy   : superadmin userId who made the decision (null = unreviewed)
 *   - reviewedAt   : ISO timestamp
 *   - reviewComment: note from the reviewer (shown in audit log)
 *   - phone        : applicant contact number
 *   - kvkkConsent  : ISO timestamp of KVKK acceptance (required)
 */
export const APPLICATIONS = [
  { id: 101, type: 'uye',      name: 'Ahmet Kaya',    email: 'ahmet.kaya@gmail.com',  meslek: 'Matematik Öğretmeni', phone: '+90 532 111 0001', city: 'Ankara', kurum: 'TED Ankara Koleji',   date: '2026-04-05', status: 'bekliyor', reviewedBy: null, reviewedAt: null, reviewComment: '', kvkkConsent: '2026-04-05T10:15:00Z', deneyim: '5 yıldır özel öğrencilerle çalışıyorum.' },
  { id: 102, type: 'temsilci', name: 'Fatma Şahin',   email: 'fatma.sahin@mail.com',  meslek: 'PDR Uzmanı',          phone: '+90 532 111 0002', city: 'İzmir',  kurum: 'Bornova RAM',         date: '2026-04-03', status: 'bekliyor', reviewedBy: null, reviewedAt: null, reviewComment: '', kvkkConsent: '2026-04-03T14:20:00Z', deneyim: 'İzmir\'de 3 yıldır diskalkuli farkındalık çalışması yürütüyorum.' },
  { id: 103, type: 'uye',      name: 'Zeynep Aslan',  email: 'zeynep.aslan@okul.tr',  meslek: 'Sınıf Öğretmeni',     phone: '+90 532 111 0003', city: 'Bursa',  kurum: 'Nilüfer İlkokulu',    date: '2026-04-06', status: 'bekliyor', reviewedBy: null, reviewedAt: null, reviewComment: '', kvkkConsent: '2026-04-06T09:45:00Z', deneyim: 'Sınıfımda 2 diskalkülili öğrenci.' },
];
