import React, { useMemo, useState } from 'react';
import { AppState } from '../../types';
import { useCan } from '../../hooks/useCan';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { PageToolbar } from '../ui/PageToolbar';
import { DynamicFormRenderer } from '../shared/DynamicFormRenderer';
import { createInterviewFormSchema } from '../../services/dynamicFormEngine';
import { APPLICATION_STATUS_LABEL, FILE_STATUS_LABEL, ApplicationStatus, SMS_PROVIDER_STATUS, computeMissing, getOnboardingConfig, prepareCredentialsSms, recordInterviewResult, referToInterview, reviewPersonnelFile, transitionApplication, InterviewResult } from '../../lib/onboarding';
import { generateId } from '../../lib/utils';
import { formatAppDate } from '../../lib/utils';

type Tab = 'apps' | 'files' | 'config';
const maskNid = (n?: string) => (n ? n.slice(0, 3) + '****' + n.slice(-3) : '—');

/** بررسی درخواست‌های همکاری، مدارک پرسنلی، ارجاع مصاحبه و تنظیمات ماژول. مجوز: onboarding.VIEW/EDIT/APPROVE. */
export function OnboardingAdminWorkspace({ state, updateState }: { state: AppState; updateState: (u: (d: AppState) => AppState | void) => void }) {
  const { can, denied } = useCan(state, updateState); const me = state.currentUserId; const cfg = getOnboardingConfig(state);
  const [tab, setTab] = useState<Tab>('apps'); const [q, setQ] = useState(''); const [statusF, setStatusF] = useState<'ALL' | ApplicationStatus>('ALL');
  const [openApp, setOpenApp] = useState<string | null>(null); const [openFile, setOpenFile] = useState<string | null>(null);
  const [note, setNote] = useState(''); const [interviewFor, setInterviewFor] = useState<string | null>(null); const [msg, setMsg] = useState('');
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 6000); };
  const apps: any[] = state.onboardingApplications || []; const files: any[] = state.personnelFiles || [];
  const att = (id?: string) => (state.attachments || []).find((a: any) => a.id === id) as any; const userName = (id?: string) => state.users?.find(u => u.id === id)?.name || '—';

  const visibleApps = useMemo(() => apps.filter(a => (statusF === 'ALL' || a.status === statusF) && (!q.trim() || `${a.firstName} ${a.lastName} ${a.mobile} ${a.desiredRole}`.includes(q.trim()))), [apps, q, statusF]);
  const app = apps.find(a => a.id === openApp); const file = files.find(f => f.userId === openFile);
  const act = (need: 'EDIT' | 'APPROVE', what: string, fn: (d: AppState) => { ok: boolean; reason?: string; errors?: string[] }) => {
    if (!can('onboarding', need)) return denied(what);
    let r: any = { ok: false }; updateState(d => { r = fn(d); }); if (!r.ok) flash(r.reason || (r.errors || []).join(' ') || 'انجام نشد.'); else { setNote(''); flash('انجام شد.'); } return r;
  };
  const interviewers = (state.users || []).filter(u => (u.isActive ?? (u as any).active) !== false).map(u => ({ id: u.id, name: u.name }));
  const Docs = ({ docs }: { docs: { kind: string; attachmentId: string }[] }) => (
    <div className="grid grid-cols-3 gap-2">{docs.map(d => { const a = att(d.attachmentId); const label = cfg.requiredDocs.find(x => x.key === d.kind)?.label || d.kind; return a ? (a.fileType?.startsWith('image/') ? <a key={d.kind} href={a.base64Data} target="_blank" rel="noreferrer" className="block"><img src={a.base64Data} alt={label} className="h-20 w-full rounded-xl object-cover" /><span className="se-caption block truncate">{label}</span></a> : <a key={d.kind} href={a.base64Data} download={a.fileName} className="se-caption grid h-20 place-items-center rounded-xl border border-border">{label} (PDF)</a>) : <span key={d.kind} className="se-caption">{label}: —</span>; })}</div>);

  if (!can('onboarding', 'VIEW')) return <div className="p-6 text-sm text-text-secondary">دسترسی به این بخش برای شما مجاز نیست.</div>;
  return (
    <div className="space-y-4 p-4" dir="rtl">
      <PageToolbar title="استخدام و پرونده پرسنلی" subtitle="درخواست‌های همکاری، مدارک پرسنل و ارجاع مصاحبه" search={tab === 'apps' ? q : undefined} onSearchChange={tab === 'apps' ? setQ : undefined} searchPlaceholder="نام، موبایل یا شغل" resultCount={tab === 'apps' ? visibleApps.length : undefined}
        activeFilters={tab === 'apps' && statusF !== 'ALL' ? [{ key: 's', label: APPLICATION_STATUS_LABEL[statusF as ApplicationStatus], onRemove: () => setStatusF('ALL') }] : []} onClearAll={() => { setQ(''); setStatusF('ALL'); }}
        filters={<>{(['apps', 'files', 'config'] as Tab[]).map(t => <button key={t} onClick={() => setTab(t)} aria-pressed={tab === t} className={`se-interactive min-h-[40px] cursor-pointer whitespace-nowrap rounded-full px-4 text-xs font-bold ${tab === t ? 'bg-primary text-white' : 'border border-border bg-surface text-text-secondary'}`}>{t === 'apps' ? `درخواست‌های همکاری (${apps.length.toLocaleString('fa-IR')})` : t === 'files' ? `پرونده‌های پرسنلی (${files.length.toLocaleString('fa-IR')})` : 'تنظیمات'}</button>)}</>} />
      {msg && <p role="status" className="rounded-xl bg-primary/10 p-3 text-xs font-bold text-primary">{msg}</p>}
      <p className="rounded-xl bg-warning-soft p-3 text-[11px] leading-6 text-warning">اتصال سرور و درگاه پیامک پیکربندی نشده است ({SMS_PROVIDER_STATUS.status}): داده‌ها فقط روی همین دستگاه ذخیره می‌شوند و پیامک‌ها «ساخته و ثبت» می‌شوند ولی ارسال نمی‌شوند.</p>

      {tab === 'apps' && (<div className="space-y-2">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">{(['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFORMATION', 'ACCEPTED', 'REJECTED'] as const).map(s => <button key={s} onClick={() => setStatusF(s)} className={`min-h-[36px] shrink-0 cursor-pointer rounded-full px-3 text-[11px] font-bold ${statusF === s ? 'bg-primary/10 text-primary' : 'text-text-secondary'}`}>{s === 'ALL' ? 'همه' : APPLICATION_STATUS_LABEL[s]}</button>)}</div>
        {visibleApps.map(a => (
          <button key={a.id} onClick={() => setOpenApp(a.id)} className="se-card se-interactive flex min-h-[64px] w-full cursor-pointer items-center justify-between gap-3 p-3 text-start hover:shadow-raised">
            <span className="min-w-0"><b className="block truncate text-sm text-text-main">{a.firstName} {a.lastName}</b><span className="se-caption block truncate">{a.desiredRole} · <span dir="ltr">{a.mobile}</span> · {formatAppDate(a.createdAt, state.settings?.locale)}</span></span>
            <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{APPLICATION_STATUS_LABEL[a.status as ApplicationStatus]}</span>
          </button>))}
        {visibleApps.length === 0 && <div className="rounded-2xl border border-dashed border-border-strong px-4 py-10 text-center text-xs text-text-secondary">{apps.length === 0 ? 'هنوز درخواست همکاری ثبت نشده است.' : 'نتیجه‌ای با این جستجو/فیلتر نیست.'}</div>}
      </div>)}

      {tab === 'files' && (<div className="space-y-2">
        {files.map(f => { const miss = computeMissing(f, cfg).length; return (
          <button key={f.userId} onClick={() => setOpenFile(f.userId)} className="se-card se-interactive flex min-h-[60px] w-full cursor-pointer items-center justify-between p-3 text-start hover:shadow-raised">
            <span><b className="text-sm text-text-main">{userName(f.userId)}</b><span className="se-caption block">{miss > 0 ? `${miss.toLocaleString('fa-IR')} مورد ناقص` : 'کامل'}</span></span>
            <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{FILE_STATUS_LABEL[f.status as keyof typeof FILE_STATUS_LABEL]}</span>
          </button>); })}
        {files.length === 0 && <div className="rounded-2xl border border-dashed border-border-strong px-4 py-10 text-center text-xs text-text-secondary">هنوز پرونده‌ای شروع نشده است. کاربران از «پرونده پرسنلی من» تکمیل را آغاز می‌کنند.</div>}
      </div>)}

      {tab === 'config' && <ConfigPanel state={state} updateState={updateState} canEdit={can('onboarding', 'EDIT')} denied={() => denied('تنظیمات ثبت‌نام')} flash={flash} />}

      {/* جزئیات درخواست */}
      <Modal isOpen={!!app} onClose={() => setOpenApp(null)} title={app ? `${app.firstName} ${app.lastName}` : ''}>
        {app && (<div className="space-y-3 text-xs">
          <dl className="grid grid-cols-2 gap-2 rounded-2xl bg-canvas p-3"><dt className="font-bold">وضعیت</dt><dd>{APPLICATION_STATUS_LABEL[app.status as ApplicationStatus]}</dd><dt className="font-bold">شغل</dt><dd>{app.desiredRole}</dd><dt className="font-bold">موبایل</dt><dd dir="ltr" className="text-start">{app.mobile}</dd><dt className="font-bold">کد ملی</dt><dd dir="ltr" className="text-start">{maskNid(app.nationalId)}</dd></dl>
          {app.notes && <p className="rounded-xl bg-canvas p-3">{app.notes}</p>}
          <Docs docs={app.documents || []} />
          {app.interview && <div className="space-y-1 rounded-2xl border border-border p-3"><b>مصاحبه:</b> {formatAppDate(app.interview.date, state.settings?.locale)} ساعت {app.interview.time} · {userName(app.interview.interviewerId)}<br /><span className="se-caption">{app.interview.address}</span><br /><span className="se-caption">پیامک متقاضی: {app.interview.smsStatus === 'NOT_CONFIGURED' ? 'ثبت شد ولی ارسال نشد (درگاه پیکربندی نشده)' : app.interview.smsStatus}</span>
            {app.interview.result ? <p className="font-bold text-primary">نتیجه: {({ ACCEPT: 'قبول', REJECT: 'رد', FOLLOW_UP: 'نیازمند پیگیری بیشتر' } as any)[app.interview.result]}{app.interview.resultNote ? ` — ${app.interview.resultNote}` : ''}</p> : (me === app.interview.interviewerId || can('onboarding', 'APPROVE')) && (
              <div className="space-y-2 pt-2"><Input label="یادداشت نتیجه" value={note} onChange={e => setNote(e.target.value)} /><div className="flex flex-wrap gap-2">{(['ACCEPT', 'REJECT', 'FOLLOW_UP'] as InterviewResult[]).map(r => <Button key={r} size="sm" variant={r === 'ACCEPT' ? 'primary' : 'outline'} onClick={() => { let res: any = { ok: false }; updateState(d => { res = recordInterviewResult(d, app.id, r, note, me, new Date(), can('onboarding', 'APPROVE')); }); if (!res.ok) flash(res.reason || 'ثبت نشد.'); else setNote(''); }}>{r === 'ACCEPT' ? 'قبول' : r === 'REJECT' ? 'رد' : 'نیازمند پیگیری'}</Button>)}</div></div>)}</div>}
          <ol className="space-y-1 border-s-2 border-border ps-3">{(app.history || []).map((h: any, i: number) => <li key={i} className="se-caption">{formatAppDate(h.at, state.settings?.locale)} · {APPLICATION_STATUS_LABEL[h.status as ApplicationStatus] || h.status}{h.note ? ` — ${h.note}` : ''}</li>)}</ol>
          {!['ACCEPTED', 'REJECTED'].includes(app.status) && (<div className="space-y-2 border-t border-border pt-3"><Input label="یادداشت (برای رد/نیازمند اطلاعات الزامی)" value={note} onChange={e => setNote(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              {app.status === 'SUBMITTED' && <Button size="sm" variant="outline" onClick={() => act('EDIT', 'شروع بررسی', d => transitionApplication(d, app.id, 'UNDER_REVIEW', note, me, new Date()))}>شروع بررسی</Button>}
              <Button size="sm" variant="outline" onClick={() => act('EDIT', 'درخواست اطلاعات', d => transitionApplication(d, app.id, 'NEEDS_INFORMATION', note, me, new Date()))}>نیازمند اطلاعات</Button>
              {!app.interview && <Button size="sm" variant="primary" onClick={() => can('onboarding', 'APPROVE') ? setInterviewFor(app.id) : denied('ارجاع به مصاحبه')}>ارجاع برای پیگیری مصاحبه</Button>}
              <Button size="sm" variant="danger" onClick={() => act('APPROVE', 'رد درخواست', d => transitionApplication(d, app.id, 'REJECTED', note, me, new Date()))}>رد</Button>
            </div><p className="se-caption">پذیرش نهایی فقط با ثبت نتیجه مصاحبه انجام می‌شود؛ پذیرش به‌تنهایی حساب کاربری نمی‌سازد و دسترسی نمی‌دهد.</p></div>)}
        </div>)}
      </Modal>

      <Modal isOpen={!!interviewFor} onClose={() => setInterviewFor(null)} title="ارجاع برای پیگیری مصاحبه">
        <DynamicFormRenderer schema={createInterviewFormSchema(interviewers, cfg.interviewAddress)} submitLabel="ثبت ارجاع (پیامک + تسک)" onCancel={() => setInterviewFor(null)}
          onSubmit={v => { const r = act('APPROVE', 'ارجاع مصاحبه', d => referToInterview(d, interviewFor!, v, me, new Date(), generateId)); if (r?.ok) setInterviewFor(null); }} />
      </Modal>

      {/* جزئیات پرونده پرسنلی */}
      <Modal isOpen={!!file} onClose={() => setOpenFile(null)} title={file ? `پرونده: ${userName(file.userId)}` : ''}>
        {file && (<div className="space-y-3 text-xs">
          <p>وضعیت: <b className="text-primary">{FILE_STATUS_LABEL[file.status as keyof typeof FILE_STATUS_LABEL]}</b></p>
          <dl className="grid grid-cols-2 gap-2 rounded-2xl bg-canvas p-3"><dt className="font-bold">نام</dt><dd>{file.identity?.fullName || '—'}</dd><dt className="font-bold">کد ملی</dt><dd dir="ltr" className="text-start">{maskNid(file.identity?.nationalId)}</dd><dt className="font-bold">بانک</dt><dd>{file.bank?.bankName || '—'}</dd><dt className="font-bold">شبا</dt><dd dir="ltr" className="text-start">{file.bank?.iban ? file.bank.iban.slice(0, 6) + '…' + file.bank.iban.slice(-4) : '—'}</dd><dt className="font-bold">نشانی</dt><dd>{[file.address?.province, file.address?.city].filter(Boolean).join('، ') || '—'}</dd></dl>
          <Docs docs={Object.entries(file.documents || {}).map(([kind, attachmentId]) => ({ kind, attachmentId: attachmentId as string }))} />
          {computeMissing(file, cfg).length > 0 && <p className="text-danger">ناقص: {computeMissing(file, cfg).map(m => m.label).join('، ')}</p>}
          {file.status === 'SUBMITTED_FOR_REVIEW' && (<div className="space-y-2 border-t border-border pt-3"><Input label="یادداشت اصلاح (برای بازگشت الزامی)" value={note} onChange={e => setNote(e.target.value)} /><div className="flex gap-2"><Button size="sm" variant="primary" onClick={() => act('APPROVE', 'تأیید مدارک', d => reviewPersonnelFile(d, file.userId, 'APPROVE', note, me, new Date()))}>تأیید مدارک</Button><Button size="sm" variant="outline" onClick={() => act('APPROVE', 'بازگشت برای اصلاح', d => reviewPersonnelFile(d, file.userId, 'NEEDS_CORRECTION', note, me, new Date()))}>نیازمند اصلاح</Button></div></div>)}
          {file.status === 'APPROVED' && (() => { const c = prepareCredentialsSms(state, { username: file.identity?.nationalId }); return <p className="rounded-xl bg-warning-soft p-3 text-[11px] leading-6 text-warning">پیامک اطلاعات ورود: {c.status === 'READY' ? 'آماده' : `مسدود — ${(c as any).reason}`}<br />تأیید مدارک، وضعیت استخدام و فعال‌سازی حساب سه مفهوم جدا هستند؛ این تأیید نقش یا مجوزهای کاربر را تغییر نداد.</p>; })()}
        </div>)}
      </Modal>
    </div>
  );
}

function ConfigPanel({ state, updateState, canEdit, denied, flash }: { state: AppState; updateState: (u: (d: AppState) => AppState | void) => void; canEdit: boolean; denied: () => void; flash: (t: string) => void }) {
  const cfg = getOnboardingConfig(state); const [docs, setDocs] = useState(cfg.requiredDocs); const [addr, setAddr] = useState(cfg.interviewAddress || ''); const [roles, setRoles] = useState(cfg.desiredRoles.join('، '));
  const [tpl, setTpl] = useState(cfg.smsTemplates); const [flags, setFlags] = useState({ enabled: cfg.enabled, requireNationalId: cfg.requireNationalId, requireBank: cfg.requireBank, requireAddress: cfg.requireAddress });
  const save = () => {
    if (!canEdit) return denied(); const clean = docs.filter(d => d.label.trim()).map(d => ({ key: d.key, label: d.label.trim(), required: d.required }));
    updateState(d => { const s: any = d.settings || (d.settings = {} as any); s.orgConfig = { ...(s.orgConfig || {}), onboarding: { ...(s.orgConfig?.onboarding || {}), ...flags, requiredDocs: clean, interviewAddress: addr.trim() || undefined, desiredRoles: roles.split(/[،,]/).map(x => x.trim()).filter(Boolean), smsTemplates: tpl } };
      if (!d.auditLogs) d.auditLogs = []; d.auditLogs.push({ id: generateId(), action: 'ONBOARDING_CONFIG_UPDATED', entityType: 'SETTINGS', entityId: 'onboarding', details: 'تنظیمات ماژول ثبت‌نام تغییر کرد', actor: d.users?.find(u => u.id === d.currentUserId)?.name || 'System', createdAt: new Date().toISOString() } as any); }); flash('تنظیمات ذخیره شد.');
  };
  return (
    <div className="se-card space-y-4 p-4 text-xs">
      <div className="grid grid-cols-2 gap-2">{([['enabled', 'فعال بودن ثبت‌نام عمومی'], ['requireNationalId', 'کد ملی الزامی'], ['requireBank', 'اطلاعات بانکی الزامی'], ['requireAddress', 'نشانی الزامی']] as const).map(([k, l]) => <label key={k} className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-border px-3"><input type="checkbox" className="accent-primary" checked={(flags as any)[k]} onChange={e => setFlags(p => ({ ...p, [k]: e.target.checked }))} />{l}</label>)}</div>
      <fieldset className="space-y-2"><legend className="font-bold">مدارک موردنیاز</legend>
        {docs.map((d, i) => <div key={d.key} className="flex items-center gap-2"><input aria-label="عنوان مدرک" value={d.label} onChange={e => setDocs(p => p.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className="min-h-[44px] flex-1 rounded-xl border border-border bg-canvas px-3" /><label className="flex items-center gap-1"><input type="checkbox" className="accent-primary" checked={d.required} onChange={e => setDocs(p => p.map((x, j) => j === i ? { ...x, required: e.target.checked } : x))} />الزامی</label><button aria-label="حذف مدرک" onClick={() => setDocs(p => p.filter((_, j) => j !== i))} className="h-10 w-10 cursor-pointer rounded-full hover:bg-ink/10">✕</button></div>)}
        <Button size="sm" variant="outline" onClick={() => setDocs(p => [...p, { key: `doc_${p.length + 1}_${Date.now().toString(36)}`, label: '', required: false }])}>افزودن مدرک</Button></fieldset>
      <Input label="شغل‌های قابل درخواست (با ویرگول؛ خالی = متن آزاد)" value={roles} onChange={e => setRoles(e.target.value)} />
      <Input label="آدرس پیش‌فرض مصاحبه" value={addr} onChange={e => setAddr(e.target.value)} />
      <label className="block font-bold">متن پیامک اطلاعات ورود (متغیرها: {'{company} {username} {tempPassword}'})<textarea value={tpl.credentials} onChange={e => setTpl(p => ({ ...p, credentials: e.target.value }))} rows={4} className="mt-1 w-full rounded-xl border border-border bg-canvas p-3 font-normal" /></label>
      <label className="block font-bold">متن پیامک دعوت مصاحبه ({'{company} {date} {time} {interviewer} {address}'})<textarea value={tpl.interview} onChange={e => setTpl(p => ({ ...p, interview: e.target.value }))} rows={5} className="mt-1 w-full rounded-xl border border-border bg-canvas p-3 font-normal" /></label>
      <p className="se-caption">نام و لوگوی شرکت از «تنظیمات › نام سازمان» خوانده می‌شود. اتصال درگاه پیامک: {SMS_PROVIDER_STATUS.status}.</p>
      <Button variant="primary" onClick={save}>ذخیره تنظیمات</Button>
    </div>
  );
}
