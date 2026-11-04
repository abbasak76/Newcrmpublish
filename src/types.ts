export type ID = string;

export type CapabilityPermission =
  | 'accounts.view'
  | 'accounts.edit'
  | 'accounts.delete'
  | 'leads.view'
  | 'leads.edit'
  | 'quotes.view'
  | 'quotes.create'
  | 'quotes.approve'
  | 'finance.view'
  | 'finance.manage'
  | 'settings.manage'
  | 'cases.view'
  | 'cases.edit'
  | 'marketing.manage'
  | 'knowledge.manage'
  | 'agents.manage'
  | 'automation.manage'
  | 'users.manage'
  | 'roles.manage'
  | 'internal.view'
  | 'internal.manage'
  | 'geo.view'
  | 'geo.manage';

export type NavigationTab =
  | 'onboarding'
  | 'accounts'
  | 'leads'
  | 'quotes'
  | 'finance'
  | 'cases'
  | 'marketing'
  | 'knowledge'
  | 'settings'
  | 'internal_automation'
  | 'dashboard'
  | 'tasks'
  | 'activities'
  | 'calendar'
  | 'reports'
  | 'operations_control'
  | 'geo_intelligence';

export type VisibilityScope = 'ORG' | 'BRANCH' | 'TERRITORY' | 'TEAM' | 'OWNER';
export type DevicePermissionType = 'LOCATION' | 'CAMERA' | 'MICROPHONE' | 'NOTIFICATIONS';
export type IndustryProfile = string;

export interface Mention {
  id: string;
  type: 'USER' | 'GROUP' | 'CUSTOMER';
  display: string;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  content: string;
  mentions?: Mention[];
  relatedEntity?: any;
  createdAt: string;
  readBy: string[];
  [key: string]: any;
}

export type LeadStage = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';

export interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  stage: LeadStage;
  ownerId: string;
  notes?: string;
  convertedAccountId?: string;
  createdAt: string;
  [key: string]: any;
}

export interface Activity {
  id: string;
  accountId?: string;
  customerId?: string;
  type: 'VISIT' | 'CALL' | 'NOTE' | 'EMAIL' | 'MEETING' | string;
  title: string;
  description?: string;
  mentions?: Mention[];
  dateTime: string;
  ownerId: string;
  [key: string]: any;
}

export interface Case {
  id: string;
  caseNumber: string;
  accountId: string;
  subject: string;
  description?: string;
  status: string;
  priority: string;
  ownerId: string;
  createdAt: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CustomerPayment {
  id: string;
  accountId: string;
  customerId?: string;
  amount: number;
  date: string;
  method: string;
  status: string;
  [key: string]: any;
}

export interface CustomerNote {
  id: string;
  accountId: string;
  customerId?: string;
  content: string;
  authorId: string;
  mentions?: Mention[];
  createdAt: string;
  [key: string]: any;
}

export type OpportunityStage = 'DISCOVERY' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';

export interface Opportunity {
  id: string;
  accountId: string;
  title: string;
  amount: number;
  stage: OpportunityStage;
  expectedCloseDate?: string;
  ownerId: string;
  createdAt: string;
  [key: string]: any;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  targetAudience: string;
  mode?: 'DYNAMIC' | 'STATIC' | string;
  startDate?: string;
  endDate?: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | string;
  ownerId: string;
  executionCount?: number;
  segmentId?: string;
  createdAt: string;
  [key: string]: any;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | string;
  authorId: string;
  createdAt: string;
  [key: string]: any;
}

export interface AIAgentLog {
  id: string;
  agentId: string;
  trigger: string;
  actionProposed: string;
  actionTaken: string;
  status: 'EXECUTED' | 'QUEUED' | 'REJECTED' | 'AWAITING_APPROVAL' | 'NOT_CONFIGURED' | string;
  timestamp: string;
  reason?: string;
  [key: string]: any;
}

export interface AIRecommendation {
  id: string;
  title: string;
  customerId: string;
  category: string;
  reason: string;
  dataUsed: string;
  proposedAction: string;
  actionPayload?: any;
  createdAt: string;
  [key: string]: any;
}

export interface Segment {
  id: string;
  name: string;
  active?: boolean;
  matchType?: 'ALL' | 'ANY' | string;
  rules?: Array<{ field: string; operator: string; value: any }>;
  accountIds?: string[];
  [key: string]: any;
}

export interface UserAccount {
  id: string;
  name: string;
  email?: string;
  username?: string;
  phone?: string;
  roleId: string;
  permissionSetId: string;
  branchId?: string;
  territoryId?: string;
  avatar?: string;
  isActive?: boolean;
  active?: boolean;
  onboardingCompleted?: boolean;
  [key: string]: any;
}

export interface Role {
  id: string;
  name: string;
  visibilityScope: VisibilityScope;
  description?: string;
  parentId?: string;
  defaultWorkspace?: NavigationTab;
  requiredDevicePermissions?: DevicePermissionType[];
  [key: string]: any;
}

export interface PermissionSet {
  id: string;
  name: string;
  permissions: CapabilityPermission[];
  fieldPermissions?: Record<string, 'SEE' | 'DO' | 'HIDDEN'>;
}

export interface Group {
  id: string;
  name: string;
  memberIds: string[];
  description?: string;
  managerId?: string;
  active?: boolean;
  [key: string]: any;
}

export type UserGroup = Group;

export interface Contact {
  id: string;
  accountId?: string;
  name: string;
  role?: string;
  title?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  notes?: string;
  isPrimary?: boolean;
  [key: string]: any;
}

export interface Customer {
  id: string;
  name: string;
  code?: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
  ownerId?: string;
  branchId?: string;
  territoryId?: string;
  status?: string;
  totalRevenue?: number;
  balance?: number;
  tags?: string[];
  contacts?: Contact[];
  createdAt?: string;
  [key: string]: any;
}

export type Account = Customer;

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  accountId?: string;
  customerId: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'PENDING' | 'OVERDUE' | string;
  date: string;
  dueDate?: string;
  items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export interface Payment {
  id: string;
  accountId: string;
  customerId: string;
  amount: number;
  date: string;
  method: 'CASH' | 'TRANSFER' | 'CHEQUE';
  reference?: string;
  bankName?: string;
  chequeDueDate?: string;
  status: 'PENDING' | 'CLEARED';
  notes?: string;
}

export interface Cheque {
  id: string;
  amount: number;
  status: 'PENDING' | 'RECEIVED' | 'DEPOSITED' | 'CLEARED' | 'BOUNCED' | string;
  dueDate?: string;
  bankName?: string;
  chequeNumber?: string;
  [key: string]: any;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
  createdAt: string;
}

/** Read-only credit-note fact mirrored from the accounting/ERP source. */
export interface CreditNote {
  id: string;
  externalCreditNoteId: string;
  sourceSystemCode: string;
  customerId: string;
  accountId?: string;
  invoiceId?: string;
  amount: number;
  status: 'DRAFT' | 'APPROVED' | 'POSTED' | 'VOID' | 'CANCELLED' | string;
  issuedAt?: string;
  postedAt?: string;
  sourceDocumentId?: string;
  isVoided?: boolean;
  syncedAt?: string;
  sourceType: 'ERP_MIRROR';
  [key: string]: any;
}

/** Local workflow request only; approval does not post an accounting credit. */
export interface CreditNoteRequest {
  id: string;
  requestNumber?: string;
  customerId: string;
  accountId?: string;
  invoiceId: string;
  amount: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'VOID' | string;
  reason: string;
  sourceDocumentId: string;
  createdAt: string;
  createdBy?: string;
  approvedAt?: string;
  voidedAt?: string;
  [key: string]: any;
}

export interface TimelineEvent {
  id: string;
  customerId: string;
  type: string;
  title: string;
  description?: string;
  dateTime: string;
  relatedEntityId?: string;
}

export type CustomerTimelineEvent = TimelineEvent;

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  actor: string;
  createdAt: string;
}

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OPEN' | string;
  dueDate?: string;
  slaStatus?: 'ON_TRACK' | 'AT_RISK' | 'BREACHED';
  assignedTo?: string;
  priority?: Priority;
  [key: string]: any;
}

export type CustomerTask = Task;

export interface QuoteLine {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  lineTotal: number;
  appliedTiers?: string[];
  [key: string]: any;
}

export interface PriceWaterfallBreakdown {
  basePrice: number;
  volumeDiscount: number;
  bundleDiscount: number;
  contractRebate: number;
  negotiatedDiscount: number;
  netPrice: number;
  costPrice: number;
  grossMarginAmount: number | null;
  grossMarginPercent: number | null;
  costKnown?: boolean;
  [key: string]: any;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId?: string;
  accountId?: string;
  totalAmount: number;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'APPROVED' | 'PENDING_APPROVAL' | string;
  marginPercent: number;
  marginCompleteness?: 'KNOWN' | 'PARTIAL' | 'UNKNOWN';
  validUntil?: string;
  lines: QuoteLine[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  read: boolean;
  createdAt: string;
  linkTab?: string;
  /** گیرنده واقعی اعلان؛ اگر تعریف شود فقط همان کاربر آن را می‌بیند */
  recipientId?: string;
  /** کلید ضدتکرار / رکورد مرتبط */
  dedupeKey?: string;
  entityId?: string;
}

export interface BusinessEvent {
  id: string;
  type: string;
  title: string;
  timestamp?: string;
  [key: string]: any;
}

export interface ExternalProduct {
  id: string;
  name: string;
  code?: string;
  sku?: string;
  unitPrice?: number;
  basePrice: number;
  costPrice: number;
  [key: string]: any;
}

export interface DraftQuoteState {
  step: number;
  selectedCustomerId: string;
  projectTitle: string;
  validUntilDays: string;
  lines: Array<{
    productId: string;
    productName: string;
    productCode: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    lineTotal: number;
  }>;
  discountPercent: string;
  applyTax: boolean;
  paymentTerms: string;
  deliveryTerms: string;
  quoteNotes: string;
}

export interface Job {
  id: string;
  type: string;
  payload: any;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRYING' | string;
  attempts: number;
  maxAttempts: number;
  idempotencyKey?: string;
  correlationId?: string;
  nextAttemptAt?: string;
  completedAt?: string;
  error?: string;
  createdAt: string;
  [key: string]: any;
}

export interface Attachment {
  id: string;
  entityId: string;
  entityType: 'ACCOUNT' | 'TASK' | 'QUOTE' | 'OPPORTUNITY' | 'CASE' | 'REQUEST' | string;
  fileName: string;
  fileType: string;
  fileSize: number;
  base64Data: string;
  uploadedAt: string;
  uploadedBy: string;
  [key: string]: any;
}

export interface OfflineOperation {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | string;
  entityType: string;
  entityId: string;
  payload: any;
  timestamp: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'COMPLETED';
  retryCount: number;
  error?: string;
}

export type RequestType = 
  | 'LEAVE'
  | 'MISSION'
  | 'OVERTIME'
  | 'ADVANCE'
  | 'ATTENDANCE'
  | 'CERTIFICATE'
  | 'PAYMENT'
  | 'EXPENSE'
  | 'PURCHASE'
  | 'EQUIPMENT'
  | 'IT_SUPPORT'
  | 'GENERAL';

export interface InternalRequest {
  id: string;
  type: RequestType;
  title: string;
  creatorId: string;
  currentAssigneeId?: string;
  currentGroupId?: string;
  status: 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'WAITING_FOR_INFORMATION' | 'COMPLETED' | 'CANCELLED' | string;
  data?: any;
  createdAt: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface ActionItem {
  id: string;
  title: string;
  assigneeId?: string;
  completed: boolean;
  dueDate?: string;
}

export interface InternalMeeting {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  organizerId: string;
  participantIds?: string[];
  groupIds?: string[];
  actionItems?: ActionItem[];
  [key: string]: any;
}

export interface WorkflowRule {
  id: string;
  name: string;
  active: boolean;
  triggerEvent: string;
  conditions?: Array<{ field: string; operator: string; value: any }>;
  actions?: Array<{ type: string; payload: any }>;
  [key: string]: any;
}

export interface AIAgent {
  id: string;
  name: string;
  type: 'SALES' | 'COLLECTION' | 'PRICING' | string;
  role: string;
  active: boolean;
  requiresHumanApproval: boolean;
  allowedTools: string[];
  prompt: string;
  autonomyLevel: number;
  description?: string;
  lastActive?: string;
}

export interface MessagingChannel {
  id: 'eitaa' | 'rubika' | 'bale' | 'kavenegar' | 'telegram' | 'custom_webhook' | string;
  name: string;
  type: 'EITAA' | 'RUBIKA' | 'BALE' | 'SMS' | 'TELEGRAM' | 'WEBHOOK' | string;
  active: boolean;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'CONFIGURING' | 'NOT_CONFIGURED';
  botToken: string;
  webhookUrl: string;
  autoReply: boolean;
  lastPing?: string;
  latencyMs?: number;
}

export interface MessagingLog {
  id: string;
  channelId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  sender: string;
  recipient: string;
  content: string;
  status: 'DELIVERED' | 'SENT' | 'FAILED' | 'RECEIVED' | 'LOCAL_ONLY';
  timestamp: string;
  trackingId?: string;
}

export type GeoMetricKey = 'OUTSTANDING_RECEIVABLES' | 'SALES' | 'RETURNS' | 'INVOICE_COUNT' | 'CUSTOMER_DENSITY' | 'CASH_COLLECTED' | 'SALESPERSON_PERFORMANCE' | 'OUT_OF_ZONE_DISTRIBUTION';
export interface GeoPoint { longitude: number; latitude: number; }
export interface GeoPolygonGeometry { type: 'Polygon'; coordinates: number[][][]; }
export interface GeoZone { id: string; code: string; name: string; status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'; ownerId?: string; createdAt: string; updatedAt: string; currentGeometryVersionId?: string; [key: string]: any; }
export interface ZoneGeometryVersion { id: string; zoneId: string; version: number; geometry: GeoPolygonGeometry; effectiveFrom: string; effectiveTo?: string | null; createdBy: string; createdAt: string; changeReason?: string; }
export interface ZoneAssignment { id: string; zoneId: string; entityType: 'CUSTOMER' | 'USER' | 'TERRITORY'; entityId: string; method: 'POLYGON' | 'MANUAL' | 'IMPORT'; effectiveFrom: string; effectiveTo?: string | null; createdBy: string; createdAt: string; }
export interface GeoMetricDefinition { key: GeoMetricKey; label: string; unit: string; sourceDescription: string; aggregation: string; higherIsBetter: boolean | null; requiresDateRange: boolean; available: boolean; limitation?: string; }
export interface ZoneMetricSnapshot { id: string; zoneId: string; metricKey: GeoMetricKey; periodStart: string; periodEnd: string; value: number; unit: string; sourceUpdatedAt: string; calculatedAt: string; sourceRecordCount: number; rebuildable: true; }

export type AccountNature = 'DEBIT' | 'CREDIT' | 'BOTH';

export interface CoaMirror {
  id: string;
  code: string;
  name: string;
  nature: AccountNature;
  level: 1 | 2 | 3 | 4;
  parentCode?: string | null;
  isActive: boolean;
  tenantId?: string;
  updatedAt: string;
}

export interface ReportBucket {
  id: string;
  key: string;
  title: string;
  standardNature: AccountNature;
  calculationExpression?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface AccountMapRule {
  id: string;
  crmEntityType: 'CUSTOMER' | 'VENDOR' | 'PAYMENT' | 'RECEIPT' | 'SALES_RETURN' | 'EXPENSE' | 'DISCOUNT' | 'TAX';
  crmSubType?: string;
  erpAccountCode: string;
  erpContraAccountCode?: string;
  description?: string;
  isActive: boolean;
}

export interface BankMap {
  id: string;
  bankName: string;
  accountNumber: string;
  erpAccountCode: string;
  isActive: boolean;
}

export interface CashboxMap {
  id: string;
  cashboxName: string;
  collectorUserId?: string;
  erpAccountCode: string;
  isActive: boolean;
}

export type OutboxStatus = 'PENDING' | 'SENT' | 'FAILED' | 'DEAD_LETTER';

export interface OutboxMessage {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: any;
  status: OutboxStatus;
  retryCount: number;
  maxRetries?: number;
  errorDetails?: string | null;
  createdAt: string;
  sentAt?: string | null;
  tenantId?: string;
  idempotencyKey?: string;
}

export interface AppState {
  /** درخواست‌های همکاری و پرونده‌های پرسنلی (ماژول ثبت‌نام؛ ذخیره محلی تا اتصال backend) */
  /** دستور پرداخت / مجوز واریز (درخواست به حسابدار؛ اجرا در ERP) */
  financeRequests?: any[];
  /** مدل دامنهٔ هوش مکانی؛ هندسه نسخه‌بندی می‌شود و snapshot فقط cache قابل بازسازی است. */
  geoZones?: GeoZone[];
  zoneGeometryVersions?: ZoneGeometryVersion[];
  zoneAssignments?: ZoneAssignment[];
  geoMetricDefinitions?: GeoMetricDefinition[];
  zoneMetricSnapshots?: ZoneMetricSnapshot[];
  /** ساختار آینه کدینگ و نگاشت حسابداری ERP */
  coaMirror?: CoaMirror[];
  reportBuckets?: ReportBucket[];
  accountMapRules?: AccountMapRule[];
  bankMaps?: BankMap[];
  cashboxMaps?: CashboxMap[];
  /** صف پیام‌های مبادله مطمئن Outbox */
  outbox?: OutboxMessage[];
  onboardingApplications?: any[];
  personnelFiles?: any[];
  schemaVersion?: number;
  currentUserId?: string;
  users: UserAccount[];
  roles?: Role[];
  permissionSets?: PermissionSet[];
  groups?: Group[];
  customers?: Customer[];
  accounts: Account[];
  invoices?: Invoice[];
  payments?: Payment[];
  cheques?: Cheque[];
  paymentAllocations?: PaymentAllocation[];
  creditNotes?: CreditNote[];
  creditNoteRequests?: CreditNoteRequest[];
  creditNoteSourceStatus?: 'NOT_CONFIGURED' | 'CONNECTED';
  quotes: Quote[];
  tasks?: Task[];
  externalProducts: ExternalProduct[];
  notifications?: Notification[];
  businessEvents?: BusinessEvent[];
  /** قوانین اتوماسیون (WorkflowRule) — تنها منبع قوانین؛ در تنظیمات تعریف و در useWorkflowEngine اجرا می‌شود */
  automations?: WorkflowRule[];
  timelineEvents?: TimelineEvent[];
  auditLogs?: AuditLog[];
  /** ثبت ضدتکرار یادآوری‌ها: taskId|stage|dueDate → زمان ایجاد */
  reminderLog?: Record<string, string>;
  attachments?: any[];
  draftQuote?: DraftQuoteState | null;
  visits?: any[];
  communications?: any[];
  activities?: any[];
  opportunities?: any[];
  activeContextAccountId?: string | null;
  activeContextCustomerId?: string | null;
  agents?: AIAgent[];
  agentLogs?: AIAgentLog[];
  messagingChannels?: MessagingChannel[];
  messagingLogs?: MessagingLog[];
  settings?: any;
  [key: string]: any;
}
