/**
 * All known feature modules shown on the home screen.
 * The visibility of each module is gated by the current user's `perms` list.
 */
export const ALL_MODULES = [
  { id: 'farkindalik', name: 'Farkındalık',      desc: 'Diskalkuli nedir, SSS',       accent: '#1B5E20', iconBg: '#E8F5E9', icon: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' },
  { id: 'haberler',    name: 'Haberler',         desc: 'Duyurular & etkinlikler',      accent: '#A0522D', iconBg: '#FBF0E8', icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0' },
  { id: 'egitim',      name: 'Eğitim LMS',       desc: 'Canlı dersler, sertifika',     accent: '#2E7D32', iconBg: '#C8E6C9', icon: 'M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5' },
  { id: 'adim',        name: 'ADIM Rehberi',     desc: '6 adımlı müdahale',            accent: '#BF6A3A', iconBg: '#F3DCC8', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z' },
  { id: 'dokunsay',    name: 'DokunSay',         desc: 'Dijital manipülatifler',       accent: '#388E3C', iconBg: '#E8F5E9', icon: 'M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15' },
  { id: 'araclar',     name: 'Somut Araçlar',    desc: 'Kanıta dayalı araçlar',        accent: '#00838F', iconBg: '#E0F7FA', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { id: 'yayinlar',    name: 'Yayınlar',         desc: 'Kitaplar, makaleler',          accent: '#7B3A1E', iconBg: '#F3DCC8', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6' },
  { id: 'kongre',      name: 'ICMLD Kongre',     desc: 'IV. Kongre — Ekim 2026',       accent: '#1B5E20', iconBg: '#E8F5E9', icon: 'M3 4h18v2H3zM3 10h18v2H3zM3 16h18v2H3z' },
  { id: 'uye',         name: 'Üyelik',           desc: 'Hiyerarşik sistem',            accent: '#A0522D', iconBg: '#FBF0E8', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
  { id: 'ilerleme',    name: 'İlerleme',         desc: 'Eğitim durumlarım',            accent: '#2E7D32', iconBg: '#C8E6C9', icon: 'M18 20v-10M12 20v-16M6 20v-6' },
  { id: 'topluluk',    name: 'Topluluk',         desc: 'Forum ve Q&A',                  accent: '#388E3C', iconBg: '#E8F5E9', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { id: 'yonetim',     name: 'Yönetim',          desc: 'Admin paneli',                  accent: '#1B5E20', iconBg: '#1B5E20', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z', iconColor: 'white' },
];
