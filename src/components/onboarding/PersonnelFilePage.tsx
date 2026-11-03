import React, { useMemo, useState } from 'react';
import { AppState } from '../../types';
import { DynamicFormRenderer } from '../shared/DynamicFormRenderer';
import { DocumentField, DocFile } from '../shared/DocumentField';
import { PERSONNEL_IDENTITY_SCHEMA, PERSONNEL_BANK_SCHEMA, PERSONNEL_ADDRESS_SCHEMA } from '../../services/dynamicFormEngine';
import { computeMissing, ensurePersonnelFile, FILE_STATUS_LABEL, getOnboardingConfig, savePersonnelStep, setPersonnelDocument, submitPersonnelFile } from '../../lib/onboarding';
import { generateId } from '../../lib/utils';
import { Button } from '../ui/Button';
import { CheckCircle2, CircleAlert } from 'lucide-react';

type Step = 'identity' | 'documents' | 'bank' | 'address';
const STEPS: { id: Step; label: string }[] = [{ id: 'identity', label: 'هویت' }, { id: 'documents', label: 'مدارک' }, { id: 'bank', label: 'بانکی' }, { id: 'address', label: 'نشانی' }];

/** تکمیل پرونده پرسنلی کاربر جاری (فقط پرونده خودش). ذخیره موقت هر مرحله؛ ارسال برای بررسی پس از کامل‌شدن. */
export function PersonnelFilePage({ state, updateState }: { state: AppState; updateState: (u: (d: AppState) => AppState | void) => void }) {
  const me = state.currentUserId || ''; const cfg = getOnboardingConfig(state); const [step, setStep] = useState<Step>('identity'); const [msg, setMsg] = useState('');
  const file: any = (state.personnelFiles || []).find((f: any) => f.userId === me);
  const eff = file || { identity: { fullName: state.users?.find(u => u.id === me)?.name || '' }, bank: {}, address: {}, documents: {}, status: 'INCOMPLETE' };
  const missing = useMemo(() => computeMissing(eff, cfg), [eff, cfg]);
  const locked = eff.status === 'SUBMITTED_FOR_REVIEW';
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 5000); };
  const saveStep = (s: 'identity' | 'bank' | 'address') => (v: Record<string, any>) => {
    let r: { ok: boolean; reason?: string } = { ok: false }; updateState(d => { r = savePersonnelStep(d, me, s, v, new Date()); }); flash((r as any).ok ? 'ذخیره موقت انجام شد. می‌توانید بعداً ادامه دهید.' : (r as any).reason || 'ذخیره نشد.');
  };
  const putDoc = (kind: string, f: DocFile | null) => {
    if (!f) return; const attId = generateId(); let r: { ok: boolean; reason?: string } = { ok: false };
    updateState(d => { r = setPersonnelDocument(d, me, kind, attId, new Date()); if ((r as any).ok) { if (!d.attachments) d.attachments = []; d.attachments.push({ id: attId, entityId: me, entityType: 'PERSONNEL_FILE', fileName: f.fileName, fileType: f.fileType, fileSize: f.fileSize, base64Data: f.base64Data, uploadedAt: new Date().toISOString(), uploadedBy: me, docKind: kind } as any); } });
    if (!(r as any).ok) flash((r as any).reason || 'بارگذاری نشد.');
  };
  const attOf = (id?: string) => (state.attachments || []).find((a: any) => a.id === id) as any;
  const submit = () => { let r: { ok: boolean; missing: { label: string }[] } = { ok: false, missing: [] }; updateState(d => { ensurePersonnelFile(d, me, new Date()); r = submitPersonnelFile(d, me, new Date()); }); flash((r as any).ok ? 'پرونده برای بررسی مدیر ارسال شد.' : `موارد ناقص: ${(r as any).missing.map((m: any) => m.label).join('، ')}`); };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4" dir="rtl">
      <header className="space-y-1"><h1 className="se-title">پرونده پرسنلی من</h1>
        <p className="se-caption">وضعیت: <b className="text-primary">{FILE_STATUS_LABEL[eff.status as keyof typeof FILE_STATUS_LABEL]}</b>{missing.length > 0 && ` · ${missing.length.toLocaleString('fa-IR')} مورد ناقص`}</p></header>
      {eff.status === 'NEEDS_CORRECTION' && eff.reviewNote && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-xs text-danger">درخواست اصلاح مدیر: {eff.reviewNote}</p>}
      {eff.status === 'APPROVED' && <p className="rounded-xl bg-success-soft p-3 text-xs text-success"><CheckCircle2 size={14} className="me-1 inline" />مدارک شما تأیید شده است. (تأیید مدارک، نقش یا دسترسی شما را تغییر نمی‌دهد.)</p>}
      <nav className="flex gap-1.5 overflow-x-auto" aria-label="مراحل پرونده">{STEPS.map(s => { const bad = missing.some(m => m.key.startsWith(s.id === 'documents' ? 'doc.' : s.id + '.')); return <button key={s.id} onClick={() => setStep(s.id)} aria-current={step === s.id ? 'step' : undefined} className={`se-interactive flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-1 rounded-full px-3 text-xs font-bold ${step === s.id ? 'bg-primary text-white' : 'border border-border bg-surface text-text-secondary'}`}>{s.label}{bad && <CircleAlert size={12} className="text-coral" aria-label="ناقص" />}</button>; })}</nav>
      <section className="se-card p-4">
        {locked && <p className="mb-3 rounded-xl bg-warning-soft p-2 text-[11px] text-warning">پرونده در حال بررسی است و تا اعلام نتیجه قابل ویرایش نیست.</p>}
        {step === 'identity' && <DynamicFormRenderer key="i" schema={PERSONNEL_IDENTITY_SCHEMA} initialValues={eff.identity} onSubmit={saveStep('identity')} submitLabel="ذخیره موقت" isSubmitting={locked} />}
        {step === 'bank' && <DynamicFormRenderer key="b" schema={PERSONNEL_BANK_SCHEMA} initialValues={eff.bank} onSubmit={saveStep('bank')} submitLabel="ذخیره موقت" isSubmitting={locked} />}
        {step === 'address' && <DynamicFormRenderer key="a" schema={PERSONNEL_ADDRESS_SCHEMA} initialValues={eff.address} onSubmit={saveStep('address')} submitLabel="ذخیره موقت" isSubmitting={locked} />}
        {step === 'documents' && <div className="space-y-3">{cfg.requiredDocs.map(d => { const a = attOf(eff.documents[d.key]); return <div key={d.key}><DocumentField label={d.label} required={d.required} value={a ? { fileName: a.fileName, fileType: a.fileType, fileSize: a.fileSize, base64Data: a.base64Data } : null} onChange={f => { if (f && !locked) putDoc(d.key, f); }} hint={a ? 'ثبت‌شده؛ برای تعویض، حذف و دوباره بارگذاری کنید' : undefined} /></div>; })}</div>}
      </section>
      {msg && <p role="status" className="rounded-xl bg-primary/10 p-3 text-xs font-bold text-primary">{msg}</p>}
      {missing.length > 0 && <details className="rounded-xl border border-border p-3 text-xs"><summary className="cursor-pointer font-bold">موارد ناقص ({missing.length.toLocaleString('fa-IR')})</summary><ul className="mt-2 list-inside list-disc space-y-0.5 text-text-secondary">{missing.map(m => <li key={m.key}>{m.label}</li>)}</ul></details>}
      <Button variant="primary" disabled={locked || eff.status === 'APPROVED'} onClick={submit}>ارسال برای بررسی مدیر</Button>
    </div>
  );
}
