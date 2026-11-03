const fa = new Intl.NumberFormat('fa-IR');
export const fNum = (n: number) => fa.format(n);
export const fPct = (n: number) => fa.format(Math.round(n)) + '٪';
export const fCompact = (n: number) =>
  n >= 1e9 ? fa.format(+(n / 1e9).toFixed(1)) + ' میلیارد' : n >= 1e6 ? fa.format(+(n / 1e6).toFixed(1)) + ' میلیون' : fa.format(n);
export interface Segment { label: string; value: number; color: string }
