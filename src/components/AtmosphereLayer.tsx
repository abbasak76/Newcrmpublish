import React from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { useAppStore } from '../lib/storage';

/** هاله جوی نسل جدید (نورپردازی حجمی + بافت سینمایی). مستقل از تم روشن/تیره؛ فقط transform/opacity انیمیت می‌شود. */
export function AtmosphereLayer() {
  const { atmosphere } = useTheme();
  const mode = useAppStore(s => s.state?.settings?.performanceMode || 'auto');
  const lowMemory = typeof navigator !== 'undefined' && ((navigator as any).deviceMemory ?? 8) <= 4;
  const prefersReducedMotion = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reduced = mode === 'low' || (mode === 'auto' && lowMemory) || prefersReducedMotion;
  return (
    <div className="se-atmosphere-root" aria-hidden="true" data-time={atmosphere} data-reduced={reduced ? 'true' : 'false'} data-performance={mode}>
      <div className="se-noise-overlay" />
      <div className="se-aurora se-aurora-1" /><div className="se-aurora se-aurora-2" /><div className="se-aurora se-aurora-3" />
      {/* لایه‌های کم‌کنتراست آسمان؛ تزئینی‌اند و زیر محتوای اصلی باقی می‌مانند. */}
      <div className="se-sky-moon" />
      <div className="se-sky-clouds"><span className="se-sky-cloud se-sky-cloud-1" /><span className="se-sky-cloud se-sky-cloud-2" /><span className="se-sky-cloud se-sky-cloud-3" /></div>
      <svg className="se-stars" viewBox="0 0 100 60" preserveAspectRatio="xMidYMin slice"><g fill="var(--se-honey-gold)" opacity=".5"><circle cx="12" cy="14" r=".4" /><circle cx="28" cy="8" r=".3" /><circle cx="46" cy="18" r=".5" /><circle cx="78" cy="16" r=".4" /><circle cx="84" cy="32" r=".25" /><circle cx="62" cy="6" r=".3" /></g></svg>
    </div>
  );
}
