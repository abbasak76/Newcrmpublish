import { useId, useState } from 'react';
import { arc, lighten, glow } from './geometry';
import { fNum, fPct, Segment } from './fmt';

/** دونات لوکس: گرادیان هر بخش، سایه رنگی نرم، قرص مرکزی شیشه‌ای، حباب عددی (مطابق مرجع). */
export function DonutChart({ segments, centerValue, centerLabel, size = 168, thickness = 18, showLegend = true }:
  { segments: Segment[]; centerValue?: string; centerLabel?: string; size?: number; thickness?: number; showLegend?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const [hot, setHot] = useState<number | null>(null);
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 60 - thickness / 2;
  let a = 0;
  const visible = segments.filter(s => s.value > 0);
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 120 120" width={size} height={size} role="img" className="se-donut" data-active={hot !== null ? 'true' : 'false'} style={{ ['--th' as any]: thickness }} onMouseLeave={() => setHot(null)}
             aria-label={segments.map(s => `${s.label}: ${fNum(s.value)}`).join('، ')}>
          <defs>
            {segments.map((s, i) => (
              <linearGradient key={i} id={`${uid}g${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" style={{ stopColor: lighten(s.color, 30) }} /><stop offset="1" style={{ stopColor: s.color }} />
              </linearGradient>))}
          </defs>
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-ink)" strokeOpacity=".07" strokeWidth={thickness} />
          {total > 0 && segments.map((s, i) => {
            if (s.value <= 0) return null;
            const span = (s.value / total) * 360;
            const gap = visible.length > 1 ? Math.min(3, span / 4) : 0;
            const d = arc(60, 60, r, a + gap / 2, a + span - gap / 2); a += span;
            return <path key={i} d={d} fill="none" stroke={`url(#${uid}g${i})`} strokeWidth={thickness}
                         strokeLinecap={visible.length > 1 ? 'round' : 'butt'} data-on={hot === i ? 'true' : 'false'} tabIndex={0} aria-label={`${s.label}: ${fNum(s.value)}`}
                         onMouseEnter={() => setHot(i)} onFocus={() => setHot(i)} onBlur={() => setHot(null)} onTouchStart={() => setHot(i)} style={{ filter: hot === i ? glow(s.color, 70) : glow(s.color, 38) }} />;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid place-items-center rounded-full bg-card/90 text-center shadow-subtle ring-1 ring-border/40"
               style={{ width: size * 0.56, height: size * 0.56 }}>
            <div>
              <div className="text-[22px] font-extrabold leading-none text-ink">{hot !== null ? fNum(segments[hot].value) : (centerValue ?? fNum(total))}</div>
              {(hot !== null || centerLabel) && <div className="mt-1 text-[10px] font-medium text-ink-soft">{hot !== null ? segments[hot].label : centerLabel}</div>}
            </div>
          </div>
        </div>
      </div>
      {showLegend && (
        <ul className="grid min-w-[150px] gap-2.5 text-xs font-bold text-ink">
          {segments.map(s => (
            <li key={s.label} className="flex items-center gap-2.5">
              <i className="h-3 w-3 shrink-0 rounded-full shadow-sm" style={{ background: `linear-gradient(135deg, ${lighten(s.color, 30)}, ${s.color})` }} />
              <span>{s.label}</span>
              <span className="ms-auto ps-3 font-mono font-medium text-ink-soft">{fNum(s.value)} · {total ? fPct((s.value / total) * 100) : fPct(0)}</span>
            </li>))}
        </ul>
      )}
    </div>
  );
}
