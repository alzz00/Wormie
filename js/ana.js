// Wormie arayüzü: ekranlar, dokunma, süre, can/jeton, güçler.
import { Tahta } from './motor.js';
import { bolumUret } from './uretici.js';
import { ciz, yerlesim } from './cizim.js';
import { TEMALAR, VARSAYILAN_TEMA } from './temalar.js';
import { KARAKTERLER, VARSAYILAN_KARAKTER } from './solucan.js';
import { ses, sesHazirla, sesAyarla } from './ses.js';

const ANAHTAR = 'kk.durum';
const MAKS_CAN = 5;
const CAN_SURE = 15 * 60 * 1000;
const FIYAT = { cekic: 60, kaldir: 80, dondur: 50 };
const CAN_FIYAT = 120;
const EK_SURE = { saniye: 20, fiyat: 40 };

const $ = s => document.querySelector(s);
const adres = new URLSearchParams(location.search);

// ---------- Kayıt ----------
function varsayilan() {
  return { bolum: 1, jeton: 100, can: MAKS_CAN, canZaman: 0, guc: { cekic: 2, kaldir: 2, dondur: 2 }, tema: VARSAYILAN_TEMA, ses: true };
}
function yukle() {
  try {
    const d = JSON.parse(localStorage.getItem(ANAHTAR));
    if (d && d.bolum) return { ...varsayilan(), ...d, guc: { ...varsayilan().guc, ...d.guc } };
  } catch { /* gizli sekme ya da bozuk kayıt */ }
  return varsayilan();
}
const durum = yukle();
function kaydet() {
  try { localStorage.setItem(ANAHTAR, JSON.stringify(durum)); } catch { /* kaydedilemezse oyun yine çalışır */ }
}
if (adres.get('bolum')) durum.bolum = Math.max(1, Number(adres.get('bolum')) || 1);
sesAyarla(durum.ses);

function canGuncelle() {
  const simdi = Date.now();
  while (durum.can < MAKS_CAN && durum.canZaman && simdi - durum.canZaman >= CAN_SURE) {
    durum.can++;
    durum.canZaman += CAN_SURE;
  }
  if (durum.can >= MAKS_CAN) durum.canZaman = 0;
}
function canKaybet() {
  if (durum.can >= MAKS_CAN) durum.canZaman = Date.now();
  durum.can = Math.max(0, durum.can - 1);
  kaydet();
}
function sonrakiCan() {
  const kalan = Math.max(0, CAN_SURE - (Date.now() - durum.canZaman));
  const dk = Math.floor(kalan / 60000), sn = Math.floor((kalan % 60000) / 1000);
  return `${dk}:${String(sn).padStart(2, '0')}`;
}

// ---------- Simgeler ----------
const IKON = {
  kalp: (s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.4C.9 8.2 3 4.5 6.6 4.5c2.2 0 3.6 1.2 5.4 3.2 1.8-2 3.2-3.2 5.4-3.2 3.6 0 5.7 3.7 4.2 7.1C19.5 16.4 12 21 12 21z" fill="#ff4d6d" stroke="#9c1534" stroke-width="1.6"/><ellipse cx="7.4" cy="8.6" rx="2" ry="1.2" fill="#fff" opacity=".6" transform="rotate(-30 7.4 8.6)"/></svg>`,
  jeton: (s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffc83d" stroke="#a86c00" stroke-width="1.8"/><circle cx="12" cy="12" r="6.2" fill="none" stroke="#e09a00" stroke-width="1.6"/><path d="M10 9.5c0-1 .9-1.6 2-1.6s2 .6 2 1.6M12 7v10" stroke="#a86c00" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  ayar: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></svg>`,
  ev: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>`,
  oyna: `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>`,
  cekic: `<svg width="34" height="34" viewBox="0 0 32 32"><path d="M13.5 13.5l12 12" stroke="#8a5a2b" stroke-width="4.2" stroke-linecap="round"/><path d="M5.5 11.5l8-8 6 6-8 8z" fill="#9aa4ad" stroke="#4a5560" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.5 8.5l4-4" stroke="#fff" stroke-width="1.6" opacity=".6" stroke-linecap="round"/></svg>`,
  kaldir: `<svg width="34" height="34" viewBox="0 0 32 32" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3v7" stroke="#4a5560" stroke-width="2.6"/><path d="M9 21c-3-3-3-8 0-10h14c3 2 3 7 0 10" stroke="#e0473f" stroke-width="3.4"/><path d="M9 21l2 4M23 21l-2 4" stroke="#e0473f" stroke-width="3.4"/><circle cx="16" cy="11" r="2.6" fill="#ffc83d" stroke="#a86c00" stroke-width="1.4"/></svg>`,
  dondur: `<svg width="34" height="34" viewBox="0 0 32 32" fill="none" stroke="#3aa8e8" stroke-width="2.6" stroke-linecap="round"><path d="M16 3v26M4.7 9.5l22.6 13M4.7 22.5l22.6-13"/><path d="M12.5 5.5L16 9l3.5-3.5M12.5 26.5L16 23l3.5 3.5M5 14l4.6 1.2L8.4 10M27 18l-4.6-1.2 1.2 5.2M5 18l4.6-1.2L8.4 22M27 14l-4.6 1.2L23.6 10"/></svg>`,
  saat: `<svg width="64" height="64" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="16" cy="17" r="11"/><path d="M16 10v7l5 3M12 3h8"/></svg>`,
  kupa: `<svg width="76" height="76" viewBox="0 0 32 32"><path d="M9 4h14v7a7 7 0 0 1-14 0z" fill="#ffc83d" stroke="#a86c00" stroke-width="1.6"/><path d="M9 6H5v2a4 4 0 0 0 4 4M23 6h4v2a4 4 0 0 1-4 4" fill="none" stroke="#a86c00" stroke-width="1.6"/><path d="M14 18h4v5h-4z" fill="#e09a00"/><path d="M10 27h12v-3H10z" fill="#8a5a2b" stroke="#5a3a1b" stroke-width="1.2"/><path d="M12.5 6.5v4" stroke="#fff" stroke-width="1.6" opacity=".7" stroke-linecap="round"/></svg>`,
  kirikKalp: `<svg width="70" height="70" viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.4C.9 8.2 3 4.5 6.6 4.5c2.2 0 3.6 1.2 5.4 3.2l-1.5 3 2.5 2-1.5 3 2 2.5" fill="#ff4d6d" stroke="#9c1534" stroke-width="1.4" stroke-linejoin="round"/><path d="M13.6 6.3c1.1-1.1 2.3-1.8 3.8-1.8 3.6 0 5.7 3.7 4.2 7.1C19.8 15.7 14.8 19.2 13 20.4l-1-2.4 1.6-2.8-2.3-2 1.4-3z" fill="#ff4d6d" stroke="#9c1534" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
};

// ---------- Tema ----------
let T = TEMALAR[TEMALAR[adres.get('tema')] ? adres.get('tema') : durum.tema] || TEMALAR[VARSAYILAN_TEMA];
const K = KARAKTERLER[adres.get('karakter')] || KARAKTERLER[VARSAYILAN_KARAKTER];

function temaUygula() {
  const kok = document.documentElement.style;
  for (const [k, v] of Object.entries(T.css)) kok.setProperty(k, v);
  kok.setProperty('--font', T.font);
  kok.setProperty('--logo-golge', T.kontur ? '5px 5px 0 #141414' : '0 5px 0 rgba(0,0,0,.28)');
  kok.setProperty('--kenar-buyuk', T.kontur ? '#141414' : 'transparent');
  $('#arka').style.background = T.arka;
  document.querySelector('meta[name=theme-color]').content = T.css['--zemin'];
  let link = document.getElementById('fontLink');
  if (!link) { link = document.createElement('link'); link.id = 'fontLink'; link.rel = 'stylesheet'; document.head.appendChild(link); }
  link.href = `https://fonts.googleapis.com/css2?family=${T.fontLink}&display=swap`;
  document.fonts?.ready.then(() => { anaCiz(); });
}

// ---------- Ekranlar ----------
function goster(ad) {
  for (const e of document.querySelectorAll('.ekran')) e.classList.toggle('acik', e.id === ad);
  if (ad === 'ana') anaCiz();
}

function hapleriYaz() {
  canGuncelle();
  $('#canHap').innerHTML = `${IKON.kalp()}${durum.can}${durum.can < MAKS_CAN ? ` <small>${sonrakiCan()}</small>` : ''}`;
  $('#jetonHap').innerHTML = `${IKON.jeton()}${durum.jeton}`;
}

function tuvalHazirla(c) {
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const W = c.clientWidth, H = c.clientHeight;
  if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, W, H };
}

function gozHazirla(t) {
  for (const g of t.geckolar) g.goz = g.hucreler.map(([x, y]) => [x + 0.5, y + 0.5]);
}

function anaCiz() {
  hapleriYaz();
  $('#oyna').innerHTML = `${IKON.oyna}<span>Bölüm ${durum.bolum}</span>`;
  if (!$('#ana').classList.contains('acik')) return;
  const b = bolumUret(durum.bolum);
  const t = new Tahta(b);
  gozHazirla(t);
  const c = $('#vitrin');
  const { ctx, W, H } = tuvalHazirla(c);
  ciz(ctx, W, H, { tahta: t, tema: T, karakter: K, yer: yerlesim(t, W, H), zaman: 0 });
}

// ---------- Pencere ----------
function pencere(html, baglantilar = {}) {
  $('#pencere').innerHTML = html;
  for (const [id, fn] of Object.entries(baglantilar)) {
    const el = document.getElementById(id);
    if (el) el.onclick = () => { sesHazirla(); ses.tik(); fn(); };
  }
  $('#perde').classList.add('acik');
}
function pencereKapat() { $('#perde').classList.remove('acik'); }
const perdeAcik = () => $('#perde').classList.contains('acik');

let ipucuSayac = 0;
function ipucuYaz(yazi, sure = 1800) {
  const el = $('#ipucuYazi');
  el.querySelector('span').textContent = yazi;
  el.classList.toggle('acik', !!yazi);
  clearTimeout(ipucuSayac);
  if (yazi && sure) ipucuSayac = setTimeout(() => el.classList.remove('acik'), sure);
}

// ---------- Oyun ----------
let o = null;

function bolumBaslat(no) {
  canGuncelle();
  if (durum.can <= 0) return canYok();
  const b = bolumUret(no);
  const t = new Tahta(b);
  gozHazirla(t);
  o = { no, tahta: t, sure: b.sure, toplamSure: b.sure, basladi: false, donukBitis: 0, efektler: [], aktif: null, isaret: null, mod: null, bitti: false, zaman: 0 };
  if (no === 1) {
    const g = t.geckolar[0], d = t.delikler[0];
    const uzak = c => Math.abs(c[0] - d.x) + Math.abs(c[1] - d.y);
    const bas = uzak(t.uc(g, false)) <= uzak(t.uc(g, true)) ? t.uc(g, false) : t.uc(g, true);
    o.ipucu = { bas, bit: [d.x, d.y] };
  }
  $('#bolumYazi').textContent = `Bölüm ${no}`;
  pencereKapat();
  goster('oyun');
  guclerYaz();
  sureYaz();
  if (no === 1) ipucuYaz('Solucanı kendi rengindeki deliğe sürükle', 0);
  else if (b.geckolar.some(g => g.buz) && !durum.buzGordu) { durum.buzGordu = true; kaydet(); ipucuYaz('Buzlu olan, üstündeki sayı kadar solucan çıkınca çözülür', 3500); }
  else ipucuYaz('');
}

function sureYaz() {
  const el = $('#sure');
  const s = Math.ceil(o.sure);
  el.innerHTML = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  el.classList.toggle('az', o.basladi && s <= 10 && !o.bitti);
  el.classList.toggle('donuk', o.zaman < o.donukBitis);
}

function guclerYaz() {
  const duvarVar = o && o.tahta.duvar.some(Boolean);
  for (const [ad, id] of [['cekic', '#gucCekic'], ['kaldir', '#gucKaldir'], ['dondur', '#gucDondur']]) {
    const el = $(id);
    const n = durum.guc[ad];
    el.innerHTML = IKON[ad] + (n > 0 ? `<b>${n}</b>` : `<b class="fiyat">+</b>`);
    el.classList.toggle('secik', o && o.mod === ad);
    el.disabled = ad === 'cekic' && !duvarVar;
  }
}

function gucKullan(ad) {
  if (!o || o.bitti) return;
  sesHazirla();
  if (o.mod === ad) { o.mod = null; ipucuYaz(''); guclerYaz(); return; }
  if (durum.guc[ad] <= 0) return gucSatinAl(ad);
  if (ad === 'dondur') {
    if (!o.basladi) { ipucuYaz('Süre ilk hamlede başlar'); return; }
    durum.guc.dondur--;
    kaydet();
    o.donukBitis = Math.max(o.zaman, o.donukBitis) + 10000;
    ses.buz();
  } else {
    o.mod = ad;
    ipucuYaz(ad === 'cekic' ? 'Kırılacak taşa dokun' : 'Deliğine gidecek solucana dokun', 0);
  }
  guclerYaz();
}

function gucSatinAl(ad) {
  const ad2 = { cekic: 'Çekiç', kaldir: 'Kaldırıcı', dondur: 'Zaman dondurma' }[ad];
  const yeter = durum.jeton >= FIYAT[ad];
  pencere(`
    <div class="ikon">${IKON[ad].replace(/width="34" height="34"/, 'width="72" height="72"')}</div>
    <h2>${ad2}</h2>
    <div class="odul">${IKON.jeton(26)}${FIYAT[ad]}</div>
    <div class="dugmeler">
      <button class="buyuk" id="pAl" ${yeter ? '' : 'disabled style="opacity:.4"'}>Al</button>
      <button class="ikinci" id="pVazgec">Vazgeç</button>
    </div>`, {
    pAl: () => { if (!yeter) return; durum.jeton -= FIYAT[ad]; durum.guc[ad]++; kaydet(); pencereKapat(); guclerYaz(); gucKullan(ad); },
    pVazgec: pencereKapat,
  });
}

function solucanBul(fx, fy) {
  const t = o.tahta;
  const x = Math.floor(fx), y = Math.floor(fy);
  if (t.icinde(x, y) && t.dolu[t.i(x, y)] >= 0) {
    const g = t.geckolar[t.dolu[t.i(x, y)]];
    return { g, k: g.hucreler.findIndex(c => c[0] === x && c[1] === y) };
  }
  // Parmak tam üstüne gelmediyse en yakın parça (0.8 kare içinde)
  let enIyi = null, enYakin = 0.8;
  for (const g of t.geckolar) {
    if (g.bitti || g.giriyor) continue;
    g.hucreler.forEach((c, k) => {
      const m = Math.hypot(c[0] + 0.5 - fx, c[1] + 0.5 - fy);
      if (m < enYakin) { enYakin = m; enIyi = { g, k }; }
    });
  }
  return enIyi;
}

function isaretKare(e) {
  const c = $('#sahne');
  const r = c.getBoundingClientRect();
  const { cs, ox, oy } = o.yer;
  return [(e.clientX - r.left - ox) / cs, (e.clientY - r.top - oy) / cs];
}

function dokun(e) {
  if (!o || !o.yer || o.bitti || perdeAcik()) return;
  sesHazirla();
  const [fx, fy] = isaretKare(e);
  const t = o.tahta;
  if (o.mod === 'cekic') {
    const x = Math.floor(fx), y = Math.floor(fy);
    if (t.duvarKir(x, y)) {
      durum.guc.cekic--; kaydet();
      o.efektler.push({ tur: 'patla', x, y, renk: T.duvar, t0: o.zaman, sure: 500 });
      ses.kir();
      o.mod = null; ipucuYaz(''); guclerYaz();
    }
    return;
  }
  const bulunan = solucanBul(fx, fy);
  if (!bulunan) return;
  const { g, k } = bulunan;
  if (o.mod === 'kaldir') {
    ucur(g);
    return;
  }
  if (g.buz > 0) {
    ses.buz();
    ipucuYaz(`${g.buz} solucan daha çıkınca çözülür`);
    return;
  }
  if (!t.hareketli(g)) return;
  const son = k > (g.hucreler.length - 1) / 2;
  o.aktif = { g, son };
  o.isaret = [fx, fy];
  ses.tut();
  $('#sahne').setPointerCapture?.(e.pointerId);
}

function ucur(g) {
  const t = o.tahta;
  if (g.bitti || g.giriyor) return;
  const [hx, hy] = g.hucreler[0];
  const delikler = t.delikler.filter(d => d.renk === g.renk);
  if (!delikler.length) return;
  const d = delikler.reduce((a, b) => (Math.hypot(a.x - hx, a.y - hy) <= Math.hypot(b.x - hx, b.y - hy) ? a : b));
  for (const [x, y] of g.hucreler) t.dolu[t.i(x, y)] = -1;
  g.giriyor = { x: d.x, y: d.y, son: false };
  g.ucus = { t0: o.zaman, sure: 450, delik: d };
  durum.guc.kaldir--; kaydet();
  o.mod = null; ipucuYaz(''); guclerYaz();
  if (!o.basladi) o.basladi = true;
}

function adimAt() {
  const { g, son } = o.aktif;
  const t = o.tahta;
  if (!t.hareketli(g)) { o.aktif = null; return false; }
  const [lx, ly] = t.uc(g, son);
  const dx = o.isaret[0] - (lx + 0.5), dy = o.isaret[1] - (ly + 0.5);
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return false;
  const yatay = Math.abs(dx) >= Math.abs(dy);
  const denenecek = [yatay ? [Math.sign(dx), 0] : [0, Math.sign(dy)]];
  if ((yatay ? Math.abs(dy) : Math.abs(dx)) >= 0.5) denenecek.push(yatay ? [0, Math.sign(dy)] : [Math.sign(dx), 0]);
  for (const [ax, ay] of denenecek) {
    const r = t.oynat(g, son, ax, ay);
    if (!r) continue;
    if (!o.basladi) o.basladi = true;
    if (o.ipucu) { o.ipucu = null; ipucuYaz(''); }
    if (r.tur === 'delik') { o.aktif = null; g.girisZaman = o.zaman; }
    else ses.adim();
    return true;
  }
  return false;
}

function girdi(g, sonuc, d) {
  const t = o.tahta;
  ses.gir();
  o.efektler.push({ tur: 'patla', x: d.x, y: d.y, renk: T.renkler[g.renk], t0: o.zaman, sure: 550 });
  if (sonuc.saat) {
    o.sure += 20;
    o.efektler.push({ tur: 'yazi', yazi: '+20', x: d.x, y: d.y, renk: '#fff', t0: o.zaman, sure: 1100 });
  }
  if (sonuc.cozulen.length) setTimeout(ses.buz, 150);
  if (t.kazanildi()) { o.bitti = true; setTimeout(kazandi, 550); }
}

function kazandi() {
  ses.kazan();
  const odul = 10 + (o.sure / o.toplamSure > 0.4 ? 5 : 0);
  durum.jeton += odul;
  durum.bolum = Math.max(durum.bolum, o.no + 1);
  kaydet();
  const sonraki = o.no + 1;
  pencere(`
    <div class="ikon">${IKON.kupa}</div>
    <h2>Harika!</h2>
    <div class="odul">${IKON.jeton(28)}+${odul}</div>
    <div class="dugmeler">
      <button class="buyuk" id="pDevam">${IKON.oyna}Bölüm ${sonraki}</button>
      <button class="ikinci" id="pAna">Ana ekran</button>
    </div>`, {
    pDevam: () => bolumBaslat(sonraki),
    pAna: () => { pencereKapat(); goster('ana'); },
  });
}

function sureBitti() {
  o.bitti = true;
  o.aktif = null;
  ses.kaybet();
  const yeter = durum.jeton >= EK_SURE.fiyat;
  pencere(`
    <div class="ikon" style="color:var(--vurgu)">${IKON.saat}</div>
    <h2>Süre bitti</h2>
    <p>&nbsp;</p>
    <div class="dugmeler">
      <button class="buyuk" id="pEk" ${yeter ? '' : 'disabled style="opacity:.4"'}>+${EK_SURE.saniye} sn · ${IKON.jeton(22)}${EK_SURE.fiyat}</button>
      <button class="ikinci" id="pBirak">Vazgeç</button>
    </div>`, {
    pEk: () => {
      if (!yeter) return;
      durum.jeton -= EK_SURE.fiyat; kaydet();
      o.sure = EK_SURE.saniye; o.bitti = false;
      pencereKapat(); sureYaz();
    },
    pBirak: kaybetti,
  });
}

function kaybetti() {
  canKaybet();
  pencere(`
    <div class="ikon">${IKON.kirikKalp}</div>
    <h2>-1 can</h2>
    <div class="odul">${IKON.kalp(26)}${durum.can}</div>
    <div class="dugmeler">
      ${durum.can > 0 ? `<button class="buyuk" id="pTekrar">Tekrar dene</button>` : ''}
      <button class="ikinci" id="pAna">Ana ekran</button>
    </div>`, {
    pTekrar: () => bolumBaslat(o.no),
    pAna: () => { pencereKapat(); goster('ana'); },
  });
}

function canYok() {
  const yeter = durum.jeton >= CAN_FIYAT;
  pencere(`
    <div class="ikon">${IKON.kirikKalp}</div>
    <h2>Canın bitti</h2>
    <p>Yeni can: ${sonrakiCan()}</p>
    <div class="dugmeler">
      <button class="buyuk" id="pDoldur" ${yeter ? '' : 'disabled style="opacity:.4"'}>${IKON.kalp(22)}5 · ${IKON.jeton(22)}${CAN_FIYAT}</button>
      <button class="ikinci" id="pTamam">Tamam</button>
    </div>`, {
    pDoldur: () => { if (!yeter) return; durum.jeton -= CAN_FIYAT; durum.can = MAKS_CAN; durum.canZaman = 0; kaydet(); pencereKapat(); hapleriYaz(); goster('ana'); },
    pTamam: () => { pencereKapat(); goster('ana'); },
  });
}

function geriDon() {
  if (o && o.basladi && !o.bitti) {
    pencere(`
      <div class="ikon">${IKON.kirikKalp}</div>
      <h2>Çıkılsın mı?</h2>
      <p>1 can gider</p>
      <div class="dugmeler">
        <button class="buyuk" id="pKal">Devam et</button>
        <button class="ikinci" id="pCik">Çık</button>
      </div>`, {
      pKal: pencereKapat,
      pCik: () => { o.bitti = true; canKaybet(); pencereKapat(); goster('ana'); },
    });
    return;
  }
  if (o) o.bitti = true;
  goster('ana');
}

function ayarlar() {
  const temaDugme = ad => {
    const t = TEMALAR[ad];
    return `<button data-tema="${ad}" class="${t === T ? 'secik' : ''}" aria-label="${t.ad}" style="background:${t.arka}">
      <svg width="100%" height="100%" viewBox="0 0 60 40"><rect x="8" y="6" width="44" height="28" rx="6" fill="${t.tahta}" stroke="${t.kontur || t.cerceve}" stroke-width="3"/>
      <path d="M16 26h12v-10h14" stroke="${t.renkler[3]}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="42" cy="16" r="4.2" fill="${t.renkler[3]}"/></svg></button>`;
  };
  pencere(`
    <h2>Ayarlar</h2>
    <div class="satir"><span>Ses</span><button class="anahtar ${durum.ses ? 'acik' : ''}" id="pSes" aria-label="Ses"></button></div>
    <div class="temalar">${Object.keys(TEMALAR).map(temaDugme).join('')}</div>
    <div class="dugmeler"><button class="buyuk" id="pKapat">Tamam</button></div>`, {
    pSes: () => { durum.ses = !durum.ses; sesAyarla(durum.ses); kaydet(); $('#pSes').classList.toggle('acik', durum.ses); },
    pKapat: pencereKapat,
  });
  for (const b of document.querySelectorAll('[data-tema]')) {
    b.onclick = () => {
      durum.tema = b.dataset.tema; kaydet();
      T = TEMALAR[durum.tema];
      temaUygula();
      for (const x of document.querySelectorAll('[data-tema]')) x.classList.toggle('secik', x === b);
    };
  }
}

// ---------- Döngü ----------
let onceki = performance.now();
function kare(simdi) {
  requestAnimationFrame(kare);
  const dt = Math.min(0.05, (simdi - onceki) / 1000);
  onceki = simdi;
  guncelle(dt);
}

function guncelle(dt) {
  if (!o || !$('#oyun').classList.contains('acik')) return;
  o.zaman += dt * 1000;
  const t = o.tahta;

  if (o.aktif && !o.bitti) for (let k = 0; k < 2 && o.aktif && adimAt(); k++);

  // Deliğe girenler ve uçanlar
  for (const g of t.geckolar) {
    if (g.bitti) continue;
    if (g.ucus) {
      if (o.zaman - g.ucus.t0 >= g.ucus.sure) {
        const d = g.ucus.delik;
        const sonuc = t.bitir(g);
        girdi(g, sonuc, d);
      }
    } else if (g.giriyor) {
      g.girisBirikim = (g.girisBirikim || 0) + dt * 1000;
      while (g.giriyor && g.girisBirikim >= 28) {
        g.girisBirikim -= 28;
        const d = { x: g.giriyor.x, y: g.giriyor.y };
        const sonuc = t.girisAdimi(g);
        if (sonuc) girdi(g, sonuc, d);
      }
    }
  }

  // Görüntü konumları hedefe yumuşakça kayar
  const yumusak = 1 - Math.exp(-dt * 32);
  for (const g of t.geckolar) {
    if (g.bitti) continue;
    if (!g.goz || g.goz.length !== g.hucreler.length) g.goz = g.hucreler.map(([x, y]) => [x + 0.5, y + 0.5]);
    if (g.ucus) {
      const d = g.ucus.delik, k = 1 - Math.exp(-dt * 9);
      for (const p of g.goz) { p[0] += (d.x + 0.5 - p[0]) * k; p[1] += (d.y + 0.5 - p[1]) * k; }
      continue;
    }
    g.goz.forEach((p, i) => {
      p[0] += (g.hucreler[i][0] + 0.5 - p[0]) * yumusak;
      p[1] += (g.hucreler[i][1] + 0.5 - p[1]) * yumusak;
    });
  }

  // Süre
  if (o.basladi && !o.bitti && !perdeAcik() && o.zaman >= o.donukBitis) {
    o.sure -= dt;
    if (o.sure <= 0) { o.sure = 0; sureYaz(); sureBitti(); }
  }
  sureYaz();

  o.efektler = o.efektler.filter(e => o.zaman - e.t0 < e.sure);
  const c = $('#sahne');
  const { ctx, W, H } = tuvalHazirla(c);
  o.yer = yerlesim(t, W, H);
  ciz(ctx, W, H, {
    tahta: t, tema: T, karakter: K, yer: o.yer, zaman: o.zaman, secili: o.aktif?.g,
    efektler: o.efektler, ipucu: o.ipucu, cekicModu: o.mod === 'cekic',
  });
}

// Önizlemede test için (oyuna etkisi yok)
window.kk = { get o() { return o; }, durum, ilerlet: ms => { for (let t = 0; t < ms; t += 16) guncelle(0.016); } };

// ---------- Başlangıç ----------
function baslat() {
  temaUygula();
  $('#ayarBtn').innerHTML = IKON.ayar;
  $('#geriBtn').innerHTML = IKON.ev;
  $('#oyna').onclick = () => { sesHazirla(); ses.tik(); bolumBaslat(durum.bolum); };
  $('#ayarBtn').onclick = () => { sesHazirla(); ayarlar(); };
  $('#geriBtn').onclick = geriDon;
  $('#gucCekic').onclick = () => gucKullan('cekic');
  $('#gucKaldir').onclick = () => gucKullan('kaldir');
  $('#gucDondur').onclick = () => gucKullan('dondur');
  const sahne = $('#sahne');
  sahne.addEventListener('pointerdown', dokun);
  sahne.addEventListener('pointermove', e => { if (o?.aktif) o.isaret = isaretKare(e); });
  const birak = () => { if (o) o.aktif = null; };
  sahne.addEventListener('pointerup', birak);
  sahne.addEventListener('pointercancel', birak);
  window.addEventListener('resize', () => { if ($('#ana').classList.contains('acik')) anaCiz(); });
  setInterval(() => { if ($('#ana').classList.contains('acik')) hapleriYaz(); }, 1000);
  // Uygulama arka plana geçince süre durur (perde açılır)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && o && o.basladi && !o.bitti && !perdeAcik() && $('#oyun').classList.contains('acik')) {
      pencere(`<h2>Mola</h2><p>&nbsp;</p><div class="dugmeler"><button class="buyuk" id="pSur">${IKON.oyna}Devam</button></div>`, { pSur: pencereKapat });
    }
  });
  if (adres.get('ekran') === 'oyun') bolumBaslat(durum.bolum);
  else goster('ana');
  requestAnimationFrame(kare);
  if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
baslat();
