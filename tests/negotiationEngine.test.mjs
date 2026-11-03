import assert from 'node:assert/strict';
const { generateQuoteNegotiationScenarios } = await import('../src/lib/negotiationEngine.ts');
let n = 0;
const eq = (a, b, m) => { assert.equal(a, b, m); n++; };
const stateBase = () => ({
  accounts: [{ id: 'a1', balance: 100, creditLimit: 1000 }],
  externalProducts: [{ id: 'p1', name: 'کالای آزمون', basePrice: 100, costPrice: 50 }],
  volumeTiers: [], contracts: []
});
const quoteBase = () => ({
  id: 'q1', quoteNumber: 'QT-1001', accountId: 'a1', status: 'DRAFT', totalAmount: 500,
  marginPercent: 50, createdAt: '2026-10-25T00:00:00.000Z',
  lines: [{ id: 'l1', productId: 'p1', quantity: 5, unitPrice: 100, costPrice: 50, lineTotal: 500 }]
});
let state = stateBase(); let quote = quoteBase();
let scenarios = generateQuoteNegotiationScenarios(quote, state);
eq(scenarios.length, 1, 'بدون پلهٔ حجمی فقط حفظ سفارش پیشنهاد می‌شود');
eq(scenarios[0].type, 'KEEP', 'سناریوی پایه حفظ سفارش است');
eq(scenarios[0].proposedProfit, 250, 'سود سفارش با بهای معتبر محاسبه می‌شود');
state.externalProducts[0].costPrice = 90;
eq(generateQuoteNegotiationScenarios(quote, state)[0].proposedProfit, 250, 'بهای جاری کاتالوگ بهای تاریخی ثبت‌شده در Quote را بازنویسی نمی‌کند');
state.externalProducts[0].costPrice = 50;
eq(scenarios[0].creditRisk, 'LOW', 'ریسک بر اساس مواجهه و سقف اعتبار محاسبه می‌شود');
state.volumeTiers = [{ productId: 'p1', minQuantity: 10, discountPercent: 5 }];
scenarios = generateQuoteNegotiationScenarios(quote, state);
eq(scenarios.length, 2, 'پلهٔ واقعی یک سناریوی افزایش می‌سازد');
eq(scenarios[1].proposedQuantity, 10, 'مقدار از پلهٔ تعریف‌شده می‌آید نه درصد ثابت');
eq(scenarios[1].proposedAmount, 950, 'قیمت پیشنهادی از CPQ محاسبه می‌شود');
eq(scenarios[1].creditRisk, 'CRITICAL', 'سناریوی عبوری از سقف اعتبار بحرانی است');
state.accounts[0].creditLimit = undefined;
eq(generateQuoteNegotiationScenarios(quote, state)[0].creditRisk, 'UNKNOWN', 'بدون سقف اعتبار واقعی ریسک نامشخص است');
state.accounts[0].creditLimit = 1000;
state.externalProducts[0].costPrice = 0;
quote.lines[0].costPrice = 0;
const unknownCost = generateQuoteNegotiationScenarios(quote, state)[0];
eq(unknownCost.proposedProfit, null, 'بهای نامعتبر/ناموجود سود ساختگی تولید نمی‌کند');
eq(unknownCost.profitCompleteness, 'UNKNOWN', 'کامل‌بودن سود صریح است');
state.volumeTiers = [{ productId: 'p1', minQuantity: 10, discountPercent: 150 }];
eq(generateQuoteNegotiationScenarios(quote, state).length, 1, 'تخفیف نامعتبر بیش از ۱۰۰٪ نادیده گرفته می‌شود');
const { calculatePriceWaterfall } = await import('../src/lib/cpqEngine.ts');
const noCostWaterfall = calculatePriceWaterfall({ basePrice: 100, quantity: 2 });
eq(noCostWaterfall.costKnown, false, 'CPQ هزینهٔ نامشخص را سود ۱۰۰٪ اعلام نمی‌کند');
eq(noCostWaterfall.grossMarginPercent, null, 'در نبود بهای معتبر حاشیه سود null است');
const knownCostWaterfall = calculatePriceWaterfall({ basePrice: 100, quantity: 2, costPrice: 60 });
eq(knownCostWaterfall.costKnown, true, 'CPQ بهای معتبر را تشخیص می‌دهد');
eq(knownCostWaterfall.grossMarginPercent, 40, 'حاشیه سود با بهای معتبر محاسبه می‌شود');

console.log(`PASS: ${n} assertions (negotiation engine + CPQ cost completeness)`);
