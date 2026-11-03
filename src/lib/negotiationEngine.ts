import type { AppState, Quote, QuoteLine } from '../types';
import { calculatePriceWaterfall } from './cpqEngine.ts';

export type NegotiationRisk = 'LOW' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';
export type NegotiationScenarioType = 'KEEP' | 'INCREASE';

export interface QuoteNegotiationScenario {
  key: string;
  type: NegotiationScenarioType;
  title: string;
  reason: string;
  proposedAmount: number;
  proposedProfit: number | null;
  profitCompleteness: 'KNOWN' | 'PARTIAL' | 'UNKNOWN';
  creditRisk: NegotiationRisk;
  lines: QuoteLine[];
  changedProductName?: string;
  currentQuantity?: number;
  proposedQuantity?: number;
  appliedVolumeDiscountPercent?: number;
}

const finiteNonNegative = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

function calculateProfit(lines: QuoteLine[], state: AppState): { value: number | null; completeness: 'KNOWN' | 'PARTIAL' | 'UNKNOWN' } {
  if (!lines.length) return { value: null, completeness: 'UNKNOWN' };
  let profit = 0;
  let known = 0;
  for (const line of lines) {
    const product = (state.externalProducts || []).find(item => item.id === line.productId);
    // Quote line cost is the captured historical cost; do not replace it with today's catalog cost.
    const cost = line.costPrice;
    const revenue = Number.isFinite(line.lineTotal) ? line.lineTotal : line.unitPrice * line.quantity;
    if (finiteNonNegative(cost) && cost > 0 && Number.isFinite(revenue)) {
      profit += revenue - cost * line.quantity;
      known += 1;
    }
  }
  if (known === lines.length) return { value: profit, completeness: 'KNOWN' };
  if (known > 0) return { value: profit, completeness: 'PARTIAL' };
  return { value: null, completeness: 'UNKNOWN' };
}

function creditRisk(state: AppState, accountId: string | undefined, proposedAmount: number): NegotiationRisk {
  const account = (state.accounts || []).find(item => item.id === accountId);
  if (!account || !finiteNonNegative(account.creditLimit) || account.creditLimit === 0 || !finiteNonNegative(account.balance)) return 'UNKNOWN';
  const exposure = account.balance + proposedAmount;
  if (exposure > account.creditLimit) return 'CRITICAL';
  if (exposure >= account.creditLimit * 0.9) return 'HIGH';
  return 'LOW';
}

/**
 * Data-driven negotiation suggestions for an existing quote.
 * No arbitrary uplift/discount percentages are introduced. Increase scenarios are emitted
 * only when the catalog has a configured next volume tier and CPQ calculates a non-increasing
 * unit price. This is a recommendation only; the caller must still enforce RBAC and approval.
 */
export function generateQuoteNegotiationScenarios(quote: Quote, state: AppState): QuoteNegotiationScenario[] {
  if (!quote || !Array.isArray(quote.lines) || quote.lines.length === 0) return [];

  const currentLines = quote.lines.map(line => ({ ...line }));
  const currentAmount = currentLines.reduce((sum, line) => sum + (Number.isFinite(line.lineTotal) ? line.lineTotal : line.unitPrice * line.quantity), 0);
  const currentProfit = calculateProfit(currentLines, state);
  const scenarios: QuoteNegotiationScenario[] = [{
    key: `keep:${quote.id}`,
    type: 'KEEP',
    title: 'حفظ پیشنهاد فعلی',
    reason: 'بدون تغییر در اقلام، مقدار یا قیمت فعلی پیش‌فاکتور.',
    proposedAmount: currentAmount,
    proposedProfit: currentProfit.value,
    profitCompleteness: currentProfit.completeness,
    creditRisk: creditRisk(state, quote.accountId || quote.customerId, currentAmount),
    lines: currentLines
  }];

  const tiers = Array.isArray(state.volumeTiers) ? state.volumeTiers as Array<Record<string, unknown>> : [];
  const contracts = Array.isArray(state.contracts) ? state.contracts as Array<Record<string, unknown>> : [];
  const contract = contracts.find(item => item.accountId === (quote.accountId || quote.customerId));
  const rebate = contract && finiteNonNegative(contract.rebatePercent) && contract.rebatePercent <= 100 ? contract.rebatePercent : 0;

  for (const line of currentLines) {
    const product = (state.externalProducts || []).find(item => item.id === line.productId);
    if (!product || !finiteNonNegative(product.basePrice) || product.basePrice <= 0 || !Number.isFinite(line.quantity) || line.quantity <= 0) continue;

    const nextTier = tiers
      .filter(tier => tier.productId === product.id && finiteNonNegative(tier.minQuantity) && tier.minQuantity > line.quantity && finiteNonNegative(tier.discountPercent) && tier.discountPercent <= 100)
      .sort((a, b) => Number(a.minQuantity) - Number(b.minQuantity))[0];
    if (!nextTier) continue;

    const targetQuantity = Number(nextTier.minQuantity);
    const discountPercent = Number(nextTier.discountPercent);
    const costKnown = finiteNonNegative(line.costPrice) && line.costPrice > 0;
    const waterfall = calculatePriceWaterfall({
      basePrice: product.basePrice,
      quantity: targetQuantity,
      costPrice: costKnown ? line.costPrice : undefined,
      appliedVolumeDiscountPercent: discountPercent,
      contractRebatePercent: rebate
    });
    const proposedUnitPrice = waterfall.netPrice / targetQuantity;
    // Never recommend an increase-tier price above the current quoted unit price.
    if (!Number.isFinite(proposedUnitPrice) || proposedUnitPrice < 0 || proposedUnitPrice > line.unitPrice) continue;

    const proposedLines = currentLines.map(item => item.id === line.id ? {
      ...item,
      quantity: targetQuantity,
      unitPrice: proposedUnitPrice,
      lineTotal: waterfall.netPrice,
      appliedTiers: [...(item.appliedTiers || []), `VOLUME_TIER:${String(nextTier.minQuantity)}`]
    } : { ...item });
    const proposedAmount = proposedLines.reduce((sum, item) => sum + (Number.isFinite(item.lineTotal) ? item.lineTotal : item.unitPrice * item.quantity), 0);
    const profit = calculateProfit(proposedLines, state);
    scenarios.push({
      key: `increase:${quote.id}:${line.id}:${targetQuantity}`,
      type: 'INCREASE',
      title: `افزایش مقدار ${product.name}`,
      reason: `پیشنهاد بر اساس پلهٔ حجمی تعریف‌شده برای ${product.name}؛ مقدار از ${line.quantity} به ${targetQuantity} می‌رسد و قیمت واحد پیشنهادی از CPQ محاسبه شده است.`,
      proposedAmount,
      proposedProfit: profit.value,
      profitCompleteness: profit.completeness,
      creditRisk: creditRisk(state, quote.accountId || quote.customerId, proposedAmount),
      lines: proposedLines,
      changedProductName: product.name,
      currentQuantity: line.quantity,
      proposedQuantity: targetQuantity,
      appliedVolumeDiscountPercent: discountPercent
    });
  }

  return scenarios;
}
