// Küçük sentez sesler (dosya indirmeden). iPhone'da ses ilk dokunuşla açılır.
let ac = null;
export let sesAcik = true;
export function sesAyarla(acik) { sesAcik = acik; }

export function sesHazirla() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  const C = window.AudioContext || window.webkitAudioContext;
  if (C) ac = new C();
}

function ton(frek, sure, { tur = 'sine', ses = 0.15, bitis = null, gecikme = 0 } = {}) {
  if (!sesAcik || !ac) return;
  const t = ac.currentTime + gecikme;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = tur;
  o.frequency.setValueAtTime(frek, t);
  if (bitis) o.frequency.exponentialRampToValueAtTime(bitis, t + sure);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(ses, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + sure + 0.02);
}

export const ses = {
  adim: () => ton(420 + Math.random() * 80, 0.05, { tur: 'triangle', ses: 0.04 }),
  tut: () => ton(300, 0.07, { tur: 'triangle', ses: 0.08, bitis: 420 }),
  gir: () => { ton(700, 0.18, { ses: 0.16, bitis: 180 }); ton(1200, 0.08, { tur: 'triangle', ses: 0.06, gecikme: 0.12 }); },
  buz: () => ton(1600, 0.25, { tur: 'triangle', ses: 0.07, bitis: 2400 }),
  kir: () => { ton(160, 0.15, { tur: 'square', ses: 0.08, bitis: 60 }); ton(90, 0.2, { ses: 0.15 }); },
  kazan: () => [523, 659, 784, 1047].forEach((f, i) => ton(f, 0.22, { tur: 'triangle', ses: 0.13, gecikme: i * 0.11 })),
  kaybet: () => [392, 330, 262].forEach((f, i) => ton(f, 0.3, { tur: 'triangle', ses: 0.12, gecikme: i * 0.16 })),
  tik: () => ton(1000, 0.04, { tur: 'square', ses: 0.03 }),
};
