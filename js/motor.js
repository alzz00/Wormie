// Wormie oyun motoru: ızgara, solucan hareketi, delikler ve sayaçlı engeller.
// Tarayıcıda ve Node'da (testler) aynı şekilde çalışır; çizimle ilgili hiçbir şey içermez.

export const YONLER = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Tohumlu rastgele sayı: aynı bölüm numarası her zaman aynı bölümü verir.
export function rastgele(tohum) {
  let a = tohum >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// bolum: { w, h, duvarlar: [[x,y]], delikler: [{x,y,renk,buz}], geckolar: [{renk,hucreler,buz,saat}], sure }
// hucreler[0] başın (gözlerin) olduğu uç, son eleman kuyruk.
export class Tahta {
  constructor(bolum) {
    this.w = bolum.w;
    this.h = bolum.h;
    this.duvar = new Uint8Array(this.w * this.h);
    for (const [x, y] of bolum.duvarlar || []) this.duvar[this.i(x, y)] = 1;
    this.delikler = (bolum.delikler || []).map(d => ({ x: d.x, y: d.y, renk: d.renk, buz: d.buz || 0 }));
    this.delikHarita = new Map(this.delikler.map(d => [this.i(d.x, d.y), d]));
    this.dolu = new Int16Array(this.w * this.h).fill(-1);
    this.geckolar = [];
    this.giren = 0;
    for (const g of bolum.geckolar || []) this.geckoEkle(g);
  }

  i(x, y) { return y * this.w + x; }
  icinde(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  zemin(x, y) { return this.icinde(x, y) && !this.duvar[this.i(x, y)] && !this.delikHarita.has(this.i(x, y)); }
  bos(x, y) { return this.zemin(x, y) && this.dolu[this.i(x, y)] === -1; }

  geckoEkle(g) {
    const yeni = {
      id: this.geckolar.length,
      renk: g.renk,
      hucreler: g.hucreler.map(c => [c[0], c[1]]),
      buz: g.buz || 0,
      saat: !!g.saat,
      giriyor: null,
      bitti: false,
    };
    for (const [x, y] of yeni.hucreler) this.dolu[this.i(x, y)] = yeni.id;
    this.geckolar.push(yeni);
    return yeni;
  }

  // son=false: baş önde gider, son=true: kuyruk önde gider.
  uc(g, son) { return son ? g.hucreler[g.hucreler.length - 1] : g.hucreler[0]; }
  arka(g, son) { return son ? g.hucreler[0] : g.hucreler[g.hucreler.length - 1]; }

  hareketli(g) { return !g.bitti && !g.giriyor && g.buz <= 0; }

  // Hamle mümkün mü? null | 'adim' | 'delik'
  dene(g, son, dx, dy) {
    if (!this.hareketli(g)) return null;
    const [x, y] = this.uc(g, son);
    const nx = x + dx, ny = y + dy;
    if (!this.icinde(nx, ny)) return null;
    const k = this.i(nx, ny);
    if (this.duvar[k]) return null;
    const d = this.delikHarita.get(k);
    if (d) return d.renk === g.renk && d.buz <= 0 ? 'delik' : null;
    const o = this.dolu[k];
    if (o === -1) return 'adim';
    if (o === g.id && g.hucreler.length >= 4) {
      // Kendi kuyruğunun boşalttığı kareye girebilir (halka şeklinde dönüş).
      const [ax, ay] = this.arka(g, son);
      if (ax === nx && ay === ny) return 'adim';
    }
    return null;
  }

  oynat(g, son, dx, dy) {
    const sonuc = this.dene(g, son, dx, dy);
    if (!sonuc) return null;
    const [x, y] = this.uc(g, son);
    const nx = x + dx, ny = y + dy;
    if (sonuc === 'adim') {
      const h = g.hucreler;
      const bosalan = son ? h.shift() : h.pop();
      this.dolu[this.i(bosalan[0], bosalan[1])] = -1;
      if (son) h.push([nx, ny]); else h.unshift([nx, ny]);
      this.dolu[this.i(nx, ny)] = g.id;
      return { tur: 'adim', bosalan };
    }
    g.giriyor = { x: nx, y: ny, son };
    return { tur: 'delik' };
  }

  // Deliğe giren solucanın bir parçası daha içeri kayar. Tamamen girince bitir() sonucunu döner.
  girisAdimi(g) {
    if (!g.giriyor) return null;
    const { x, y, son } = g.giriyor;
    const h = g.hucreler;
    const bosalan = son ? h.shift() : h.pop();
    if (!(bosalan[0] === x && bosalan[1] === y)) this.dolu[this.i(bosalan[0], bosalan[1])] = -1;
    if (son) h.push([x, y]); else h.unshift([x, y]);
    if (h.every(c => c[0] === x && c[1] === y)) return this.bitir(g);
    return null;
  }

  // Solucanı tahtadan çıkarır, sayaçlı engelleri birer azaltır.
  bitir(g) {
    for (const [x, y] of g.hucreler) {
      const k = this.i(x, y);
      if (this.dolu[k] === g.id) this.dolu[k] = -1;
    }
    g.bitti = true;
    g.giriyor = null;
    this.giren++;
    const cozulen = [];
    for (const o of this.geckolar) if (!o.bitti && o.buz > 0) { o.buz--; if (!o.buz) cozulen.push(o); }
    for (const d of this.delikler) if (d.buz > 0) d.buz--;
    return { saat: g.saat, cozulen };
  }

  kazanildi() { return this.geckolar.every(g => g.bitti); }

  duvarKir(x, y) {
    if (!this.icinde(x, y) || !this.duvar[this.i(x, y)]) return false;
    this.duvar[this.i(x, y)] = 0;
    return true;
  }

  // Kaldırıcı: solucanı doğrudan deliğine yollar (buzlu olsa bile). Uygun delik yoksa false.
  delikVarMi(g) { return this.delikler.some(d => d.renk === g.renk); }
}
