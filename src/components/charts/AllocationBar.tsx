import { lighten } from './geometry';
import type { Segment } from './fmt';
export function AllocationBar({ segments, caption }: { segments: Segment[]; caption?: string }) {
  return (
    <div>
      <div className="flex h-3 gap-1.5" role="img" aria-label={segments.map(s => `${s.label} ${s.value}`).join('، ')}>
        {segments.filter(s => s.value > 0).map(s => (
          <i key={s.label} className="rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,.5)]"
             style={{ flex: s.value, background: `linear-gradient(180deg, ${lighten(s.color, 25)}, ${s.color})` }} />))}
      </div>
      {caption && <p className="mt-1.5 text-[11px] text-ink-soft">{caption}</p>}
    </div>
  );
}
