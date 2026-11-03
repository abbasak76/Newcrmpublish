import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

/** theme: برای سازگاری با کدهای قبلی حفظ شده؛ هویت Solar Ember همیشه روشن است (تم تیره سراسری وجود ندارد). */
export type Theme = 'light' | 'dark';
export type AtmosphereMode = 'auto' | 'twilight' | 'morning' | 'sunset' | 'night';
export type AtmosphereTime = Exclude<AtmosphereMode, 'auto'>;

export type ThemePreference = Theme | 'system';
interface Ctx { theme: Theme; themePreference: ThemePreference; setThemePreference: (p: ThemePreference) => void; toggle: () => void; setTheme: (t: Theme) => void; atmosphereMode: AtmosphereMode; setAtmosphereMode: (m: AtmosphereMode) => void; atmosphere: AtmosphereTime }
const C = createContext<Ctx>({ theme: 'light', themePreference: 'system', setThemePreference: () => {}, toggle: () => {}, setTheme: () => {}, atmosphereMode: 'auto', setAtmosphereMode: () => {}, atmosphere: 'morning' });
export const useTheme = () => useContext(C);

/** تعیین حالت جوی از ساعت محلی دستگاه */
export const atmosphereFromHour = (h: number): AtmosphereTime => (h >= 4 && h < 6 ? 'twilight' : h >= 6 && h < 16 ? 'morning' : h >= 16 && h < 19 ? 'sunset' : h >= 19 || h < 4 ? 'night' : 'morning');
const read = <T extends string>(k: string, ok: readonly T[], d: T): T => { try { const v = localStorage.getItem(k); return ok.includes(v as T) ? (v as T) : d; } catch { return d; } };

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // تم (روشن/تیره/سیستم) کاملاً مستقل از هاله جوی است؛ هاله فقط یک لایه نور محیطی است.
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => read<ThemePreference>('akhavan-theme', ['light', 'dark', 'system'], 'system'));
  const [systemDark, setSystemDark] = useState(() => { try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; } });
  const [atmosphereMode, setAtmosphereMode] = useState<AtmosphereMode>(() => read<AtmosphereMode>('akhavan-atmosphere', ['auto', 'twilight', 'morning', 'sunset', 'night'], 'auto'));
  const [hour, setHour] = useState(() => new Date().getHours());

  useEffect(() => {
    try { const mq = window.matchMedia('(prefers-color-scheme: dark)'); const f = () => setSystemDark(mq.matches); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f); } catch { return; }
  }, []);
  const theme: Theme = themePreference === 'system' ? (systemDark ? 'dark' : 'light') : themePreference;

  useEffect(() => { const t = setInterval(() => setHour(new Date().getHours()), 5 * 60 * 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#171114' : '#71364B');
    try { localStorage.setItem('akhavan-theme', themePreference); } catch { /* ignore */ }
  }, [theme, themePreference]);
  useEffect(() => { try { localStorage.setItem('akhavan-atmosphere', atmosphereMode); } catch { /* ignore */ } }, [atmosphereMode]);

  const atmosphere: AtmosphereTime = atmosphereMode === 'auto' ? atmosphereFromHour(hour) : atmosphereMode;
  const value = useMemo<Ctx>(() => ({
    theme, themePreference, setThemePreference,
    setTheme: (t: Theme) => setThemePreference(t),
    toggle: () => setThemePreference(theme === 'light' ? 'dark' : 'light'),
    atmosphereMode, setAtmosphereMode, atmosphere,
  }), [theme, themePreference, atmosphereMode, atmosphere]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
