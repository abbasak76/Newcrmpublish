import type { QuoteLine, ExternalProduct, PriceWaterfallBreakdown } from '../types';

export interface PriceWaterfallParams {
  basePrice?: number;
  quantity: number;
  costPrice?: number;
  negotiatedUnitPrice?: number;
  appliedVolumeDiscountPercent?: number;
  contractRebatePercent?: number;
  bundleDiscountPercent?: number;
}

export function calculateQuoteLineMargin(
  line: QuoteLine,
  product?: ExternalProduct,
  threshold: number = 15
) {
  const unitCost = product?.costPrice ?? line.costPrice;
  const isCostKnown = typeof unitCost === 'number' && Number.isFinite(unitCost) && unitCost > 0;
  const revenue = Number.isFinite(line.lineTotal) ? line.lineTotal : (line.unitPrice * line.quantity);
  if (!isCostKnown || !Number.isFinite(revenue) || revenue <= 0 || !Number.isFinite(line.quantity) || line.quantity <= 0) {
    return { marginPercent: 0, marginAmount: 0, isBelowThreshold: true, isCostKnown: false };
  }
  const cost = unitCost * line.quantity;
  const profit = revenue - cost;
  const marginPercent = Math.round((profit / revenue) * 1000) / 10;

  return {
    marginPercent,
    marginAmount: profit,
    isBelowThreshold: marginPercent < threshold,
    isCostKnown: true
  };
}

export function calculatePriceWaterfall({
  basePrice = 0,
  quantity = 1,
  costPrice,
  negotiatedUnitPrice,
  appliedVolumeDiscountPercent = 0,
  contractRebatePercent = 0,
  bundleDiscountPercent = 0
}: PriceWaterfallParams): PriceWaterfallBreakdown {
  const totalBasePrice = (basePrice || 0) * quantity;
  const volumeDiscount = Math.round((totalBasePrice * (appliedVolumeDiscountPercent || 0)) / 100);
  const bundleDiscount = Math.round((totalBasePrice * (bundleDiscountPercent || 0)) / 100);
  const contractRebate = Math.round((totalBasePrice * (contractRebatePercent || 0)) / 100);

  const subtotalBeforeNegotiated = totalBasePrice - volumeDiscount - bundleDiscount - contractRebate;
  const targetNetPrice = negotiatedUnitPrice !== undefined 
    ? negotiatedUnitPrice * quantity 
    : subtotalBeforeNegotiated;

  const negotiatedDiscount = Math.max(0, subtotalBeforeNegotiated - targetNetPrice);
  const netPrice = targetNetPrice;
  const costKnown = typeof costPrice === 'number' && Number.isFinite(costPrice) && costPrice > 0;
  const totalCost = costKnown ? costPrice * quantity : 0;
  const grossMarginAmount = costKnown ? netPrice - totalCost : null;
  const grossMarginPercent = costKnown && netPrice > 0 ? Math.round((grossMarginAmount! / netPrice) * 1000) / 10 : null;

  return {
    basePrice: totalBasePrice,
    volumeDiscount,
    bundleDiscount,
    contractRebate,
    negotiatedDiscount,
    netPrice,
    costPrice: totalCost,
    grossMarginAmount,
    grossMarginPercent,
    costKnown
  };
}

/**
 * قفل ویرایش اقلام پیش‌فاکتور: پس از ثبت Price Snapshot (HANDOFF) یا خروج از وضعیت DRAFT،
 * قیمت و اقلام تاریخی نباید تغییر کنند (قابل‌بازسازی بودن شرایط). منبع واحد این قاعده همین تابع است.
 */
export function canEditQuoteLines(quote: { status?: string; pricingSnapshot?: unknown } | null | undefined): { ok: boolean; reason?: string } {
  if (!quote) return { ok: false, reason: 'پیش‌فاکتور یافت نشد.' };
  if (quote.pricingSnapshot) return { ok: false, reason: 'این پیش‌فاکتور Price Snapshot دارد و اقلام آن قفل است.' };
  if (quote.status && quote.status !== 'DRAFT') return { ok: false, reason: 'فقط پیش‌فاکتور در وضعیت پیش‌نویس قابل ویرایش اقلام است.' };
  return { ok: true };
}
