export const COLLECTION_EVIDENCE_MAX_BYTES = 5 * 1024 * 1024;
export const COLLECTION_EVIDENCE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
export interface EvidenceFileLike { name: string; type: string; size: number }
export function validateCollectionEvidenceFile(file: EvidenceFileLike): { valid: boolean; error?: string } {
  if (!COLLECTION_EVIDENCE_MIME_TYPES.has(file.type)) return { valid: false, error: 'فقط تصویر JPEG/PNG/WebP یا فایل PDF به‌عنوان مدرک مجاز است.' };
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > COLLECTION_EVIDENCE_MAX_BYTES) return { valid: false, error: 'حجم مدرک باید بیشتر از صفر و حداکثر ۵ مگابایت باشد.' };
  return { valid: true };
}
