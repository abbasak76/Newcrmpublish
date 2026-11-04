import React, { useState, useEffect, useRef } from 'react';
import { 
  DynamicFormSchema, 
  DynamicFormField, 
  shouldFieldDisplay, 
  validateSingleField, 
  validateEntireForm 
} from '../../services/dynamicFormEngine';
import { CustomDatePicker } from '../ui/CustomDatePicker';
import { Button } from '../ui/Button';
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { announceToScreenReader } from '../ui/LiveAnnouncer';
import { useAppStore } from '../../lib/storage';
import { findMentionToken, searchMentions, createMentionReference, MentionEntity } from '../../services/mentionEngine.ts';

interface DynamicFormRendererProps {
  schema: DynamicFormSchema;
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  /** Optional stable key for this form draft; otherwise scoped by user/schema/record. */
  draftKey?: string;
  autoSaveDraft?: boolean;
}

export function DynamicFormRenderer({
  schema,
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = 'ثبت و ذخیره فرم',
  cancelLabel = 'انصراف',
  isSubmitting = false,
  draftKey,
  autoSaveDraft = true
}: DynamicFormRendererProps) {
  const appState = useAppStore(s => s.state);
  const currentUserId = useAppStore(s => s.state?.currentUserId || 'anonymous');
  const [mentionMenu, setMentionMenu] = useState<{ fieldName: string; tokenStart: number; tokenEnd: number; query: string; results: MentionEntity[] } | null>(null);
  const autoSaveEnabled = useAppStore(s => s.state?.settings?.autoSaveFormDrafts !== false);
  const sensitiveForm = schema.fields.some(field => /password|token|secret|national.?code|bank.?account|card.?number|otp/i.test(field.name));
  const resolvedDraftKey = draftKey || `akhavan:form-draft:${currentUserId}:${schema.id}:${String(initialValues.id || initialValues.accountId || initialValues.customerId || initialValues.quoteId || 'new')}`;
  const canAutoSaveDraft = autoSaveDraft && autoSaveEnabled && !sensitiveForm;
  const [draftReady, setDraftReady] = useState(false);
  const [submittingInternal, setSubmittingInternal] = useState(false);
  const submissionLock = useRef(false);
  const submitting = isSubmitting || submittingInternal;
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  // فرم ولیوز بر اساس دیفالت‌های فیلدها و اینیشال ولیوز
  const [formValues, setFormValues] = useState<Record<string, any>>(() => {
    const vals: Record<string, any> = { ...initialValues };
    schema.fields.forEach(f => {
      if (vals[f.name] === undefined && f.defaultValue !== undefined) {
        vals[f.name] = f.defaultValue;
      }
    });
    return vals;
  });

  useEffect(() => {
    const vals: Record<string, any> = { ...initialValues };
    schema.fields.forEach(f => { if (vals[f.name] === undefined && f.defaultValue !== undefined) vals[f.name] = f.defaultValue; });
    setDraftReady(false);
    if (canAutoSaveDraft && typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(resolvedDraftKey);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved?.schemaId === schema.id && saved?.values && typeof saved.values === 'object') {
            const allowed = new Set(schema.fields.map(field => field.name));
            for (const [key, value] of Object.entries(saved.values)) if (allowed.has(key)) vals[key] = value;
            setDraftSavedAt(typeof saved.savedAt === 'string' ? saved.savedAt : null);
          }
        } else setDraftSavedAt(null);
      } catch { setDraftSavedAt(null); }
    }
    setFormValues(vals); setTouched({}); setErrors({}); setDraftReady(true);
  }, [schema.id, JSON.stringify(initialValues), resolvedDraftKey, canAutoSaveDraft]);

  useEffect(() => {
    if (!draftReady || !canAutoSaveDraft || typeof window === 'undefined') return;
    try {
      const savedAt = new Date().toISOString();
      window.localStorage.setItem(resolvedDraftKey, JSON.stringify({ schemaId: schema.id, values: formValues, savedAt }));
      setDraftSavedAt(savedAt);
    } catch {
      // Storage quota/privacy mode can deny local persistence; the live form remains usable.
    }
  }, [formValues, draftReady, canAutoSaveDraft, resolvedDraftKey, schema.id]);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formFieldsMandatory = useAppStore(s => s.state?.settings?.formFieldsMandatory !== false);
  const updateState = useAppStore(s => s.updateState);

  const handleFieldChange = (field: DynamicFormField, rawValue: any) => {
    let value = rawValue;
    if (((field as any).enableMentions || field.type === 'text' || field.type === 'textarea') && typeof rawValue === 'string') {
      const token = findMentionToken(rawValue);
      if (token) setMentionMenu({ fieldName: field.name, tokenStart: token.start, tokenEnd: token.end, query: token.query, results: searchMentions(appState, token.query) });
      else setMentionMenu(current => current?.fieldName === field.name ? null : current);
    }

    // پاکسازی برای فیلدهای عددی و ریالی
    if (field.type === 'currency' || field.type === 'number') {
      if (typeof rawValue === 'string') {
        value = rawValue.replace(/,/g, '');
      }
    }

    const updatedValues = { ...formValues, [field.name]: value };
    // Clear dependent selections when their source field changes, preventing stale IDs.
    schema.fields.forEach(candidate => {
      if (candidate.optionsDependsOn === field.name && candidate.name !== field.name) {
        updatedValues[candidate.name] = '';
      }
    });
    setFormValues(updatedValues);

    // اعتبارسنجی بلادرنگ فیلد تغییریافته
    if (touched[field.name]) {
      const err = validateSingleField(field, value, updatedValues);
      setErrors(prev => {
        const next = { ...prev };
        if (err && (formFieldsMandatory || (value !== undefined && value !== null && String(value).trim() !== ''))) {
          next[field.name] = err;
        } else {
          delete next[field.name];
        }
        return next;
      });
    }
  };

  const handleBlur = (field: DynamicFormField) => {
    setTouched(prev => ({ ...prev, [field.name]: true }));
    const err = validateSingleField(field, formValues[field.name], formValues);
    setErrors(prev => {
      const next = { ...prev };
      if (err && (formFieldsMandatory || (formValues[field.name] !== undefined && formValues[field.name] !== null && String(formValues[field.name]).trim() !== ''))) {
        next[field.name] = err;
      } else {
        delete next[field.name];
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submissionLock.current || submitting) return;

    // مارک کردن تمامی فیلدها به عنوان تاچ‌شده
    const allTouched: Record<string, boolean> = {};
    schema.fields.forEach(f => { allTouched[f.name] = true; });
    setTouched(allTouched);

    const validation = validateEntireForm(schema, formValues);
    
    // در صورتی که کاربر اجباری بودن فیلدها را در تنظیمات خاموش کرده باشد، فیلدهای خالی مانع ثبت نمی‌شوند
    const effectiveErrors = formFieldsMandatory 
      ? validation.errors 
      : Object.fromEntries(
          Object.entries(validation.errors).filter(([key, err]) => {
            const val = formValues[key];
            const isEmpty = val === undefined || val === null || (typeof val === 'string' && val.trim() === '');
            return !isEmpty && Boolean(err);
          })
        );

    setErrors(effectiveErrors);

    const isSubmissionValid = formFieldsMandatory ? validation.isValid : Object.keys(effectiveErrors).length === 0;

    if (isSubmissionValid) {
      announceToScreenReader('اعتبارسنجی فرم موفق بود؛ اطلاعات در حال ارسال است.');
      submissionLock.current = true;
      setSubmittingInternal(true);
      const clearDraft = () => { try { if (typeof window !== 'undefined') window.localStorage.removeItem(resolvedDraftKey); setDraftSavedAt(null); } catch { /* ignore denied storage */ } };
      const releaseLock = () => { submissionLock.current = false; setSubmittingInternal(false); };
      try {
        const submission = (onSubmit as (values: Record<string, any>) => unknown)(formValues);
        if (submission && typeof (submission as any).then === 'function') {
          Promise.resolve(submission).then(() => clearDraft()).catch(() => announceToScreenReader('ارسال فرم کامل نشد؛ پیش‌نویس محلی حفظ شده است.', 'assertive')).finally(releaseLock);
        } else {
          clearDraft();
          releaseLock();
        }
      } catch {
        announceToScreenReader('ارسال فرم با خطا مواجه شد؛ پیش‌نویس محلی حفظ شده است.', 'assertive');
        releaseLock();
      }
    } else {
      const errorCount = Object.values(validation.errors).filter(Boolean).length;
      announceToScreenReader(`فرم دارای ${errorCount.toLocaleString('fa-IR')} خطا است. فیلدهای مشخص‌شده را بررسی کنید.`, 'assertive');
    }
  };

  // فرمت سه‌رقم سه‌رقم برای مبالغ ریالی
  const formatCurrencyDisplay = (val: any) => {
    if (val === undefined || val === null || val === '') return '';
    const num = Number(String(val).replace(/,/g, ''));
    return isNaN(num) ? val : num.toLocaleString('fa-IR');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      {canAutoSaveDraft && <p className="text-[10px] text-text-secondary" role="status">پیش‌نویس این فرم روی همین مرورگر ذخیره می‌شود{draftSavedAt ? ` · آخرین ذخیره: ${new Date(draftSavedAt).toLocaleTimeString('fa-IR')}` : ''}؛ پس از ثبت موفق پاک می‌شود.</p>}
      {schema.description && (
        <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs text-text-secondary flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>{schema.description}</span>
        </div>
      )}

      {/* نوار تغییر سریع حالت اجباری / اختیاری فیلدها */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-canvas border border-border/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-text-main">
            {formFieldsMandatory ? 'وضعیت فرم: فیلدهای ستاره‌دار الزامی هستند' : '⚡ حالت ثبت سریع: کلیه فیلدها اختیاری شده‌اند (ثبت فوری بدون معطلی)'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            updateState(draft => {
              if (!draft.settings) draft.settings = {};
              draft.settings.formFieldsMandatory = !formFieldsMandatory;
            });
          }}
          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
            formFieldsMandatory 
              ? 'border-border text-text-secondary hover:text-primary hover:border-primary' 
              : 'border-primary bg-primary/10 text-primary font-black'
          }`}
        >
          {formFieldsMandatory ? 'آسان‌سازی فرم (حذف اجبار فیلدها)' : 'بازگرداندن به حالت اجباری'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schema.fields.map(field => {
          // بررسی شرط نمایش
          if (!shouldFieldDisplay(field, formValues)) {
            return null;
          }

          const isFullWidth = field.colSpan === 2;
          const fieldError = touched[field.name] ? errors[field.name] : null;
          const val = formValues[field.name];

          return (
            <div 
              key={field.id} 
              className={`space-y-1.5 ${isFullWidth ? 'md:col-span-2' : 'md:col-span-1'}`}
            >
              <div className="flex items-center justify-between">
                <label htmlFor={`dynamic-${schema.id}-${field.id}`} className="text-xs font-bold text-text-main flex items-center gap-1">
                  <span>{field.label}</span>
                  {field.validation?.required && (
                    formFieldsMandatory ? (
                      <span className="text-red-500 font-bold" title="فیلد الزامی">*</span>
                    ) : (
                      <span className="text-text-secondary text-[10px] font-normal mr-1">(اختیاری)</span>
                    )
                  )}
                  {field.unit && (
                    <span className="text-[10px] text-text-secondary font-normal">({field.unit})</span>
                  )}
                </label>
                {field.description && (
                  <span className="text-[10px] text-text-secondary">{field.description}</span>
                )}
              </div>

              {/* رندرهای مختلف بر اساس نوع فیلد */}
              {field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'nationalCode' ? (<>
                <input
                  id={`dynamic-${schema.id}-${field.id}`}
                  aria-invalid={Boolean(fieldError)}
                  aria-describedby={fieldError ? `dynamic-error-${schema.id}-${field.id}` : undefined}
                  type={field.type === 'email' ? 'email' : 'text'}
                  value={val ?? ''}
                  onChange={e => handleFieldChange(field, e.target.value)}
                  onBlur={() => handleBlur(field)}
                  placeholder={field.placeholder}
                  readOnly={field.readOnly}
                  dir={field.type === 'phone' || field.type === 'email' || field.type === 'nationalCode' ? 'ltr' : 'rtl'}
                  className={`w-full bg-canvas border rounded-xl p-2.5 text-xs text-text-main focus:outline-none transition-all ${
                    fieldError 
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20' 
                      : 'border-border/80 focus:border-primary focus:ring-1 focus:ring-primary/20'
                  }`}
                />
                {((field as any).enableMentions || (field.type as string) === 'text' || (field.type as string) === 'textarea') && mentionMenu?.fieldName === field.name && mentionMenu.results.length > 0 && (
                  <div role="listbox" aria-label="نتایج منشن" className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
                    {mentionMenu.results.map(entity => <button type="button" role="option" aria-selected="false" key={`${entity.entityType}:${entity.entityId}`} className="flex w-full items-center justify-between gap-3 border-b border-border/50 px-3 py-2 text-right last:border-b-0 hover:bg-primary/5" onMouseDown={event => event.preventDefault()} onClick={() => {
                      const current = String(formValues[field.name] ?? '');
                      const token = findMentionToken(current);
                      const start = token?.start ?? mentionMenu.tokenStart; const end = token?.end ?? mentionMenu.tokenEnd;
                      const next = `${current.slice(0,start)}@${entity.displayText} ${current.slice(end)}`;
                      setFormValues(previous => ({ ...previous, [field.name]: next, mentions: [...((previous.mentions as any[]) || []), createMentionReference(entity)] }));
                      setMentionMenu(null);
                    }}><span className="min-w-0"><span className="block text-xs font-bold text-text-main">{entity.displayText}</span><span className="block text-[10px] text-text-secondary">{entity.entityType} · {entity.subtitle || entity.entityId}</span></span><span className="shrink-0 text-[10px] text-text-secondary">{entity.source}</span></button>)}
                  </div>
                )}
                </>) : field.type === 'currency' ? (
                <div className="relative">
                  <input
                    id={`dynamic-${schema.id}-${field.id}`}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={fieldError ? `dynamic-error-${schema.id}-${field.id}` : undefined}
                    type="text"
                    value={formatCurrencyDisplay(val)}
                    onChange={e => handleFieldChange(field, e.target.value)}
                    onBlur={() => handleBlur(field)}
                    placeholder={field.placeholder}
                    dir="ltr"
                    className={`w-full bg-canvas border rounded-xl p-2.5 text-xs font-bold text-text-main text-left pl-12 focus:outline-none transition-all ${
                      fieldError 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-border/80 focus:border-primary'
                    }`}
                  />
                  <div className="absolute left-3 top-2.5 text-[11px] font-bold text-text-secondary pointer-events-none">
                    ریال
                  </div>
                </div>
              ) : field.type === 'number' ? (
                <input
                  id={`dynamic-${schema.id}-${field.id}`}
                  aria-invalid={Boolean(fieldError)}
                  aria-describedby={fieldError ? `dynamic-error-${schema.id}-${field.id}` : undefined}
                  type="number"
                  value={val ?? ''}
                  onChange={e => handleFieldChange(field, e.target.value)}
                  onBlur={() => handleBlur(field)}
                  placeholder={field.placeholder}
                  dir="ltr"
                  className={`w-full bg-canvas border rounded-xl p-2.5 text-xs text-text-main focus:outline-none transition-all ${
                    fieldError ? 'border-red-500' : 'border-border/80 focus:border-primary'
                  }`}
                />
              ) : field.type === 'textarea' ? (
                <textarea
                  id={`dynamic-${schema.id}-${field.id}`}
                  aria-invalid={Boolean(fieldError)}
                  aria-describedby={fieldError ? `dynamic-error-${schema.id}-${field.id}` : undefined}
                  value={val ?? ''}
                  onChange={e => handleFieldChange(field, e.target.value)}
                  onBlur={() => handleBlur(field)}
                  placeholder={field.placeholder}
                  rows={3}
                  className={`w-full bg-canvas border rounded-xl p-2.5 text-xs text-text-main focus:outline-none transition-all ${
                    fieldError ? 'border-red-500' : 'border-border/80 focus:border-primary'
                  }`}
                />
              ) : field.type === 'select' ? (
                <select
                  id={`dynamic-${schema.id}-${field.id}`}
                  aria-invalid={Boolean(fieldError)}
                  aria-describedby={fieldError ? `dynamic-error-${schema.id}-${field.id}` : undefined}
                  value={val ?? ''}
                  onChange={e => handleFieldChange(field, e.target.value)}
                  onBlur={() => handleBlur(field)}
                  className={`w-full bg-canvas border rounded-xl p-2.5 text-xs text-text-main font-medium focus:outline-none transition-all ${
                    fieldError ? 'border-red-500' : 'border-border/80 focus:border-primary'
                  }`}
                >
                  <option value="" disabled>-- انتخاب کنید --</option>
                  {(field.optionsDependsOn && field.optionsByValue ? (field.optionsByValue[String(formValues[field.optionsDependsOn] ?? '')] || []) : (field.options || [])).map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'jalaliDate' ? (
                <CustomDatePicker
                  value={val ?? ''}
                  onChange={dateStr => handleFieldChange(field, dateStr)}
                  placeholder={field.placeholder || 'انتخاب تاریخ شمسی'}
                />
              ) : field.type === 'boolean' ? (
                <label className="flex items-center gap-3 p-3 bg-canvas/50 rounded-xl border border-border/60 cursor-pointer hover:bg-canvas transition-colors">
                  <input
                    id={`dynamic-${schema.id}-${field.id}`}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={fieldError ? `dynamic-error-${schema.id}-${field.id}` : undefined}
                    type="checkbox"
                    checked={Boolean(val)}
                    onChange={e => handleFieldChange(field, e.target.checked)}
                    className="w-4 h-4 text-primary rounded-sm border-border focus:ring-primary/20 accent-primary"
                  />
                  <span className="text-xs font-medium text-text-main select-none">{field.placeholder || field.label}</span>
                </label>
              ) : null}

              {((field as any).enableMentions || field.type === 'text' || field.type === 'textarea') && mentionMenu?.fieldName === field.name && mentionMenu.results.length > 0 && (
                <div role="listbox" aria-label="نتایج منشن" className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
                  {mentionMenu.results.map(entity => <button type="button" role="option" aria-selected="false" key={`${entity.entityType}:${entity.entityId}`} className="flex w-full items-center justify-between gap-3 border-b border-border/50 px-3 py-2 text-right last:border-b-0 hover:bg-primary/5" onMouseDown={event => event.preventDefault()} onClick={() => {
                    const current = String(formValues[field.name] ?? '');
                    const token = findMentionToken(current);
                    const start = token?.start ?? mentionMenu.tokenStart; const end = token?.end ?? mentionMenu.tokenEnd;
                    const next = `${current.slice(0,start)}@${entity.displayText} ${current.slice(end)}`;
                    setFormValues(previous => ({ ...previous, [field.name]: next, mentions: [...((previous.mentions as any[]) || []).filter((m: any) => !(m.entityType === entity.entityType && m.entityId === entity.entityId)), createMentionReference(entity)] }));
                    setMentionMenu(null);
                  }}><span className="min-w-0"><span className="block text-xs font-bold text-text-main">{entity.displayText}</span><span className="block text-[10px] text-text-secondary">{entity.entityType} · {entity.subtitle || entity.entityId}</span></span><span className="shrink-0 text-[10px] text-text-secondary">{entity.source}</span></button>)}
                </div>
              )}

              {/* نمایش خطای اعتبارسنجی */}
              {fieldError && (
                <div id={`dynamic-error-${schema.id}-${field.id}`} role="alert" className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldError}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* اکشن‌های دکمه فرم */}
      <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
        {onCancel && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
            disabled={submitting}
          >
            {cancelLabel}
          </Button>
        )}
        <Button 
          type="submit" 
          variant="primary" 
          size="sm" 
          disabled={submitting}
          className="flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{submitting ? 'در حال ذخیره‌سازی...' : submitLabel}</span>
        </Button>
      </div>
    </form>
  );
}
