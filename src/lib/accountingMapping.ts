/**
 * AKHAVAN CRM — موتور نگاشت حسابداری و صف تبادل مطمئن (Accounting Mapping & Outbox Engine)
 * مطابق بند ۳۵ سند نیازمندی‌ها (docs/DB_SCHEMA.md)
 */
import { CoaMirror, ReportBucket, AccountMapRule, BankMap, CashboxMap, OutboxMessage, OutboxStatus } from '../types';

export const DEFAULT_COA_MIRROR: CoaMirror[] = [
  // گروه ۱: دارایی‌ها
  { id: 'coa-1', code: '1', name: 'دارایی‌ها', nature: 'DEBIT', level: 1, parentCode: null, isActive: true, updatedAt: new Date().toISOString() },
  { id: 'coa-11', code: '11', name: 'دارایی‌های جاری', nature: 'DEBIT', level: 2, parentCode: '1', isActive: true, updatedAt: new Date().toISOString() },
  { id: 'coa-1101', code: '1101', name: 'موجودی نقد و بانک', nature: 'DEBIT', level: 3, parentCode: '11', isActive: true, updatedAt: new Date().toISOString() },
  { id: 'coa-110101', code: '110101', name: 'صندوق‌های فروش و پخش', nature: 'DEBIT', level: 4, parentCode: '1101', isActive: true, updatedAt: new Date().toISOString() },
  { id: 'coa-110102', code: '110102', name: 'بانک‌های تجاری', nature: 'DEBIT', level: 4, parentCode: '1101', isActive: true, updatedAt: new Date().toISOString() },
  { id: 'coa-1102', code: '1102', name: 'حساب‌ها و اسناد دریافتنی تجاری', nature: 'DEBIT', level: 3, parentCode: '11', isActive: true, updatedAt: new Date().toISOString() },
  { id: 'coa-110201', code: '110201', name: 'بدهکاران تجاری (مشتریان)', nature: 'DEBIT', level: 4, parentCode: '1102', isActive: true, updatedAt: new Date().toISOString() },
  { id: 'coa-110202', code: '110202', name: 'اسناد دریافتنی تجاری (چک‌ها)', nature: 'DEBIT', level: 4, parentCode: '1102', isActive: true, updatedAt: new Date().toISOString() },
  { id: 'coa-1103', code: '1103', name: 'موجودی کالا و انبار', nature: 'DEBIT', level: 3, parentCode: '11', isActive: true, updatedAt: new Date().toISOString() },

  // گروه ۲: بدهی‌ها
  { id: 'coa-2', code: '2', name: 'بدهی‌ها', nature: 'CREDIT', level: 1, parentCode: null, isActive: true, updatedAt: new Date().toISOString() },
  { id: 'coa-21', code: '21', name: 'بدهی‌های جاری', nature: 'CREDIT', level: 2, parentCode: '2', isActive: true, updatedAt: new Date().toISOString() },
  { id: 'coa-2101', code: '2101', name: 'بستانکاران تجاری (تأمین‌کنندگان)', nature: 'CREDIT', level: 3, parentCode: '21', isActive: true, updatedAt: new Date().toISOString() },
  { id: 'coa-2102', code: '2102', name: 'پیش‌دریافت از مشتریان', nature: 'CREDIT', level: 3, parentCode: '21', isActive: true, updatedAt: new Date().toISOString() },

  // گروه ۴: درآمدها و فروش
  { id: 'coa-4', code: '4', name: 'درآمدها', nature: 'CREDIT', level: 1, parentCode: null, isActive: true, updatedAt: new Date().toISOString() },
  { id: 'coa-41', code: '41', name: 'فروش ناخالص', nature: 'CREDIT', level: 2, parentCode: '4', isActive: true, updatedAt: new Date().toISOString() },
  { id: 'coa-42', code: '42', name: 'برگشت از فروش و تخفیفات', nature: 'DEBIT', level: 2, parentCode: '4', isActive: true, updatedAt: new Date().toISOString() },

  // گروه ۵: بهای تمام‌شده و هزینه‌ها
  { id: 'coa-5', code: '5', name: 'بهای تمام‌شده و هزینه‌ها', nature: 'DEBIT', level: 1, parentCode: null, isActive: true, updatedAt: new Date().toISOString() },
  { id: 'coa-51', code: '51', name: 'بهای تمام‌شده کالای فروش‌رفته', nature: 'DEBIT', level: 2, parentCode: '5', isActive: true, updatedAt: new Date().toISOString() },
  { id: 'coa-52', code: '52', name: 'هزینه‌های توزیع و فروش', nature: 'DEBIT', level: 2, parentCode: '5', isActive: true, updatedAt: new Date().toISOString() },
];

export const DEFAULT_REPORT_BUCKETS: ReportBucket[] = [
  { id: 'rb-1', key: 'GROSS_SALES', title: 'فروش ناخالص', standardNature: 'CREDIT', displayOrder: 1, isActive: true },
  { id: 'rb-2', key: 'SALES_RETURNS', title: 'برگشت از فروش و تخفیف', standardNature: 'DEBIT', displayOrder: 2, isActive: true },
  { id: 'rb-3', key: 'NET_SALES', title: 'فروش خالص', standardNature: 'CREDIT', calculationExpression: 'GROSS_SALES - SALES_RETURNS', displayOrder: 3, isActive: true },
  { id: 'rb-4', key: 'COGS', title: 'بهای تمام‌شده کالای فروش‌رفته', standardNature: 'DEBIT', displayOrder: 4, isActive: true },
  { id: 'rb-5', key: 'GROSS_PROFIT', title: 'سود ناخالص عملیاتی', standardNature: 'CREDIT', calculationExpression: 'NET_SALES - COGS', displayOrder: 5, isActive: true },
  { id: 'rb-6', key: 'OPERATING_EXPENSES', title: 'هزینه‌های توزیع، فروش و اداری', standardNature: 'DEBIT', displayOrder: 6, isActive: true },
  { id: 'rb-7', key: 'OPERATING_PROFIT', title: 'سود عملیاتی توزیع و فروش', standardNature: 'CREDIT', calculationExpression: 'GROSS_PROFIT - OPERATING_EXPENSES', displayOrder: 7, isActive: true },
  { id: 'rb-8', key: 'RECEIVABLES_CURRENT', title: 'مطالبات جاری مشتریان', standardNature: 'DEBIT', displayOrder: 8, isActive: true },
  { id: 'rb-9', key: 'RECEIVABLES_OVERDUE', title: 'مطالبات سررسیدگذشته و مشکوک‌الوصول', standardNature: 'DEBIT', displayOrder: 9, isActive: true },
  { id: 'rb-10', key: 'CHEQUES_IN_TRANSIT', title: 'اسناد دریافتنی در جریان وصول', standardNature: 'DEBIT', displayOrder: 10, isActive: true },
];

export const DEFAULT_ACCOUNT_MAP_RULES: AccountMapRule[] = [
  { id: 'amr-1', crmEntityType: 'CUSTOMER', erpAccountCode: '110201', description: 'نگاشت حساب‌های دریافتنی تجاری مشتریان', isActive: true },
  { id: 'amr-2', crmEntityType: 'RECEIPT', crmSubType: 'CASH', erpAccountCode: '110101', erpContraAccountCode: '110201', description: 'دریافت نقدی و تسویه فاکتور', isActive: true },
  { id: 'amr-3', crmEntityType: 'RECEIPT', crmSubType: 'POS', erpAccountCode: '110102', erpContraAccountCode: '110201', description: 'دریافت از طریق کارتخوان/بانک', isActive: true },
  { id: 'amr-4', crmEntityType: 'RECEIPT', crmSubType: 'CHEQUE', erpAccountCode: '110202', erpContraAccountCode: '110201', description: 'دریافت چک صیادی', isActive: true },
  { id: 'amr-5', crmEntityType: 'SALES_RETURN', erpAccountCode: '42', erpContraAccountCode: '110201', description: 'برگشت از فروش و کاهش حساب مشتری', isActive: true },
  { id: 'amr-6', crmEntityType: 'DISCOUNT', erpAccountCode: '42', erpContraAccountCode: '110201', description: 'تخفیفات تجاری اعطایی', isActive: true },
];

export class OutboxManager {
  /**
   * ایجاد پیام مبادله در صف Outbox با کلید ضدتکرار
   */
  static enqueue(
    outboxList: OutboxMessage[] = [],
    eventType: string,
    aggregateType: string,
    aggregateId: string,
    payload: any,
    options: { tenantId?: string; idempotencyKey?: string; maxRetries?: number } = {}
  ): { nextOutbox: OutboxMessage[]; message: OutboxMessage } {
    const idempotencyKey = options.idempotencyKey || `${aggregateType}-${aggregateId}-${eventType}`;
    
    // محافظت در برابر درج تکراری
    const existing = outboxList.find(m => m.idempotencyKey === idempotencyKey);
    if (existing) {
      return { nextOutbox: outboxList, message: existing };
    }

    const message: OutboxMessage = {
      id: `outbox-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      eventType,
      aggregateType,
      aggregateId,
      payload,
      status: 'PENDING',
      retryCount: 0,
      maxRetries: options.maxRetries || 5,
      createdAt: new Date().toISOString(),
      sentAt: null,
      errorDetails: null,
      tenantId: options.tenantId,
      idempotencyKey
    };

    return {
      nextOutbox: [message, ...outboxList].slice(0, 500),
      message
    };
  }

  /**
   * شبیه‌سازی ارسال / ثبت پیام موفق
   */
  static markSent(outboxList: OutboxMessage[], messageId: string): OutboxMessage[] {
    return outboxList.map(m => {
      if (m.id === messageId) {
        return {
          ...m,
          status: 'SENT' as OutboxStatus,
          sentAt: new Date().toISOString(),
          errorDetails: null
        };
      }
      return m;
    });
  }

  /**
   * ثبت خطا و بررسی Dead Letter
   */
  static markFailed(outboxList: OutboxMessage[], messageId: string, error: string): OutboxMessage[] {
    return outboxList.map(m => {
      if (m.id === messageId) {
        const nextRetry = m.retryCount + 1;
        const isDeadLetter = nextRetry >= (m.maxRetries || 5);
        return {
          ...m,
          status: (isDeadLetter ? 'DEAD_LETTER' : 'FAILED') as OutboxStatus,
          retryCount: nextRetry,
          errorDetails: error
        };
      }
      return m;
    });
  }
}
