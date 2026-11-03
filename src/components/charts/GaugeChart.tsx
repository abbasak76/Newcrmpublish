import { useId } from 'react';
import { arc, polar, lighten, glow } from './geometry';

/** گیج ۲۷۰ درجه: گرادیان، سایه رنگی، نقطه سفید انتهای کمان و عدد مرکزی */
export function GaugeChart({ value, max, display, label, color = 'var(--color-chart-1)', size = 132 }:
  { value: number; max: number; display: string; label?: string; color?: string; size?: number }) {
  const id = useId().replace(/:/g, '');
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const end = -135 + 270 * pct, [kx, ky] = polar(60, 60, 48, end);
  return (
    <figure className="m-0 text-center">
      <svg viewBox="0 0 120 120" width={size} height={size} role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label ?? display}>
        <defs><linearGradient id={id} x1="0" y1="1" x2="1" y2="0"><stop offset="0" style={{ stopColor: lighten(color, 32) }} /><stop offset="1" style={{ stopColor: color }} /></linearGradient></defs>
        <path d={arc(60, 60, 48, -135, 135)} fill="none" stroke="var(--color-ink)" strokeOpacity=".08" strokeWidth="9" strokeLinecap="round" />
        {pct > 0 && <>
          <path d={arc(60, 60, 48, -135, end)} fill="none" stroke={`url(#${id})`} strokeWidth="9" strokeLinecap="round" style={{ filter: glow(color) }} />
          <circle cx={kx} cy={ky} r="3.6" fill="#fff" stroke={color} strokeWidth="1.6" />
        </>}
        <text x="60" y="61" textAnchor="middle" dominantBaseline="central" fontSize="22" fontWeight="800" fill="var(--color-ink)">{display}</text>
      </svg>
      {label && <figcaption className="-mt-3 text-[11px] font-medium text-ink-soft">{label}</figcaption>}
    </figure>
  );
}
