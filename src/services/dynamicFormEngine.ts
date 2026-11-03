/**
 * AKHAVAN CRM - Dynamic Form Engine
 * معماری موتور فرم‌های پویا در لایه سرویس‌های مرکزی CRM
 * بدون هاردکد، پشتیبانی از اعتبارسنجی‌های استاندارد ایران و قوانین نمایش شرطی
 */

export type FormFieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'currency' 
  | 'select' 
  | 'multiSelect' 
  | 'jalaliDate' 
  | 'boolean' 
  | 'email' 
  | 'phone' 
  | 'nationalCode';

export interface FormFieldOption {
  value: string;
  label: string;
  badgeColor?: string;
}

export interface ConditionalVisibilityRule {
  field: string;
  operator: 'equals' | 'notEquals' | 'in' | 'contains' | 'greaterThan' | 'lessThan' | 'truthy' | 'falsy';
  value?: any;
}

export interface FormFieldValidation {
  required?: boolean;
  requiredMessage?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp | string;
  patternMessage?: string;
  customValidator?: (value: any, formValues: Record<string, any>) => string | null;
}

export interface DynamicFormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  description?: string;
  defaultValue?: any;
  options?: FormFieldOption[];
  /** Resolve select options from another field's current value without duplicating renderers. */
  optionsDependsOn?: string;
  optionsByValue?: Record<string, FormFieldOption[]>;
  validation?: FormFieldValidation;
  dependsOn?: ConditionalVisibilityRule[];
  colSpan?: 1 | 2; // Grid columns: 1 or full width (2)
  readOnly?: boolean;
  unit?: string; // e.g. 'ریال', 'تومان', 'کیلوگرم', 'روز'
}

export interface DynamicFormSchema {
  id: string;
  title: string;
  description?: string;
  category: 'CUSTOMER' | 'DEAL' | 'COLLECTION' | 'TASK' | 'INVOICE' | 'SETTINGS' | 'ACTIVITY' | 'NOTE' | 'CASE' | 'PAYMENT' | 'LEAD' | 'CONTACT' | 'CHEQUE' | 'AUTOMATION' | 'APPLICATION' | 'PERSONNEL';
  fields: DynamicFormField[];
}

/**
 * الگوریتم رسمی اعتبارسنجی کد ملی ۱۰ رقمی جمهوری اسلامی ایران
 */
export function validateIranianNationalCode(code: string): boolean {
  if (!code) return false;
  const cleanCode = code.replace(/\D/g, '');
  if (cleanCode.length !== 10) return false;
  if (/^(\d)\1{9}$/.test(cleanCode)) return false; // ارقام یکسان مثل 1111111111 نامعتبرند

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCode.charAt(i), 10) * (10 - i);
  }
  const remainder = sum % 11;
  const checkDigit = parseInt(cleanCode.charAt(9), 10);

  return (remainder < 2 && checkDigit === remainder) || (remainder >= 2 && checkDigit === 11 - remainder);
}

/**
 * اعتبارسنجی شماره موبایل ایران (۰۹...)
 */
export function validateIranianMobile(phone: string): boolean {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');
  return /^09\d{9}$/.test(cleanPhone);
}

/**
 * ارزیابی شرط نمایش فیلد (Conditional Visibility)
 */
export function shouldFieldDisplay(
  field: DynamicFormField, 
  formValues: Record<string, any>
): boolean {
  if (!field.dependsOn || field.dependsOn.length === 0) {
    return true;
  }

  return field.dependsOn.every(rule => {
    const parentValue = formValues[rule.field];

    switch (rule.operator) {
      case 'equals':
        return String(parentValue) === String(rule.value);
      case 'notEquals':
        return String(parentValue) !== String(rule.value);
      case 'in':
        return Array.isArray(rule.value) ? rule.value.includes(parentValue) : false;
      case 'contains':
        return typeof parentValue === 'string' && parentValue.includes(String(rule.value));
      case 'greaterThan':
        return Number(parentValue) > Number(rule.value);
      case 'lessThan':
        return Number(parentValue) < Number(rule.value);
      case 'truthy':
        return Boolean(parentValue);
      case 'falsy':
        return !Boolean(parentValue);
      default:
        return true;
    }
  });
}

/**
 * اعتبارسنجی یک فیلد خاص بر اساس قوانین تعریف‌شده
 */
export function validateSingleField(
  field: DynamicFormField, 
  value: any, 
  formValues: Record<string, any>
): string | null {
  // اگر فیلد بر اساس شرط پنهان باشد، اعتبارسنجی انجام نمی‌شود
  if (!shouldFieldDisplay(field, formValues)) {
    return null;
  }

  const v = field.validation;
  if (!v) return null;

  const isEmpty = value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

  if (v.required && isEmpty) {
    return v.requiredMessage || `تکمیل فیلد «${field.label}» الزامی است`;
  }

  if (isEmpty) {
    return null; // فیلد اختیاری و خالی است
  }

  // اعتبارسنجی اختصاصی انواع داده
  if (field.type === 'nationalCode') {
    if (!validateIranianNationalCode(String(value))) {
      return 'کد ملی وارد شده با ساختار ۱۰ رقمی ایران همخوانی ندارد و نامعتبر است';
    }
  }

  if (field.type === 'phone' || field.name.toLowerCase().includes('mobile')) {
    if (!validateIranianMobile(String(value))) {
      return 'شماره موبایل باید با ۰۹ شروع شده و دارای ۱۱ رقم باشد';
    }
  }

  if (field.type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(value))) {
      return 'آدرس ایمیل معتبر نیست';
    }
  }

  if (field.type === 'number' || field.type === 'currency') {
    const num = Number(String(value).replace(/,/g, ''));
    if (isNaN(num)) {
      return 'مقدار وارد شده باید عدد باشد';
    }
    if (v.min !== undefined && num < v.min) {
      return `حداقل مقدار مجاز ${v.min.toLocaleString('fa-IR')} است`;
    }
    if (v.max !== undefined && num > v.max) {
      return `حداکثر مقدار مجاز ${v.max.toLocaleString('fa-IR')} است`;
    }
  }

  if (v.minLength !== undefined && String(value).length < v.minLength) {
    return `حداقل ${v.minLength} کاراکتر مورد نیاز است`;
  }

  if (v.maxLength !== undefined && String(value).length > v.maxLength) {
    return `حداکثر طول مجاز ${v.maxLength} کاراکتر است`;
  }

  if (v.pattern) {
    const regex = typeof v.pattern === 'string' ? new RegExp(v.pattern) : v.pattern;
    if (!regex.test(String(value))) {
      return v.patternMessage || 'فرمت مقدار وارد شده صحیح نیست';
    }
  }

  if (v.customValidator) {
    const customErr = v.customValidator(value, formValues);
    if (customErr) return customErr;
  }

  return null;
}

/**
 * اعتبارسنجی کل فرم پویا
 */
export function validateEntireForm(
  schema: DynamicFormSchema, 
  formValues: Record<string, any>
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const field of schema.fields) {
    const err = validateSingleField(field, formValues[field.name], formValues);
    if (err) {
      errors[field.name] = err;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// -------------------------------------------------------------
// اسکیمای از پیش‌تعریف‌شده برای ماژول‌های عملیاتی سامانه
// -------------------------------------------------------------

/**
 * اسکیمای پویای فرم افتتاح و ویرایش پرونده مشتری
 */
export const CUSTOMER_FORM_SCHEMA: DynamicFormSchema = {
  id: 'customer_profile_schema',
  title: 'مشخصات پرونده تجاری مشتری',
  category: 'CUSTOMER',
  fields: [
    {
      id: 'customerType',
      name: 'customerType',
      label: 'نوع شخصیت حقوقی/حقیقی',
      type: 'select',
      defaultValue: 'LEGAL',
      options: [
        { value: 'LEGAL', label: 'شخصیت حقوقی (شرکت، بازرگانی، فروشگاه زنجیره‌ای)' },
        { value: 'INDIVIDUAL', label: 'شخصیت حقیقی (سوپرمارکت، کاسب، بنکدار انفرادی)' }
      ],
      validation: { required: true },
      colSpan: 1
    },
    {
      id: 'name',
      name: 'name',
      label: 'نام کامل طرف حساب / فروشگاه',
      type: 'text',
      placeholder: 'مثال: هایپرمارکت بزرگ افق',
      validation: { required: true, minLength: 3 },
      colSpan: 1
    },
    {
      id: 'economicCode',
      name: 'economicCode',
      label: 'کد اقتصادی سازمان',
      type: 'text',
      placeholder: '۱۲ یا ۱۴ رقم کد اقتصادی',
      dependsOn: [{ field: 'customerType', operator: 'equals', value: 'LEGAL' }],
      validation: { required: true },
      colSpan: 1
    },
    {
      id: 'nationalCode',
      name: 'nationalCode',
      label: 'شناسه ملی / کد ملی',
      type: 'nationalCode',
      placeholder: 'شناسه ملی شرکت یا کد ملی مدیریت',
      validation: { required: true },
      colSpan: 1
    },
    {
      id: 'phone',
      name: 'phone',
      label: 'شماره تماس مستقیم',
      type: 'phone',
      placeholder: '09123456789',
      validation: { required: true },
      colSpan: 1
    },
    {
      id: 'creditLimit',
      name: 'creditLimit',
      label: 'سقف اعتبار مصوب فروش اعتباری',
      type: 'currency',
      unit: 'ریال',
      placeholder: 'مثال: ۵۰۰,۰۰۰,۰۰۰',
      defaultValue: 100000000,
      validation: { min: 0 },
      colSpan: 1
    },
    {
      id: 'paymentTermsDays',
      name: 'paymentTermsDays',
      label: 'فرجه استاندارد تسویه فاکتورها',
      type: 'select',
      defaultValue: '30',
      options: [
        { value: '0', label: 'نقدی همزمان با تحویل' },
        { value: '15', label: '۱۵ روزه' },
        { value: '30', label: '۳۰ روزه (استاندارد)' },
        { value: '45', label: '۴۵ روزه' },
        { value: '60', label: '۶۰ روزه (نیازمند تایید ویژه)' }
      ],
      colSpan: 1
    },
    {
      id: 'sayadRequired',
      name: 'sayadRequired',
      label: 'الزام ثبت در سامانه صیاد بانک مرکزی',
      type: 'boolean',
      defaultValue: true,
      colSpan: 1
    },
    {
      id: 'address',
      name: 'address',
      label: 'آدرس دقیق پستی و توزیع',
      type: 'textarea',
      placeholder: 'استان، شهر، خیابان، پلاک و طبقه...',
      validation: { required: true },
      colSpan: 2
    }
  ]
};

/**
 * اسکیمای فرم ثبت وعده پرداخت و پیگیری وصول
 */
export const COLLECTION_PROMISE_SCHEMA: DynamicFormSchema = {
  id: 'collection_promise_schema',
  title: 'ثبت تعهد و وعده پرداخت مشتری (Promise to Pay)',
  category: 'COLLECTION',
  fields: [
    {
      id: 'promisedAmount',
      name: 'promisedAmount',
      label: 'مبلغ مورد توافق جهت واریز',
      type: 'currency',
      unit: 'ریال',
      placeholder: 'مبلغ به ریال',
      validation: { required: true, min: 1000000 },
      colSpan: 1
    },
    {
      id: 'promisedDate',
      name: 'promisedDate',
      label: 'تاریخ وعده پرداخت (شمسی)',
      type: 'jalaliDate',
      validation: { required: true },
      colSpan: 1
    },
    {
      id: 'paymentMethod',
      name: 'paymentMethod',
      label: 'روش و نحوه توافق‌شده پرداخت',
      type: 'select',
      defaultValue: 'TRANSFER',
      options: [
        { value: 'TRANSFER', label: 'حواله ساتنا / پایا مستقیم' },
        { value: 'SAYAD_CHEQUE', label: 'چک معتبر صیادی بنفش' },
        { value: 'CASH_DEPOSIT', label: 'واریز نقدی به حساب شرکت' },
        { value: 'POS', label: 'دستگاه پوز ویزیتور' }
      ],
      validation: { required: true },
      colSpan: 1
    },
    {
      id: 'sayadChequeNumber',
      name: 'sayadChequeNumber',
      label: 'شناسه ۱۶ رقمی صیادی چک',
      type: 'text',
      placeholder: 'شناسه ۱۶ رقمی چک صیاد',
      dependsOn: [{ field: 'paymentMethod', operator: 'equals', value: 'SAYAD_CHEQUE' }],
      validation: { required: true, minLength: 16, maxLength: 16 },
      colSpan: 1
    },
    {
      id: 'contactPerson',
      name: 'contactPerson',
      label: 'نام طرف مذاکره و تاییدکننده پرداخت',
      type: 'text',
      placeholder: 'مثال: آقای محمدی (مدیر مالی)',
      validation: { required: true },
      colSpan: 1
    },
    {
      id: 'autoGenerateCalendarTask',
      name: 'autoGenerateCalendarTask',
      label: 'ایجاد خودکار وظیفه یادآوری در تقویم کارشناس وصول',
      type: 'boolean',
      defaultValue: true,
      colSpan: 1
    },
    {
      id: 'negotiationNotes',
      name: 'negotiationNotes',
      label: 'مشروح مذاکره و علت تأخیر قبلی',
      type: 'textarea',
      placeholder: 'توضیحات و توافقات حاصله در تماس تلفنی یا جلسه حضوری...',
      colSpan: 2
    }
  ]
};

/**
 * اسکیمای پویای ثبت تعامل و فعالیت مشتری (تماس، جلسه، ویزیت، ایمیل)
 */
export const ACTIVITY_FORM_SCHEMA: DynamicFormSchema = {
  id: 'activity_form_schema',
  title: 'ثبت فعالیت و تعامل با مشتری',
  category: 'ACTIVITY',
  fields: [
    {
      id: 'activityType',
      name: 'activityType',
      label: 'نوع تعامل / فعالیت',
      type: 'select',
      defaultValue: 'CALL',
      options: [
        { value: 'CALL', label: 'تماس تلفنی' },
        { value: 'VISIT', label: 'ویزیت حضوری' },
        { value: 'MEETING', label: 'جلسه کاری و مذاکره' },
        { value: 'EMAIL', label: 'مکاتبه رسمی / ایمیل' },
        { value: 'NOTE', label: 'یادداشت داخلی' }
      ],
      validation: { required: true },
      colSpan: 1
    },
    {
      id: 'title',
      name: 'title',
      label: 'عنوان فعالیت',
      type: 'text',
      placeholder: 'مثال: پیگیری تسویه چک سفارش قبلی',
      validation: { required: true, minLength: 3 },
      colSpan: 1
    },
    {
      id: 'visitLocationType',
      name: 'visitLocationType',
      label: 'محل ویزیت حضوری',
      type: 'select',
      defaultValue: 'STORE',
      options: [
        { value: 'STORE', label: 'محل فروشگاه / سوپرمارکت مشتری' },
        { value: 'OFFICE', label: 'دفتر مرکزی مشتری' },
        { value: 'WAREHOUSE', label: 'انبار یا مرکز توزیع' }
      ],
      dependsOn: [{ field: 'activityType', operator: 'equals', value: 'VISIT' }],
      colSpan: 1
    },
    {
      id: 'outcome',
      name: 'outcome',
      label: 'نتیجه اولیه تعامل',
      type: 'select',
      defaultValue: 'FOLLOW_UP',
      options: [
        { value: 'ORDER_AGREED', label: 'توافق بر سر سفارش جدید' },
        { value: 'PROMISE_PAY', label: 'قول پرداخت و تسویه معوقات' },
        { value: 'PRICE_OBJECTION', label: 'اعتراض به قیمت یا درخواست تخفیف بیشتر' },
        { value: 'FOLLOW_UP', label: 'نیازمند تماس و پیگیری مجدد' },
        { value: 'COMPLAINT', label: 'شکایت از کیفیت یا تحویل بار' }
      ],
      colSpan: 1
    },
    {
      id: 'description',
      name: 'description',
      label: 'شرح جزئیات مذاکره و توافقات',
      type: 'textarea',
      placeholder: 'خلاصه موارد مطرح شده، توافقات مالی، بازخورد کالاها و نیازمندی‌ها...',
      validation: { required: true, minLength: 3 },
      colSpan: 2
    }
  ]
};

/**
 * اسکیمای پویای ثبت یادداشت و سابقه مشتری
 */
export const NOTE_FORM_SCHEMA: DynamicFormSchema = {
  id: 'customer_note_schema',
  title: 'ثبت سابقه و یادداشت مشتری',
  category: 'NOTE',
  fields: [
    {
      id: 'category',
      name: 'category',
      label: 'دسته‌بندی موضوعی یادداشت',
      type: 'select',
      defaultValue: 'GENERAL',
      options: [
        { value: 'GENERAL', label: 'سابقه عمومی ارتباط' },
        { value: 'FINANCIAL', label: 'وضعیت اعتباری و پرداخت‌ها' },
        { value: 'DECISION_MAKER', label: 'ویژگی‌های شخصیتی تصمیم‌گیرنده' },
        { value: 'SPECIAL_TERMS', label: 'شروط خاص فروش و تخفیف' }
      ],
      validation: { required: true },
      colSpan: 1
    },
    {
      id: 'isImportant',
      name: 'isImportant',
      label: 'نشانه‌گذاری به عنوان یادداشت پین‌شده و مهم',
      type: 'boolean',
      defaultValue: false,
      colSpan: 1
    },
    {
      id: 'content',
      name: 'content',
      label: 'متن سابقه و یادداشت مذاکره',
      type: 'textarea',
      placeholder: 'ثبت نکات کلیدی مذاکرات، ویژگی‌های تصمیم‌گیرنده، و پیش‌نیازها...',
      validation: { required: true, minLength: 3 },
      colSpan: 2
    }
  ]
};

/**
 * ایجاد اسکیمای پویای فرم وظایف متناسب با لیست کاربران فعال سیستم
 */
export function createTaskFormSchema(users: { id: string; name: string }[]): DynamicFormSchema {
  return {
    id: 'customer_task_schema',
    title: 'تعریف وظیفه پیگیری (تسک)',
    category: 'TASK',
    fields: [
      {
        id: 'title',
        name: 'title',
        label: 'عنوان وظیفه',
        type: 'text',
        placeholder: 'مثال: ارسال کاتالوگ و پیگیری پیش‌فاکتور جدید',
        validation: { required: true, minLength: 3 },
        colSpan: 1
      },
      {
        id: 'priority',
        name: 'priority',
        label: 'اولویت اقدام',
        type: 'select',
        defaultValue: 'NORMAL',
        options: [
          { value: 'LOW', label: 'کم' },
          { value: 'NORMAL', label: 'عادی' },
          { value: 'HIGH', label: 'بالا' },
          { value: 'URGENT', label: 'فوری و بحرانی' }
        ],
        validation: { required: true },
        colSpan: 1
      },
      {
        id: 'dueDate',
        name: 'dueDate',
        label: 'مهلت انجام (تاریخ شمسی)',
        type: 'jalaliDate',
        validation: { required: true },
        colSpan: 1
      },
      {
        id: 'assigneeId',
        name: 'assigneeId',
        label: 'مسئول انجام',
        type: 'select',
        defaultValue: users[0]?.id || '',
        options: users.map(u => ({ value: u.id, label: u.name })),
        validation: { required: true },
        colSpan: 1
      },
      {
        id: 'taskCategory',
        name: 'taskCategory',
        label: 'نوع پیگیری',
        type: 'select',
        defaultValue: 'FOLLOW_UP',
        options: [
          { value: 'COLLECTION', label: 'پیگیری وصول چک و مطالبات معوق' },
          { value: 'ORDER_OFFER', label: 'ارائه پیشنهاد فروش و کاتالوگ جدید' },
          { value: 'ONSITE_VISIT', label: 'سرکشی و ویزیت میدانی' },
          { value: 'FINANCIAL_RECON', label: 'مغایرت‌گیری و تطبیق حساب' },
          { value: 'FOLLOW_UP', label: 'پیگیری عمومی و اداری' }
        ],
        colSpan: 1
      },
      {
        id: 'description',
        name: 'description',
        label: 'توضیحات تکمیلی وظیفه',
        type: 'textarea',
        placeholder: 'دستورالعمل و جزئیات انتظارات از انجام این وظیفه...',
        colSpan: 2
      }
    ]
  };
}

/** فرم جامع وظیفه؛ فیلدهای تخصیص فردی/گروهی و ارتباط با مشتری را حفظ می‌کند. */
export function createTaskWorkspaceFormSchema(
  users: { id: string; name: string }[],
  groups: { id: string; name: string }[],
  accounts: { id: string; name: string; code?: string }[]
): DynamicFormSchema {
  return {
    id: 'task_workspace_form_v1', title: 'تعریف وظیفه', category: 'TASK',
    description: 'وظیفه به حساب مشتری و مسئول فردی یا گروه کاری متصل می‌شود. پیوست‌ها پس از ذخیره از بخش مدیریت فایل‌ها در دسترس‌اند.',
    fields: [
      { id: 'task-title', name: 'title', label: 'عنوان وظیفه', type: 'text', placeholder: 'عنوان روشن و قابل پیگیری؛ برای پیوند موجودیت‌ها @ را بنویسید', validation: { required: true, minLength: 3 }, colSpan: 2, enableMentions: true } as DynamicFormField,
      { id: 'task-account', name: 'accountId', label: 'مشتری / حساب تجاری', type: 'select', options: accounts.map(a => ({ value: a.id, label: a.code ? `${a.name} (${a.code})` : a.name })), validation: { required: true }, colSpan: 2 },
      { id: 'task-due', name: 'dueDate', label: 'مهلت انجام (تاریخ شمسی)', type: 'jalaliDate' },
      { id: 'task-priority', name: 'priority', label: 'اولویت', type: 'select', defaultValue: 'NORMAL', validation: { required: true }, options: [ { value: 'LOW', label: 'پایین' }, { value: 'NORMAL', label: 'عادی' }, { value: 'HIGH', label: 'بالا' }, { value: 'URGENT', label: 'فوری' } ] },
      { id: 'task-assignee-type', name: 'assigneeType', label: 'نوع تخصیص', type: 'select', defaultValue: 'USER', validation: { required: true }, options: [ { value: 'USER', label: 'فردی (کارشناس)' }, { value: 'GROUP', label: 'گروه کاری' } ] },
      { id: 'task-assignee', name: 'assigneeId', label: 'مسئول انجام', type: 'select', optionsDependsOn: 'assigneeType', optionsByValue: { USER: users.map(u => ({ value: u.id, label: u.name })), GROUP: groups.map(g => ({ value: g.id, label: g.name })) }, validation: { required: true } },
      { id: 'task-description', name: 'description', label: 'شرح و جزئیات اقدام', type: 'textarea', placeholder: 'شرح، انتظار و نتیجه موردنیاز', colSpan: 2 } as DynamicFormField
    ]
  };
}

export function createInternalRequestFormSchema(requestTypes: { value: string; label: string }[]): DynamicFormSchema {
  return {
    id: 'internal_request_form_v1', title: 'درخواست اداری جدید', category: 'SETTINGS',
    fields: [
      { id: 'request-type', name: 'type', label: 'نوع درخواست', type: 'select', options: requestTypes, validation: { required: true } },
      { id: 'request-title', name: 'title', label: 'موضوع و عنوان درخواست', type: 'text', placeholder: 'موضوع را دقیق و کوتاه بنویسید', validation: { required: true, minLength: 3 }, colSpan: 2 },
      { id: 'request-priority', name: 'priority', label: 'اولویت', type: 'select', defaultValue: 'NORMAL', validation: { required: true }, options: [ { value: 'LOW', label: 'پایین' }, { value: 'NORMAL', label: 'عادی' }, { value: 'HIGH', label: 'بالا' }, { value: 'URGENT', label: 'بسیار فوری' } ] },
      { id: 'request-description', name: 'description', label: 'شرح و توضیحات تکمیلی', type: 'textarea', placeholder: 'جزئیات، زمان‌بندی یا مستندات موردنیاز را شرح دهید', colSpan: 2 }
    ]
  };
}

export function createCampaignFormSchema(): DynamicFormSchema {
  return {
    id: 'campaign_form_v1', title: 'ایجاد کمپین بازاریابی', category: 'SETTINGS',
    fields: [
      { id: 'campaign-name', name: 'name', label: 'نام کمپین', type: 'text', validation: { required: true, minLength: 3 }, colSpan: 2 },
      { id: 'campaign-audience', name: 'targetAudience', label: 'مخاطبان هدف', type: 'text', placeholder: 'مثال: فروشگاه‌های زنجیره‌ای', colSpan: 2 },
      { id: 'campaign-start', name: 'startDate', label: 'تاریخ شروع', type: 'jalaliDate', validation: { required: true } },
      { id: 'campaign-end', name: 'endDate', label: 'تاریخ پایان', type: 'jalaliDate', validation: { required: true } },
      { id: 'campaign-description', name: 'description', label: 'توضیحات کمپین', type: 'textarea', colSpan: 2 }
    ]
  };
}

export function createKnowledgeArticleFormSchema(): DynamicFormSchema {
  return {
    id: 'knowledge_article_form_v1', title: 'ثبت مقاله و شیوه‌نامه', category: 'SETTINGS',
    fields: [
      { id: 'article-title', name: 'title', label: 'عنوان مقاله / بخشنامه', type: 'text', validation: { required: true, minLength: 3 }, colSpan: 2 },
      { id: 'article-category', name: 'category', label: 'دسته‌بندی موضوعی', type: 'select', defaultValue: 'مالی و اعتبارات', validation: { required: true }, options: [ { value: 'مالی و اعتبارات', label: 'مالی و اعتبارات' }, { value: 'فروش و تخفیفات', label: 'فروش و تخفیف‌ها' }, { value: 'لجستیک و تحویل', label: 'لجستیک و تحویل' }, { value: 'روابط مشتریان', label: 'روابط مشتریان' }, { value: 'آموزش عمومی', label: 'آموزش عمومی' } ] },
      { id: 'article-content', name: 'content', label: 'متن کامل مقاله / بخشنامه', type: 'textarea', validation: { required: true, minLength: 5 }, colSpan: 2 }
    ]
  };
}

export function createCaseFormSchema(accounts: { id: string; name: string; code?: string }[]): DynamicFormSchema {
  return {
    id: 'case_form_v1', title: 'ثبت پرونده خدمات و شکایت', category: 'CASE',
    fields: [
      { id: 'case-subject', name: 'subject', label: 'موضوع پرونده', type: 'text', validation: { required: true, minLength: 3 }, colSpan: 2 },
      { id: 'case-account', name: 'accountId', label: 'حساب مشتری مرتبط', type: 'select', options: accounts.map(a => ({ value: a.id, label: a.code ? `${a.name} (${a.code})` : a.name })), validation: { required: true }, colSpan: 2 },
      { id: 'case-priority', name: 'priority', label: 'اولویت رسیدگی', type: 'select', defaultValue: 'NORMAL', validation: { required: true }, options: [ { value: 'LOW', label: 'پایین' }, { value: 'NORMAL', label: 'عادی' }, { value: 'HIGH', label: 'بالا' }, { value: 'URGENT', label: 'فوری / بحرانی' } ] },
      { id: 'case-description', name: 'description', label: 'شرح درخواست یا شکایت', type: 'textarea', colSpan: 2 }
    ]
  };
}

/**
 * اسکیمای پویای ثبت فرصت تجاری
 */
export const OPPORTUNITY_FORM_SCHEMA: DynamicFormSchema = {
  id: 'opportunity_form_schema',
  title: 'ثبت فرصت تجاری جدید (Deal/Opportunity)',
  category: 'DEAL',
  fields: [
    {
      id: 'title',
      name: 'title',
      label: 'عنوان فرصت تجاری',
      type: 'text',
      placeholder: 'مثال: قرارداد تامین سالانه روغن صنعتی یا سبد فصلی',
      validation: { required: true, minLength: 3 },
      colSpan: 1
    },
    {
      id: 'amount',
      name: 'amount',
      label: 'مبلغ برآوردی فرصت (ریال)',
      type: 'currency',
      unit: 'ریال',
      placeholder: 'مبلغ به ریال',
      validation: { required: true, min: 100000 },
      colSpan: 1
    },
    {
      id: 'stage',
      name: 'stage',
      label: 'مرحله پایپ‌لاین فروش',
      type: 'select',
      defaultValue: 'DISCOVERY',
      options: [
        { value: 'DISCOVERY', label: 'شناسایی و کشف نیاز' },
        { value: 'PROPOSAL', label: 'ارائه پیشنهاد و پیش‌فاکتور' },
        { value: 'NEGOTIATION', label: 'مذاکره نهایی شروط و پرداخت' },
        { value: 'WON', label: 'برنده شده و نهایی' },
        { value: 'LOST', label: 'از دست رفته' }
      ],
      validation: { required: true },
      colSpan: 1
    },
    {
      id: 'expectedCloseDate',
      name: 'expectedCloseDate',
      label: 'تاریخ برآوردی بسته‌شدن (شمسی)',
      type: 'jalaliDate',
      colSpan: 1
    },
    {
      id: 'description',
      name: 'description',
      label: 'توضیحات و شروط توافق',
      type: 'textarea',
      placeholder: 'نیازمندی‌های خاص، شرایط تحویل و موارد رقابتی...',
      colSpan: 2
    }
  ]
};

/**
 * اسکیمای پویای پرونده خدمات و پشتیبانی
 */
export const SERVICE_CASE_SCHEMA: DynamicFormSchema = {
  id: 'service_case_schema',
  title: 'ثبت پرونده خدمات و پشتیبانی (تیکت / مغایرت)',
  category: 'CASE',
  fields: [
    {
      id: 'subject',
      name: 'subject',
      label: 'موضوع پرونده / مغایرت',
      type: 'text',
      placeholder: 'مثال: مغایرت در تعداد اقلام تحویلی فاکتور یا شکستگی بار',
      validation: { required: true, minLength: 3 },
      colSpan: 1
    },
    {
      id: 'priority',
      name: 'priority',
      label: 'اولویت رسیدگی',
      type: 'select',
      defaultValue: 'NORMAL',
      options: [
        { value: 'LOW', label: 'کم' },
        { value: 'NORMAL', label: 'عادی' },
        { value: 'HIGH', label: 'بالا' },
        { value: 'URGENT', label: 'فوری و بحرانی' }
      ],
      validation: { required: true },
      colSpan: 1
    },
    {
      id: 'caseType',
      name: 'caseType',
      label: 'دسته‌بندی نوع مشکل',
      type: 'select',
      defaultValue: 'LOGISTICS',
      options: [
        { value: 'LOGISTICS', label: 'مغایرت در ارسال و تحویل بار' },
        { value: 'QUALITY', label: 'کیفیت نامناسب یا آسیب‌دیدگی کالا' },
        { value: 'ACCOUNTING', label: 'اختلاف در مبالغ فاکتور و تخفیف' },
        { value: 'STAFF_BEHAVIOR', label: 'گزارش رفتار ویزیتور یا موزع' },
        { value: 'RETURN_REQUEST', label: 'درخواست مرجوعی کالا' }
      ],
      validation: { required: true },
      colSpan: 1
    },
    {
      id: 'slaHours',
      name: 'slaHours',
      label: 'سقف مهلت پاسخگویی طبق تعهد (SLA)',
      type: 'select',
      defaultValue: '24',
      options: [
        { value: '4', label: '۴ ساعته (بحرانی)' },
        { value: '24', label: '۲۴ ساعته (استاندارد)' },
        { value: '48', label: '۴۸ ساعته (بررسی انبار و مالی)' }
      ],
      colSpan: 1
    },
    {
      id: 'description',
      name: 'description',
      label: 'شرح مشکل یا درخواست مشتری',
      type: 'textarea',
      placeholder: 'توضیحات تفصیلی، اقلام مغایر، شماره بارنامه و زمان تحویل...',
      validation: { required: true, minLength: 3 },
      colSpan: 2
    }
  ]
};

/**
 * اسکیمای پویای ثبت سند وصولی و دریافت وجه
 */
export const PAYMENT_RECEIPT_SCHEMA: DynamicFormSchema = {
  id: 'payment_receipt_schema',
  title: 'ثبت سند وصولی و دریافت وجه',
  category: 'PAYMENT',
  fields: [
    {
      id: 'amount',
      name: 'amount',
      label: 'مبلغ دریافتی',
      type: 'currency',
      unit: 'ریال',
      placeholder: 'مبلغ به ریال',
      validation: { required: true, min: 1000 },
      colSpan: 1
    },
    {
      id: 'date',
      name: 'date',
      label: 'تاریخ دریافت / وصول (شمسی)',
      type: 'jalaliDate',
      validation: { required: true },
      colSpan: 1
    },
    {
      id: 'method',
      name: 'method',
      label: 'شیوه و روش پرداخت',
      type: 'select',
      defaultValue: 'TRANSFER',
      options: [
        { value: 'TRANSFER', label: 'واریز نقدی / حواله پایا / ساتنا' },
        { value: 'SAYAD_CHEQUE', label: 'چک معتبر صیادی بنفش' },
        { value: 'POS', label: 'دستگاه کارت‌خوان (POS)' },
        { value: 'CASH', label: 'وجه نقد دریافتی موزع' }
      ],
      validation: { required: true },
      colSpan: 1
    },
    {
      id: 'sayadNumber',
      name: 'sayadNumber',
      label: 'شناسه ۱۶ رقمی صیادی چک',
      type: 'text',
      placeholder: 'شناسه ۱۶ رقمی چک صیاد',
      dependsOn: [{ field: 'method', operator: 'equals', value: 'SAYAD_CHEQUE' }],
      validation: { required: true, minLength: 16, maxLength: 16 },
      colSpan: 1
    },
    {
      id: 'bankName',
      name: 'bankName',
      label: 'بانک صادرکننده',
      type: 'text',
      placeholder: 'مثال: ملت، صادرات، ملی...',
      dependsOn: [{ field: 'method', operator: 'equals', value: 'SAYAD_CHEQUE' }],
      colSpan: 1
    },
    {
      id: 'referenceNumber',
      name: 'referenceNumber',
      label: 'شماره ارجاع / پیگیری بانکی',
      type: 'text',
      placeholder: 'کد پیگیری تراکنش بانکی یا رسید کارتخوان',
      colSpan: 1
    },
    {
      id: 'notes',
      name: 'notes',
      label: 'توضیحات و بابت سند',
      type: 'textarea',
      placeholder: 'بابت تسویه فاکتور شماره...، حساب بانکی مقصد و ملاحظات...',
      colSpan: 2
    }
  ]
};


/** اسکیمای پویای ثبت سرنخ فروش */
export const LEAD_FORM_SCHEMA: DynamicFormSchema = {
  id: 'lead_form_schema',
  title: 'ثبت سرنخ فروش جدید',
  category: 'LEAD',
  fields: [
    { id: 'companyName', name: 'companyName', label: 'نام شرکت / فروشگاه', type: 'text', placeholder: 'مثال: فروشگاه برادران حسینی', validation: { required: true, minLength: 2 }, colSpan: 2 },
    { id: 'contactName', name: 'contactName', label: 'نام مخاطب یا تصمیم‌گیرنده', type: 'text', validation: { required: true, minLength: 2 }, colSpan: 1 },
    { id: 'phone', name: 'phone', label: 'شماره تماس', type: 'phone', colSpan: 1 },
    { id: 'notes', name: 'notes', label: 'یادداشت', type: 'textarea', placeholder: 'منبع سرنخ، نیاز اولیه...', colSpan: 2 },
  ],
};

/**
 * اسکیمای مخاطبین طرف حساب (افزودن/ویرایش در Customer 360).
 * اعتبارسنجی کیفیت داده (موبایل/ایمیل/تلفن ثابت) از همین موتور واحد انجام می‌شود؛
 * مقدار پیش‌فرض نقش وجود ندارد تا قاعده‌ی کسب‌وکار خاصی در هسته هاردکد نشود.
 */
export const CONTACT_FORM_SCHEMA: DynamicFormSchema = {
  id: 'customer_contact_schema',
  title: 'اطلاعات مخاطب',
  category: 'CONTACT',
  fields: [
    { id: 'name', name: 'name', label: 'نام و نام خانوادگی', type: 'text', validation: { required: true, minLength: 2 }, colSpan: 2 },
    { id: 'role', name: 'role', label: 'سمت / نقش در سازمان', type: 'text', placeholder: 'مثلاً مسئول خرید، مدیر مالی', colSpan: 1 },
    { id: 'mobile', name: 'mobile', label: 'شماره موبایل', type: 'phone', colSpan: 1 },
    {
      id: 'landline', name: 'landline', label: 'تلفن ثابت (با پیش‌شماره)', type: 'text',
      validation: { pattern: '^0\\d{10}$', patternMessage: 'تلفن ثابت باید ۱۱ رقم و با پیش‌شماره باشد (مثال: ۰۲۱۱۲۳۴۵۶۷۸)' }, colSpan: 1
    },
    { id: 'email', name: 'email', label: 'ایمیل', type: 'email', colSpan: 1 },
    { id: 'isPrimary', name: 'isPrimary', label: 'مخاطب اصلی این طرف حساب', type: 'boolean', defaultValue: false, colSpan: 2 },
    { id: 'notes', name: 'notes', label: 'یادداشت', type: 'textarea', colSpan: 2 }
  ]
};

/* ----------------------------------------------------------------------------
 * فرم‌های ماژول مالی (فاکتور، رسید پرداخت، چک) — همگی از همین موتور؛
 * گزینه‌ها از state ساخته می‌شوند و مقدار پیش‌فرض کسب‌وکاری (بانک/مبلغ/مهلت) هاردکد نیست.
 * ------------------------------------------------------------------------- */
type AccountOpt = { id: string; name: string; code?: string; phone?: string };

const accountOptions = (accounts: AccountOpt[]): FormFieldOption[] =>
  accounts.map(a => ({ value: a.id, label: `${a.name}${a.code || a.phone ? ` (${a.code || a.phone})` : ''}` }));

export function createInvoiceFormSchema(accounts: AccountOpt[], quotes: { id: string; label: string }[]): DynamicFormSchema {
  return {
    id: 'invoice_form_schema',
    title: 'صدور فاکتور رسمی',
    category: 'INVOICE',
    fields: [
      {
        id: 'source', name: 'source', label: 'مبنای صدور فاکتور', type: 'select', defaultValue: 'FROM_QUOTE',
        options: [{ value: 'FROM_QUOTE', label: 'از روی پیش‌فاکتور' }, { value: 'MANUAL', label: 'صدور دستی' }],
        validation: { required: true }, colSpan: 2
      },
      {
        id: 'quoteId', name: 'quoteId', label: 'پیش‌فاکتور مرجع', type: 'select', options: quotes,
        dependsOn: [{ field: 'source', operator: 'equals', value: 'FROM_QUOTE' }],
        validation: { required: true, requiredMessage: 'انتخاب پیش‌فاکتور الزامی است' }, colSpan: 2,
        description: 'اقلام و مبلغ مستقیماً از پیش‌فاکتور منتقل می‌شود.'
      },
      {
        id: 'accountId', name: 'accountId', label: 'حساب خریدار', type: 'select', options: accountOptions(accounts),
        dependsOn: [{ field: 'source', operator: 'equals', value: 'MANUAL' }],
        validation: { required: true }, colSpan: 2
      },
      {
        id: 'totalAmount', name: 'totalAmount', label: 'مبلغ کل فاکتور', type: 'currency', unit: 'ریال',
        dependsOn: [{ field: 'source', operator: 'equals', value: 'MANUAL' }],
        validation: { required: true, min: 1000 }, colSpan: 1
      },
      { id: 'invoiceNumber', name: 'invoiceNumber', label: 'شماره فاکتور (در صورت خالی بودن، ترتیبی ساخته می‌شود)', type: 'text', colSpan: 1 },
      { id: 'description', name: 'description', label: 'شرح فاکتور', type: 'text',
        dependsOn: [{ field: 'source', operator: 'equals', value: 'MANUAL' }], validation: { required: true }, colSpan: 2 },
      { id: 'dueDate', name: 'dueDate', label: 'تاریخ سررسید', type: 'jalaliDate', validation: { required: true }, colSpan: 2 }
    ]
  };
}

export function createPaymentReceiptFormSchema(accounts: AccountOpt[], methods: FormFieldOption[]): DynamicFormSchema {
  return {
    id: 'finance_receipt_schema',
    title: 'ثبت رسید دریافتی',
    category: 'PAYMENT',
    fields: [
      { id: 'accountId', name: 'accountId', label: 'حساب تجاری طرف معامله', type: 'select', options: accountOptions(accounts), validation: { required: true }, colSpan: 2 },
      { id: 'amount', name: 'amount', label: 'مبلغ دریافتی', type: 'currency', unit: 'ریال', validation: { required: true, min: 1000 }, colSpan: 1 },
      { id: 'method', name: 'method', label: 'روش پرداخت', type: 'select', options: methods, validation: { required: true }, colSpan: 1 },
      { id: 'bankName', name: 'bankName', label: 'نام بانک یا درگاه', type: 'text', colSpan: 1 },
      { id: 'reference', name: 'reference', label: 'کد رهگیری فیش یا سند واریز', type: 'text', colSpan: 1 }
    ]
  };
}

export function createChequeFormSchema(accounts: AccountOpt[]): DynamicFormSchema {
  return {
    id: 'cheque_form_schema',
    title: 'ثبت چک صیادی',
    category: 'CHEQUE',
    fields: [
      { id: 'accountId', name: 'accountId', label: 'حساب مشتری', type: 'select', options: accountOptions(accounts), validation: { required: true }, colSpan: 2 },
      {
        id: 'chequeNumber', name: 'chequeNumber', label: 'شناسه ۱۶ رقمی صیاد', type: 'text',
        validation: { required: true, pattern: '^\\d{16}$', patternMessage: 'شناسه صیاد باید دقیقاً ۱۶ رقم باشد' }, colSpan: 2
      },
      { id: 'amount', name: 'amount', label: 'مبلغ چک', type: 'currency', unit: 'ریال', validation: { required: true, min: 1000 }, colSpan: 1 },
      { id: 'bankName', name: 'bankName', label: 'نام بانک و شعبه', type: 'text', validation: { required: true }, colSpan: 1 },
      { id: 'dueDate', name: 'dueDate', label: 'تاریخ سررسید چک', type: 'jalaliDate', validation: { required: true }, colSpan: 2 }
    ]
  };
}

/** فرم تعریف قانون اتوماسیون (Settings → قوانین اتوماسیون)؛ گزینه‌ها از کاتالوگ واحد automation.ts می‌آید. */
export function createAutomationRuleFormSchema(
  events: FormFieldOption[], actions: FormFieldOption[], priorities: FormFieldOption[]
): DynamicFormSchema {
  return {
    id: 'automation_rule_schema',
    title: 'تعریف قانون اتوماسیون',
    category: 'AUTOMATION',
    fields: [
      { id: 'name', name: 'name', label: 'عنوان قانون', type: 'text', validation: { required: true, minLength: 3 }, colSpan: 2 },
      { id: 'triggerEvent', name: 'triggerEvent', label: 'وقتی این رویداد رخ داد', type: 'select', options: events, validation: { required: true }, colSpan: 2 },
      { id: 'condField', name: 'condField', label: 'شرط (اختیاری): نام فیلد رویداد', type: 'text', placeholder: 'مثلاً totalAmount', colSpan: 1 },
      {
        id: 'condOperator', name: 'condOperator', label: 'عملگر', type: 'select', defaultValue: '>',
        options: [{ value: '>', label: 'بزرگ‌تر از' }, { value: '<', label: 'کوچک‌تر از' }, { value: '=', label: 'برابر با' }, { value: '!=', label: 'نابرابر با' }],
        dependsOn: [{ field: 'condField', operator: 'truthy' }], colSpan: 1
      },
      { id: 'condValue', name: 'condValue', label: 'مقدار شرط', type: 'text', dependsOn: [{ field: 'condField', operator: 'truthy' }], validation: { required: true }, colSpan: 2 },
      { id: 'actionType', name: 'actionType', label: 'آنگاه این اقدام انجام شود', type: 'select', options: actions, defaultValue: actions[0]?.value, validation: { required: true }, colSpan: 2 },
      { id: 'taskTitle', name: 'taskTitle', label: 'عنوان وظیفه‌ی ایجادشده', type: 'text', validation: { required: true }, dependsOn: [{ field: 'actionType', operator: 'equals', value: 'CREATE_TASK' }], colSpan: 2 },
      { id: 'taskDescription', name: 'taskDescription', label: 'توضیح وظیفه', type: 'textarea', dependsOn: [{ field: 'actionType', operator: 'equals', value: 'CREATE_TASK' }], colSpan: 2 },
      { id: 'taskPriority', name: 'taskPriority', label: 'اولویت', type: 'select', options: priorities, defaultValue: 'NORMAL', dependsOn: [{ field: 'actionType', operator: 'equals', value: 'CREATE_TASK' }], colSpan: 1 }
    ]
  };
}


/* ===== ثبت‌نام / پرونده پرسنلی / ارجاع مصاحبه (ماژول عمومی؛ متن‌ها قابل‌پیکربندی از orgConfig.onboarding) ===== */
export const createApplicationFormSchema = (roles: string[] = [], requireNationalId = true): DynamicFormSchema => ({
  id: 'application_form_schema', title: 'ثبت اطلاعات و درخواست همکاری', category: 'APPLICATION',
  fields: [
    { id: 'firstName', name: 'firstName', label: 'نام', type: 'text', validation: { required: true, minLength: 2 }, colSpan: 1 },
    { id: 'lastName', name: 'lastName', label: 'نام خانوادگی', type: 'text', validation: { required: true, minLength: 2 }, colSpan: 1 },
    { id: 'mobile', name: 'mobile', label: 'شماره موبایل', type: 'phone', placeholder: '09121234567', validation: { required: true }, colSpan: 1 },
    { id: 'nationalId', name: 'nationalId', label: 'کد ملی', type: 'nationalCode', validation: { required: requireNationalId }, colSpan: 1 },
    roles.length ? { id: 'desiredRole', name: 'desiredRole', label: 'شغل درخواستی', type: 'select', options: roles.map(r => ({ value: r, label: r })), validation: { required: true }, colSpan: 2 }
                 : { id: 'desiredRole', name: 'desiredRole', label: 'شغل درخواستی', type: 'text', validation: { required: true, minLength: 2 }, colSpan: 2 },
    { id: 'notes', name: 'notes', label: 'سوابق و توضیحات', type: 'textarea', placeholder: 'سوابق کاری، مهارت‌ها یا توضیحات لازم', colSpan: 2 },
  ],
} as DynamicFormSchema);
export const PERSONNEL_IDENTITY_SCHEMA: DynamicFormSchema = { id: 'personnel_identity', title: 'اطلاعات هویتی', category: 'PERSONNEL', fields: [
  { id: 'fullName', name: 'fullName', label: 'نام و نام خانوادگی', type: 'text', validation: { required: true, minLength: 3 }, colSpan: 2 },
  { id: 'nationalId', name: 'nationalId', label: 'کد ملی', type: 'nationalCode', validation: { required: true }, colSpan: 1 },
  { id: 'mobile', name: 'mobile', label: 'شماره موبایل', type: 'phone', validation: { required: true }, colSpan: 1 } ] } as DynamicFormSchema;
export const PERSONNEL_BANK_SCHEMA: DynamicFormSchema = { id: 'personnel_bank', title: 'اطلاعات بانکی', category: 'PERSONNEL', fields: [
  { id: 'bankName', name: 'bankName', label: 'نام بانک', type: 'text', validation: { required: true }, colSpan: 1 },
  { id: 'accountHolder', name: 'accountHolder', label: 'نام صاحب حساب', type: 'text', validation: { required: true }, colSpan: 1 },
  { id: 'iban', name: 'iban', label: 'شماره شبا (IR…)', type: 'text', placeholder: 'IR000000000000000000000000', validation: { required: true, minLength: 26, maxLength: 26 }, colSpan: 2 },
  { id: 'accountNumber', name: 'accountNumber', label: 'شماره حساب (اختیاری)', type: 'text', colSpan: 2 } ] } as DynamicFormSchema;
export const PERSONNEL_ADDRESS_SCHEMA: DynamicFormSchema = { id: 'personnel_address', title: 'نشانی', category: 'PERSONNEL', fields: [
  { id: 'province', name: 'province', label: 'استان', type: 'text', validation: { required: true }, colSpan: 1 },
  { id: 'city', name: 'city', label: 'شهر', type: 'text', validation: { required: true }, colSpan: 1 },
  { id: 'full', name: 'full', label: 'آدرس کامل', type: 'textarea', validation: { required: true, minLength: 8 }, colSpan: 2 },
  { id: 'postalCode', name: 'postalCode', label: 'کد پستی (اختیاری)', type: 'text', colSpan: 2 } ] } as DynamicFormSchema;
export const createInterviewFormSchema = (interviewers: { id: string; name: string }[], defaultAddress?: string): DynamicFormSchema => ({ id: 'interview_referral', title: 'ارجاع برای پیگیری مصاحبه', category: 'APPLICATION', fields: [
  { id: 'date', name: 'date', label: 'تاریخ مصاحبه', type: 'jalaliDate', validation: { required: true }, colSpan: 1 },
  { id: 'time', name: 'time', label: 'ساعت (مثال 10:30)', type: 'text', placeholder: '10:30', validation: { required: true, minLength: 5, maxLength: 5 }, colSpan: 1 },
  { id: 'interviewerId', name: 'interviewerId', label: 'مصاحبه‌کننده', type: 'select', options: interviewers.map(u => ({ value: u.id, label: u.name })), validation: { required: true }, colSpan: 2 },
  { id: 'address', name: 'address', label: 'آدرس محل مصاحبه', type: 'textarea', defaultValue: defaultAddress, validation: { required: true }, colSpan: 2 } ] } as DynamicFormSchema);


/** اسکیمای پویای دستور پرداخت / درخواست مجوز واریز (برای حسابدار؛ اجرا در ERP) */
export const FINANCE_REQUEST_SCHEMA: DynamicFormSchema = {
  id: 'finance_request_schema', title: 'دستور پرداخت / مجوز واریز', category: 'PAYMENT',
  fields: [
    { id: 'payeeName', name: 'payeeName', label: 'ذی‌نفع / دریافت‌کننده', type: 'text', placeholder: 'مثال: شرکت حمل‌ونقل', validation: { required: true, minLength: 2 }, colSpan: 2 },
    { id: 'amount', name: 'amount', label: 'مبلغ', type: 'currency', unit: 'ریال', validation: { required: true, min: 1 }, colSpan: 1 },
    { id: 'dueDate', name: 'dueDate', label: 'مهلت اجرا (شمسی)', type: 'jalaliDate', colSpan: 1 },
    { id: 'reason', name: 'reason', label: 'شرح و علت درخواست', type: 'textarea', placeholder: 'مثال: کرایه حمل محموله مشتری ...', validation: { required: true, minLength: 3 }, colSpan: 2 },
  ],
} as DynamicFormSchema;
