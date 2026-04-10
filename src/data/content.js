/**
 * Editorial content rendered across the app:
 * news, courses, ADIM steps, manipulatives, publications, progress, community posts.
 *
 * These are static seed data; a real back-end would fetch them via a Repository.
 */

/* ── News & announcements (Haberler) ─────────────────────────── */
export const HABERLER = [
  { cat: 'kongre', catLabel: 'Kongre', catCss: 'cat-kongre', title: 'IV. ICMLD Bildiri Çağrısı Açıldı',                      date: '2026',        excerpt: 'IV. Uluslararası Matematik Öğrenme Güçlüğü Kongresi 1-3 Ekim 2026 tarihlerinde İstanbul Medeniyet Üniversitesi\'nde düzenlenecek. Ana tema: Aile Odaklı Yaklaşımlar.' },
  { cat: 'egitim', catLabel: 'Eğitim', catCss: 'cat-egitim', title: 'YZ Destekli Kapsayıcı Öğretim Stratejileri',             date: 'Mayıs 2026', excerpt: 'Diskalkuli Derneği olarak yapay zeka destekli kapsayıcı öğretim stratejileri konusunda kapsamlı eğitim düzenliyoruz.' },
  { cat: 'haber',  catLabel: 'Haber',  catCss: 'cat-haber',  title: 'Matematik Kaygısı Eğitimi 320 Katılımcıyla Tamamlandı', date: '2026',        excerpt: 'Diskalkuli Derneği olarak matematik kaygısı, etkileri ve iyileştirilmesi konusunda düzenlediğimiz eğitim 320 katılımcıyla tamamlandı.' },
  { cat: 'egitim', catLabel: 'Eğitim', catCss: 'cat-egitim', title: 'Ebeveyn Katılımı ve Matematik Öğretimi',                date: '2026',        excerpt: 'Ailelerin matematik öğrenme güçlüğü sürecindeki kritik rolünü ele alan eğitim programımıza başvurular devam ediyor.' },
];

/* ── Courses (Eğitim) ────────────────────────────────────────── */
export const KURSLAR = [
  { title: 'Diskalkuli Farkındalık Eğitimi',         inst: 'Prof. Dr. Yılmaz Mutlu', type: 'live', typLabel: 'Canlı Ders', typeColor: 'var(--danger)', date: '15 Mayıs 2026', enrolled: 148, pct: 0 },
  { title: 'YZ Destekli Kapsayıcı Öğretim',          inst: 'Prof. Dr. Yılmaz Mutlu', type: 'live', typLabel: 'Canlı Ders', typeColor: 'var(--danger)', date: '22 Mayıs 2026', enrolled: 92,  pct: 0 },
  { title: 'Matematik Kaygısı: Etkileri',            inst: 'Dr. Mehmet Sarı',        type: 'rec',  typLabel: 'Kayıtlı',    typeColor: 'var(--brown)',  date: 'Kayıtlı · 3 saat', enrolled: 320, pct: 65 },
  { title: 'Ebeveyn Katılımı',                       inst: 'Dr. Nilgün Kaya',        type: 'rec',  typLabel: 'Kayıtlı',    typeColor: 'var(--brown)',  date: 'Kayıtlı · 2 saat', enrolled: 210, pct: 0 },
  { title: 'DokunSay ile Erken Müdahale',            inst: 'Prof. Dr. Yılmaz Mutlu', type: 'free', typLabel: 'Ücretsiz',    typeColor: 'var(--green)',  date: '5 Haziran 2026',    enrolled: 75,  pct: 0 },
];

/* ── ADIM intervention steps ─────────────────────────────────── */
export const ADIM_STEPS = [
  { n: 1, title: 'Değerlendirme ve Tanılama', desc: 'NUMAP ve standart testlerle öğrencinin matematiksel yetkinliklerini kapsamlı biçimde değerlendirin.',                     tag: 'Temel' },
  { n: 2, title: 'Profil Çıkarma',            desc: 'Güçlü/zayıf yönlerin belirlenmesi. Sayı hissi, işlem akıcılığı ve uzamsal akıl yürütme alanlarında bireysel profil.',    tag: 'Temel' },
  { n: 3, title: 'Hedef Belirleme',            desc: 'Bireye özgü ölçülebilir öğrenme hedefleri. Kısa, orta ve uzun vadeli hedefler BEP ile desteklenir.',                     tag: 'Planlama' },
  { n: 4, title: 'Müdahale Planı',            desc: 'DokunSay, GalakSay ve çok duyusal öğretim materyalleri ile bireyselleştirilmiş müdahale programı.',                       tag: 'Planlama' },
  { n: 5, title: 'Uygulama ve İzleme',         desc: 'Programın düzenli uygulanması ve ilerlemenin sistematik izlenmesi. Haftalık geri bildirim döngüsü.',                      tag: 'Uygulama' },
  { n: 6, title: 'Değerlendirme ve Raporlama', desc: 'Kapsamlı değerlendirme, aile ve okul raporları. Gerekirse program güncellenir.',                                         tag: 'Sonuç' },
];

/* ── DokunSay manipulatives ──────────────────────────────────── */
export const MANIPULATIFLER = [
  { name: 'Aritmetik Tabletleri', desc: 'Onluk-birlik yapıyı görselleştiren interaktif tablolar',    tag: 'Temel' },
  { name: 'Sayı Çubukları',       desc: 'DokunSay patentli noktalı sayı çubukları dijital versiyonu', tag: 'Temel' },
  { name: 'Kesir Diskleri',       desc: 'Kesir kavramını somutlaştıran interaktif disk modeli',       tag: 'Orta' },
  { name: 'Sayı Doğrusu',          desc: 'Dinamik sayı doğrusu ve tahmin oyunları',                    tag: 'Tüm Seviyeler' },
];

/* ── Publications ────────────────────────────────────────────── */
export const YAYINLAR = [
  { title: 'Diskalkuli — Matematik Öğrenme Güçlüğüne Sahip Çocuklara Matematik Öğretimi',      author: 'Yılmaz Mutlu',              type: 'Kitap',        year: 2023 },
  { title: 'Diskalkuli Olan Öğrencilerin Tanılanması, Değerlendirilmesi ve Desteklenmesi',    author: 'Yılmaz Mutlu',              type: 'Kitap',        year: 2022 },
  { title: 'DokunSay ile Erken Sayı Duyusu Gelişimi',                                          author: 'Mutlu, Y. ve ark.',         type: 'Makale',        year: 2024 },
  { title: 'Matematik Kaygısı ve Diskalkuli İlişkisi',                                         author: 'Mutlu, Y. & Sarı, M.',      type: 'Makale',        year: 2023 },
  { title: 'Farklılaştırılmış Öğretimde Diskalkuli',                                           author: 'Yılmaz Mutlu',              type: 'Kitap Bölümü', year: 2024 },
];

/* ── User progress ───────────────────────────────────────────── */
export const ILERLEME = [
  { title: 'Diskalkuli Farkındalık Eğitimi',       pct: 100, date: 'Mart 2026' },
  { title: 'Matematik Kaygısı: Etkileri',          pct: 65,  date: 'Devam ediyor' },
  { title: 'YZ Destekli Öğretim Stratejileri',     pct: 0,   date: 'Mayıs 2026' },
  { title: 'DokunSay ile Erken Müdahale',          pct: 0,   date: 'Haziran 2026' },
];

/* ── Community posts ─────────────────────────────────────────── */
export const TOPLULUK = [
  { initials: 'AK', author: 'Dr. Ayşe Kaya',    role: 'Bölge Temsilcisi', time: '2 saat önce', text: 'DokunSay materyallerini sınıfta kullanmaya başladık, öğrencilerin ilgisi inanılmaz. Özellikle Aritmetik Tabletleri ondalık sayı kavramını somutlaştırmada çok etkili.', likes: 14, comments: 5 },
  { initials: 'MD', author: 'Mehmet Demir',     role: 'Dernek Üyesi',     time: '1 gün önce',  text: 'ADIM modelini uyguladığım 3. sınıf öğrencimde büyük ilerleme kaydettik. 3. adımda hedef belirleme aşamasında ailenin desteği kritik oldu.',                      likes: 23, comments: 8 },
  { initials: 'FÖ', author: 'Dr. Fatma Öz',     role: 'Bölge Temsilcisi', time: '2 gün önce',  text: 'IV. ICMLD için bildiri başvurusu yaptım. Araştırma konusu: erken çocukluk döneminde sayı duyusu müdahalelerinin uzun vadeli etkileri.',                        likes: 31, comments: 12 },
];

/* ── Membership tiers (Üyelik) ───────────────────────────────── */
export const TIERS = [
  { role: 'yonetim',  name: 'Yönetim Kurulu',    desc: 'Derneğin en üst karar organı',                css: 'tier-yonetim',  perms: ['Tüm modüller tam erişim', 'Üye yönetimi ve temsilci atama', 'Duyuru ve bildirim yayınlama', 'Kongre organizasyonu', 'Raporlar ve istatistikler'] },
  { role: 'temsilci', name: 'Bölge Temsilcisi',  desc: 'İl/bölge düzeyinde yetkilendirilmiş',        css: 'tier-temsilci', perms: ['Tüm eğitimlere tam erişim', 'Bölgesel üye listesi görüntüleme', 'Bölge duyurusu yayınlama', 'ADIM rehberine tam erişim'] },
  { role: 'uye',      name: 'Dernek Üyesi',      desc: 'Kayıtlı ve aktif dernek üyesi',              css: 'tier-uye',      perms: ['Eğitimlere kayıt olabilme', 'Katılım belgesi alabilme', 'Kongre bildiri gönderimi', 'Farkındalık içeriklerine erişim'] },
  { role: 'genel',    name: 'Genel Ziyaretçi',   desc: 'Üye olmayan genel kullanıcı',                css: 'tier-genel',    perms: ['Temel farkındalık içerikleri', 'Duyuru ve haberleri okuma'] },
];

/* ── Bottom-nav tab mapping ──────────────────────────────────── */
/**
 * Which screens map to which tab in the global bottom-navigation bar.
 * Key = screen id, Value = nav button id.
 */
export const NAV_TAB_MAP = Object.freeze({
  home: 'gnav-home', haberler: 'gnav-home', farkindalik: 'gnav-home',
  egitim: 'gnav-egitim', adim: 'gnav-egitim', dokunsay: 'gnav-egitim',
  araclar: 'gnav-egitim', yayinlar: 'gnav-egitim',
  kongre: 'gnav-kongre',
  profil: 'gnav-profil', uye: 'gnav-profil', ilerleme: 'gnav-profil',
  topluluk: 'gnav-profil', yonetim: 'gnav-profil',
  'uye-basvuru': 'gnav-profil', 'temsilci-basvuru': 'gnav-profil',
});
