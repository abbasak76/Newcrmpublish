/** HapticsAdapter — بازخورد لمسی وابسته به قابلیت واقعی دستگاه؛ در نبود پشتیبانی بی‌صدا نادیده گرفته می‌شود. */
export interface HapticsAdapter { selection(): void; light(): void; success(): void; warning(): void }

const KEY = 'akhavan-haptics';
const supported = (): boolean => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
export const isHapticsEnabled = (): boolean => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } };
export const setHapticsEnabled = (on: boolean): void => { try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* ignore */ } };
const reduced = (): boolean => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const buzz = (p: number | number[]) => { if (!supported() || !isHapticsEnabled() || reduced()) return; try { navigator.vibrate(p); } catch { /* ignore */ } };

export const haptics: HapticsAdapter = {
  selection: () => buzz(8),
  light: () => buzz(12),
  success: () => buzz([10, 40, 14]),
  warning: () => buzz([20, 50, 20]),
};
