import { useId } from 'react';
import { lighten } from './geometry';
import { fCompact } from './fmt';

export interface CashFlowDay { date: string; inflow: number; outflow: number }

/** نمودار نقدینگی ۱۴ روز آینده: ورودی (آبی) در برابر خروجی (مرجانی)، ۳ روز اول به‌عنوان «ناحیه بحرانی» هاشور می‌خورد */
export function CashFlowChart({ days, dangerDays = 3, height = 190 }: { days: CashFlowDay[]; dangerDays?: number; height?: number }) {
  const id = useId().replace(/:/g, '');
  const W = 320, top = 14, base = height - 30, n = days.length || 1, slot = W / n, bw = Math.min(9, slot * 0.34);
  const max = Math.max(...days.flatMap(d => [d.inflow, d.outflow]), 1);
  const h = (v: number) => (v / max) * (base - top);
  const day = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric' }), mon = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'short' });
  const grad = (c: string, k: string) => <linearGradient id={`${id}${k}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: lighten(c, 28) }} /><stop offset="1" style={{ stopColor: c }} /></linearGradient>;
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label="پیش‌بینی ورودی و خروجی نقدینگی ۱۴ روز آینده">
      <defs>{grad('var(--color-chart-1)', 'i')}{grad('var(--color-chart-2)', 'o')}
        <pattern id={`${id}p`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="6" fill="var(--color-coral)" opacity=".12" /></pattern></defs>
      {[0, 1, 2, 3].map(i => { const y = top + ((base - top) * i) / 3; return <line key={i} x1="0" x2={W} y1={y} y2={y} stroke="var(--color-ink)" strokeOpacity=".1" strokeDasharray={i === 3 ? undefined : '3 4'} />; })}
      <rect x={W - slot * dangerDays} y={top - 6} width={slot * dangerDays} height={base - top + 6} rx="10" fill={`url(#${id}p)`} />
      <text x={W - 4} y={top + 4} textAnchor="end" fontSize="8" fontWeight="700" fill="var(--color-coral)">۳ روز بحرانی</text>
      {days.map((d, k) => {
        const i = n - 1 - k, cx = i * slot + slot / 2, dt = new Date(d.date + 'T12:00:00');
        return (
          <g key={d.date}>
            <title>{`${day.format(dt)} ${mon.format(dt)} — ورودی ${fCompact(d.inflow)} / خروجی ${fCompact(d.outflow)} ریال`}</title>
            <rect className="anim-grow-y" style={{ ['--i' as any]: k }} x={cx - bw - 1} y={base - h(d.inflow)} width={bw} height={Math.max(h(d.inflow), d.inflow ? 3 : 0)} rx={bw / 2} fill={`url(#${id}i)`} />
            <rect className="anim-grow-y" style={{ ['--i' as any]: k + 0.5 }} x={cx + 1} y={base - h(d.outflow)} width={bw} height={Math.max(h(d.outflow), d.outflow ? 3 : 0)} rx={bw / 2} fill={`url(#${id}o)`} />
            <text x={cx} y={height - 8} textAnchor="middle" fontSize="9" fill="var(--color-ink-soft)">{day.format(dt)}</text>
            {(k === 0 || dt.getDate() === 1 || (k % 5 === 0 && k > 0)) && <text x={cx} y={height - 19} textAnchor="middle" fontSize="7.5" fill="var(--color-ink-soft)" opacity=".8">{mon.format(dt)}</text>}
          </g>
        );
      })}
    </svg>
  );
}
