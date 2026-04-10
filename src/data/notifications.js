/**
 * Initial notifications bag. NotificationService owns the mutable state.
 */
export const INITIAL_NOTIFICATIONS = [
  { id: 1, icon: '📢', iconBg: 'var(--green-light)', title: 'IV. ICMLD Bildiri',    text: 'Son başvuru: 6 Eylül 2026.',               time: '14 dk önce', unread: true,  screen: 'kongre' },
  { id: 2, icon: '✅', iconBg: 'var(--green-light)', title: 'Sertifikanız Hazır',   text: 'Diskalkuli sertifikanız oluşturuldu.',     time: '2 saat önce', unread: true,  screen: 'profil' },
  { id: 3, icon: '👤', iconBg: '#E3F2FD',             title: 'Yeni Üye',             text: 'Dr. Fatma Özcan katıldı.',                 time: '5 saat önce', unread: true,  screen: 'yonetim' },
  { id: 4, icon: '📰', iconBg: 'var(--brown-light)',  title: 'Yeni Haber',           text: 'Ebeveyn katılımı makalesi yayınlandı.',    time: '1 gün önce', unread: false, screen: 'haberler' },
];
