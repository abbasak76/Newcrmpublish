import React, { useRef, useState } from 'react';
import { Camera, Paperclip, X, FileText } from 'lucide-react';

export interface DocFile { fileName: string; fileType: string; fileSize: number; base64Data: string }
const MAX = 3 * 1024 * 1024;

/** انتخاب مدرک با دوربین یا گالری + پیش‌نمایش (تصویر یا PDF، حداکثر ۳ مگابایت). */
export function DocumentField({ label, required, value, onChange, hint }: { label: string; required?: boolean; value: DocFile | null; onChange: (f: DocFile | null) => void; hint?: string }) {
  const cam = useRef<HTMLInputElement>(null); const gal = useRef<HTMLInputElement>(null); const [err, setErr] = useState('');
  const pick = (f?: File) => {
    if (!f) return; setErr('');
    if (!/^image\//.test(f.type) && f.type !== 'application/pdf') { setErr('فقط تصویر یا PDF مجاز است.'); return; }
    if (f.size > MAX) { setErr('حجم فایل نباید بیشتر از ۳ مگابایت باشد.'); return; }
    const r = new FileReader(); r.onload = () => onChange({ fileName: f.name, fileType: f.type, fileSize: f.size, base64Data: String(r.result) }); r.readAsDataURL(f);
  };
  return (
    <div className="space-y-1.5 rounded-2xl border border-border bg-surface p-3">
      <div className="flex items-center justify-between"><span className="text-xs font-bold text-text-main">{label}{required && <b className="text-danger"> *</b>}</span>{hint && <span className="se-caption">{hint}</span>}</div>
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }} />
      <input ref={gal} type="file" accept="image/*,application/pdf" hidden onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }} />
      {value ? (
        <div className="flex items-center gap-3">
          {value.fileType.startsWith('image/') ? <img src={value.base64Data} alt={label} className="h-16 w-16 rounded-xl object-cover" /> : <span className="grid h-16 w-16 place-items-center rounded-xl bg-canvas"><FileText /></span>}
          <span className="min-w-0 flex-1 truncate text-[11px] text-text-secondary" dir="ltr">{value.fileName}</span>
          <button type="button" aria-label="حذف و بارگذاری مجدد" onClick={() => onChange(null)} className="grid h-10 w-10 cursor-pointer place-items-center rounded-full hover:bg-ink/10"><X size={16} /></button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button type="button" onClick={() => cam.current?.click()} className="se-interactive flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-strong text-xs font-bold text-text-secondary hover:bg-canvas"><Camera size={15} />دوربین</button>
          <button type="button" onClick={() => gal.current?.click()} className="se-interactive flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-strong text-xs font-bold text-text-secondary hover:bg-canvas"><Paperclip size={15} />گالری / فایل</button>
        </div>
      )}
      {err && <p role="alert" className="text-[11px] font-bold text-danger">{err}</p>}
    </div>
  );
}
