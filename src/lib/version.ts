/** نسخه محصول (منبع واحد؛ با package.json و VERSION.md هم‌خوان نگه داشته شود). */
export const APP_VERSION = '0.12.30';
export const APP_RELEASE = { round: 12, checkpoint: 10, label: 'r12-cp10-b54-transactional-account-outbox', base: 'r11-cp9-b53-source-surface-audit' } as const;
export const APP_VERSION_LABEL = `AKHAVAN CRM v${APP_VERSION} · ${APP_RELEASE.label}`;
