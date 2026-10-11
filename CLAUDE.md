# Wormie

Gecko Out tarzı solucan-delik bulmaca oyunu. iPhone'da çalışan web oyunu (GitHub Pages: https://alzz00.github.io/Wormie/).

## Kullanıcı tercihleri
- Kullanıcıya her yanıtta bir kez "boss" de. Türkçe konuş, adımları numaralı ve amacıyla anlat.
- Cihazlar: Windows + iPhone (Mac/Android yok). Telefon adımları Safari/iOS menüleriyle.
- Görünüm değişikliklerinde önce 2-3 seçeneği telefon görseli olarak göster; "yükle" demeden yayınlama.
- Karakter SOLUCAN (kertenkele istemedi), tema Teraryum, karakter Halkalı, logo "w[delik]rmie".

## Yapı (derleme yok, saf JS modülleri)
- `js/motor.js` ızgara, hamle, delik, buz sayaçları · `js/uretici.js` tohumlu tersten bölüm üretimi (her bölüm çözülebilir)
- `js/cizim.js` tahta çizimi · `js/solucan.js` solucan çizimi · `js/temalar.js` · `js/ana.js` arayüz, can/jeton/güçler · `js/ses.js`
- Kayıt: localStorage `kk.durum` (adını değiştirme, ilerleme silinir).
- Test: `node araclar/test-uretici.mjs 1 300` · Önizleme: `node araclar/onizleme.cjs 4547`
- Adres parametreleri: `?tema=`, `?karakter=`, `?bolum=N`, `?ekran=oyun`. Testte döngü: `window.kk.ilerlet(ms)`.
