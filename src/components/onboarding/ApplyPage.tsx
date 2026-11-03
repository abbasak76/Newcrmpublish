import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppState } from '../../types';
import { DynamicFormRenderer } from '../shared/DynamicFormRenderer';
import { DocumentField, DocFile } from '../shared/DocumentField';
import { createApplicationFormSchema } from '../../services/dynamicFormEngine';
import { getOnboardingConfig, submitApplication } from '../../lib/onboarding';
import { getTenantName } from '../../lib/orgPolicy';
import { generateId } from '../../lib/utils';
import { Button } from '../ui/Button';
import { ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';

/** صفحه عمومی ثبت‌نام و درخواست همکاری (بدون ورود). لینک این صفحه هیچ دسترسی‌ای به CRM نمی‌دهد. */
export function ApplyPage({ state, updateState }: { state: AppState; updateState: (u: (d: AppState) => AppState | void) => void }) {
  const navigate = useNavigate(); const cfg = getOnboardingConfig(state); const company = getTenantName(state);
  const [step, setStep] = useState<0 | 1 | 2>(0); const [values, setValues] = useState<Record<string, any>>({});
  const [docs, setDocs] = useState<Record<string, DocFile | null>>({}); const [errors, setErrors] = useState<string[]>([]); const [doneId, setDoneId] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const logo = (state.settings as any)?.orgConfig?.logoUrl as string | undefined;

  const finish = () => {
    if (busy) return; setBusy(true); setErrors([]);
    const appId = generateId(); const now = new Date(); let res: { ok: boolean; errors: string[] } = { ok: false, errors: [] };
    const attach = cfg.requiredDocs.filter(d => docs[d.key]).map(d => ({ kind: d.key, attachmentId: generateId(), file: docs[d.key]! }));
    updateState(draft => {
      res = submitApplication(draft, values, appId, now, attach.map(a => ({ kind: a.kind, attachmentId: a.attachmentId })));
      if (res.ok) { if (!draft.attachments) draft.attachments = []; attach.forEach(a => draft.attachments!.push({ id: a.attachmentId, entityId: appId, entityType: 'APPLICATION', fileName: a.file.fileName, fileType: a.file.fileType, fileSize: a.file.fileSize, base64Data: a.file.base64Data, uploadedAt: now.toISOString(), uploadedBy: 'applicant' } as any)); }
    });
    setBusy(false); if ((res as any).ok) setDoneId(appId); else setErrors((res as any).errors);
  };

  if (!cfg.enabled) return <Shell company={company} logo={logo} onBack={() => navigate('/login')}><p className="text-sm text-text-secondary">دریافت درخواست همکاری در حال حاضر فعال نیست.</p></Shell>;
  if (doneId) return (
    <Shell company={company} logo={logo} onBack={() => navigate('/login')}>
      <div className="space-y-3 text-center"><CheckCircle2 className="mx-auto text-success" size={44} /><h2 className="se-title">درخواست شما ثبت شد</h2>
        <p className="se-body">کد پیگیری: <b dir="ltr" className="font-mono">{doneId.slice(-8).toUpperCase()}</b></p>
        <p className="rounded-xl bg-warning-soft p-3 text-start text-[11px] leading-6 text-warning"><ShieldAlert size={13} className="me-1 inline" />در این نسخه ارتباط با سرور پیکربندی نشده است؛ درخواست فقط روی همین دستگاه ذخیره شد و پس از اتصال backend قابل ارسال به مدیر خواهد بود. این فرم برای شما دسترسی به CRM ایجاد نمی‌کند.</p>
        <Button variant="primary" onClick={() => navigate('/login')}>بازگشت به صفحه ورود</Button></div>
    </Shell>);

  const missingDocs = cfg.requiredDocs.filter(d => d.required && !docs[d.key]);
  return (
    <Shell company={company} logo={logo} onBack={() => navigate('/login')}>
      <ol className="mb-4 flex items-center gap-2 text-[11px] font-bold" aria-label="مراحل">{['اطلاعات', 'مدارک', 'مرور و ارسال'].map((l, i) => <li key={l} aria-current={step === i ? 'step' : undefined} className={`flex-1 rounded-full py-1.5 text-center ${step === i ? 'bg-primary text-white' : i < step ? 'bg-primary/10 text-primary' : 'bg-canvas text-text-secondary'}`}>{i + 1}. {l}</li>)}</ol>
      {step === 0 && <DynamicFormRenderer schema={createApplicationFormSchema(cfg.desiredRoles, cfg.requireNationalId)} initialValues={values} submitLabel="ادامه: بارگذاری مدارک" onSubmit={v => { setValues(v); setErrors([]); setStep(1); }} />}
      {step === 1 && (
        <div className="space-y-3">
          {cfg.requiredDocs.map(d => <DocumentField key={d.key} label={d.label} required={d.required} value={docs[d.key] || null} onChange={f => setDocs(p => ({ ...p, [d.key]: f }))} />)}
          {missingDocs.length > 0 && <p className="se-caption">مدارک الزامی باقی‌مانده: {missingDocs.map(d => d.label).join('، ')}</p>}
          <div className="flex gap-2"><Button variant="ghost" onClick={() => setStep(0)}>مرحله قبل</Button><Button variant="primary" disabled={missingDocs.length > 0} onClick={() => setStep(2)}>مرور و ارسال</Button></div>
        </div>)}
      {step === 2 && (
        <div className="space-y-3 text-xs">
          <dl className="grid grid-cols-2 gap-2 rounded-2xl bg-canvas p-3"><dt className="font-bold">نام</dt><dd>{values.firstName} {values.lastName}</dd><dt className="font-bold">موبایل</dt><dd dir="ltr" className="text-start">{values.mobile}</dd><dt className="font-bold">شغل درخواستی</dt><dd>{values.desiredRole}</dd><dt className="font-bold">مدارک</dt><dd>{Object.values(docs).filter(Boolean).length.toLocaleString('fa-IR')} فایل</dd></dl>
          {errors.length > 0 && <ul role="alert" className="space-y-1 rounded-xl bg-danger-soft p-3 text-danger">{errors.map(e => <li key={e}>• {e}</li>)}</ul>}
          <div className="flex gap-2"><Button variant="ghost" onClick={() => setStep(1)}>مرحله قبل</Button><Button variant="primary" disabled={busy} onClick={finish}>ثبت درخواست همکاری</Button></div>
        </div>)}
    </Shell>
  );
}

function Shell({ company, logo, onBack, children }: { company: string; logo?: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <main dir="rtl" className="min-h-[100dvh] bg-canvas px-4 py-6 font-premium">
      <div className="mx-auto max-w-lg space-y-4">
        <button onClick={onBack} className="se-interactive flex min-h-[44px] cursor-pointer items-center gap-1 text-xs font-bold text-text-secondary"><ArrowRight size={15} />بازگشت به ورود</button>
        <header className="flex items-center gap-3">{logo ? <img src={logo} alt={company} className="h-12 w-12 rounded-2xl object-cover" /> : <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-lg font-black text-white shadow-lux">{company.slice(0, 1)}</span>}<div><h1 className="se-title">درخواست همکاری</h1><p className="se-caption">{company}</p></div></header>
        <section className="se-card se-panel-enter p-4 sm:p-5">{children}</section>
      </div>
    </main>
  );
}
