export const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};
/** کمان از a0 تا a1 (درجه؛ ۰ = بالا، ساعت‌گرد) */
export const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const end = Math.min(a1, a0 + 359.99);
  const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, end);
  return `M${x0} ${y0}A${r} ${r} 0 ${end - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
};
export const smooth = (pts: [number, number][]) =>
  pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x} ${y}`;
    const [px, py] = pts[i - 1], mx = (px + x) / 2;
    return `${d}C${mx} ${py} ${mx} ${y} ${x} ${y}`;
  }, '');
/** روشن‌تر کردن رنگ برای ابتدای گرادیان */
export const lighten = (c: string, pct = 28) => `color-mix(in srgb, ${c}, white ${pct}%)`;
export const darken = (c: string, pct = 12) => `color-mix(in srgb, ${c}, black ${pct}%)`;
export const glow = (c: string, pct = 45) => `drop-shadow(0 5px 9px color-mix(in srgb, ${c} ${pct}%, transparent))`;
