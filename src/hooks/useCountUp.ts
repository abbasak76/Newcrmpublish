import { useEffect, useRef, useState } from 'react';

/** شمارش نرم تا مقدار هدف (ease-out)؛ در حالت کاهش حرکت، مقدار نهایی بی‌واسطه نمایش داده می‌شود */
export function useCountUp(target: number, duration = 1100): number {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setV(target); return; }
    const start = performance.now(), a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration), e = 1 - Math.pow(1 - p, 4);
      setV(a + (target - a) * e);
      if (p < 1) raf = requestAnimationFrame(tick); else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}
