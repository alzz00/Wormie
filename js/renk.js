// Renk yardımcıları
function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
// t > 0 açar, t < 0 koyulaştırır.
export function ton(hex, t) {
  const [r, g, b] = rgb(hex);
  const f = c => Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
