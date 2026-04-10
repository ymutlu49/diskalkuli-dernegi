# Diskalkuli Derneği — Mobil Uygulama

**Herkes Matematik Öğrenebilir.**

Mobil-öncelikli, kurulabilir bir Progressive Web App (PWA). Vanilla
JavaScript (ES6 modules + classes) — build step yok, framework yok,
bağımlılık yok.

---

## 📁 Proje Yapısı

```
app/
├── index.html                # Tek sayfa uygulama kabuğu (tüm ekranlar burada)
├── manifest.webmanifest      # PWA manifesti — ana ekrana eklemeyi mümkün kılar
├── sw.js                     # Service worker — offline çalışma ve önbellek
│
├── icons/
│   ├── logo.png              # 512x512 uygulama logosu
│   └── logo-small.png        # 192x192 ikon
│
├── styles/
│   ├── tokens.css            # Tasarım jetonları (renkler, yazı tipleri, reset)
│   ├── app.css               # Düzen + bileşenler + ekran stilleri
│   └── mobile.css            # Mobil ince ayarlar: safe-area, touch targets, PWA
│
└── src/
    ├── main.js               # Uygulama giriş noktası (servisleri ve ekranları bağlar)
    ├── compat.js             # Eski inline onclick handler köprüsü (geçici)
    │
    ├── core/
    │   ├── App.js            # Uygulama orkestratörü
    │   ├── Router.js         # Ekran router'ı + geçmiş yığını
    │   ├── Store.js          # Küçük observable state store
    │   ├── EventBus.js       # Basit pub/sub olay bus'ı
    │   └── BaseScreen.js     # Tüm ekran controller'ları için temel sınıf
    │
    ├── data/
    │   ├── roles.js          # Rol kimlikleri ve etiketleri
    │   ├── permissions.js    # Rol → yetki eşlemesi
    │   ├── users.js          # Demo kullanıcılar, APP_USERS, APPLICATIONS
    │   ├── modules.js        # Ana ekrandaki modül kartları
    │   ├── content.js        # Haberler, kurslar, ADIM adımları, yayınlar, vb.
    │   └── notifications.js  # Başlangıç bildirim listesi
    │
    ├── services/
    │   ├── AuthService.js         # Giriş / çıkış / e-posta doğrulama
    │   ├── ToastService.js        # Küçük pop-up bildirimler
    │   ├── NotificationService.js # Bildirim merkezi
    │   ├── PermissionService.js   # Rol tabanlı erişim kontrolleri
    │   ├── UserService.js         # Kullanıcı CRUD (admin panel)
    │   ├── ApplicationService.js  # Üyelik başvuruları
    │   └── ModalService.js        # Modal açma/kapatma yardımcıları
    │
    ├── screens/
    │   ├── SplashScreen.js
    │   ├── LoginScreen.js
    │   ├── AuthScreen.js          # Demo rol seçici
    │   ├── HomeScreen.js          # Ana sayfa (hero + stats + modüller)
    │   ├── HaberlerScreen.js
    │   ├── FarkindalikScreen.js   # Diskalkuli nedir + SSS akordiyon
    │   ├── EgitimScreen.js        # Eğitim LMS / kurslar
    │   ├── AdimScreen.js          # 6 adımlı müdahale modeli
    │   ├── DokunsayScreen.js      # Dijital manipülatifler
    │   ├── AraclarScreen.js       # Somut araçlar (filtrelenebilir)
    │   ├── YayinlarScreen.js      # Kitaplar, makaleler
    │   ├── KongreScreen.js        # ICMLD IV + canlı geri sayım
    │   ├── IlerlemeScreen.js      # Kullanıcı eğitim ilerleme durumu
    │   ├── ToplulukScreen.js      # Topluluk / forum
    │   ├── UyeScreen.js           # Üyelik kademeleri
    │   ├── ProfilScreen.js        # Kullanıcı profili
    │   ├── YonetimScreen.js       # Admin paneli (özet/üyeler/başvurular)
    │   ├── UyeBasvuruScreen.js    # Çok adımlı üyelik formu
    │   └── TemsilciBasvuruScreen.js
    │
    └── ui/
        └── chips.js          # Ortak filtre-chip render helper'ı
```

---

## 🏗️ Mimari

Katmanlı, OOP, loose-coupled bir yapı:

```
┌─────────────────────────────────────────┐
│  index.html (statik markup, 19 ekran)  │
├─────────────────────────────────────────┤
│  Screen Controllers (BaseScreen)        │  ← her ekran bir sınıf
├─────────────────────────────────────────┤
│  Services (Auth, User, Toast, ...)      │  ← iş mantığı
├─────────────────────────────────────────┤
│  Core: App · Router · Store · EventBus  │  ← altyapı
└─────────────────────────────────────────┘
```

**Anahtar prensipler**:

- **Store**: tek kaynak — `currentUser`, `currentScreen`
- **EventBus**: servisler ve ekranlar isimlendirilmiş olaylarla konuşur
  (`auth:login`, `users:changed`, `router:navigated`, …)
- **Router**: ekranı değiştirir, geçmiş yığınını tutar,
  `onEnter()`/`onLeave()` yaşam döngülerini çağırır
- **BaseScreen**: her ekran `init()`, `onEnter()`, `onLeave()` override edebilir
- **Screens know nothing about each other** — sadece bus / router / services

---

## 🚀 Yerel Geliştirme

PWA'yı (service worker, `type="module"`) çalıştırmak için bir HTTP sunucu
gerekir:

```bash
cd app

# npm script (en kolay)
npm run serve

# veya doğrudan
npx --yes http-server . -p 8080 -c-1

# veya Python 3
python -m http.server 8080
```

Sonra `http://localhost:8080` adresini aç. Geliştirme yaparken
`Ctrl+Shift+R` (sert yenileme) service worker önbelleğini temizler.

### Test

```bash
npm test              # tüm testleri çalıştır (node:test, ~0.3s)
npm run test:watch    # değişikliklerde otomatik tekrar çalıştır
npm run validate      # SW syntax + manifest JSON + tüm testler
```

### Demo hesaplar

Geliştirme sırasında kullanabileceğin demo hesaplar:

| Rol                   | E-posta                       |
| --------------------- | ----------------------------- |
| YK Başkanı            | `y.mutlu@alparslan.edu.tr`    |
| Denetleme K. Başkanı  | `ihsan.soylemez@mail.com`     |
| İl Temsilcisi         | `ayse.kaya@mail.com`          |
| Dernek Üyesi          | `mehmet@okul.edu.tr`          |
| Ziyaretçi             | `ziyaretci@mail.com`          |

Demo şifre `src/services/AuthService.js` içindeki `DEMO_PASSWORD`
sabitinde bulunur. **Production deploy'dan önce mutlaka kaldırılmalı
ve backend API (AuthService `mode: 'api'`) aktifleştirilmelidir.**

Ya da giriş ekranındaki **"Demo hesaplarla görüntüle"** düğmesiyle
rol kartlarından birini tek tıkla açabilirsin — şifre gerekmez.

> ⚠ **Güvenlik notu:** Şu an çalışan kimlik doğrulama yalnızca
> `localStorage`'a ve bundle'daki hard-coded kullanıcı listesine
> dayanır. Bu sadece çevrimdışı bir prototiptir; gerçek üye
> bilgileri, aidat kayıtları ve KVKK verileri için bir backend ve
> `AuthService`'de `api` modu şarttır.

---

## 📱 Telefonda Kullanma

Bir PWA olarak:

1. Uygulamayı web sunucuna deploy et (aşağıya bak).
2. Telefonda Chrome/Safari ile URL'yi aç.
3. Tarayıcı menüsünden **"Ana ekrana ekle"** / **"Add to Home Screen"**.
4. Artık ikon ana ekranda. Dokunduğunda tam ekran, bottom bar'sız açılır.
5. Offline kullanılabilir (service worker sayesinde).

---

## 🌐 Deploy

### Seçenek A — Netlify (en kolay)

```bash
# 1. Netlify CLI kurulu değilse:
npm install -g netlify-cli

# 2. Giriş yap:
netlify login

# 3. app/ dizinini deploy et:
cd app
netlify deploy --prod --dir=.
```

Verilen URL'i telefonuna aç → Ana ekrana ekle.

### Seçenek B — Vercel

```bash
cd app
npx vercel --prod
```

### Seçenek C — GitHub Pages

```bash
# Depoyu push ettiysen, Settings → Pages → "Deploy from branch"
# Kök: /app
```

### Seçenek D — Kendi sunucunda Nginx

```nginx
server {
  listen 443 ssl http2;
  server_name diskalkuli.example.com;
  root /var/www/diskalkuli/app;
  index index.html;

  # SPA fallback: tüm yolları index.html'e yönlendir
  location / {
    try_files $uri $uri/ /index.html;
  }

  # JS modülleri
  location ~* \.js$ {
    add_header Content-Type "application/javascript; charset=utf-8";
  }

  # Service worker scope'unu limit etme
  location = /sw.js {
    add_header Cache-Control "no-cache";
  }
}
```

### ⚠️ Önemli

- **HTTPS zorunludur** — service worker'lar ve PWA kurulumu yalnızca
  HTTPS (veya `localhost`) üzerinde çalışır.
- Depoyu yeniden deploy ettiğinde `sw.js` içindeki `CACHE_VERSION`
  sabitini artır — aksi hâlde kullanıcılar eski bundle'ı görür.

---

## 🔧 Yapılan İyileştirmeler

| Önce (monolit)           | Sonra (bu repo)                |
| ------------------------ | ------------------------------ |
| 1 dosya, 3596 satır      | ~40 modül, ortalama 80-200 sat |
| Inline 824 KB base64     | `icons/` dizinine dönüştürüldü |
| Global `var` bildirimleri | ES6 class + module + const    |
| `function foo(){}` kümesi | Controller sınıfları            |
| HTML'de `onclick="..."` | Event listener + compat shim   |
| `setTimeout` ile init    | Yaşam döngüsü (onEnter/onLeave) |
| Service worker yok       | Offline PWA                    |
| `viewport-fit=cover` yok | Safe-area + dinamik viewport   |
| 44×44 touch target yok   | iOS HIG uyumlu dokunma alanları |

---

## 🛠️ Kod Rehberi (Geliştirici)

### Yeni ekran ekleme

1. `index.html`'e `<div class="screen" id="screen-yeniekran">…</div>` ekle.
2. `src/screens/YeniekranScreen.js` dosyasında `BaseScreen`'i extend et:
   ```js
   import { BaseScreen } from '../core/BaseScreen.js';
   export class YeniekranScreen extends BaseScreen {
     init()    { /* tek seferlik kurulum */ }
     onEnter() { /* her girişte */ }
   }
   ```
3. `src/main.js` içindeki `screenDefs` dizisine ekle.
4. Başka bir ekrandan `this.ctx.router.goTo('yeniekran')` ile git.

### Yeni servis ekleme

1. `src/services/FooService.js` oluştur, opsiyonel `attach({store, bus})`
   metodu ekle.
2. `main.js` içinde `services` objesine ekle.
3. Ekranlar `this.ctx.services.foo` üzerinden erişir.

### Olay yayma / dinleme

```js
// Ekranda veya serviste:
this.ctx.bus.emit('tokenim:oldu', { payload: 42 });
this.ctx.bus.on('tokenim:oldu', ({ payload }) => { ... });
```

### Kullanıcı verisini okuma

```js
const user = this.ctx.store.get('currentUser');
if (user && user.superadmin) { ... }

// Veya permission service üzerinden:
if (this.ctx.services.permissions.can('egitim')) { ... }
```

---

## 📜 Lisans

Bu uygulama Diskalkuli Derneği için geliştirilmiştir.
Geliştiren: **Prof. Dr. Yılmaz Mutlu**
