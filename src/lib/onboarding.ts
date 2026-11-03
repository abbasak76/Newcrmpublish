import type { AppState } from '../types';

/**
 * ثبت‌نام، درخواست همکاری و پرونده پرسنلی — ماژول عمومی و قابل‌پیکربندی (بدون نام/متن اختصاصی هیچ شرکت).
 * روی همان state/tasks/messagingLogs/attachments/auditLogs موجود؛ بدون سامانه ورود یا تسک موازی.
 * ⚠ بدون backend: ذخیره فقط روی همین دستگاه؛ ارسال پیامک و صدور رمز موقت = NOT_CONFIGURED / BLOCKED (جعل نمی‌شود).
 * سه مفهوم جدا: تأیید مدارک ≠ تصمیم استخدام ≠ فعال‌سازی حساب (هیچ تابعی نقش/مجوز/فعال‌بودن کاربر را تغییر نمی‌دهد).
 */
export type ApplicationStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'NEEDS_INFORMATION' | 'ACCEPTED' | 'REJECTED';
export type PersonnelFileStatus = 'INCOMPLETE' | 'SUBMITTED_FOR_REVIEW' | 'NEEDS_CORRECTION' | 'APPROVED';
export type InterviewResult = 'ACCEPT' | 'REJECT' | 'FOLLOW_UP';
export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = { SUBMITTED: 'ثبت شد', UNDER_REVIEW: 'در حال بررسی', NEEDS_INFORMATION: 'نیازمند اطلاعات', ACCEPTED: 'پذیرفته شد', REJECTED: 'رد شد' };
export const FILE_STATUS_LABEL: Record<PersonnelFileStatus, string> = { INCOMPLETE: 'ناقص', SUBMITTED_FOR_REVIEW: 'ارسال برای بررسی', NEEDS_CORRECTION: 'نیازمند اصلاح', APPROVED: 'تأیید شد' };

export interface DocSpec { key: string; label: string; required: boolean }
export interface OnboardingConfig {
  enabled: boolean; requiredDocs: DocSpec[]; requireNationalId: boolean; requireBank: boolean; requireAddress: boolean; desiredRoles: string[];
  usernamePolicy: 'NATIONAL_ID' | 'MOBILE'; tempPasswordTtlHours: number; interviewAddress?: string;
  smsTemplates: { credentials: string; interview: string };
}
const DEFAULT_CFG: OnboardingConfig = {
  enabled: true, requireNationalId: true, requireBank: true, requireAddress: true, desiredRoles: [], usernamePolicy: 'NATIONAL_ID', tempPasswordTtlHours: 48,
  requiredDocs: [{ key: 'photo', label: 'عکس پرسنلی', required: true }, { key: 'birthCertificate', label: 'تصویر صفحه اول شناسنامه', required: true }, { key: 'nationalCard', label: 'تصویر کارت ملی', required: true }],
  smsTemplates: {
    credentials: '{company}\nپرسنل گرامی، مدارک شما تأیید شد.\nنام کاربری: {username}\nرمز اولیه: {tempPassword}\nلطفاً در اولین ورود، رمز عبور خود را تغییر دهید.',
    interview: '{company}\nمتقاضی گرامی، درخواست همکاری شما بررسی شد.\nزمان مصاحبه: {date}، ساعت {time}\nمصاحبه‌کننده: {interviewer}\nآدرس: {address}\nلطفاً در زمان مقرر حضور داشته باشید.',
  },
};
export const getOnboardingConfig = (state?: Pick<AppState, 'settings'> | null): OnboardingConfig => {
  const c = (state?.settings as any)?.orgConfig?.onboarding || {};
  return { ...DEFAULT_CFG, ...c, requiredDocs: Array.isArray(c.requiredDocs) && c.requiredDocs.length ? c.requiredDocs : DEFAULT_CFG.requiredDocs, smsTemplates: { ...DEFAULT_CFG.smsTemplates, ...(c.smsTemplates || {}) } };
};

// ---------- اعتبارسنجی ----------
export const toLatinDigits = (s: string) => (s || '').replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
export const normalizeMobile = (m?: string): string | null => { const d = toLatinDigits(String(m || '')).replace(/[\s\-()]/g, ''); const x = d.replace(/^(\+98|0098|98)/, '0'); return /^09\d{9}$/.test(x) ? x : (/^9\d{9}$/.test(x) ? '0' + x : null); };
export const isValidNationalCode = (code?: string): boolean => {
  const c = toLatinDigits(String(code || '')).trim(); if (!/^\d{10}$/.test(c) || /^(\d)\1{9}$/.test(c)) return false;
  const s = [...c.slice(0, 9)].reduce((a, d, i) => a + +d * (10 - i), 0) % 11; const k = +c[9]; return s < 2 ? k === s : k === 11 - s;
};
export const isValidIranIban = (v?: string): boolean => {
  const s = toLatinDigits(String(v || '')).replace(/\s/g, '').toUpperCase(); if (!/^IR\d{24}$/.test(s)) return false;
  const r = (s.slice(4) + '1827' + s.slice(2, 4)); let rem = 0; for (const ch of r) rem = (rem * 10 + +ch) % 97; return rem === 1;
};
const norm = (s?: string) => toLatinDigits(String(s || '')).trim().toLowerCase();
const log = (d: any, action: string, entityType: string, entityId: string, details: string, actorId?: string, now = new Date(), newId: () => string = () => `${Date.now()}`) => {
  if (!d.auditLogs) d.auditLogs = [];
  d.auditLogs.push({ id: newId(), action, entityType, entityId, details, actor: (d.users || []).find((u: any) => u.id === actorId)?.name || actorId || 'متقاضی/سیستم', createdAt: now.toISOString() });
};

// ---------- درخواست همکاری ----------
export interface ApplicationInput { firstName?: string; lastName?: string; mobile?: string; nationalId?: string; desiredRole?: string; notes?: string }
export function validateApplication(state: AppState, i: ApplicationInput): { ok: boolean; errors: string[]; mobile?: string } {
  const cfg = getOnboardingConfig(state); const errors: string[] = [];
  if (!norm(i.firstName)) errors.push('نام الزامی است.'); if (!norm(i.lastName)) errors.push('نام خانوادگی الزامی است.');
  const mobile = normalizeMobile(i.mobile); if (!mobile) errors.push('شماره موبایل معتبر نیست (مثال: 09121234567).');
  if (cfg.requireNationalId && !isValidNationalCode(i.nationalId)) errors.push('کد ملی معتبر نیست.');
  if (!cfg.requireNationalId && norm(i.nationalId) && !isValidNationalCode(i.nationalId)) errors.push('کد ملی واردشده معتبر نیست.');
  if (!norm(i.desiredRole)) errors.push('شغل درخواستی الزامی است.');
  return { ok: errors.length === 0, errors, mobile: mobile || undefined };
}
const ACTIVE_APP: ApplicationStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFORMATION'];
export const applicationKey = (i: ApplicationInput) => `${norm(i.nationalId) || normalizeMobile(i.mobile) || ''}|${norm(i.desiredRole)}`;
export function submitApplication(draft: any, i: ApplicationInput, id: string, now: Date, docs: { kind: string; attachmentId: string }[] = []): { ok: boolean; errors: string[]; id?: string } {
  const v = validateApplication(draft, i); const errors = [...v.errors]; const cfg = getOnboardingConfig(draft);
  for (const d of cfg.requiredDocs) if (d.required && !docs.some(x => x.kind === d.key)) errors.push(`مدرک «${d.label}» الزامی است.`);
  const key = applicationKey(i);
  if ((draft.onboardingApplications || []).some((a: any) => a.idempotencyKey === key && ACTIVE_APP.includes(a.status))) errors.push('درخواست فعالی با همین مشخصات قبلاً ثبت شده است.');
  if (errors.length) return { ok: false, errors };
  if (!draft.onboardingApplications) draft.onboardingApplications = [];
  draft.onboardingApplications.unshift({ id, status: 'SUBMITTED' as ApplicationStatus, firstName: i.firstName!.trim(), lastName: i.lastName!.trim(), mobile: v.mobile, nationalId: toLatinDigits(i.nationalId || '').trim() || undefined, desiredRole: i.desiredRole!.trim(), notes: i.notes?.trim() || undefined, documents: docs, idempotencyKey: key, createdAt: now.toISOString(), history: [{ at: now.toISOString(), status: 'SUBMITTED', note: 'ثبت توسط متقاضی' }], transport: 'LOCAL_DEVICE_ONLY' });
  log(draft, 'APPLICATION_SUBMITTED', 'APPLICATION', id, `درخواست همکاری ${i.firstName} ${i.lastName} ثبت شد`, undefined, now);
  return { ok: true, errors: [], id };
}
const APP_FLOW: Record<ApplicationStatus, ApplicationStatus[]> = { SUBMITTED: ['UNDER_REVIEW', 'NEEDS_INFORMATION', 'ACCEPTED', 'REJECTED'], UNDER_REVIEW: ['NEEDS_INFORMATION', 'ACCEPTED', 'REJECTED'], NEEDS_INFORMATION: ['UNDER_REVIEW', 'REJECTED'], ACCEPTED: [], REJECTED: [] };
export function transitionApplication(draft: any, id: string, to: ApplicationStatus, note: string, actorId: string | undefined, now: Date): { ok: boolean; reason?: string } {
  const a = (draft.onboardingApplications || []).find((x: any) => x.id === id); if (!a) return { ok: false, reason: 'درخواست یافت نشد.' };
  if (!actorId) return { ok: false, reason: 'کاربر نامعلوم.' };
  if (!APP_FLOW[a.status as ApplicationStatus].includes(to)) return { ok: false, reason: 'این تغییر وضعیت مجاز نیست.' };
  if (['NEEDS_INFORMATION', 'REJECTED'].includes(to) && !norm(note)) return { ok: false, reason: 'یادداشت الزامی است.' };
  a.status = to; a.reviewerId = actorId; a.decisionNote = note.trim() || a.decisionNote; a.history.push({ at: now.toISOString(), status: to, note: note.trim() || undefined, by: actorId });
  log(draft, 'APPLICATION_' + to, 'APPLICATION', id, `وضعیت درخواست ${a.firstName} ${a.lastName} → ${APPLICATION_STATUS_LABEL[to as ApplicationStatus]}`, actorId, now);
  return { ok: true };
}

// ---------- پیامک (فقط ثبت محلی؛ ارسال واقعی = NOT_CONFIGURED) ----------
export const SMS_PROVIDER_STATUS = { status: 'NOT_CONFIGURED' as const, message: 'درگاه پیامک پیکربندی نشده است؛ متن پیامک ساخته و ثبت شد ولی ارسال نشد.' };
export function composeSms(template: string, vars: Record<string, string | undefined>): { ok: boolean; text: string; missing: string[] } {
  const missing: string[] = []; const text = template.replace(/\{(\w+)\}/g, (_, k) => { const v = vars[k]; if (v === undefined || v === '') { missing.push(k); return `{${k}}`; } return v; });
  return { ok: missing.length === 0, text, missing };
}
export function queueSms(draft: any, p: { to: string; text: string; key: string }, now: Date, newId: () => string): { id: string; duplicate: boolean } {
  if (!draft.messagingLogs) draft.messagingLogs = [];
  const ex = draft.messagingLogs.find((m: any) => m.dedupeKey === p.key); if (ex) return { id: ex.id, duplicate: true };
  const id = newId();
  draft.messagingLogs.unshift({ id, channelId: 'sms', direction: 'OUTBOUND', sender: getTenantNameSafe(draft), recipient: p.to, content: p.text, status: 'LOCAL_ONLY', reason: SMS_PROVIDER_STATUS.status, timestamp: now.toISOString(), dedupeKey: p.key });
  return { id, duplicate: false };
}
const getTenantNameSafe = (d: any) => (d?.settings?.orgConfig?.tenantName as string) || 'سازمان';

/** پیامک اطلاعات ورود: رمز موقت باید توسط سرویس احراز هویت تولید شود؛ بدون آن ساخته/ثبت نمی‌شود (جعل رمز ممنوع). */
export function prepareCredentialsSms(state: AppState, vars: { username?: string; tempPassword?: string }) {
  const cfg = getOnboardingConfig(state);
  const r = composeSms(cfg.smsTemplates.credentials, { company: getTenantNameSafe(state), username: vars.username, tempPassword: vars.tempPassword });
  return r.ok ? { status: 'READY' as const, text: r.text } : { status: 'BLOCKED' as const, reason: 'نیازمند سرویس احراز هویت (تولید رمز موقت منقضی‌شونده و اجبار تغییر در اولین ورود) و درگاه پیامک.', missing: r.missing };
}

// ---------- ارجاع به مصاحبه ----------
export interface InterviewInput { date?: string; time?: string; interviewerId?: string; address?: string }
export function referToInterview(draft: any, appId: string, i: InterviewInput, actorId: string | undefined, now: Date, newId: () => string): { ok: boolean; errors: string[]; taskId?: string } {
  const errors: string[] = []; const a = (draft.onboardingApplications || []).find((x: any) => x.id === appId);
  if (!a) return { ok: false, errors: ['درخواست یافت نشد.'] };
  if (!actorId) return { ok: false, errors: ['کاربر نامعلوم.'] };
  if (['ACCEPTED', 'REJECTED'].includes(a.status)) errors.push('برای درخواست نهایی‌شده ارجاع مصاحبه ممکن نیست.');
  if (a.interview?.taskId) errors.push('این درخواست قبلاً به مصاحبه ارجاع شده است (ارجاع تکراری ساخته نمی‌شود).');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(i.date || '')) errors.push('تاریخ مصاحبه معتبر نیست.');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(i.time || '')) errors.push('ساعت مصاحبه معتبر نیست.');
  const interviewer = (draft.users || []).find((u: any) => u.id === i.interviewerId && (u.isActive ?? u.active) !== false); if (!interviewer) errors.push('مصاحبه‌کننده فعال انتخاب نشده است.');
  const address = (i.address || getOnboardingConfig(draft).interviewAddress || '').trim(); if (!address) errors.push('آدرس محل مصاحبه الزامی است.');
  if (errors.length) return { ok: false, errors };
  const fullName = `${a.firstName} ${a.lastName}`; const taskId = newId();
  if (!draft.tasks) draft.tasks = [];
  draft.tasks.unshift({ id: taskId, title: `مصاحبه استخدامی — ${fullName}`, description: `درخواست همکاری: ${fullName} · شغل: ${a.desiredRole}`, dueDate: i.date, dueTime: i.time, status: 'OPEN', priority: 'NORMAL', slaStatus: 'ON_TRACK', assigneeType: 'USER', assigneeId: interviewer.id, mentions: [], sourceApplicationId: appId, relatedEntity: { type: 'APPLICATION', id: appId, display: `درخواست همکاری: ${fullName}` }, createdAt: now.toISOString() });
  const sms = composeSms(getOnboardingConfig(draft).smsTemplates.interview, { company: getTenantNameSafe(draft), date: i.date, time: i.time, interviewer: interviewer.name, address });
  const q = sms.ok ? queueSms(draft, { to: a.mobile, text: sms.text, key: `interview|${appId}` }, now, newId) : { id: undefined };
  if (!draft.notifications) draft.notifications = [];
  draft.notifications.push({ id: newId(), title: 'مصاحبه جدید', message: `مصاحبه ${fullName} در ${i.date} ساعت ${i.time} به شما ارجاع شد.`, type: 'INFO', read: false, createdAt: now.toISOString(), linkTab: 'tasks', recipientId: interviewer.id, dedupeKey: `interview-task|${appId}`, entityId: taskId });
  a.interview = { date: i.date, time: i.time, interviewerId: interviewer.id, address, taskId, smsLogId: q.id, smsStatus: SMS_PROVIDER_STATUS.status };
  if (a.status === 'SUBMITTED' || a.status === 'NEEDS_INFORMATION') { a.status = 'UNDER_REVIEW'; }
  a.history.push({ at: now.toISOString(), status: a.status, note: 'ارجاع به مصاحبه', by: actorId });
  log(draft, 'INTERVIEW_REFERRED', 'APPLICATION', appId, `ارجاع مصاحبه ${fullName} به ${interviewer.name}`, actorId, now, newId);
  return { ok: true, errors: [], taskId };
}
export function recordInterviewResult(draft: any, appId: string, result: InterviewResult, note: string, actorId: string | undefined, now: Date, canOverride = false): { ok: boolean; reason?: string } {
  const a = (draft.onboardingApplications || []).find((x: any) => x.id === appId);
  if (!a?.interview?.taskId) return { ok: false, reason: 'ارجاع مصاحبه‌ای وجود ندارد.' };
  if (a.interview.result) return { ok: false, reason: 'نتیجه مصاحبه قبلاً ثبت شده است.' };
  if (!actorId || (a.interview.interviewerId !== actorId && !canOverride)) return { ok: false, reason: 'فقط مصاحبه‌کننده (یا مدیر مجاز) می‌تواند نتیجه را ثبت کند.' };
  if (result !== 'ACCEPT' && !norm(note)) return { ok: false, reason: 'یادداشت الزامی است.' };
  a.interview.result = result; a.interview.resultNote = note.trim() || undefined; a.interview.resultAt = now.toISOString();
  const t = (draft.tasks || []).find((x: any) => x.id === a.interview.taskId); if (t) { t.status = 'COMPLETED'; t.completedAt = now.toISOString(); }
  const to: ApplicationStatus = result === 'ACCEPT' ? 'ACCEPTED' : result === 'REJECT' ? 'REJECTED' : 'UNDER_REVIEW';
  a.status = to; a.history.push({ at: now.toISOString(), status: to, note: `نتیجه مصاحبه: ${result}${note ? ' — ' + note : ''}`, by: actorId });
  log(draft, 'INTERVIEW_RESULT', 'APPLICATION', appId, `نتیجه مصاحبه ${a.firstName} ${a.lastName}: ${result}`, actorId, now);
  return { ok: true };
}

// ---------- پرونده پرسنلی (اتصال به همان کاربر؛ بدون رکورد تکراری) ----------
export interface PersonnelFile { userId: string; status: PersonnelFileStatus; identity: Record<string, any>; bank: Record<string, any>; address: Record<string, any>; documents: Record<string, string>; reviewNote?: string; history: any[]; updatedAt: string; createdAt: string }
export function ensurePersonnelFile(draft: any, userId: string, now: Date): PersonnelFile | null {
  if (!(draft.users || []).some((u: any) => u.id === userId)) return null;
  if (!draft.personnelFiles) draft.personnelFiles = [];
  let f = draft.personnelFiles.find((x: any) => x.userId === userId);
  if (!f) { const u = draft.users.find((x: any) => x.id === userId); f = { userId, status: 'INCOMPLETE', identity: { fullName: u?.name || '' , mobile: u?.mobile || u?.phone || '', nationalId: u?.nationalId || '' }, bank: {}, address: {}, documents: {}, history: [], createdAt: now.toISOString(), updatedAt: now.toISOString() }; draft.personnelFiles.push(f); }
  return f;
}
export function computeMissing(file: Pick<PersonnelFile, 'identity' | 'bank' | 'address' | 'documents'> | undefined, cfg: OnboardingConfig): { key: string; label: string }[] {
  const m: { key: string; label: string }[] = []; const f = file || { identity: {}, bank: {}, address: {}, documents: {} } as any;
  if (!norm(f.identity.fullName)) m.push({ key: 'identity.fullName', label: 'نام و نام خانوادگی' });
  if (!normalizeMobile(f.identity.mobile)) m.push({ key: 'identity.mobile', label: 'شماره موبایل معتبر' });
  if (cfg.requireNationalId && !isValidNationalCode(f.identity.nationalId)) m.push({ key: 'identity.nationalId', label: 'کد ملی معتبر' });
  if (cfg.requireBank) { if (!norm(f.bank.bankName)) m.push({ key: 'bank.bankName', label: 'نام بانک' }); if (!isValidIranIban(f.bank.iban)) m.push({ key: 'bank.iban', label: 'شماره شبا معتبر' }); if (!norm(f.bank.accountHolder)) m.push({ key: 'bank.accountHolder', label: 'نام صاحب حساب' }); }
  if (cfg.requireAddress) { if (!norm(f.address.province)) m.push({ key: 'address.province', label: 'استان' }); if (!norm(f.address.city)) m.push({ key: 'address.city', label: 'شهر' }); if (!norm(f.address.full)) m.push({ key: 'address.full', label: 'آدرس کامل' }); }
  for (const d of cfg.requiredDocs) if (d.required && !f.documents[d.key]) m.push({ key: `doc.${d.key}`, label: d.label });
  return m;
}
/** ذخیره موقت یک مرحله (ادامه بعداً)؛ فایل تأییدشده با تغییر اطلاعات به NEEDS_CORRECTION/INCOMPLETE برمی‌گردد */
export function savePersonnelStep(draft: any, userId: string, step: 'identity' | 'bank' | 'address', data: Record<string, any>, now: Date): { ok: boolean; reason?: string } {
  const f = ensurePersonnelFile(draft, userId, now); if (!f) return { ok: false, reason: 'کاربر یافت نشد.' };
  if (f.status === 'SUBMITTED_FOR_REVIEW') return { ok: false, reason: 'پرونده در حال بررسی است؛ تا تعیین نتیجه قابل ویرایش نیست.' };
  f[step] = { ...f[step], ...data }; if (f.status === 'APPROVED') f.status = 'INCOMPLETE'; f.updatedAt = now.toISOString(); return { ok: true };
}
export function setPersonnelDocument(draft: any, userId: string, kind: string, attachmentId: string, now: Date): { ok: boolean; reason?: string } {
  const f = ensurePersonnelFile(draft, userId, now); if (!f) return { ok: false, reason: 'کاربر یافت نشد.' };
  if (f.status === 'SUBMITTED_FOR_REVIEW') return { ok: false, reason: 'پرونده در حال بررسی است.' };
  f.documents[kind] = attachmentId; if (f.status === 'APPROVED') f.status = 'INCOMPLETE'; f.updatedAt = now.toISOString(); return { ok: true };
}
export function submitPersonnelFile(draft: any, userId: string, now: Date): { ok: boolean; missing: { key: string; label: string }[] } {
  const f = ensurePersonnelFile(draft, userId, now); if (!f) return { ok: false, missing: [{ key: 'user', label: 'کاربر' }] };
  const missing = computeMissing(f, getOnboardingConfig(draft)); if (missing.length) return { ok: false, missing };
  if (f.status === 'SUBMITTED_FOR_REVIEW' || f.status === 'APPROVED') return { ok: false, missing: [] };
  f.status = 'SUBMITTED_FOR_REVIEW'; f.reviewNote = undefined; f.history.push({ at: now.toISOString(), status: f.status, by: userId }); f.updatedAt = now.toISOString();
  log(draft, 'PERSONNEL_FILE_SUBMITTED', 'PERSONNEL_FILE', userId, 'پرونده پرسنلی برای بررسی ارسال شد', userId, now); return { ok: true, missing: [] };
}
/** بررسی مدیر: تأیید مدارک فقط وضعیت پرونده را عوض می‌کند — نقش/مجوز/فعال‌بودن حساب دست‌نخورده می‌ماند. تأیید پرونده خود ممنوع. */
export function reviewPersonnelFile(draft: any, userId: string, decision: 'APPROVE' | 'NEEDS_CORRECTION', note: string, actorId: string | undefined, now: Date): { ok: boolean; reason?: string } {
  const f = (draft.personnelFiles || []).find((x: any) => x.userId === userId);
  if (!f) return { ok: false, reason: 'پرونده یافت نشد.' }; if (!actorId) return { ok: false, reason: 'کاربر نامعلوم.' };
  if (actorId === userId) return { ok: false, reason: 'بررسی پرونده خود مجاز نیست.' };
  if (f.status !== 'SUBMITTED_FOR_REVIEW') return { ok: false, reason: 'پرونده در وضعیت قابل بررسی نیست.' };
  if (decision === 'NEEDS_CORRECTION' && !norm(note)) return { ok: false, reason: 'یادداشت اصلاح الزامی است.' };
  if (decision === 'APPROVE' && computeMissing(f, getOnboardingConfig(draft)).length) return { ok: false, reason: 'پرونده ناقص است و تأیید نمی‌شود.' };
  f.status = decision === 'APPROVE' ? 'APPROVED' : 'NEEDS_CORRECTION'; f.reviewNote = note.trim() || undefined; f.reviewedBy = actorId; f.reviewedAt = now.toISOString(); f.history.push({ at: now.toISOString(), status: f.status, note: note.trim() || undefined, by: actorId });
  log(draft, 'PERSONNEL_FILE_' + f.status, 'PERSONNEL_FILE', userId, `پرونده پرسنلی → ${FILE_STATUS_LABEL[f.status as PersonnelFileStatus]}`, actorId, now); return { ok: true };
}

export interface FilePayload { fileName: string; fileType: string; fileSize: number; base64Data: string }
/** ذخیره مدرک در همان state.attachments (فضای خصوصی دستگاه؛ نمایش فقط در صفحه‌های مجاز) */
export function addAttachment(draft: any, entityType: 'APPLICATION' | 'PERSONNEL_FILE', entityId: string, kind: string, f: FilePayload, id: string, now: Date, uploadedBy: string): string {
  if (!draft.attachments) draft.attachments = [];
  draft.attachments.push({ id, entityId, entityType, kind, fileName: f.fileName, fileType: f.fileType, fileSize: f.fileSize, base64Data: f.base64Data, uploadedAt: now.toISOString(), uploadedBy });
  return id;
}
