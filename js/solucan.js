// Solucan karakteri: baştan kuyruğa tek parça pürüzsüz gövde, iki ucu yuvarlak, önde sevimli bir yüz.
import { ton } from './renk.js';

// Karakter seçenekleri (oranlar kare boyuna göre)
export const KARAKTERLER = {
  halkali: { ad: 'Halkalı', W: 0.64, bas: 1.08, goz: 1.2, gozTip: 'yuvarlak', govde: 'halka', agiz: true, yanak: false },
  boncuk: { ad: 'Boncuk', W: 0.7, bas: 1.12, goz: 1.15, gozTip: 'yuvarlak', govde: 'boncuk', agiz: true, yanak: true },
  jole: { ad: 'Jöle', W: 0.6, bas: 1.04, goz: 1.0, gozTip: 'boncuk', govde: 'jole', agiz: false, yanak: true },
};
export const VARSAYILAN_KARAKTER = 'halkali';

// Hücre merkezlerinden (baş → kuyruk) köşeleri yuvarlatılmış, eşit aralıklı örnek noktalar.
function ornekle(pts, cs) {
  const n = pts.length;
  const kaba = [pts[0]];
  for (let i = 1; i < n - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const m1 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], m2 = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2];
    kaba.push(m1);
    for (let k = 1; k <= 6; k++) {
      const t = k / 6, u = 1 - t;
      kaba.push([u * u * m1[0] + 2 * u * t * b[0] + t * t * m2[0], u * u * m1[1] + 2 * u * t * b[1] + t * t * m2[1]]);
    }
  }
  kaba.push(pts[n - 1]);
  const adim = Math.max(2, cs * 0.09);
  const out = [{ x: kaba[0][0], y: kaba[0][1], s: 0 }];
  let s = 0, kalan = adim;
  for (let i = 1; i < kaba.length; i++) {
    const [ax, ay] = kaba[i - 1], [bx, by] = kaba[i];
    const seg = Math.hypot(bx - ax, by - ay);
    let pos = 0;
    while (seg - pos >= kalan) {
      pos += kalan; s += kalan;
      const t = pos / seg;
      out.push({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t, s });
      kalan = adim;
    }
    kalan -= seg - pos;
    s += seg - pos;
  }
  const son = kaba[kaba.length - 1], l = out[out.length - 1];
  if (Math.hypot(son[0] - l.x, son[1] - l.y) > 0.5) out.push({ x: son[0], y: son[1], s });
  return out;
}

// Gövde geometrisi: örnekler, normaller, genişlik fonksiyonu, baş konumu. Deliğe tamamen girmişse null.
export function geometri(pts, cs, K) {
  const o = ornekle(pts, cs);
  if (o.length < 3) return null;
  const W = cs * K.W;
  const kuyrukW = W * 0.82;
  // Kuyruk ucu yarım daire: son noktanın ötesine yarıçap kadar uzanır
  const a = o[o.length - 2], b = o[o.length - 1];
  const bl = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const R = kuyrukW / 2;
  for (let k = 1; k <= 5; k++) {
    const d = (R * k) / 5;
    o.push({ x: b.x + ((b.x - a.x) / bl) * d, y: b.y + ((b.y - a.y) / bl) * d, s: b.s + d });
  }
  for (let i = 0; i < o.length; i++) {
    const p = o[Math.max(0, i - 1)], q = o[Math.min(o.length - 1, i + 1)];
    const l = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    o[i].tx = (q.x - p.x) / l;
    o[i].ty = (q.y - p.y) / l;
    o[i].nx = -o[i].ty;
    o[i].ny = o[i].tx;
  }
  const L = o[o.length - 1].s;
  const Lgovde = b.s;
  const genislik = s => {
    if (s > Lgovde) { const d = s - Lgovde; return 2 * Math.sqrt(Math.max(0, R * R - d * d)); }
    const q = Lgovde > 0 ? s / Lgovde : 0;
    return W - (W - kuyrukW) * Math.max(0, (q - 0.55) / 0.45);   // arka yarıda hafifçe incelir
  };
  const ref = o[Math.min(o.length - 1, 4)];
  const fl = Math.hypot(o[0].x - ref.x, o[0].y - ref.y) || 1;
  const fx = (o[0].x - ref.x) / fl, fy = (o[0].y - ref.y) / fl;
  const bas = {
    x: o[0].x + fx * cs * 0.04, y: o[0].y + fy * cs * 0.04, fx, fy,
    rx: cs * 0.38 * K.bas, ry: cs * 0.37 * K.bas, aci: Math.atan2(fy, fx),
  };
  return { o, L, W, genislik, bas };
}

const ornekAl = (geo, s) => geo.o.reduce((en, p) => (Math.abs(p.s - s) < Math.abs(en.s - s) ? p : en), geo.o[0]);

// Gövde + baş tek yol. ek: toplam genişliğe eklenen piksel (eksi daraltır), dx/dy: kaydırma
function sekilYolu(ctx, geo, ek, dx, dy, basDahil = true) {
  const { o, genislik, bas } = geo;
  ctx.beginPath();
  for (let i = 0; i < o.length; i++) {
    const h = Math.max(0.3, (genislik(o[i].s) + ek) / 2);
    const x = o[i].x + o[i].nx * h + dx, y = o[i].y + o[i].ny * h + dy;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  for (let i = o.length - 1; i >= 0; i--) {
    const h = Math.max(0.3, (genislik(o[i].s) + ek) / 2);
    ctx.lineTo(o[i].x - o[i].nx * h + dx, o[i].y - o[i].ny * h + dy);
  }
  ctx.closePath();
  if (!basDahil) return;
  const rx = Math.max(1, bas.rx + ek / 2), ry = Math.max(1, bas.ry + ek / 2);
  ctx.moveTo(bas.x + dx + Math.cos(bas.aci) * rx, bas.y + dy + Math.sin(bas.aci) * rx);
  ctx.ellipse(bas.x + dx, bas.y + dy, rx, ry, bas.aci, 0, Math.PI * 2);
}

// Gövde ve baş ayrı ayrı doldurulur (tek yolda üst üste binince delik açılabiliyor)
function katman(ctx, geo, renk, ek = 0, dx = 0, dy = 0) {
  ctx.fillStyle = renk;
  sekilYolu(ctx, geo, ek, dx, dy, false);
  ctx.fill();
  basYolu(ctx, geo, ek, dx, dy);
  ctx.fill();
}

function basYolu(ctx, geo, ek, dx, dy) {
  const { bas } = geo;
  ctx.beginPath();
  ctx.ellipse(bas.x + dx, bas.y + dy, Math.max(1, bas.rx + ek / 2), Math.max(1, bas.ry + ek / 2), bas.aci, 0, Math.PI * 2);
}

// Sadece gövdenin içine çizilen katman (kuyruk ucundan taşmaz)
function govdeIci(ctx, geo, ciz) {
  ctx.save();
  sekilYolu(ctx, geo, 0, 0, 0, false);
  ctx.clip();
  ciz();
  ctx.restore();
}

// Tek boncuk (Boncuk gövdesi): koyu kenar, karın tonu, üst renk, parlama
function boncuk(ctx, x, y, r, renk, T, cs) {
  const daire = (cx, cy, rr, f) => { ctx.fillStyle = f; ctx.beginPath(); ctx.arc(cx, cy, Math.max(0.5, rr), 0, Math.PI * 2); ctx.fill(); };
  daire(x, y, r + cs * (T.kontur ? 0.06 : 0.035), T.kontur || ton(renk, -0.45));
  daire(x, y, r, ton(renk, -0.2));
  daire(x, y - r * 0.12, r * 0.84, renk);
  ctx.save();
  ctx.globalAlpha *= T.parlama;
  ctx.fillStyle = ton(renk, 0.6);
  ctx.beginPath();
  ctx.ellipse(x - r * 0.25, y - r * 0.45, r * 0.38, r * 0.2, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function golgeCiz(ctx, geo, T, cs) {
  katman(ctx, geo, T.golge, 0, T.kontur ? cs * 0.08 : cs * 0.05, T.kontur ? cs * 0.08 : cs * 0.12);
}

export function solucanCiz(ctx, geo, K, T, cs, renk, { secili = false } = {}) {
  const { W, genislik, bas, L } = geo;
  if (secili) {
    ctx.save();
    ctx.globalAlpha *= 0.45;
    katman(ctx, geo, '#ffffff', cs * 0.22);
    ctx.restore();
  }

  if (K.govde === 'boncuk') {
    // Kuyruktan başa doğru üst üste binen boncuklar
    const adim = cs * 0.42;
    const yerler = [];
    for (let s = L - genislik(L - 1) / 2 - cs * 0.12; s > cs * 0.25; s -= adim) yerler.push(s);
    for (const s of yerler) {
      const p = ornekAl(geo, s);
      boncuk(ctx, p.x, p.y, genislik(Math.min(s, L - cs * 0.3)) * 0.56, renk, T, cs);
    }
  } else {
    // Hacim: koyu kenar → karın tonu → üst renk (yukarı kaymış) → parlama
    katman(ctx, geo, T.kontur || ton(renk, -0.45), cs * (T.kontur ? 0.12 : 0.07));
    const govdeDoldur = (f, ek, dx, dy) => { ctx.fillStyle = f; sekilYolu(ctx, geo, ek, dx, dy, false); ctx.fill(); };
    govdeDoldur(ton(renk, K.govde === 'jole' ? -0.15 : -0.2), 0, 0, 0);
    govdeIci(ctx, geo, () => {
      if (K.govde === 'jole') {
        // Başta koyu, kuyruğa doğru açılan iki tonlu şeker solucan
        const { o } = geo;
        const gr = ctx.createLinearGradient(o[0].x, o[0].y, o[o.length - 1].x, o[o.length - 1].y);
        gr.addColorStop(0, renk);
        gr.addColorStop(1, ton(renk, 0.45));
        govdeDoldur(gr, -W * 0.16, 0, -W * 0.06);
      } else {
        govdeDoldur(renk, -W * 0.18, 0, -W * 0.07);
      }
      if (K.govde === 'halka') {
        // Kalın bel halkası (kemer) ve ince gövde halkaları
        const kemer0 = cs * 0.62, kemer1 = cs * 0.98;
        ctx.lineCap = 'round';
        for (let s = cs * 0.45; s < L - cs * 0.2; s += cs * 0.2) {
          const p = ornekAl(geo, s), w = genislik(s);
          const kemer = s >= kemer0 && s <= kemer1;
          ctx.strokeStyle = kemer ? ton(renk, 0.28) : ton(renk, -0.3);
          ctx.lineWidth = kemer ? cs * 0.16 : Math.max(1, cs * 0.028);
          ctx.globalAlpha = kemer ? 1 : 0.75;
          const h = w * (kemer ? 0.5 : 0.44);
          ctx.beginPath();
          ctx.moveTo(p.x + p.nx * h, p.y + p.ny * h);
          ctx.quadraticCurveTo(p.x + p.tx * cs * 0.05, p.y + p.ty * cs * 0.05 - W * 0.06, p.x - p.nx * h, p.y - p.ny * h);
          ctx.stroke();
          ctx.globalAlpha = 1;
          if (kemer) s += cs * 0.16;
        }
      }
      ctx.globalAlpha *= T.parlama;
      govdeDoldur(ton(renk, 0.6), -W * 0.74, -W * 0.03, -W * 0.18);
    });
    if (K.govde === 'jole') {
      // Şeker taneleri
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (let s = cs * 0.5, k = 0; s < L - cs * 0.15; s += cs * 0.13, k++) {
        const p = ornekAl(geo, s), w = genislik(s);
        const yan = ((k * 7) % 5) / 5 - 0.4;
        ctx.fillRect(p.x + p.nx * yan * w * 0.8 - 1, p.y + p.ny * yan * w * 0.8 - 1, Math.max(1.5, cs * 0.03), Math.max(1.5, cs * 0.03));
      }
    }
  }

  // Baş
  const { x: hx, y: hy, fx, fy, rx, ry } = bas;
  if (K.govde === 'boncuk') {
    boncuk(ctx, hx, hy, Math.max(rx, ry), renk, T, cs);
  } else {
    const elips = (ek, dy, f) => {
      ctx.fillStyle = f;
      ctx.beginPath();
      ctx.ellipse(hx, hy + dy, Math.max(1, rx + ek / 2), Math.max(1, ry + ek / 2), bas.aci, 0, Math.PI * 2);
      ctx.fill();
    };
    elips(cs * (T.kontur ? 0.12 : 0.07), 0, T.kontur || ton(renk, -0.45));
    elips(0, 0, ton(renk, -0.2));
    elips(-W * 0.18, -W * 0.07, renk);
    ctx.save();
    ctx.globalAlpha *= T.parlama;
    ctx.fillStyle = ton(renk, 0.6);
    ctx.beginPath();
    ctx.ellipse(hx - rx * 0.2, hy - ry * 0.5, rx * 0.36, ry * 0.18, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Yüz: gözler bakış yönünde, altında küçük gülümseme
  const qx = -fy, qy = fx;
  if (K.yanak) {
    ctx.fillStyle = 'rgba(255,110,150,0.5)';
    for (const yan of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(hx + fx * rx * 0.25 + qx * yan * ry * 0.66, hy + fy * rx * 0.25 + qy * yan * ry * 0.66 + cs * 0.03, cs * 0.075, cs * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const r = cs * 0.12 * K.goz;
  for (const yan of [-1, 1]) {
    const ex = hx + fx * rx * 0.18 + qx * yan * ry * 0.42;
    const ey = hy + fy * rx * 0.18 + qy * yan * ry * 0.42 - cs * 0.04;
    if (K.gozTip === 'boncuk') {
      ctx.fillStyle = '#17110c';
      ctx.beginPath(); ctx.arc(ex, ey, r * 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ex - r * 0.25, ey - r * 0.3, r * 0.28, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ex + r * 0.28, ey + r * 0.25, r * 0.12, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = T.kontur || ton(renk, -0.55);
      ctx.beginPath(); ctx.arc(ex, ey, r + cs * 0.03, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#17110c';
      ctx.beginPath(); ctx.arc(ex + fx * r * 0.32, ey + fy * r * 0.32, r * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ex + fx * r * 0.12 - r * 0.15, ey + fy * r * 0.12 - r * 0.22, r * 0.2, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (K.agiz) {
    const mx = hx + fx * rx * 0.55, my = hy + fy * rx * 0.55 + cs * 0.02;
    ctx.strokeStyle = T.kontur || ton(renk, -0.6);
    ctx.lineWidth = Math.max(1, cs * 0.035);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mx + qx * ry * 0.22, my + qy * ry * 0.22);
    ctx.quadraticCurveTo(mx + fx * rx * 0.2, my + fy * rx * 0.2, mx - qx * ry * 0.22, my - qy * ry * 0.22);
    ctx.stroke();
  }
  return ornekAl(geo, L * 0.5);
}

// Buz kabuğu: gövdenin üstüne yarı saydam açık mavi katman
export function buzCiz(ctx, geo, cs) {
  ctx.save();
  ctx.globalAlpha *= 0.62;
  katman(ctx, geo, '#d4f3ff', cs * 0.14);
  ctx.restore();
}
