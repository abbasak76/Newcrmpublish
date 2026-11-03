export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
export interface RiskSignal { code: string; level: RiskLevel; title: string; reason: string; blocking?: boolean }
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** محاسبات تحلیلی خالص؛ بدون ایجاد سند مالی یا تغییر خودکار مانده مشتری. */
export function assessOrderRisk(input: {
  order: any; customer?: any; orders?: any[]; policies?: any[]; invoices?: any[]; returns?: any[];
}): RiskSignal[] {
  const { order, customer, orders = [], policies = [], invoices = [], returns = [] } = input;
  const signals: RiskSignal[] = [];
  const appliesToOrder = (policy: any) => !policy.scope || policy.scope === 'COMPANY' || policy.scope === 'CUSTOMER' && policy.value === customer?.id || policy.scope === 'PRODUCT' && (order?.lines || []).some((line: any) => line.productId === policy.value) || policy.scope === 'PRODUCT_GROUP' && (order?.lines || []).some((line: any) => line.productGroupId === policy.value) || policy.scope === 'ZONE' && order?.zone === policy.value;
  const balance = Number(customer?.balance);
  const limit = Number(customer?.creditLimit);
  if (!customer) signals.push({ code: 'CUSTOMER_UNKNOWN', level: 'UNKNOWN', title: 'پروفایل مشتری ناقص', reason: 'مشتری به سفارش متصل نیست یا در داده محلی یافت نشد.' });
  else if (finite(balance) && finite(limit) && limit > 0 && balance + Number(order?.totalAmount || 0) > limit) {
    signals.push({ code: 'CREDIT_LIMIT', level: 'HIGH', title: 'عبور احتمالی از سقف اعتبار', reason: `مانده فعلی به‌علاوه سفارش از سقف اعتبار تعریف‌شده بیشتر می‌شود.`, blocking: policies.some(p => p.enabled && p.type === 'CREDIT_LIMIT' && p.enforcement === 'CRM_TEST_ONLY') });
  } else if (!finite(balance) || !finite(limit) || limit <= 0) {
    signals.push({ code: 'CREDIT_UNKNOWN', level: 'UNKNOWN', title: 'اعتبار قابل ارزیابی نیست', reason: 'مانده یا سقف اعتبار معتبر در داده موجود نیست.' });
  }
  if (order?.costKnown === true && finite(order.totalAmount) && finite(order.costAmount) && order.totalAmount > 0) {
    const margin = ((order.totalAmount - order.costAmount) / order.totalAmount) * 100;
    const minPolicy = policies.find(p => p.enabled && p.type === 'MIN_MARGIN' && p.value != null && appliesToOrder(p));
    if (minPolicy && Number.isFinite(Number(minPolicy.value)) && margin < Number(minPolicy.value)) signals.push({ code: 'LOW_MARGIN', level: 'HIGH', title: 'حاشیه سود کمتر از سیاست', reason: `حاشیه محاسبه‌شده ${margin.toFixed(1)}٪ است و از حد تعریف‌شده ${Number(minPolicy.value)}٪ پایین‌تر است.`, blocking: true });
    if (margin < 0) signals.push({ code: 'NEGATIVE_MARGIN', level: 'HIGH', title: 'سفارش زیان‌ده در سطح بهای ثبت‌شده', reason: 'مبلغ سفارش از بهای تمام‌شده ثبت‌شده کمتر است.', blocking: true });
  } else signals.push({ code: 'COST_UNKNOWN', level: 'UNKNOWN', title: 'بهای تمام‌شده نامشخص', reason: 'تا دریافت بهای معتبر، سود و حاشیه سود قابل تأیید نیست.' });

  const noCredit = policies.find(p => p.enabled && p.type === 'NO_CREDIT' && appliesToOrder(p));
  const invoiceBalance = invoices.filter(i => i.customerId === order.customerId).reduce((sum, i) => sum + Math.max(0, Number(i.balance || 0)), 0);
  const knownCustomerBalance = Math.max(invoiceBalance, Number.isFinite(Number(customer?.balance)) ? Math.max(0, Number(customer?.balance)) : 0);
  if (noCredit && knownCustomerBalance > 0) signals.push({ code: 'NO_CREDIT_POLICY', level: 'HIGH', title: 'مشتری دارای مانده تحت سیاست محدودکننده', reason: `مانده قابل مشاهده ${knownCustomerBalance} است؛ این سیگنال محلی است و جایگزین کنترل سمت سرور نیست.`, blocking: true });
  const maxDiscount = policies.find(p => p.enabled && p.type === 'MAX_DISCOUNT' && p.value != null && appliesToOrder(p));
  if (maxDiscount && Number.isFinite(Number(maxDiscount.value)) && Number(order?.discountPercent || 0) > Number(maxDiscount.value)) signals.push({ code: 'MAX_DISCOUNT', level: 'HIGH', title: 'تخفیف بالاتر از سیاست مجاز', reason: `تخفیف سفارش ${Number(order.discountPercent)}٪ است و از سقف ${Number(maxDiscount.value)}٪ بیشتر است.`, blocking: true });
  const zonePolicy = policies.find(p => p.enabled && p.type === 'ZONE' && p.value != null && appliesToOrder(p));
  if (zonePolicy && order?.zone && order.zone !== zonePolicy.value) signals.push({ code: 'ZONE_POLICY', level: 'HIGH', title: 'مغایرت محدوده توزیع', reason: `زون سفارش ${order.zone} با زون مجاز ${zonePolicy.value} مطابقت ندارد.`, blocking: true });
  const sameCustomer = orders.filter(o => o.id !== order.id && o.customerId === order.customerId && o.status !== 'CANCELLED');
  const sameValueRecent = sameCustomer.find(o => Number(o.totalAmount) === Number(order.totalAmount) && Math.abs(new Date(o.createdAt || 0).getTime() - new Date(order.createdAt || 0).getTime()) < 24 * 60 * 60 * 1000);
  if (sameValueRecent) signals.push({ code: 'POSSIBLE_DUPLICATE', level: 'MEDIUM', title: 'احتمال سفارش تکراری', reason: `سفارش ${sameValueRecent.orderNumber || sameValueRecent.id} با مبلغ برابر برای همین مشتری در بازه نزدیک وجود دارد.` });
  const customerReturns = returns.filter(r => r.customerId === order.customerId && r.status !== 'CANCELLED');
  if (customerReturns.length >= 3) signals.push({ code: 'RETURN_PATTERN', level: 'MEDIUM', title: 'تکرار برگشتی مشتری', reason: `${customerReturns.length} برگشتی در داده‌های موجود ثبت شده؛ علت نهایی نیازمند بررسی انسانی است.` });
  return signals;
}

export function calculateProfitability(input: { invoices?: any[]; returns?: any[]; payments?: any[]; orders?: any[]; dispatchPlans?: any[]; expenses?: any[] }) {
  const invoices = input.invoices || [], returns = input.returns || [], payments = input.payments || [], orders = input.orders || [], plans = input.dispatchPlans || [], expenses = input.expenses || [];
  const actualCogs = (input as any).actualCogs;
  const invoiceGross = invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
  const confirmedReturns = returns.filter(r => r.financialDocumentConfirmed === true).reduce((s, r) => s + Number(r.amount || 0), 0);
  const unconfirmedReturns = returns.filter(r => r.financialDocumentConfirmed !== true).reduce((s, r) => s + Number(r.amount || 0), 0);
  const netSales = invoiceGross - confirmedReturns;
  const clearedPayments = payments.filter(p => p.status === 'CLEARED' && p.method !== 'CHEQUE').reduce((s, p) => s + Number(p.amount || 0), 0)
    + payments.filter(p => p.status === 'CLEARED' && p.method === 'CHEQUE').reduce((s, p) => s + Number(p.amount || 0), 0);
  const knownCostOrders = orders.filter(o => o.status !== 'CANCELLED' && o.costKnown === true && Number.isFinite(Number(o.costAmount)));
  const estimatedOrderRevenue = knownCostOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const estimatedGrossProfit = knownCostOrders.reduce((s, o) => s + Number(o.totalAmount || 0) - Number(o.costAmount || 0), 0);
  const knownDispatchCosts = plans.filter(p => Number.isFinite(Number(p.distributionCost)) && p.distributionCost != null).reduce((s, p) => s + Number(p.distributionCost), 0);
  const knownExpenses = expenses.filter(e => e.status === 'PAID' && Number.isFinite(Number(e.amount))).reduce((s, e) => s + Number(e.amount), 0);
  return {
    invoiceGross, confirmedReturns, unconfirmedReturns, netSales, clearedPayments,
    receivableBalance: invoices.reduce((s, i) => s + Math.max(0, Number(i.balance || 0)), 0),
    estimatedOrderRevenue, estimatedGrossProfit,
    estimatedGrossMarginPercent: estimatedOrderRevenue > 0 ? estimatedGrossProfit / estimatedOrderRevenue * 100 : null,
    costCoveragePercent: orders.length ? knownCostOrders.length / orders.length * 100 : null,
    knownDispatchCosts, knownExpenses,
    operationalProfit: finite(actualCogs) && knownDispatchCosts > 0 ? netSales - actualCogs - knownExpenses - knownDispatchCosts : null,
    operationalProfitStatus: finite(actualCogs) && knownDispatchCosts > 0 ? 'CALCULATED_WITH_INPUTS' : 'UNAVAILABLE',
    returnReconciliationStatus: unconfirmedReturns > 0 ? 'PENDING_DOCUMENTS' : 'RECONCILED',
  };
}

export function buildOperationsMetrics(input: { orders?: any[]; invoices?: any[]; returns?: any[]; dispatchPlans?: any[]; payments?: any[] }) {
  const orders = input.orders || [], invoices = input.invoices || [], returns = input.returns || [], plans = input.dispatchPlans || [], payments = input.payments || [];
  const convertedQuoteIds = new Set(invoices.map(i => i.quoteId).filter(Boolean));
  const invoicedOrderIds = new Set(invoices.map(i => i.salesOrderId).filter(Boolean));
  const knownWeights = plans.filter(p => Number(p.capacityKg) > 0 && p.plannedWeightKg != null);
  return {
    orderCount: orders.length,
    approvedOrders: orders.filter(o => ['APPROVED','RELEASED','IN_TRANSIT','DELIVERED'].includes(o.status)).length,
    cancelledOrders: orders.filter(o => o.status === 'CANCELLED').length,
    orderValue: orders.filter(o => o.status !== 'CANCELLED').reduce((s,o)=>s+Number(o.totalAmount||0),0),
    invoicedOrderCount: orders.filter(o => invoicedOrderIds.has(o.id)).length,
    returnCount: returns.length,
    confirmedReturnCount: returns.filter(r=>r.financialDocumentConfirmed===true).length,
    unconfirmedReturnAmount: returns.filter(r=>r.financialDocumentConfirmed!==true).reduce((s,r)=>s+Number(r.amount||0),0),
    paymentAmount: payments.filter(p=>p.status==='CLEARED').reduce((s,p)=>s+Number(p.amount||0),0),
    dispatchCapacityCoverage: knownWeights.length ? knownWeights.reduce((s,p)=>s+Number(p.plannedWeightKg||0)/Number(p.capacityKg)*100,0)/knownWeights.length : null,
    quoteInvoiceLinkCoverage: convertedQuoteIds.size,
  };
}

export function calculateCreditMetrics(input: { invoices?: any[]; payments?: any[]; allocations?: any[]; cheques?: any[]; asOf?: Date }) {
  const invoices = input.invoices || [], payments = input.payments || [], allocations = input.allocations || [], cheques = input.cheques || [];
  const paymentById = new Map(payments.map(p => [p.id, p]));
  const invoiceById = new Map(invoices.map(i => [i.id, i]));
  const settlementDays = allocations.flatMap(a => {
    const payment: any = paymentById.get(a.paymentId), invoice: any = invoiceById.get(a.invoiceId);
    if (!payment || !invoice || payment.status !== 'CLEARED' || !invoice.date || !payment.date) return [];
    const days = Math.floor((new Date(payment.date).getTime() - new Date(invoice.date).getTime()) / 86400000);
    return Number.isFinite(days) && days >= 0 ? [days] : [];
  }).sort((a,b)=>a-b);
  const median = settlementDays.length ? settlementDays.length % 2 ? settlementDays[(settlementDays.length-1)/2] : (settlementDays[settlementDays.length/2-1]+settlementDays[settlementDays.length/2])/2 : null;
  const clearedAllocated = allocations.reduce((sum,a)=>{const p:any=paymentById.get(a.paymentId);return sum+(p?.status==='CLEARED'?Math.max(0,Number(a.amount||0)):0)},0);
  const invoiceGross = invoices.reduce((sum,i)=>sum+Math.max(0,Number(i.totalAmount||0)),0);
  const now = (input.asOf || new Date()).getTime();
  const overdueInvoices = invoices.filter(i=>Number(i.balance||0)>0&&(i.status==='OVERDUE'||i.dueDate&&new Date(i.dueDate).getTime()<now)).length;
  return {
    averageSettlementDays: settlementDays.length ? settlementDays.reduce((a,b)=>a+b,0)/settlementDays.length : null,
    medianSettlementDays: median,
    settlementSampleSize: settlementDays.length,
    overdueInvoiceCount: overdueInvoices,
    bouncedChequeCount: cheques.filter(c=>c.status==='BOUNCED').length,
    unresolvedChequeCount: cheques.filter(c=>['PENDING','RECEIVED','DEPOSITED'].includes(c.status)).length,
    clearedAllocatedAmount: clearedAllocated,
    allocatedCollectionRatePercent: invoiceGross>0?clearedAllocated/invoiceGross*100:null,
    overdueBalance: invoices.filter(i=>Number(i.balance||0)>0&&(i.status==='OVERDUE'||i.dueDate&&new Date(i.dueDate).getTime()<now)).reduce((sum,i)=>sum+Number(i.balance||0),0),
  };
}

export function analyzeReturns(returns: any[] = []) {
  const byCause = new Map<string,{reasonCode:string;count:number;amount:number;confirmedCount:number;unconfirmedAmount:number}>();
  for (const item of returns) {
    const reasonCode = item.reasonCode || 'UNKNOWN';
    const entry = byCause.get(reasonCode) || { reasonCode, count: 0, amount: 0, confirmedCount: 0, unconfirmedAmount: 0 };
    entry.count += 1; entry.amount += Number(item.amount || 0);
    if (item.financialDocumentConfirmed === true) entry.confirmedCount += 1; else entry.unconfirmedAmount += Number(item.amount || 0);
    byCause.set(reasonCode, entry);
  }
  return [...byCause.values()].sort((a,b)=>b.amount-a.amount);
}

export function evaluateDispatchPlan(plan: any, orders: any[] = []) {
  const assignedIds: string[] = Array.isArray(plan?.orderIds) ? plan.orderIds : [];
  const assigned = orders.filter(o=>assignedIds.includes(o.id));
  const signals: RiskSignal[] = [];
  const capacity = Number(plan?.capacityKg), weight = plan?.plannedWeightKg == null ? NaN : Number(plan.plannedWeightKg);
  if (!Number.isFinite(capacity) || capacity <= 0 || !Number.isFinite(weight)) {
    signals.push({ code: 'DISPATCH_WEIGHT_UNKNOWN', level: 'UNKNOWN', title: 'ظرفیت یا وزن بار نامشخص', reason: 'تا زمان ثبت وزن معتبر اقلام و ظرفیت معتبر خودرو، درصد بهره‌برداری قابل محاسبه نیست.' });
  } else if (weight > capacity) {
    signals.push({ code: 'DISPATCH_OVER_CAPACITY', level: 'HIGH', title: 'بار بیش از ظرفیت وزنی', reason: `وزن برنامه ${weight} از ظرفیت مجاز ${capacity} بیشتر است.`, blocking: true });
  }
  const zoneMismatches = assigned.filter(o=>o.zone && plan?.zone && o.zone !== plan.zone);
  if (zoneMismatches.length) signals.push({ code: 'DISPATCH_ZONE_MISMATCH', level: 'HIGH', title: 'مغایرت زون سفارش و مسیر', reason: `${zoneMismatches.length} سفارش با زون برنامه پخش یکسان نیست؛ تأیید استثنا باید ثبت شود.` });
  const duplicateCount = assignedIds.length - new Set(assignedIds).size;
  if (duplicateCount > 0) signals.push({ code: 'DISPATCH_DUPLICATE_ASSIGNMENT', level: 'HIGH', title: 'تخصیص تکراری سفارش', reason: `${duplicateCount} شناسه سفارش بیش از یک‌بار در برنامه آمده است.`, blocking: true });
  return { signals, assignedOrderCount: assigned.length, capacityUtilizationPercent: Number.isFinite(capacity)&&capacity>0&&Number.isFinite(weight)?weight/capacity*100:null, knownWeight: Number.isFinite(weight), zoneMismatchCount: zoneMismatches.length };
}
