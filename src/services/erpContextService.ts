import { OPERATIONS_CONFIG } from '../config/operations.ts';
export interface ErpContextRequest { tenantId: string; sourceSystemCode: string; entityType: string; entityId: string; contextKind: string; }
export interface ErpContextResult<T = unknown> { data: T; fetchedAt: string; expiresAt: string; source: string; stale: boolean; }
export type ErpContextFetcher<T = unknown> = (request: ErpContextRequest, signal?: AbortSignal) => Promise<T>;

/** On-demand adapter contract with bounded TTL cache. No live ERP endpoint is assumed or embedded. */
export class ErpContextService {
  private cache = new Map<string, { data: unknown; fetchedAt: number; expiresAt: number }>();
  private readonly fetcher?: ErpContextFetcher;
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  constructor(fetcher?: ErpContextFetcher, ttlMs = OPERATIONS_CONFIG.mentionCacheTtlMs, maxEntries = 500) { this.fetcher = fetcher; this.ttlMs = ttlMs; this.maxEntries = maxEntries; }
  private key(r: ErpContextRequest): string { return [r.tenantId,r.sourceSystemCode,r.entityType,r.entityId,r.contextKind].join('|'); }
  async get<T = unknown>(request: ErpContextRequest, options: { forceRefresh?: boolean; allowStaleOnError?: boolean; signal?: AbortSignal } = {}): Promise<ErpContextResult<T>> {
    if (!request.tenantId || !request.sourceSystemCode || !request.entityType || !request.entityId || !request.contextKind) throw new Error('پارامترهای استعلام کانتکست ناقص است.');
    const key = this.key(request); const now = Date.now(); const cached = this.cache.get(key);
    if (!options.forceRefresh && cached && cached.expiresAt > now) return this.result<T>(cached, false);
    if (!this.fetcher) {
      if (cached && options.allowStaleOnError) return this.result<T>(cached, true);
      throw new Error('آداپتور ERP پیکربندی نشده است؛ داده زنده قابل تأیید نیست.');
    }
    try {
      const data = await this.fetcher(request, options.signal);
      const entry = { data, fetchedAt: Date.now(), expiresAt: Date.now() + this.ttlMs };
      this.cache.delete(key); this.cache.set(key, entry);
      while (this.cache.size > this.maxEntries) this.cache.delete(this.cache.keys().next().value as string);
      return this.result<T>(entry, false);
    } catch (error) {
      if (cached && options.allowStaleOnError) return this.result<T>(cached, true);
      throw error;
    }
  }
  invalidate(request?: ErpContextRequest): void { if (!request) this.cache.clear(); else this.cache.delete(this.key(request)); }
  private result<T>(entry: { data: unknown; fetchedAt: number; expiresAt: number }, stale: boolean): ErpContextResult<T> {
    return { data: entry.data as T, fetchedAt: new Date(entry.fetchedAt).toISOString(), expiresAt: new Date(entry.expiresAt).toISOString(), source: 'ERP_ADAPTER', stale };
  }
}
