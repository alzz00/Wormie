// Bölüm üretici. Her bölüm tersten kurulur: solucanlar sırayla deliklerinden çıkıp tahtada dolaşır.
// Bu yüzden her bölümün kesin bir çözümü vardır (sondan başa: dolaşmayı geri al, deliğe gir).
import { Tahta, YONLER, rastgele } from './motor.js';

export const RENK_SAYISI = 8;

// Bölüm numarasına göre zorluk ayarları.
export function ayarlar(no) {
  if (no === 1) return { w: 5, h: 6, renk: 1, gecko: 1, uzun: [4, 4], duvar: 0, dolum: 0.2, kaydir: 4, kapali: 0 };
  if (no === 2) return { w: 5, h: 7, renk: 2, gecko: 2, uzun: [4, 5], duvar: 0, dolum: 0.3, kaydir: 6, kapali: 0 };
  if (no === 3) return { w: 6, h: 7, renk: 2, gecko: 3, uzun: [4, 5], duvar: 0, dolum: 0.4, kaydir: 8, kapali: 0.3 };
  if (no === 4) return { w: 6, h: 8, renk: 3, gecko: 4, uzun: [3, 5], duvar: 2, dolum: 0.45, kaydir: 10, kapali: 0.3 };
  const zor = Math.min(1, (no - 4) / 90);          // 0 → 1 arası, ~94. bölümde tavan
  const tepe = no % 10 === 0 ? 0.15 : 0;           // her 10. bölüm biraz daha zor
  const z = Math.min(1, zor + tepe);
  const w = Math.min(11, 6 + Math.round(z * 5));
  const h = Math.min(14, w + 2 + Math.round(z));
  return {
    w, h,
    renk: Math.min(7, 3 + Math.floor(no / 6)),
    gecko: 40,
    uzun: [3, 5 + Math.round(z * 5)],
    duvar: Math.round(w * h * (0.02 + 0.04 * z)),
    dolum: 0.5 + 0.22 * z,
    kaydir: 14 + Math.round(z * 30),
    kapali: 0.35 + 0.4 * z,
    buzGecko: no >= 8 ? 0.12 + 0.1 * z : 0,
    buzDelik: no >= 12 ? 0.18 : 0,
    saat: no >= 6 ? 0.1 : 0,
    zor: z,
  };
}

const anahtar = (x, y) => x + ',' + y;

function karistir(dizi, r) {
  for (let i = dizi.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [dizi[i], dizi[j]] = [dizi[j], dizi[i]];
  }
  return dizi;
}

// Kenar karesinin tahtanın içine bakan komşusu.
function icKomsu(w, h, x, y) {
  if (x === 0) return [1, y];
  if (x === w - 1) return [w - 2, y];
  if (y === 0) return [x, 1];
  return [x, h - 2];
}

function tekDeneme(a, r, kayitTut) {
  const { w, h } = a;

  // 1) Delikler: köşeler hariç kenar kareleri, her renge en az bir tane.
  const kenar = [];
  for (let x = 1; x < w - 1; x++) kenar.push([x, 0], [x, h - 1]);
  for (let y = 1; y < h - 1; y++) kenar.push([0, y], [w - 1, y]);
  karistir(kenar, r);
  const renkler = karistir([...Array(RENK_SAYISI).keys()], r).slice(0, a.renk);
  const delikSayisi = Math.min(kenar.length, a.renk + Math.round(a.renk * (0.3 + r() * 0.4)));
  const delikler = [];
  for (let i = 0; i < delikSayisi; i++) {
    const [x, y] = kenar[i];
    delikler.push({ x, y, renk: renkler[i % renkler.length], buz: 0 });
  }
  const delikKomsu = new Set(delikler.map(d => anahtar(...icKomsu(w, h, d.x, d.y))));

  // 2) Taşlar: iç karelere, delik ağızlarını kapatmadan.
  const duvarlar = [];
  const ic = [];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (!delikKomsu.has(anahtar(x, y))) ic.push([x, y]);
  karistir(ic, r);
  for (let i = 0; i < Math.min(a.duvar, ic.length); i++) duvarlar.push(ic[i]);

  const t = new Tahta({ w, h, duvarlar, delikler });
  if (!bagliMi(t)) return null;

  // 3) Solucanlar: delikten çıkar, sonra dolaş.
  let zeminSayisi = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (t.zemin(x, y)) zeminSayisi++;
  const hedefDolu = Math.round(zeminSayisi * a.dolum);
  let dolu = 0;
  const kaynak = [];   // her solucanın çıktığı delik
  const kayit = [];    // her solucanın dolaşma hamleleri (test için)
  let hata = 0;
  while (dolu < hedefDolu && t.geckolar.length < a.gecko && hata < 30) {
    const renk = renkler[t.geckolar.length % renkler.length];
    const adaylar = t.delikler.filter(d => d.renk === renk && t.bos(...icKomsu(w, h, d.x, d.y)));
    if (!adaylar.length) { hata++; continue; }
    const delik = adaylar[Math.floor(r() * adaylar.length)];
    const L = a.uzun[0] + Math.floor(r() * (a.uzun[1] - a.uzun[0] + 1));
    const yol = yuru(t, icKomsu(w, h, delik.x, delik.y), Math.min(L, hedefDolu - dolu + 2), r);
    if (yol.length < 3) { hata++; continue; }
    const g = t.geckoEkle({ renk, hucreler: r() < 0.5 ? yol : yol.slice().reverse() });
    kaynak.push(delik);
    kayit.push(dolas(t, g, delik, a.kaydir, r, kayitTut));
    dolu += yol.length;
  }
  if (!t.geckolar.length) return null;

  // 4) Sayaçlı engeller. i. solucan çözümde (N-1-i). sırada çıkar; sayaçlar bundan büyük olamaz.
  const N = t.geckolar.length;
  const bolumGeckolar = t.geckolar.map((g, i) => {
    const once = N - 1 - i;
    let buz = 0;
    if (a.buzGecko && once >= 1 && r() < a.buzGecko) buz = 1 + Math.floor(r() * Math.min(once, 5));
    return { renk: g.renk, hucreler: g.hucreler.map(c => [...c]), buz, saat: !buz && a.saat > 0 && r() < a.saat };
  });
  const bolumDelikler = t.delikler.map(d => {
    let enErken = N - 1;
    kaynak.forEach((k, i) => { if (k === d) enErken = Math.min(enErken, N - 1 - i); });
    let buz = 0;
    if (a.buzDelik && enErken >= 1 && r() < a.buzDelik) buz = 1 + Math.floor(r() * Math.min(enErken, 4));
    return { x: d.x, y: d.y, renk: d.renk, buz };
  });
  const toplamUzun = bolumGeckolar.reduce((s, g) => s + g.hucreler.length, 0);
  const sure = Math.ceil(((20 + N * 4 + toplamUzun * 0.9) * (1.25 - 0.3 * (a.zor || 0))) / 5) * 5;
  return {
    w, h, duvarlar, delikler: bolumDelikler, geckolar: bolumGeckolar, sure,
    _kaynak: kaynak.map(d => t.delikler.indexOf(d)), _kayit: kayitTut ? kayit : null,
  };
}

// Zemin kareleri tek parça mı?
function bagliMi(t) {
  let bas = null, toplam = 0;
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) if (t.zemin(x, y)) { toplam++; bas = bas || [x, y]; }
  if (!bas) return false;
  const gor = new Set([anahtar(...bas)]);
  const kuyruk = [bas];
  while (kuyruk.length) {
    const [x, y] = kuyruk.pop();
    for (const [dx, dy] of YONLER) {
      const k = anahtar(x + dx, y + dy);
      if (t.zemin(x + dx, y + dy) && !gor.has(k)) { gor.add(k); kuyruk.push([x + dx, y + dy]); }
    }
  }
  return gor.size === toplam;
}

// Boş karelerde kendini kesmeyen kıvrımlı yol.
function yuru(t, bas, L, r) {
  if (!t.bos(...bas)) return [];
  const yol = [bas];
  const kullan = new Set([anahtar(...bas)]);
  let yon = null;
  while (yol.length < L) {
    const [x, y] = yol[yol.length - 1];
    const aday = YONLER.filter(([dx, dy]) => t.bos(x + dx, y + dy) && !kullan.has(anahtar(x + dx, y + dy)));
    if (!aday.length) break;
    const duz = yon && aday.find(d => d[0] === yon[0] && d[1] === yon[1]);
    yon = duz && r() < 0.5 ? duz : aday[Math.floor(r() * aday.length)];
    const yeni = [x + yon[0], y + yon[1]];
    yol.push(yeni);
    kullan.add(anahtar(...yeni));
  }
  return yol;
}

// Solucanı deliğinden uzaklaştıracak şekilde rastgele dolaştırır.
function dolas(t, g, delik, adim, r, kayitTut) {
  const kayit = [];
  let son = r() < 0.5;
  let sonYon = null;
  for (let s = 0; s < adim; s++) {
    if (r() < 0.12) son = !son;
    let secenek = secenekler(t, g, son, delik, sonYon);
    if (!secenek.length) { son = !son; sonYon = null; secenek = secenekler(t, g, son, delik, sonYon); }
    if (!secenek.length) break;
    let toplam = secenek.reduce((s2, c) => s2 + c.agirlik, 0);
    let x = r() * toplam;
    let secilen = secenek[0];
    for (const c of secenek) { x -= c.agirlik; if (x <= 0) { secilen = c; break; } }
    const sonuc = t.oynat(g, son, secilen.dx, secilen.dy);
    sonYon = [secilen.dx, secilen.dy];
    if (kayitTut) kayit.push({ son, bosalan: sonuc.bosalan });
  }
  return kayit;
}

function secenekler(t, g, son, delik, sonYon) {
  const [x, y] = t.uc(g, son);
  const once = Math.abs(x - delik.x) + Math.abs(y - delik.y);
  const liste = [];
  for (const [dx, dy] of YONLER) {
    if (t.dene(g, son, dx, dy) !== 'adim') continue;
    const sonra = Math.abs(x + dx - delik.x) + Math.abs(y + dy - delik.y);
    let agirlik = sonra > once ? 3 : sonra === once ? 1.4 : 0.6;
    if (sonYon && sonYon[0] === dx && sonYon[1] === dy) agirlik *= 1.6;
    liste.push({ dx, dy, agirlik });
  }
  return liste;
}

// Kaç solucan hemen deliğine gidebilir? (kaba tahmin: ucundan boş karelerle uygun deliğe yol var mı)
export function serbestSayisi(t) {
  let n = 0;
  for (const g of t.geckolar) {
    if (g.bitti || g.buz > 0) continue;
    if ([false, true].some(son => yolVar(t, g, son))) n++;
  }
  return n;
}

function yolVar(t, g, son) {
  const bas = t.uc(g, son);
  const gor = new Set([anahtar(...bas)]);
  const kuyruk = [bas];
  while (kuyruk.length) {
    const [x, y] = kuyruk.shift();
    for (const [dx, dy] of YONLER) {
      const nx = x + dx, ny = y + dy;
      if (!t.icinde(nx, ny)) continue;
      const d = t.delikHarita.get(t.i(nx, ny));
      if (d && d.renk === g.renk && d.buz <= 0) return true;
      const k = anahtar(nx, ny);
      if (!gor.has(k) && t.bos(nx, ny)) { gor.add(k); kuyruk.push([nx, ny]); }
    }
  }
  return false;
}

const onbellek = new Map();

export function bolumUret(no, kayitTut = false) {
  if (!kayitTut && onbellek.has(no)) return onbellek.get(no);
  const a = ayarlar(no);
  let enIyi = null;
  for (let deneme = 0; deneme < 40; deneme++) {
    const r = rastgele(no * 7919 + deneme * 104729 + 17);
    const b = tekDeneme(a, r, kayitTut);
    if (!b) continue;
    const t = new Tahta(b);
    const N = t.geckolar.length;
    const serbest = serbestSayisi(t);
    if (!serbest) continue;
    const kapaliOran = 1 - serbest / N;
    const dolulukPuan = Math.min(1, b.geckolar.reduce((s, g) => s + g.hucreler.length, 0) / (a.dolum * a.w * a.h));
    const puan = dolulukPuan * 2 + Math.min(kapaliOran, a.kapali) * 3;
    if (!enIyi || puan > enIyi.puan) enIyi = { b, puan };
    if (dolulukPuan > 0.85 && kapaliOran >= a.kapali) break;
  }
  const sonuc = enIyi && enIyi.b;
  if (!kayitTut) onbellek.set(no, sonuc);
  return sonuc;
}
