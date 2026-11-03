import type { GeoMetricDefinition, GeoMetricKey, GeoPoint, GeoPolygonGeometry, ZoneGeometryVersion } from '../types';

/** Canonical metric catalog. Availability stays false until a verified source/aggregation is wired. */
export const GEO_METRIC_CATALOG: Record<GeoMetricKey, GeoMetricDefinition> = {
  OUTSTANDING_RECEIVABLES: { key: 'OUTSTANDING_RECEIVABLES', label: 'مانده مطالبات', unit: 'IRR', sourceDescription: 'فاکتور معتبر منهای تخصیص‌های معتبر پرداخت و بستانکاری تا تاریخ انتخابی', aggregation: 'SUM(valid invoice outstanding balances)', higherIsBetter: false, requiresDateRange: false, available: false, limitation: 'باید به منبع واحد مانده و PaymentAllocation متصل شود.' },
  SALES: { key: 'SALES', label: 'فروش', unit: 'IRR', sourceDescription: 'اسناد فروش معتبر در بازه؛ نه پیش‌فاکتور و نه سفارش', aggregation: 'SUM(valid sales invoice totals)', higherIsBetter: true, requiresDateRange: true, available: false, limitation: 'قرارداد اسناد معتبر فروش و برگشت باید نهایی شود.' },
  RETURNS: { key: 'RETURNS', label: 'برگشتی', unit: 'IRR', sourceDescription: 'سند برگشت معتبر؛ مبلغ یا تعداد باید در گزارش انتخاب شود', aggregation: 'SUM(valid return document totals)', higherIsBetter: false, requiresDateRange: true, available: false, limitation: 'نوع سنجه (مبلغ/تعداد) باید در UI مشخص شود.' },
  INVOICE_COUNT: { key: 'INVOICE_COUNT', label: 'تعداد فاکتور', unit: 'invoice', sourceDescription: 'تعداد فاکتورهای معتبر؛ سفارش‌ها شمرده نمی‌شوند', aggregation: 'COUNT(valid invoices)', higherIsBetter: true, requiresDateRange: true, available: false, limitation: 'منبع نهایی اسناد فروش باید متصل شود.' },
  CUSTOMER_DENSITY: { key: 'CUSTOMER_DENSITY', label: 'تراکم مشتری', unit: 'customer', sourceDescription: 'تعداد مشتریان یکتای دارای مختصات معتبر داخل مرز زون', aggregation: 'COUNT(DISTINCT customerId within polygon)', higherIsBetter: null, requiresDateRange: false, available: false, limitation: 'مختصات مشتریان باید اعتبارسنجی شوند.' },
  CASH_COLLECTED: { key: 'CASH_COLLECTED', label: 'وصول نقدی', unit: 'IRR', sourceDescription: 'پرداخت معتبر ثبت‌شده؛ با تخصیص پرداخت به فاکتور اشتباه نشود', aggregation: 'SUM(valid collected payments)', higherIsBetter: true, requiresDateRange: true, available: false, limitation: 'منبع پرداخت واقعی و وضعیت نهایی وصول باید تعریف شود.' },
  SALESPERSON_PERFORMANCE: { key: 'SALESPERSON_PERFORMANCE', label: 'عملکرد فروشنده', unit: 'configured metric', sourceDescription: 'باید یک سنجه صریح مانند فروش، وصول، پوشش مشتری یا تحقق هدف انتخاب شود', aggregation: 'Configured metric; never an opaque composite score', higherIsBetter: null, requiresDateRange: true, available: false, limitation: 'بدون انتخاب سنجهٔ دقیق، عملکرد تجمیعی نمایش داده نمی‌شود.' },
  OUT_OF_ZONE_DISTRIBUTION: { key: 'OUT_OF_ZONE_DISTRIBUTION', label: 'توزیع خارج از زون', unit: 'invoice/delivery', sourceDescription: 'سند تحویل/فاکتور معتبر با نقطهٔ تحویل خارج از هندسهٔ معتبر زون', aggregation: 'COUNT(valid deliveries outside active zone polygon)', higherIsBetter: false, requiresDateRange: true, available: false, limitation: 'به مختصات تحویل، هندسهٔ معتبر و سند واقعی تحویل نیاز دارد.' },
};

export interface PolygonValidation { valid: boolean; errors: string[]; vertexCount: number; }
const samePoint = (a: number[], b: number[]) => a[0] === b[0] && a[1] === b[1];

/** Validates GeoJSON lon/lat polygon ring; at least three distinct vertices and closed ring required. */
export function validateZonePolygon(geometry: GeoPolygonGeometry): PolygonValidation {
  const errors: string[] = [];
  if (!geometry || geometry.type !== 'Polygon' || !Array.isArray(geometry.coordinates) || !Array.isArray(geometry.coordinates[0])) {
    return { valid: false, errors: ['ساختار هندسه باید GeoJSON Polygon با حلقهٔ بیرونی باشد.'], vertexCount: 0 };
  }
  const ring = geometry.coordinates[0];
  if (ring.some(point => !Array.isArray(point) || point.length < 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1]))) errors.push('همهٔ نقاط باید مختصات عددی طول و عرض جغرافیایی داشته باشند.');
  if (ring.some(point => Array.isArray(point) && (point[0] < -180 || point[0] > 180 || point[1] < -90 || point[1] > 90))) errors.push('مختصات خارج از محدودهٔ مجاز طول/عرض جغرافیایی است.');
  const closed = ring.length > 1 && samePoint(ring[0], ring[ring.length - 1]);
  if (!closed) errors.push('حلقهٔ چندضلعی باید با تکرار نقطهٔ اول بسته شود.');
  const openRing = closed ? ring.slice(0, -1) : ring;
  const distinct = new Set(openRing.map(point => `${point[0]},${point[1]}`));
  if (distinct.size < 3) errors.push('زون باید دست‌کم سه رأس متمایز داشته باشد.');
  const vertexCount = distinct.size;
  return { valid: errors.length === 0, errors, vertexCount };
}

function pointOnSegment(p: GeoPoint, a: number[], b: number[], epsilon = 1e-9): boolean {
  const cross = (p.latitude - a[1]) * (b[0] - a[0]) - (p.longitude - a[0]) * (b[1] - a[1]);
  if (Math.abs(cross) > epsilon) return false;
  const dot = (p.longitude - a[0]) * (b[0] - a[0]) + (p.latitude - a[1]) * (b[1] - a[1]);
  if (dot < -epsilon) return false;
  const lenSq = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
  return dot <= lenSq + epsilon;
}

/** Point-in-polygon; boundary points count as inside. Input is GeoJSON longitude/latitude order. */
export function isPointInsideZone(point: GeoPoint, geometry: GeoPolygonGeometry): boolean {
  if (!validateZonePolygon(geometry).valid || !Number.isFinite(point.longitude) || !Number.isFinite(point.latitude)) return false;
  const ring = geometry.coordinates[0];
  let inside = false;
  for (let i = 0, j = ring.length - 2; i < ring.length - 1; j = i++) {
    const a = ring[j], b = ring[i];
    if (pointOnSegment(point, a, b)) return true;
    const intersects = ((b[1] > point.latitude) !== (a[1] > point.latitude)) &&
      (point.longitude < ((a[0] - b[0]) * (point.latitude - b[1])) / (a[1] - b[1]) + b[0]);
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Creates a version record without overwriting prior geometry; caller must persist/audit it. */
export function createZoneGeometryVersion(input: Omit<ZoneGeometryVersion, 'version'>, previousVersions: ZoneGeometryVersion[]): ZoneGeometryVersion {
  const validation = validateZonePolygon(input.geometry);
  if (!validation.valid) throw new Error(`هندسهٔ زون نامعتبر است: ${validation.errors.join(' ')}`);
  const previous = previousVersions.filter(item => item.zoneId === input.zoneId);
  if (previous.some(item => !item.effectiveTo)) throw new Error('پیش از ثبت نسخهٔ جدید، نسخهٔ فعال قبلی باید با effectiveTo بسته شود.');
  return { ...input, version: previous.reduce((max, item) => Math.max(max, item.version), 0) + 1 };
}

export function getAvailableGeoMetrics(): GeoMetricDefinition[] {
  return Object.values(GEO_METRIC_CATALOG).filter(metric => metric.available);
}
