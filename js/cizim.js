import { ton } from './renk.js';
import { geometri, golgeCiz, solucanCiz, buzCiz } from './solucan.js';

export { ton };

// Tahtayı ve solucanları canvas'a çizer. Oyun durumunu değiştirmez.

export function yerlesim(tahta, W, H) {
  const pay = 0.9; // çerçeve payı (kare cinsinden)
  const cs = Math.max(12, Math.floor(Math.min(W / (tahta.w + pay), H / (tahta.h + pay))));
  return { cs, ox: Math.round((W - tahta.w * cs) / 2), oy: Math.round((H - tahta.h * cs) / 2) };
}

function yuvarlakDortgen(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// sahne: { tahta, tema, karakter, yer, zaman, secili, efektler, ipucu, cekicModu }
export function ciz(ctx, W, H, sahne) {
  const { tahta: t, tema: T, yer } = sahne;
  const { cs, ox, oy } = yer;
  ctx.clearRect(0, 0, W, H);
  const merkez = (x, y) => [ox + (x + 0.5) * cs, oy + (y + 0.5) * cs];

  // Tahta ve çerçeve
  const f = cs * 0.32;
  const bw = t.w * cs, bh = t.h * cs;
  if (T.kontur) {
    ctx.fillStyle = T.kontur;
    yuvarlakDortgen(ctx, ox - f + 7, oy - f + 7, bw + 2 * f, bh + 2 * f, cs * 0.3);
    ctx.fill();
  } else {
    ctx.fillStyle = T.golge;
    yuvarlakDortgen(ctx, ox - f, oy - f + cs * 0.22, bw + 2 * f, bh + 2 * f, cs * 0.4);
    ctx.fill();
  }
  ctx.fillStyle = T.cerceve;
  yuvarlakDortgen(ctx, ox - f, oy - f, bw + 2 * f, bh + 2 * f, cs * 0.4);
  ctx.fill();
  ctx.strokeStyle = T.cerceveUst;
  ctx.lineWidth = Math.max(1.5, cs * 0.05);
  yuvarlakDortgen(ctx, ox - f + ctx.lineWidth, oy - f + ctx.lineWidth, bw + 2 * f - 2 * ctx.lineWidth, bh + 2 * f - 2 * ctx.lineWidth, cs * 0.36);
  ctx.stroke();
  const gr = ctx.createLinearGradient(0, oy, 0, oy + bh);
  gr.addColorStop(0, T.tahtaUst);
  gr.addColorStop(1, T.tahta);
  ctx.fillStyle = gr;
  yuvarlakDortgen(ctx, ox, oy, bw, bh, cs * 0.18);
  ctx.fill();

  // Izgara
  ctx.strokeStyle = T.izgara;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 1; x < t.w; x++) { ctx.moveTo(ox + x * cs + 0.5, oy); ctx.lineTo(ox + x * cs + 0.5, oy + bh); }
  for (let y = 1; y < t.h; y++) { ctx.moveTo(ox, oy + y * cs + 0.5); ctx.lineTo(ox + bw, oy + y * cs + 0.5); }
  ctx.stroke();

  // Delik tabanları
  for (const d of t.delikler) {
    const renk = T.renkler[d.renk];
    const x = ox + d.x * cs, y = oy + d.y * cs, p = cs * 0.06;
    ctx.fillStyle = ton(renk, -0.35);
    yuvarlakDortgen(ctx, x + p, y + p + cs * 0.05, cs - 2 * p, cs - 2 * p, cs * 0.16);
    ctx.fill();
    ctx.fillStyle = renk;
    yuvarlakDortgen(ctx, x + p, y + p, cs - 2 * p, cs - 2 * p, cs * 0.16);
    ctx.fill();
    if (T.kontur) { ctx.strokeStyle = T.kontur; ctx.lineWidth = cs * 0.06; ctx.stroke(); }
  }

  // Taşlar
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) {
    if (!t.duvar[t.i(x, y)]) continue;
    const px = ox + x * cs, py = oy + y * cs, p = cs * 0.07;
    ctx.fillStyle = ton(T.duvar, -0.35);
    yuvarlakDortgen(ctx, px + p, py + p + cs * 0.08, cs - 2 * p, cs - 2 * p, cs * 0.2);
    ctx.fill();
    ctx.fillStyle = T.duvar;
    yuvarlakDortgen(ctx, px + p, py + p, cs - 2 * p, cs - 2 * p, cs * 0.2);
    ctx.fill();
    ctx.fillStyle = T.duvarUst;
    yuvarlakDortgen(ctx, px + p * 2, py + p * 1.6, cs - 4 * p, cs * 0.35, cs * 0.14);
    ctx.fill();
    if (T.kontur) { ctx.strokeStyle = T.kontur; ctx.lineWidth = cs * 0.06; yuvarlakDortgen(ctx, px + p, py + p, cs - 2 * p, cs - 2 * p, cs * 0.2); ctx.stroke(); }
    if (sahne.cekicModu) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = cs * 0.06;
      ctx.setLineDash([cs * 0.12, cs * 0.1]);
      yuvarlakDortgen(ctx, px + p, py + p, cs - 2 * p, cs - 2 * p, cs * 0.2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Solucanlar: önce gölgeler, sonra gövdeler
  const K = sahne.karakter;
  const canli = t.geckolar.filter(g => !g.bitti && g.goz);
  const geolar = new Map();
  for (const g of canli) {
    const geo = geometri(g.goz.map(([x, y]) => [ox + x * cs, oy + y * cs]), cs, K);
    if (geo) geolar.set(g, geo);
  }
  for (const [g, geo] of geolar) if (!g.ucus) golgeCiz(ctx, geo, T, cs);
  for (const [g, geo] of geolar) {
    ctx.save();
    if (g.ucus) ctx.globalAlpha = 1 - Math.min(1, (sahne.zaman - g.ucus.t0) / g.ucus.sure) ** 2;
    const orta = solucanCiz(ctx, geo, K, T, cs, T.renkler[g.renk], { secili: sahne.secili === g });
    if (g.buz > 0) {
      buzCiz(ctx, geo, cs);
      rozet(ctx, orta.x, orta.y, cs, String(g.buz), '#e8f8ff', '#2a6d8f', T);
    } else if (g.saat) {
      rozet(ctx, orta.x, orta.y, cs, '', '#fffdf5', '#333', T);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = cs * 0.045;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(orta.x, orta.y - cs * 0.13);
      ctx.lineTo(orta.x, orta.y);
      ctx.lineTo(orta.x + cs * 0.1, orta.y + cs * 0.04);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Delik ağızları (giren solucanın üstünü örter)
  for (const d of t.delikler) {
    const [cx, cy] = merkez(d.x, d.y);
    const r = cs * 0.31;
    const ag = ctx.createRadialGradient(cx, cy - r * 0.3, r * 0.1, cx, cy, r);
    ag.addColorStop(0, T.agiz);
    ag.addColorStop(1, ton(T.renkler[d.renk], -0.7));
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = T.kontur || ton(T.renkler[d.renk], 0.35);
    ctx.lineWidth = cs * 0.05;
    ctx.stroke();
    if (d.buz > 0) buzKutu(ctx, ox + d.x * cs, oy + d.y * cs, cs, d.buz, T);
  }

  // Efektler
  const simdi = sahne.zaman;
  for (const e of sahne.efektler || []) {
    const p = (simdi - e.t0) / e.sure;
    if (p < 0 || p > 1) continue;
    const [cx, cy] = merkez(e.x, e.y);
    if (e.tur === 'patla') {
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2 + e.x;
        const rr = cs * (0.3 + p * 1.1);
        ctx.globalAlpha = 1 - p;
        ctx.fillStyle = k % 3 ? e.renk : '#fff';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, cs * 0.09 * (1 - p * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (e.tur === 'yazi') {
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = e.renk;
      ctx.font = `${Math.round(cs * 0.5)}px ${T.font}`;
      ctx.textAlign = 'center';
      ctx.fillText(e.yazi, cx, cy - cs * (0.4 + p * 0.8));
      ctx.globalAlpha = 1;
    }
  }

  // İlk bölüm ipucu: parmak başlangıçtan deliğe kayar
  if (sahne.ipucu) {
    const { bas, bit } = sahne.ipucu;
    const p = (simdi % 1600) / 1600;
    const q = Math.min(1, p * 1.4);
    const [ax, ay] = merkez(...bas), [bx, by] = merkez(...bit);
    const x = ax + (bx - ax) * q, y = ay + (by - ay) * q;
    ctx.globalAlpha = p > 0.85 ? (1 - p) / 0.15 : 1;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + cs * 0.15, y + cs * 0.2, cs * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function rozet(ctx, x, y, cs, yazi, zemin, renk, T) {
  ctx.fillStyle = zemin;
  ctx.strokeStyle = T.kontur || renk;
  ctx.lineWidth = cs * 0.05;
  ctx.beginPath();
  ctx.arc(x, y, cs * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (yazi) {
    ctx.fillStyle = renk;
    ctx.font = `${Math.round(cs * 0.3)}px ${T.font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(yazi, x, y + cs * 0.02);
  }
}

function buzKutu(ctx, x, y, cs, sayi, T) {
  const p = cs * 0.05;
  ctx.fillStyle = 'rgba(205,240,255,0.88)';
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = cs * 0.05;
  yuvarlakDortgen(ctx, x + p, y + p, cs - 2 * p, cs - 2 * p, cs * 0.16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2a6d8f';
  ctx.font = `${Math.round(cs * 0.42)}px ${T.font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(sayi), x + cs / 2, y + cs / 2 + cs * 0.02);
}
