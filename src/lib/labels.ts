/** Centralized Persian labels for stable CRM enum values shown to end users. */
const STATUS_LABELS: Record<string, string> = {
  NEW: 'جدید', OPEN: 'باز', IN_PROGRESS: 'در حال انجام', PENDING: 'در انتظار',
  COMPLETED: 'تکمیل‌شده', APPROVED: 'تأییدشده', REJECTED: 'ردشده', CANCELLED: 'لغوشده',
  IN_REVIEW: 'در حال بررسی', SUBMITTED: 'ارسال‌شده', WAITING_FOR_INFORMATION: 'در انتظار اطلاعات',
  CONNECTED: 'متصل', DISCONNECTED: 'قطع اتصال', NOT_CONFIGURED: 'پیکربندی‌نشده', ERROR: 'خطا',
  DRAFT: 'پیش‌نویس', ACTIVE: 'فعال', INACTIVE: 'غیرفعال', WON: 'مذاکره موفق (عقد قرارداد)', LOST: 'مذاکره ناموفق (مختومه)',
  QUALIFIED: 'واجد شرایط', CONTACTED: 'تماس گرفته‌شده', CONVERTED: 'تبدیل‌شده',
  LOW: 'پایین', NORMAL: 'عادی', HIGH: 'بالا', URGENT: 'فوری',
  EXECUTED: 'اجراشده', QUEUED: 'در صف اجرا', AWAITING_APPROVAL: 'در انتظار تأیید',
  SENT: 'ارسال‌شده', FAILED: 'ناموفق', PAID: 'پرداخت‌شده', PARTIAL: 'پرداخت جزئی', OVERDUE: 'سررسیدگذشته',
  UNREAD: 'خوانده‌نشده', READ: 'خوانده‌شده', ON_TRACK: 'طبق برنامه', AT_RISK: 'در معرض تأخیر', BREACHED: 'از مهلت گذشته',
  FOLLOW_UP: 'پیگیری', COLLECTION: 'وصول مطالبات', ORDER_OFFER: 'پیشنهاد فروش', ONSITE_VISIT: 'ویزیت میدانی', FINANCIAL_RECON: 'تطبیق مالی',
  CASH: 'نقدی', BANK_TRANSFER: 'انتقال بانکی', CHEQUE: 'چک', CARD: 'کارت‌خوان', NEW_CASE: 'پرونده جدید',
  PENDING_APPROVAL: 'در انتظار تأیید', ACCEPTED: 'پذیرفته‌شده', HANDOFF_EXTERNAL: 'تحویل به سامانه بیرونی',
  PROSPECTING: 'شناسایی فرصت', NEGOTIATION: 'مذاکره', PROPOSAL: 'ارائه پیشنهاد', CLOSED_WON: 'موفق و نهایی‌شده', CLOSED_LOST: 'ناموفق و بسته‌شده',
  BOUNCED: 'برگشت‌خورده (نکول)', CLEARED: 'وصول‌شده (تسویه)', LOCAL_ONLY: 'فقط ثبت محلی (ارسال نشده)', ERP_PENDING: 'در انتظار اجرا در ERP', NEEDS_INFORMATION: 'نیازمند اطلاعات', NEEDS_CORRECTION: 'نیازمند اصلاح', UNDER_REVIEW: 'در حال بررسی', SUBMITTED_FOR_REVIEW: 'ارسال برای بررسی', INCOMPLETE: 'ناقص', DEAD_LETTER: 'عملیات ناموفق (بایگانی خطا)',
  ON_HOLD: 'متوقف موقت', ARCHIVED: 'بایگانی‌شده', SENT_FOR_APPROVAL: 'ارسال برای تأیید', NEEDS_REVIEW: 'نیازمند بررسی'
};

export function getPersianStatusLabel(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  const key = String(value).trim().toUpperCase();
  return STATUS_LABELS[key] || String(value);
}
