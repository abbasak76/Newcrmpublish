/** Shared sales pipeline vocabulary. Keep stage identifiers stable for persisted records; labels/styles are presentation only. */
export const LEAD_STAGES = [
  { id: 'NEW', label: 'جدید (NEW)', color: 'bg-sky-50 text-info' },
  { id: 'CONTACTED', label: 'تماس اولیه (CONTACTED)', color: 'bg-primary/10 text-primary' },
  { id: 'QUALIFIED', label: 'واجد شرایط (QUALIFIED)', color: 'bg-amber-50 text-warning' },
  { id: 'CONVERTED', label: 'تبدیل به مشتری (CONVERTED)', color: 'bg-success-soft text-success' },
  { id: 'LOST', label: 'از دست رفته (LOST)', color: 'bg-red-50 text-danger' },
] as const;

export const OPPORTUNITY_STAGES = [
  { id: 'DISCOVERY', label: 'شناسایی (Discovery)', color: 'bg-sky-50 text-info' },
  { id: 'PROPOSAL', label: 'پروپوزال (Proposal)', color: 'bg-primary/10 text-primary' },
  { id: 'NEGOTIATION', label: 'مذاکره (Negotiation)', color: 'bg-amber-50 text-warning' },
  { id: 'WON', label: 'موفق (Won)', color: 'bg-success-soft text-success' },
  { id: 'LOST', label: 'از دست رفته (Lost)', color: 'bg-red-50 text-danger' },
] as const;

export const PIPELINE_FILTER_ALL = {
  leads: { id: 'ALL', label: 'همه سرنخ‌ها', color: 'bg-canvas text-text-secondary' },
  opportunities: { id: 'ALL', label: 'همه فرصت‌ها', color: 'bg-canvas text-text-secondary' },
} as const;

export const APP_LIMITS = { DEFAULT_PAGE_SIZE: 25, MAX_PAGE_SIZE: 100 } as const;
