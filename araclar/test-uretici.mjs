// Her bölümün çözülebildiğini kontrol eder: node araclar/test-uretici.mjs [ilk] [son]
import { Tahta } from '../js/motor.js';
import { bolumUret, serbestSayisi } from '../js/uretici.js';

const ilk = Number(process.argv[2]) || 1;
const son = Number(process.argv[3]) || 200;
let hata = 0;
const t0 = Date.now();

for (let no = ilk; no <= son; no++) {
  const b = bolumUret(no, true);
  if (!b) { console.log(`Bölüm ${no}: üretilemedi`); hata++; continue; }
  const t = new Tahta(b);
  const N = t.geckolar.length;
  const serbest = serbestSayisi(t);
  let sorun = null;
  for (let i = N - 1; i >= 0 && !sorun; i--) {
    const g = t.geckolar[i];
    const kayit = b._kayit[i];
    for (let k = kayit.length - 1; k >= 0; k--) {
      const { son: s, bosalan } = kayit[k];
      const [x, y] = t.uc(g, !s);
      if (!t.oynat(g, !s, bosalan[0] - x, bosalan[1] - y)) { sorun = `kertenkele ${i} geri dolaşamadı`; break; }
    }
    if (sorun) break;
    const d = t.delikler[b._kaynak[i]];
    let girdi = false;
    for (const s of [false, true]) {
      const [x, y] = t.uc(g, s);
      if (Math.abs(x - d.x) + Math.abs(y - d.y) === 1 && t.oynat(g, s, d.x - x, d.y - y)?.tur === 'delik') { girdi = true; break; }
    }
    if (!girdi) { sorun = `kertenkele ${i} deliğe giremedi`; break; }
    let guvenlik = 50;
    while (!g.bitti && guvenlik--) t.girisAdimi(g);
  }
  if (!sorun && !t.kazanildi()) sorun = 'bitmedi';
  if (sorun) { hata++; console.log(`Bölüm ${no}: HATA ${sorun}`); }
  if (no <= 12 || no % 20 === 0) {
    const buz = b.geckolar.filter(g => g.buz).length, bd = b.delikler.filter(d => d.buz).length;
    console.log(`Bölüm ${no}: ${b.w}x${b.h}, ${N} kertenkele, ${b.delikler.length} delik, ${b.duvarlar.length} taş, serbest ${serbest}, buz ${buz}/${bd}, ${b.sure} sn`);
  }
}
console.log(`${son - ilk + 1} bölüm, ${hata} hata, ${Date.now() - t0} ms`);
process.exit(hata ? 1 : 0);
