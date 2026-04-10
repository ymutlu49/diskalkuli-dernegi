/**
 * Permission sets for each role and the list of all known permission keys.
 * A "permission" here corresponds 1:1 with a screen/module that the user can open.
 */
export const ALL_PERMS = Object.freeze([
  'farkindalik', 'haberler', 'egitim', 'adim', 'dokunsay', 'araclar',
  'yayinlar', 'kongre', 'uye', 'ilerleme', 'topluluk', 'yonetim', 'profil',
]);

export const PERM_LABELS = Object.freeze({
  farkindalik: 'Farkındalık',
  haberler:    'Haberler',
  egitim:      'Eğitim',
  adim:        'ADIM',
  dokunsay:    'DokunSay',
  araclar:     'Araçlar',
  yayinlar:    'Yayınlar',
  kongre:      'Kongre',
  uye:         'Üyelik',
  ilerleme:    'İlerleme',
  topluluk:    'Topluluk',
  yonetim:     'Yönetim',
  profil:      'Profil',
});

export const PERM_SETS = Object.freeze({
  yonetim:  ['farkindalik', 'haberler', 'egitim', 'adim', 'dokunsay', 'araclar', 'yayinlar', 'kongre', 'uye', 'ilerleme', 'topluluk', 'yonetim', 'profil'],
  temsilci: ['farkindalik', 'haberler', 'egitim', 'adim', 'dokunsay', 'araclar', 'yayinlar', 'kongre', 'uye', 'ilerleme', 'topluluk', 'profil'],
  uye:      ['farkindalik', 'haberler', 'egitim', 'adim', 'araclar', 'yayinlar', 'kongre', 'ilerleme', 'topluluk', 'profil'],
  genel:    ['farkindalik', 'haberler', 'kongre', 'profil'],
});
