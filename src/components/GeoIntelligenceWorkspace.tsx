import React, { useMemo, useState } from 'react';
import { AppState, GeoPoint, GeoPolygonGeometry, GeoZone, ZoneGeometryVersion, Priority } from '../types';
import { GEO_METRIC_CATALOG, createZoneGeometryVersion, isPointInsideZone, validateZonePolygon } from '../lib/geoIntelligence';
import { generateId } from '../lib/utils';
import { processTaskCollaborationEvents } from '../lib/collaboration';
import { COLLECTION_OUTCOME_OPTIONS, validateCollectionTaskOutcome } from '../lib/collectionTaskOutcome';
import { validateCollectionEvidenceFile } from '../lib/collectionTaskEvidence';
import { buildGeoCollectionReport, collectionReportToCsv, collectionReportDetailsToCsv, filterCollectionTasksByPeriod } from '../lib/geoCollectionReporting';
import { reconcileReceivables } from '../lib/receivableReconciliation';
import { useCan } from '../hooks/useCan';
import { GeoZoneMapEditor } from './GeoZoneMapEditor';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { DataSourceStatus } from './ui/DataSourceStatus';
import { MapPinned, Plus, Save, ShieldAlert, Layers3, Users, Clock3, Archive, CheckCircle2, AlertTriangle, Paperclip, Download } from 'lucide-react';

interface Props { state: AppState; updateState: (updater: (draft: AppState) => AppState | void) => void; }
type Mode = 'zones' | 'heatmap' | 'operations';

const readCustomerPoint = (customer: any): GeoPoint | null => {
  const longitude = Number(customer.longitude ?? customer.lng ?? customer.locationLongitude ?? customer.coordinates?.longitude);
  const latitude = Number(customer.latitude ?? customer.lat ?? customer.locationLatitude ?? customer.coordinates?.latitude);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) return null;
  return { longitude, latitude };
};
const parseCoordinates = (text: string): GeoPolygonGeometry => {
  const points = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map((line, index) => {
    const parts = line.split(/[;,\s]+/).filter(Boolean);
    if (parts.length !== 2) throw new Error(`خط ${index + 1}: هر ردیف باید طول و عرض جغرافیایی داشته باشد.`);
    const lon = Number(parts[0]); const lat = Number(parts[1]);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) throw new Error(`خط ${index + 1}: مختصات عددی نیست.`);
    return [lon, lat];
  });
  if (points.length < 3) throw new Error('برای تعریف زون حداقل سه رأس لازم است.');
  const first = points[0]; const last = points[points.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) points.push([...first]);
  return { type: 'Polygon', coordinates: [points] };
};
const coordinatesToText = (geometry?: GeoPolygonGeometry) => geometry?.coordinates?.[0]?.slice(0, -1).map(point => `${point[0]}, ${point[1]}`).join('\n') || '';

function PolygonGeometryPreview({ geometry }: { geometry: GeoPolygonGeometry }) {
  const ring = geometry.coordinates[0].slice(0, -1);
  if (ring.length < 3) return null;
  const xs = ring.map(point => point[0]); const ys = ring.map(point => point[1]);
  const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys);
  const width = Math.max(maxX - minX, 0.000001); const height = Math.max(maxY - minY, 0.000001);
  const points = ring.map(point => `${24 + ((point[0] - minX) / width) * 272},${144 - ((point[1] - minY) / height) * 112}`).join(' ');
  return <div className="rounded-2xl border border-border bg-canvas p-3"><div className="mb-2 text-xs font-bold text-text-secondary">پیش‌نمایش شکل هندسه (بدون نقشهٔ پس‌زمینه)</div><svg viewBox="0 0 320 168" role="img" aria-label="پیش‌نمایش چندضلعی زون" className="h-36 w-full"><defs><pattern id="geo-grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M 16 0 L 0 0 0 16" fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" /></pattern></defs><rect width="320" height="168" rx="12" fill="url(#geo-grid)"/><polygon points={points} fill="var(--color-primary, #315EAA)" fillOpacity="0.14" stroke="var(--color-primary, #315EAA)" strokeWidth="2.5" strokeLinejoin="round"/>{ring.map((point,index)=><circle key={`${point[0]}-${point[1]}-${index}`} cx={24 + ((point[0] - minX) / width) * 272} cy={144 - ((point[1] - minY) / height) * 112} r="3.5" fill="var(--c-accent, #FFC72C)" stroke="white" strokeWidth="1.2"/> )}</svg><p className="mt-1 text-[10px] leading-5 text-text-secondary">این پیش‌نمایش فقط شکل چندضلعی را نشان می‌دهد؛ جایگزین نقشهٔ ایران یا مبنای مکانیابی نیست.</p></div>;
}

export function GeoIntelligenceWorkspace({ state, updateState }: Props) {
  const { rbac, can, canOn, denied } = useCan(state, updateState);
  const canEdit = can('geo', 'EDIT');
  const [mode, setMode] = useState<Mode>('zones');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [zoneName, setZoneName] = useState('');
  const [zoneCode, setZoneCode] = useState('');
  const [coordinateText, setCoordinateText] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'ok' | 'error' | 'info'; text: string } | null>(null);
  const [metricKey, setMetricKey] = useState<keyof typeof GEO_METRIC_CATALOG>('OUTSTANDING_RECEIVABLES');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [taskCustomerId, setTaskCustomerId] = useState('');
  const [bulkCustomerIds, setBulkCustomerIds] = useState<string[]>([]);
  const [taskAssigneeId, setTaskAssigneeId] = useState(state.currentUserId || '');
  const [taskWatcherId, setTaskWatcherId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('HIGH');
  const [outcomeTaskId, setOutcomeTaskId] = useState('');
  const [outcomeCode, setOutcomeCode] = useState('');
  const [outcomePaymentId, setOutcomePaymentId] = useState('');
  const [outcomeReason, setOutcomeReason] = useState('');
  const [outcomeFollowUpDate, setOutcomeFollowUpDate] = useState('');
  const [outcomeNote, setOutcomeNote] = useState('');
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  // Reuse the canonical customer-record scope; a geo permission must not widen customer visibility.
  const visibleCustomers = (state.customers || []).filter(customer => rbac.canActOnRecord('accounts', 'VIEW', { ownerId: customer.ownerId, branchId: customer.branchId, territoryId: customer.territoryId, teamId: customer.teamId, tenantId: customer.tenantId, deletedAt: customer.deletedAt, isDeleted: customer.isDeleted }));
  const visibleCustomerIdSet = new Set(visibleCustomers.map(customer => customer.id));
  const zones = state.geoZones || [];
  const versions = state.zoneGeometryVersions || [];
  const assignments = state.zoneAssignments || [];
  const selectedZone = zones.find(zone => zone.id === selectedZoneId) || null;
  const activeGeometry = selectedZone ? versions.find(version => version.id === selectedZone.currentGeometryVersionId) || versions.filter(version => version.zoneId === selectedZone.id && !version.effectiveTo).sort((a,b) => b.version-a.version)[0] : undefined;
  const parsedGeometry = useMemo(() => {
    if (!coordinateText.trim()) return null;
    try { const geometry = parseCoordinates(coordinateText); const validation = validateZonePolygon(geometry); return validation.valid ? { geometry, error: '' } : { geometry, error: validation.errors.join(' ') }; }
    catch (error) { return { geometry: null, error: error instanceof Error ? error.message : 'مختصات نامعتبر است.' }; }
  }, [coordinateText]);
  const customersInside = useMemo(() => {
    if (!activeGeometry) return [];
    return visibleCustomers.filter(customer => { const point = readCustomerPoint(customer); return point ? isPointInsideZone(point, activeGeometry.geometry) : false; });
  }, [visibleCustomers, activeGeometry]);
  const activeMetric = GEO_METRIC_CATALOG[metricKey];
  const selectedZoneAssignments = assignments.filter(item => item.zoneId === selectedZoneId && item.entityType === 'CUSTOMER' && visibleCustomerIdSet.has(item.entityId) && !item.effectiveTo);
  const actor = state.users?.find(user => user.id === state.currentUserId)?.name || 'کاربر فعال';

  const recordAudit = (draft: AppState, action: string, entityId: string, details: string) => {
    if (!draft.auditLogs) draft.auditLogs = [];
    draft.auditLogs.push({ id: generateId(), action, entityType: 'GEO_ZONE', entityId, details, actor, createdAt: new Date().toISOString() } as any);
  };
  const selectZone = (zone: GeoZone) => {
    setSelectedZoneId(zone.id); setZoneName(zone.name); setZoneCode(zone.code);
    const current = versions.find(version => version.id === zone.currentGeometryVersionId) || versions.filter(version => version.zoneId === zone.id && !version.effectiveTo).sort((a,b) => b.version-a.version)[0];
    setCoordinateText(coordinatesToText(current?.geometry)); setChangeReason(''); setStatusMessage(null);
  };
  const saveZone = () => {
    if (!canEdit) { denied('مدیریت زون‌های مکانی'); return; }
    if (!zoneName.trim() || !zoneCode.trim()) { setStatusMessage({ type: 'error', text: 'نام و کد زون الزامی است.' }); return; }
    if (!parsedGeometry?.geometry || parsedGeometry.error) { setStatusMessage({ type: 'error', text: parsedGeometry?.error || 'مختصات زون را وارد کنید.' }); return; }
    const now = new Date().toISOString();
    const existing = zones.find(zone => zone.id === selectedZoneId);
    if (!existing && zones.some(zone => zone.code.trim().toLowerCase() === zoneCode.trim().toLowerCase())) { setStatusMessage({ type: 'error', text: 'کد زون باید یکتا باشد.' }); return; }
    const zoneId = existing?.id || generateId();
    try {
      const prior = versions.filter(version => version.zoneId === zoneId);
      const current = prior.find(version => !version.effectiveTo);
      const nextVersions = current ? prior.map(version => version.id === current.id ? { ...version, effectiveTo: now } : version) : prior;
      const version = createZoneGeometryVersion({ id: generateId(), zoneId, geometry: parsedGeometry.geometry, effectiveFrom: now, createdBy: state.currentUserId || '', createdAt: now, changeReason: changeReason.trim() || (existing ? 'ویرایش مرز زون' : 'ایجاد زون') }, nextVersions);
      updateState(draft => {
        if (!draft.geoZones) draft.geoZones = [];
        if (!draft.zoneGeometryVersions) draft.zoneGeometryVersions = [];
        const oldZone = draft.geoZones.find(zone => zone.id === zoneId);
        if (oldZone) Object.assign(oldZone, { name: zoneName.trim(), code: zoneCode.trim(), updatedAt: now, currentGeometryVersionId: version.id, status: oldZone.status === 'ARCHIVED' ? 'DRAFT' : oldZone.status });
        else draft.geoZones.push({ id: zoneId, code: zoneCode.trim(), name: zoneName.trim(), status: 'DRAFT', createdAt: now, updatedAt: now, currentGeometryVersionId: version.id, ownerId: draft.currentUserId } as GeoZone);
        // Preserve prior geometry versions while closing the previous active one.
        draft.zoneGeometryVersions = (draft.zoneGeometryVersions || []).map(item => item.zoneId === zoneId && !item.effectiveTo ? { ...item, effectiveTo: now } : item);
        draft.zoneGeometryVersions.push(version);
        recordAudit(draft, existing ? 'GEO_ZONE_GEOMETRY_VERSION_CREATED' : 'GEO_ZONE_CREATED', zoneId, `زون «${zoneName.trim()}»؛ نسخه هندسه ${version.version} ذخیره شد.`);
      });
      setSelectedZoneId(zoneId); setStatusMessage({ type: 'ok', text: `نسخه ${version.version} هندسه ذخیره شد. مرز قبلی حذف نشده است.` });
    } catch (error) { setStatusMessage({ type: 'error', text: error instanceof Error ? error.message : 'ذخیره زون ناموفق بود.' }); }
  };
  const changeZoneStatus = (zone: GeoZone, status: GeoZone['status']) => {
    if (!canEdit) { denied('تغییر وضعیت زون'); return; }
    updateState(draft => {
      const target = draft.geoZones?.find(item => item.id === zone.id); if (!target) return;
      target.status = status; target.updatedAt = new Date().toISOString();
      recordAudit(draft, 'GEO_ZONE_STATUS_CHANGED', zone.id, `وضعیت زون «${target.name}» به ${status} تغییر کرد.`);
    });
    setStatusMessage({ type: 'ok', text: `وضعیت زون به ${status === 'ACTIVE' ? 'فعال' : status === 'ARCHIVED' ? 'بایگانی' : 'پیش‌نویس'} تغییر کرد.` });
  };
  const zoneCollectionTasks = (state.tasks || []).filter(task => task.source === 'GEO_ZONE' && task.taskType === 'COLLECTION' && task.zoneId === selectedZoneId && visibleCustomerIdSet.has(String(task.customerId || task.accountId || '')) && rbac.canActOnRecord('tasks', 'VIEW', { ownerId: task.assigneeId, branchId: (task as any).branchId, territoryId: (task as any).territoryId, teamId: (task as any).teamId, tenantId: (task as any).tenantId, deletedAt: (task as any).deletedAt, isDeleted: (task as any).isDeleted }));
  const reportTasks = useMemo(() => filterCollectionTasksByPeriod(zoneCollectionTasks as any, reportDateFrom, reportDateTo), [zoneCollectionTasks, reportDateFrom, reportDateTo]);
  const collectionReport = buildGeoCollectionReport(reportTasks as any, state.payments || [], (state.users || []).map(user => ({ id: user.id, name: user.name })), new Date(), visibleCustomers.map(customer => ({ id: customer.id, name: customer.name })));
  const zoneCustomerIds = new Set(customersInside.map(customer => customer.id));
  const zoneInvoices = (state.invoices || []).filter(invoice => zoneCustomerIds.has(String(invoice.customerId || invoice.accountId || '')));
  const zoneInvoiceIds = new Set(zoneInvoices.map(invoice => invoice.id));
  const zonePayments = (state.payments || []).filter(payment => zoneCustomerIds.has(String(payment.customerId || payment.accountId || '')));
  const zonePaymentIds = new Set(zonePayments.map(payment => payment.id));
  const zoneAllocations = (state.paymentAllocations || []).filter(allocation => zoneInvoiceIds.has(allocation.invoiceId) || zonePaymentIds.has(allocation.paymentId));
  const zoneCredits = (state.creditNotes || []).filter(note => zoneCustomerIds.has(String(note.customerId || note.accountId || '')) && zoneInvoiceIds.has(String(note.invoiceId || '')));
  const zoneReceivableReconciliation = reconcileReceivables(zoneInvoices, zonePayments, zoneAllocations, state.creditNoteSourceStatus !== 'CONNECTED' ? undefined : zoneCredits, new Date());
  const priorityByCustomer = new Map(zoneReceivableReconciliation.priorities.map(row => [row.customerId, row]));
  const prioritizedCustomersInside = [...customersInside].sort((a,b) => (priorityByCustomer.get(a.id)?.rank ?? Number.MAX_SAFE_INTEGER) - (priorityByCustomer.get(b.id)?.rank ?? Number.MAX_SAFE_INTEGER));
  const resolvedCollectionPriority = (customerId: string): Priority => { if (!zoneReceivableReconciliation.authoritative) return taskPriority; const row = priorityByCustomer.get(customerId); if (!row) return 'NORMAL'; const total = Math.max(1, zoneReceivableReconciliation.priorities.length); if (row.rank === 1) return 'URGENT'; if (row.rank <= Math.max(2, Math.ceil(total * 0.25))) return 'HIGH'; return 'NORMAL'; };
  const downloadCollectionCsv = (content: string, suffix: string) => {
    if (!selectedZone || !can('geo', 'VIEW')) { denied('خروجی گزارش وصول زون'); return; }
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `akhavan-collection-${selectedZone.code || selectedZone.id}-${suffix}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };
  const exportCollectionReport = () => downloadCollectionCsv(collectionReportToCsv(collectionReport), 'summary');
  const exportCollectionDetails = () => downloadCollectionCsv(collectionReportDetailsToCsv(collectionReport), 'details');
  const selectedOutcomeTask = zoneCollectionTasks.find(task => task.id === outcomeTaskId) || null;
  const selectedOutcomeCustomerId = selectedOutcomeTask ? String(selectedOutcomeTask.customerId || selectedOutcomeTask.accountId || '') : '';
  const availablePayments = (state.payments || []).filter(payment => String(payment.customerId || payment.accountId || '') === selectedOutcomeCustomerId && payment.status === 'CLEARED' && Number.isFinite(payment.amount) && payment.amount > 0);
  const taskEvidence = (taskId: string) => (state.attachments || []).filter(file => file.entityId === taskId && file.entityType === 'TASK');
  const uploadCollectionEvidence = (file?: File) => {
    if (!file || !selectedOutcomeTask) return;
    if (!canOnTask(selectedOutcomeTask)) { denied('پیوست مدرک وظیفه وصول'); setStatusMessage({ type: 'error', text: 'برای پیوست مدرک، مجوز و محدودهٔ دسترسی لازم است.' }); return; }
    const validation = validateCollectionEvidenceFile(file);
    if (!validation.valid) { setStatusMessage({ type: 'error', text: validation.error || 'فایل مدرک معتبر نیست.' }); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const data = typeof reader.result === 'string' ? reader.result : '';
      if (!data.startsWith('data:')) { setStatusMessage({ type: 'error', text: 'خواندن فایل مدرک ناموفق بود.' }); return; }
      const now = new Date().toISOString();
      updateState(draft => {
        if (!draft.attachments) draft.attachments = [];
        draft.attachments.push({ id: generateId(), entityId: selectedOutcomeTask.id, entityType: 'TASK', kind: 'COLLECTION_EVIDENCE', fileName: file.name, fileType: file.type, fileSize: file.size, base64Data: data, uploadedAt: now, uploadedBy: draft.currentUserId || '' } as any);
        if (!draft.auditLogs) draft.auditLogs = [];
        draft.auditLogs.push({ id: generateId(), action: 'GEO_COLLECTION_EVIDENCE_ATTACHED', entityType: 'TASK', entityId: selectedOutcomeTask.id, details: `مدرک وظیفه وصول پیوست شد: ${file.name} (${file.size} bytes).`, actor, createdAt: now } as any);
      });
      setStatusMessage({ type: 'ok', text: 'مدرک به همین وظیفه پیوست شد و رویداد ممیزی ثبت شد.' });
    };
    reader.onerror = () => setStatusMessage({ type: 'error', text: 'خواندن فایل مدرک ناموفق بود.' });
    reader.readAsDataURL(file);
  };
  const downloadEvidence = (file: any) => {
    if (!selectedOutcomeTask || !canOnTask(selectedOutcomeTask) || file.entityId !== selectedOutcomeTask.id || file.entityType !== 'TASK') { denied('دریافت مدرک وظیفه وصول'); return; }
    const link = document.createElement('a'); link.href = file.base64Data; link.download = file.fileName; document.body.appendChild(link); link.click(); link.remove();
  };
  const saveCollectionOutcome = () => {
    if (!selectedOutcomeTask) { setStatusMessage({ type: 'error', text: 'وظیفهٔ وصول معتبر انتخاب نشده است.' }); return; }
    if (!canOnTask(selectedOutcomeTask)) { denied('ثبت نتیجهٔ وظیفه وصول'); setStatusMessage({ type: 'error', text: 'برای ثبت نتیجهٔ این وظیفه مجوز و دسترسی لازم را ندارید.' }); return; }
    const validation = validateCollectionTaskOutcome(selectedOutcomeTask, { outcome: outcomeCode, paymentId: outcomePaymentId || undefined, failureReason: outcomeReason, followUpDate: outcomeFollowUpDate, note: outcomeNote }, state.payments || []);
    if (!validation.valid) { setStatusMessage({ type: 'error', text: validation.error || 'نتیجه قابل ثبت نیست.' }); return; }
    const now = new Date().toISOString();
    updateState(draft => {
      const task = draft.tasks?.find(item => item.id === selectedOutcomeTask.id);
      if (!task) return;
      const entry = { outcome: outcomeCode, paymentId: validation.payment?.id, collectedAmount: validation.collectedAmount, failureReason: outcomeReason.trim() || undefined, followUpDate: outcomeFollowUpDate || undefined, note: outcomeNote.trim() || undefined, recordedAt: now, recordedBy: draft.currentUserId || '' };
      if (!task.resultHistory) task.resultHistory = [];
      task.resultHistory.push(entry);
      task.result = outcomeCode;
      task.resultAt = now;
      task.resultBy = draft.currentUserId || '';
      task.paymentId = validation.payment?.id;
      task.collectedAmount = validation.collectedAmount;
      task.failureReason = outcomeReason.trim() || undefined;
      task.followUpDate = outcomeFollowUpDate || undefined;
      task.resultNote = outcomeNote.trim() || undefined;
      task.status = 'COMPLETED';
      recordAudit(draft, 'GEO_COLLECTION_TASK_RESULT_RECORDED', task.id, `نتیجهٔ وظیفه وصول ثبت شد: ${outcomeCode}${validation.payment ? `؛ پرداخت معتبر ${validation.payment.id}، مبلغ ${validation.payment.amount}` : ''}.`);
    });
    setStatusMessage({ type: 'ok', text: validation.payment ? `نتیجه ثبت شد؛ مبلغ ${validation.payment.amount.toLocaleString('fa-IR')} از رکورد پرداخت نهایی خوانده شد.` : 'نتیجهٔ وظیفه ثبت شد؛ مبلغ وصولی به‌صورت دستی وارد یا جعل نشده است.' });
    setOutcomeTaskId(''); setOutcomeCode(''); setOutcomePaymentId(''); setOutcomeReason(''); setOutcomeFollowUpDate(''); setOutcomeNote('');
  };
  const canOnTask = (task: any) => canOn('tasks', 'EDIT', { ownerId: task.assigneeType === 'GROUP' ? (state.groups?.find(group => group.id === task.assigneeId)?.memberIds.includes(state.currentUserId || '') ? state.currentUserId : undefined) : task.assigneeId });

  const createBulkCollectionTasks = () => {
    if (!can('tasks', 'CREATE')) { denied('ایجاد گروهی وظایف وصول'); setStatusMessage({ type: 'error', text: 'مجوز ایجاد وظیفه ندارید.' }); return; }
    if (!selectedZone || selectedZone.status !== 'ACTIVE' || !activeGeometry) { setStatusMessage({ type: 'error', text: 'زون فعال با هندسه معتبر لازم است.' }); return; }
    const assignee = (state.users || []).find(user => user.id === taskAssigneeId && (user.isActive ?? user.active) !== false);
    if (!assignee) { setStatusMessage({ type: 'error', text: 'مسئول فعال و معتبر انتخاب کنید.' }); return; }
    if ((assignee.id !== state.currentUserId || taskWatcherId) && !can('tasks', 'ASSIGN')) { denied('ارجاع گروهی وظایف'); setStatusMessage({ type: 'error', text: 'برای ارجاع به کاربر دیگر یا تعیین ناظر، مجوز ارجاع لازم است.' }); return; }
    const eligible = prioritizedCustomersInside.filter(customer => bulkCustomerIds.includes(customer.id));
    if (!eligible.length) { setStatusMessage({ type: 'error', text: 'حداقل یک مشتری داخل زون انتخاب کنید.' }); return; }
    const existingOpenCustomerIds = new Set(zoneCollectionTasks.filter(task => task.status !== 'COMPLETED' && task.status !== 'CANCELLED').map(task => String(task.customerId || task.accountId || '')));
    const toCreate = eligible.filter(customer => !existingOpenCustomerIds.has(customer.id));
    if (!toCreate.length) { setStatusMessage({ type: 'info', text: 'برای تمام مشتریان انتخاب‌شده، وظیفهٔ وصول باز از همین زون وجود دارد؛ وظیفهٔ تکراری ساخته نشد.' }); return; }
    const now = new Date().toISOString();
    const tasks = toCreate.map(customer => { const priorityRow = priorityByCustomer.get(customer.id); return ({ id: generateId(), title: `پیگیری وصول — ${customer.name}`, description: `ایجاد گروهی از زون «${selectedZone.name}». نتیجه باید بر اساس تماس/مراجعه واقعی ثبت شود؛ قرارگیری داخل زون اثبات وصول نیست.${zoneReceivableReconciliation.authoritative && priorityRow ? ` ماندهٔ معتبر: ${priorityRow.outstandingAmount}؛ رتبهٔ وصول: ${priorityRow.rank}.` : ' رتبه‌بندی مالی معتبر در دسترس نیست؛ اولویت دستی اعمال شد.'}`, accountId: customer.id, customerId: customer.id, zoneId: selectedZone.id, taskType: 'COLLECTION', expectedOutcome: 'COLLECTION_RESULT', status: 'OPEN', priority: resolvedCollectionPriority(customer.id), slaStatus: 'ON_TRACK', dueDate: taskDueDate || undefined, assigneeType: 'USER', assigneeId: assignee.id, watcherIds: taskWatcherId ? [taskWatcherId] : [], createdAt: now, createdBy: state.currentUserId || '', source: 'GEO_ZONE', evidence: [] } as any); });
    updateState(draft => {
      if (!draft.tasks) draft.tasks = [];
      draft.tasks.unshift(...tasks);
      for (const task of tasks) processTaskCollaborationEvents(task, state, draft, true);
      if (!draft.auditLogs) draft.auditLogs = [];
      draft.auditLogs.push({ id: generateId(), action: 'GEO_COLLECTION_TASKS_BULK_CREATED', entityType: 'GEO_ZONE', entityId: selectedZone.id, details: `${tasks.length} وظیفهٔ وصول گروهی برای زون ${selectedZone.code} ساخته شد؛ مسئول ${assignee.id}.`, actor, createdAt: now } as any);
    });
    setStatusMessage({ type: 'ok', text: `${tasks.length.toLocaleString('fa-IR')} وظیفه ایجاد شد؛ مشتریان دارای وظیفهٔ باز از تکرار مستثنا شدند.` });
    setBulkCustomerIds([]);
  };
  const createCollectionTask = () => {
    if (!can('tasks', 'CREATE')) { denied('ایجاد وظیفه وصول از زون'); return; }
    if (!selectedZone || selectedZone.status !== 'ACTIVE' || !activeGeometry) { setStatusMessage({ type: 'error', text: 'برای ایجاد وظیفه، زون فعال با هندسه معتبر انتخاب کنید.' }); return; }
    const customer = customersInside.find(item => item.id === taskCustomerId);
    if (!customer) { setStatusMessage({ type: 'error', text: 'یک مشتری قابل مشاهده داخل زون انتخاب کنید.' }); return; }
    const assignee = (state.users || []).find(user => user.id === taskAssigneeId && (user.isActive ?? user.active) !== false);
    if (!assignee) { setStatusMessage({ type: 'error', text: 'مسئول فعال و معتبر انتخاب کنید.' }); return; }
    if (assignee.id !== state.currentUserId && !can('tasks', 'ASSIGN')) { denied('ارجاع وظیفه وصول به کاربر دیگر'); setStatusMessage({ type: 'error', text: 'برای ارجاع به کاربر دیگر به مجوز ارجاع وظیفه نیاز دارید.' }); return; }
    if (taskWatcherId && !can('tasks', 'ASSIGN')) { denied('تعیین ناظر وظیفه'); setStatusMessage({ type: 'error', text: 'برای تعیین ناظر به مجوز ارجاع وظیفه نیاز دارید.' }); return; }
    const now = new Date().toISOString();
    const task: any = {
      id: generateId(), title: `پیگیری وصول — ${customer.name}`, description: `ایجاد از زون «${selectedZone.name}». نتیجه مورد انتظار: بررسی مانده معتبر و ثبت نتیجه تماس/مراجعه؛ نزدیکی مکانی به‌تنهایی نتیجه موفق محسوب نمی‌شود.${zoneReceivableReconciliation.authoritative && priorityByCustomer.has(customer.id) ? ` ماندهٔ معتبر: ${priorityByCustomer.get(customer.id)!.outstandingAmount}؛ رتبهٔ وصول: ${priorityByCustomer.get(customer.id)!.rank}.` : ' رتبه‌بندی مالی معتبر در دسترس نیست.'}`,
      accountId: customer.id, customerId: customer.id, zoneId: selectedZone.id, taskType: 'COLLECTION', expectedOutcome: 'COLLECTION_RESULT',
      status: 'OPEN', priority: resolvedCollectionPriority(customer.id), slaStatus: 'ON_TRACK', dueDate: taskDueDate || undefined, assigneeType: 'USER', assigneeId: assignee.id,
      watcherIds: taskWatcherId ? [taskWatcherId] : [], createdAt: now, createdBy: state.currentUserId || '', source: 'GEO_ZONE',
      result: undefined, collectedAmount: undefined, failureReason: undefined, evidence: []
    };
    updateState(draft => {
      if (!draft.tasks) draft.tasks = [];
      draft.tasks.unshift(task);
      processTaskCollaborationEvents(task, state, draft, true);
      recordAudit(draft, 'GEO_COLLECTION_TASK_CREATED', selectedZone.id, `وظیفه وصول برای مشتری ${customer.id} به مسئول ${assignee.id} ارجاع شد.`);
    });
    setStatusMessage({ type: 'ok', text: `وظیفه پیگیری وصول برای «${customer.name}» ایجاد شد و در فهرست وظایف قرار گرفت.` });
    setTaskCustomerId('');
  };

  const assignCustomersInZone = () => {
    if (!canEdit) { denied('انتساب مشتری به زون'); return; }
    if (!selectedZone || selectedZone.status !== 'ACTIVE' || !activeGeometry) { setStatusMessage({ type: 'error', text: 'برای انتساب، زون فعال با هندسه معتبر انتخاب کنید.' }); return; }
    const now = new Date().toISOString(); const insideIds = new Set(customersInside.map(customer => customer.id));
    updateState(draft => {
      if (!draft.zoneAssignments) draft.zoneAssignments = [];
      // Close previous polygon assignments for this zone, then create a fresh auditable assignment set.
      draft.zoneAssignments = draft.zoneAssignments.map(item => item.zoneId === selectedZone.id && item.method === 'POLYGON' && !item.effectiveTo && insideIds.has(item.entityId) ? { ...item, effectiveTo: now } : item);
      for (const customerId of insideIds) draft.zoneAssignments.push({ id: generateId(), zoneId: selectedZone.id, entityType: 'CUSTOMER', entityId: customerId, method: 'POLYGON', effectiveFrom: now, createdBy: draft.currentUserId || '', createdAt: now });
      recordAudit(draft, 'GEO_ZONE_CUSTOMERS_ASSIGNED', selectedZone.id, `${insideIds.size} مشتری بر اساس مختصات معتبر داخل مرز زون انتساب داده شد.`);
    });
    setStatusMessage({ type: 'ok', text: `${insideIds.size} مشتری با مختصات معتبر به‌صورت نسخه‌دار به زون انتساب داده شدند.` });
  };

  return <div className="mx-auto max-w-7xl space-y-5 p-3 pb-10 sm:p-5" dir="rtl">
    <header className="relative overflow-hidden rounded-3xl border border-border bg-white p-5 shadow-card sm:p-7">
      <div className="relative flex flex-wrap items-start justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-primary"><MapPinned size={19}/><span className="text-xs font-black tracking-wide">AKHAVAN · GEO INTELLIGENCE</span></div><h1 className="text-2xl font-black text-text-main sm:text-3xl">هوش مکانی و مدیریت زون‌ها</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-text-secondary">تعریف مرزهای جغرافیایی نسخه‌دار، انتساب مشتری با مختصات معتبر و آماده‌سازی تحلیل مکانی. سنجه‌ها تا اتصال منبع واقعی غیرفعال می‌مانند.</p></div><div className="rounded-2xl border border-warning/30 bg-warning-soft px-3 py-2 text-xs font-bold leading-6 text-warning"><ShieldAlert size={15} className="ml-1 inline"/>صفحهٔ نقشهٔ پایه؛ هنوز tile provider یا نقشهٔ پس‌زمینه متصل نیست.</div></div>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">{[{label:'کل زون‌ها',value:zones.length},{label:'زون فعال',value:zones.filter(zone=>zone.status==='ACTIVE').length},{label:'نسخه‌های هندسه',value:versions.length},{label:'مشتری دارای مختصات معتبر',value:(state.customers||[]).filter(customer=>readCustomerPoint(customer)).length}].map(item=><div key={item.label} className="rounded-2xl border border-border bg-canvas/70 p-3"><div className="text-xs text-text-secondary">{item.label}</div><div className="mt-1 text-2xl font-black tabular-nums text-text-main">{item.value.toLocaleString('fa-IR')}</div></div>)}</div>
    </header>
    <DataSourceStatus 
      source="CRM" 
      sourceName="پایگاه اطلاعات مکانی و زون‌بندی ویزیتورها" 
      isAuthoritative={true} 
    />
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="حالت‌های هوش مکانی">{([{id:'zones',label:'زون‌ها',icon:Layers3},{id:'heatmap',label:'تحلیل و Heatmap',icon:MapPinned},{id:'operations',label:'عملیات و انتساب',icon:Users}] as const).map(item=><button key={item.id} role="tab" aria-selected={mode===item.id} onClick={()=>setMode(item.id)} className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors ${mode===item.id?'border-primary bg-primary text-white':'border-border bg-white text-text-secondary hover:bg-canvas'}`}><item.icon size={16}/>{item.label}</button>)}</div>
    {statusMessage && <div role="status" className={`flex items-start gap-2 rounded-xl border p-3 text-sm leading-6 ${statusMessage.type==='error'?'border-danger/30 bg-danger-soft text-danger':statusMessage.type==='ok'?'border-success/30 bg-success-soft text-success':'border-border bg-canvas text-text-secondary'}`}>{statusMessage.type==='error'?<AlertTriangle size={17} className="mt-1 shrink-0"/>:<CheckCircle2 size={17} className="mt-1 shrink-0"/>}{statusMessage.text}</div>}
    {mode==='zones' && <div className="grid gap-4 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
      <Card className="space-y-3" padding="lg"><div className="flex items-center justify-between gap-2"><h2 className="text-base font-black text-text-main">زون‌های ذخیره‌شده</h2><Button size="sm" variant="outline" onClick={()=>{setSelectedZoneId('');setZoneName('');setZoneCode('');setCoordinateText('');setChangeReason('');setStatusMessage(null);}} icon={<Plus size={15}/>}>زون جدید</Button></div>
        {zones.length===0 && <div className="rounded-2xl border border-dashed border-border-strong p-7 text-center"><MapPinned className="mx-auto mb-3 text-text-secondary" size={28}/><p className="text-sm font-bold text-text-main">هنوز زونی تعریف نشده است</p><p className="mt-2 text-xs leading-6 text-text-secondary">برای جلوگیری از دادهٔ ساختگی، زون نمونه ساخته نشده. نام، کد و مختصات واقعی خود را وارد کنید.</p></div>}
        <div className="space-y-2">{zones.map(zone=>{const v=versions.find(item=>item.id===zone.currentGeometryVersionId)||versions.filter(item=>item.zoneId===zone.id).sort((a,b)=>b.version-a.version)[0];return <button key={zone.id} onClick={()=>selectZone(zone)} className={`w-full rounded-2xl border p-3 text-start transition-colors ${selectedZoneId===zone.id?'border-primary/50 bg-primary/5':'border-border bg-white hover:bg-canvas'}`}><div className="flex items-start justify-between gap-2"><div><div className="font-bold text-text-main">{zone.name}</div><div className="mt-1 text-xs text-text-secondary">کد {zone.code} · نسخه {v?.version||0}</div></div><span className={`rounded-lg px-2 py-1 text-[10px] font-bold ${zone.status==='ACTIVE'?'bg-success-soft text-success':zone.status==='ARCHIVED'?'bg-canvas text-text-secondary':'bg-warning-soft text-warning'}`}>{zone.status==='ACTIVE'?'فعال':zone.status==='ARCHIVED'?'بایگانی':'پیش‌نویس'}</span></div></button>;})}</div>
      </Card>
      <Card className="space-y-4" padding="lg"><div><h2 className="text-base font-black text-text-main">{selectedZone?'ویرایش زون و ثبت نسخهٔ جدید':'تعریف زون جدید'}</h2><p className="mt-1 text-xs leading-6 text-text-secondary">مختصات را در ترتیب طول، عرض جغرافیایی وارد کنید؛ هر رأس در یک خط، نمونهٔ قالب: <code>51.42, 35.72</code>. حلقه هنگام ذخیره بسته می‌شود.</p></div>
        <div className="grid gap-3 sm:grid-cols-2"><Input label="نام زون" value={zoneName} onChange={event=>setZoneName(event.target.value)} placeholder="مثلاً منطقه شمالی" required/><Input label="کد یکتا" value={zoneCode} onChange={event=>setZoneCode(event.target.value)} placeholder="مثلاً ZN-001" required/></div>
        <label className="block text-xs font-bold text-text-secondary">رأس‌های مرز (طول، عرض)<textarea value={coordinateText} onChange={event=>setCoordinateText(event.target.value)} rows={7} placeholder={'51.42, 35.72\n51.50, 35.70\n51.48, 35.78'} className="mt-1.5 w-full rounded-xl border border-border bg-white p-3 font-mono text-sm text-text-main outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" /></label>
        <GeoZoneMapEditor key={selectedZoneId || 'new-zone'} geometry={parsedGeometry?.geometry || undefined} coordinateText={coordinateText} disabled={!canEdit} mapConfig={state.settings?.mapConfig || {}} onMapConfigChange={config=>updateState(draft=>{if(!draft.settings)draft.settings={};draft.settings.mapConfig=config;})} onChange={geometry=>{if(geometry)setCoordinateText(coordinatesToText(geometry));}} onPointsChange={points=>setCoordinateText(points.map(point=>`${point.longitude}, ${point.latitude}`).join('\n'))} />
        <Input label="دلیل تغییر مرز / توضیح ممیزی" value={changeReason} onChange={event=>setChangeReason(event.target.value)} placeholder="اختیاری؛ مثلاً اصلاح محدوده پوشش"/>
        {parsedGeometry && <div className={`rounded-xl border p-3 text-xs leading-6 ${parsedGeometry.error?'border-danger/30 bg-danger-soft text-danger':'border-success/30 bg-success-soft text-success'}`}>{parsedGeometry.error || `هندسه معتبر است؛ ${validateZonePolygon(parsedGeometry.geometry!).vertexCount.toLocaleString('fa-IR')} رأس متمایز.`}</div>}{parsedGeometry?.geometry && !parsedGeometry.error && <PolygonGeometryPreview geometry={parsedGeometry.geometry} />}
        <div className="flex flex-wrap gap-2"><Button onClick={saveZone} disabled={!canEdit || !zoneName.trim() || !zoneCode.trim() || !parsedGeometry?.geometry || !!parsedGeometry.error} icon={<Save size={15}/>}>ذخیره نسخهٔ هندسه</Button>{selectedZone?.status!=='ACTIVE'&&selectedZone&&<Button variant="success" disabled={!canEdit||!activeGeometry} onClick={()=>changeZoneStatus(selectedZone,'ACTIVE')} icon={<CheckCircle2 size={15}/>}>فعال‌سازی زون</Button>}{selectedZone?.status==='ACTIVE'&&<Button variant="outline" disabled={!canEdit} onClick={()=>changeZoneStatus(selectedZone,'DRAFT')}>بازگشت به پیش‌نویس</Button>}{selectedZone&&selectedZone.status!=='ARCHIVED'&&<Button variant="ghost" disabled={!canEdit} onClick={()=>changeZoneStatus(selectedZone,'ARCHIVED')} icon={<Archive size={15}/>}>بایگانی</Button>}</div>
        {!canEdit&&<p className="text-xs text-warning">برای تغییر زون، مجوز مدیریت تنظیمات یا نقش لازم است. مجوز مشاهده به‌تنهایی امکان تغییر نمی‌دهد.</p>}
      </Card>
    </div>}
    {mode==='heatmap' && <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.75fr)]"><Card padding="lg" className="space-y-4"><div><h2 className="text-base font-black text-text-main">تعریف سنجهٔ تحلیل</h2><p className="mt-1 text-xs leading-6 text-text-secondary">در هر تحلیل فقط یک سنجه انتخاب می‌شود؛ رنگ و اولویت آن تا تعریف دقیق منبع و معنای «بیشتر بهتر است/بدتر است» نباید حدس زده شود.</p></div><label className="block text-xs font-bold text-text-secondary">سنجهٔ اصلی<select value={metricKey} onChange={event=>setMetricKey(event.target.value as keyof typeof GEO_METRIC_CATALOG)} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-text-main">{Object.values(GEO_METRIC_CATALOG).map(metric=><option key={metric.key} value={metric.key}>{metric.label}</option>)}</select></label><div className="grid gap-3 sm:grid-cols-2"><Input label="از تاریخ (اختیاری تا اتصال منبع)" type="date" value={dateFrom} onChange={event=>setDateFrom(event.target.value)}/><Input label="تا تاریخ (اختیاری تا اتصال منبع)" type="date" value={dateTo} onChange={event=>setDateTo(event.target.value)}/></div><div className="rounded-2xl border border-warning/30 bg-warning-soft p-4"><div className="flex items-center gap-2 font-bold text-warning"><ShieldAlert size={17}/>این سنجه هنوز منبع واقعی ندارد</div><p className="mt-2 text-sm leading-7 text-text-main">{activeMetric.limitation}</p></div></Card><Card padding="lg" className="space-y-3"><h2 className="text-base font-black text-text-main">قرارداد سنجه</h2><div className="rounded-xl border border-border p-3"><div className="text-xs text-text-secondary">واحد</div><div className="mt-1 font-bold text-text-main">{activeMetric.unit}</div></div><div className="rounded-xl border border-border p-3"><div className="text-xs text-text-secondary">تجمیع</div><div className="mt-1 text-sm leading-6 text-text-main">{activeMetric.aggregation}</div></div><div className="rounded-xl border border-border p-3"><div className="text-xs text-text-secondary">منبع معتبر</div><div className="mt-1 text-sm leading-6 text-text-main">{activeMetric.sourceDescription}</div></div><div className="rounded-xl border border-border p-3"><div className="text-xs text-text-secondary">معنای مقدار بالاتر</div><div className="mt-1 font-bold text-text-main">{activeMetric.higherIsBetter===null?'باید با انتخاب سنجه مشخص شود':activeMetric.higherIsBetter?'مطلوب‌تر':'نامطلوب‌تر'}</div></div><div className="text-xs leading-6 text-text-secondary">هیچ Heatmap، عدد یا رتبهٔ ساختگی نمایش داده نمی‌شود. فیلتر تاریخ پس از اتصال به منبع باید بر همان منبع معتبر اعمال شود.</div></Card></div>}
    {mode==='operations' && <div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"><Card padding="lg" className="space-y-3"><h2 className="text-base font-black text-text-main">مشتریان داخل زون</h2><label className="block text-xs font-bold text-text-secondary">زون<select value={selectedZoneId} onChange={event=>{const zone=zones.find(item=>item.id===event.target.value);if(zone)selectZone(zone);else setSelectedZoneId('');}} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-text-main"><option value="">انتخاب زون</option>{zones.map(zone=><option key={zone.id} value={zone.id}>{zone.name} · {zone.status==='ACTIVE'?'فعال':zone.status==='ARCHIVED'?'بایگانی':'پیش‌نویس'}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-border bg-canvas p-3"><div className="text-xs text-text-secondary">مشتری داخل مرز</div><div className="mt-1 text-2xl font-black text-text-main">{customersInside.length.toLocaleString('fa-IR')}</div></div><div className="rounded-xl border border-border bg-canvas p-3"><div className="text-xs text-text-secondary">انتساب فعال</div><div className="mt-1 text-2xl font-black text-text-main">{selectedZoneAssignments.length.toLocaleString('fa-IR')}</div></div></div><Button block disabled={!canEdit||!selectedZone||selectedZone.status!=='ACTIVE'||!activeGeometry} onClick={assignCustomersInZone} icon={<Users size={15}/>}>انتساب / به‌روزرسانی مشتریان داخل مرز</Button><p className="text-xs leading-6 text-text-secondary">این عمل فقط مشتریانی را در نظر می‌گیرد که مختصات واقعی و معتبر دارند و از RBAC اجازهٔ مشاهدهٔ آن‌ها را دارید. انتساب‌های قبلی همین مشتریان با پایان اعتبار بسته می‌شوند؛ رکوردهای خارج از محدودهٔ دسترسی تغییر نمی‌کنند.</p>
      <div className="mt-5 border-t border-border pt-4"><h3 className="mb-1 text-sm font-black text-text-main">ایجاد وظیفهٔ پیگیری وصول از زون</h3><p className="mb-3 text-xs leading-6 text-text-secondary">وظیفه به موتور وظایف موجود اضافه می‌شود؛ مبلغ وصول یا موفقیت مراجعه به‌صورت خودکار فرض نمی‌شود و باید بعداً با نتیجهٔ واقعی ثبت شود.</p>
      <div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-bold text-text-secondary">مشتری<select value={taskCustomerId} onChange={event=>setTaskCustomerId(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-text-main"><option value="">انتخاب مشتری داخل زون</option>{prioritizedCustomersInside.map(customer=><option key={customer.id} value={customer.id}>{customer.name}{priorityByCustomer.has(customer.id) ? ` · رتبه ${priorityByCustomer.get(customer.id)!.rank}` : ''}</option>)}</select></label><label className="block text-xs font-bold text-text-secondary">مسئول اصلی<select value={taskAssigneeId} onChange={event=>setTaskAssigneeId(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-text-main">{(state.users||[]).filter(user=>(user.isActive??user.active)!==false).map(user=><option key={user.id} value={user.id}>{user.name}</option>)}</select></label><label className="block text-xs font-bold text-text-secondary">ناظر / سرپرست اختیاری<select value={taskWatcherId} onChange={event=>setTaskWatcherId(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-text-main"><option value="">بدون ناظر</option>{(state.users||[]).filter(user=>user.id!==taskAssigneeId&&(user.isActive??user.active)!==false).map(user=><option key={user.id} value={user.id}>{user.name}</option>)}</select></label><Input label="مهلت انجام" type="date" value={taskDueDate} onChange={event=>setTaskDueDate(event.target.value)}/><label className="block text-xs font-bold text-text-secondary">اولویت<select value={taskPriority} onChange={event=>setTaskPriority(event.target.value as Priority)} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-text-main"><option value="LOW">کم</option><option value="NORMAL">عادی</option><option value="HIGH">زیاد</option><option value="URGENT">فوری</option></select></label></div><Button block className="mt-3" disabled={!can('tasks','CREATE')||!selectedZone||selectedZone.status!=='ACTIVE'||!taskCustomerId||!taskAssigneeId||(taskAssigneeId!==state.currentUserId&&!can('tasks','ASSIGN'))||(!!taskWatcherId&&!can('tasks','ASSIGN'))} onClick={createCollectionTask}>ایجاد وظیفه و ارجاع</Button>{!can('tasks','CREATE')&&<p className="mt-2 text-xs text-warning">برای ساخت وظیفه باید مجوز ایجاد وظایف داشته باشید.</p>}<div className="mt-4 border-t border-border pt-4 space-y-3"><div><h4 className="text-sm font-black text-text-main">ساخت گروهی وظیفهٔ وصول</h4><p className="mt-1 text-xs leading-5 text-text-secondary">مشتریان را انتخاب کن؛ وظیفه‌های باز تکراری از همین زون ساخته نمی‌شوند. اگر تطبیق مالی معتبر و بدون مغایرت باشد، انتخاب‌ها بر اساس ماندهٔ واقعی و تأخیر مرتب و اولویت وظیفه به‌صورت رتبه‌ای تنظیم می‌شود؛ در غیر این صورت اولویت دستی اعمال می‌شود.</p></div><div className="flex flex-wrap items-center gap-2"><button type="button" className="rounded-lg border border-border px-3 py-2 text-xs font-bold" onClick={()=>setBulkCustomerIds(prioritizedCustomersInside.map(customer=>customer.id))}>انتخاب همه</button><button type="button" className="rounded-lg border border-border px-3 py-2 text-xs font-bold" onClick={()=>setBulkCustomerIds([])}>پاک‌کردن انتخاب</button><span className="text-xs text-text-secondary">انتخاب‌شده: {bulkCustomerIds.filter(id=>customersInside.some(customer=>customer.id===id)).length.toLocaleString('fa-IR')}</span></div><div className="max-h-52 space-y-1 overflow-auto rounded-xl border border-border p-2">{prioritizedCustomersInside.map(customer=><label key={customer.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-xs hover:bg-canvas"><input type="checkbox" checked={bulkCustomerIds.includes(customer.id)} onChange={event=>setBulkCustomerIds(current=>event.target.checked?[...new Set([...current,customer.id])]:current.filter(id=>id!==customer.id))}/><span className="min-w-0 truncate">{customer.name}{priorityByCustomer.has(customer.id) && <span className="ms-2 text-text-secondary">#{priorityByCustomer.get(customer.id)!.rank} · {priorityByCustomer.get(customer.id)!.outstandingAmount.toLocaleString('fa-IR')} ریال</span>}</span></label>)}</div><Button block disabled={!can('tasks','CREATE')||bulkCustomerIds.length===0||!taskAssigneeId||(taskAssigneeId!==state.currentUserId&&!can('tasks','ASSIGN'))} onClick={createBulkCollectionTasks} icon={<Users size={15}/>}>ایجاد گروهی وظایف انتخاب‌شده</Button></div></div></Card><Card padding="lg" className="space-y-3"><h2 className="text-base font-black text-text-main">فهرست مشتریان داخل مرز</h2>{!selectedZone&&<p className="rounded-xl border border-dashed border-border-strong p-5 text-sm text-text-secondary">زون را انتخاب کنید.</p>}{selectedZone&&customersInside.length===0&&<p className="rounded-xl border border-dashed border-border-strong p-5 text-sm leading-6 text-text-secondary">مشتری دارای مختصات معتبر داخل هندسهٔ فعلی پیدا نشد؛ این وضعیت به‌معنی صفر بودن کل مشتریان زون نیست، ممکن است مختصات ثبت نشده باشند.</p>}{customersInside.slice(0,100).map(customer=>{const point=readCustomerPoint(customer)!;return <div key={customer.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"><div className="min-w-0"><div className="truncate text-sm font-bold text-text-main">{customer.name}</div><div className="mt-1 text-[11px] text-text-secondary">کد: {customer.code||customer.id}</div></div><div className="shrink-0 text-left font-mono text-[10px] text-text-secondary">{point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}</div></div>;})}{customersInside.length>100&&<p className="text-xs text-text-secondary">۱۰۰ مورد نخست نمایش داده شده؛ کل مشتریان داخل مرز: {customersInside.length.toLocaleString('fa-IR')}</p>}</Card></div>}
    {mode==='operations' && selectedZone && <Card padding="lg" className="space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-black text-text-main">گزارش عملکرد وصول زون</h2><p className="mt-1 text-xs leading-6 text-text-secondary">فقط وظایف قابل مشاهده در محدودهٔ دسترسی جاری؛ مبلغ وصول از پرداخت‌های CLEARED بازخوانی می‌شود و پرداخت تکراری دوباره‌شماری نمی‌شود.</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={!can('geo','VIEW')} onClick={exportCollectionReport} icon={<Download size={14}/>}>خروجی خلاصه CSV</Button><Button variant="secondary" disabled={!can('geo','VIEW')} onClick={exportCollectionDetails} icon={<Download size={14}/>}>خروجی تفصیلی CSV</Button></div></div><div className="grid gap-3 rounded-xl border border-border bg-canvas p-3 sm:grid-cols-[1fr_1fr_auto]"><label className="block text-xs font-bold text-text-secondary">از تاریخ نتیجه / ایجاد<input type="date" value={reportDateFrom} max={reportDateTo || undefined} onChange={event=>setReportDateFrom(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-text-main" /></label><label className="block text-xs font-bold text-text-secondary">تا تاریخ نتیجه / ایجاد<input type="date" value={reportDateTo} min={reportDateFrom || undefined} onChange={event=>setReportDateTo(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-text-main" /></label><div className="flex items-end"><Button variant="outline" onClick={()=>{setReportDateFrom('');setReportDateTo('');}}>پاک‌کردن فیلتر</Button></div><p className="sm:col-span-3 text-[10px] leading-5 text-text-secondary">بازه شامل هر دو روز است؛ برای وظیفه دارای نتیجه، تاریخ آخرین نتیجه و برای وظیفه بدون نتیجه، تاریخ ایجاد مبناست.</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-xl border border-border bg-canvas p-3"><div className="text-xs text-text-secondary">کل وظایف</div><div className="mt-1 text-xl font-black text-text-main">{collectionReport.total.toLocaleString('fa-IR')}</div></div><div className="rounded-xl border border-border bg-canvas p-3"><div className="text-xs text-text-secondary">باز</div><div className="mt-1 text-xl font-black text-text-main">{collectionReport.open.toLocaleString('fa-IR')}</div></div><div className="rounded-xl border border-border bg-canvas p-3"><div className="text-xs text-text-secondary">معوق</div><div className="mt-1 text-xl font-black text-text-main">{collectionReport.overdue.toLocaleString('fa-IR')}</div></div><div className="rounded-xl border border-border bg-canvas p-3"><div className="text-xs text-text-secondary">وصول معتبر</div><div className="mt-1 text-lg font-black text-text-main">{collectionReport.collectedAmount.toLocaleString('fa-IR')}</div><div className="mt-1 text-[10px] text-text-secondary">{collectionReport.distinctPayments.toLocaleString('fa-IR')} پرداخت یکتا</div></div></div>{Object.keys(collectionReport.outcomes).length>0&&<div className="flex flex-wrap gap-2">{COLLECTION_OUTCOME_OPTIONS.filter(option=>collectionReport.outcomes[option.value]).map(option=><span key={option.value} className="rounded-full border border-border bg-canvas px-3 py-1.5 text-[11px] text-text-secondary">{option.label}: <strong className="text-text-main">{collectionReport.outcomes[option.value].toLocaleString('fa-IR')}</strong></span>)}</div>}{collectionReport.byAssignee.length===0?<p className="rounded-xl border border-dashed border-border p-4 text-sm text-text-secondary">برای این زون وظیفهٔ قابل مشاهده‌ای وجود ندارد.</p>:<div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[640px] text-right text-xs"><thead className="bg-canvas text-text-secondary"><tr><th className="p-3 font-bold">مسئول</th><th className="p-3 font-bold">کل</th><th className="p-3 font-bold">باز</th><th className="p-3 font-bold">تکمیل</th><th className="p-3 font-bold">معوق</th><th className="p-3 font-bold">وصول معتبر</th></tr></thead><tbody>{collectionReport.byAssignee.map(row=><tr key={row.assigneeId} className="border-t border-border"><td className="p-3 font-bold text-text-main">{row.assigneeName}</td><td className="p-3">{row.total.toLocaleString('fa-IR')}</td><td className="p-3">{row.open.toLocaleString('fa-IR')}</td><td className="p-3">{row.completed.toLocaleString('fa-IR')}</td><td className="p-3">{row.overdue.toLocaleString('fa-IR')}</td><td className="p-3">{row.collectedAmount.toLocaleString('fa-IR')}</td></tr>)}</tbody></table></div>}<div className="space-y-2"><h3 className="text-sm font-black text-text-main">جزئیات وظایف و مشتریان</h3>{collectionReport.details.length===0?<p className="text-xs text-text-secondary">جزئیاتی برای نمایش وجود ندارد.</p>:<div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[760px] text-right text-xs"><thead className="bg-canvas text-text-secondary"><tr><th className="p-3 font-bold">مشتری</th><th className="p-3 font-bold">مسئول</th><th className="p-3 font-bold">وضعیت</th><th className="p-3 font-bold">نتیجه</th><th className="p-3 font-bold">مهلت</th><th className="p-3 font-bold">وصول معتبر</th></tr></thead><tbody>{collectionReport.details.slice(0,100).map(row=><tr key={row.taskId} className="border-t border-border"><td className="p-3"><div className="font-bold text-text-main">{row.customerName}</div><div className="mt-1 text-[10px] text-text-secondary">{row.taskId}</div></td><td className="p-3">{row.assigneeName}</td><td className="p-3">{row.status==='COMPLETED'?'تکمیل‌شده':row.status==='CANCELLED'?'لغو': 'باز'}</td><td className="p-3">{COLLECTION_OUTCOME_OPTIONS.find(option=>option.value===row.outcome)?.label||row.outcome||'ثبت نشده'}</td><td className="p-3">{row.dueDate||'—'}</td><td className="p-3">{row.collectedAmount?row.collectedAmount.toLocaleString('fa-IR'):'—'}</td></tr>)}</tbody></table></div>}{collectionReport.details.length>100&&<p className="text-[11px] text-text-secondary">۱۰۰ وظیفهٔ نخست نمایش داده شده؛ خروجی تفصیلی شامل همهٔ {collectionReport.details.length.toLocaleString('fa-IR')} مورد است.</p>}</div><div className="rounded-xl border border-border bg-canvas p-3 space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-black text-text-main">سلامت منبع مالی مشتریان این زون</h3><span className="rounded-full bg-warning/15 px-2 py-1 text-[10px] font-bold text-warning">برای اولویت‌بندی قابل استفاده نیست</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><div><div className="text-[10px] text-text-secondary">فاکتور فعال</div><div className="mt-1 text-sm font-black">{zoneReceivableReconciliation.invoiceCount.toLocaleString('fa-IR')}</div></div><div><div className="text-[10px] text-text-secondary">تخصیص معتبر</div><div className="mt-1 text-sm font-black">{zoneReceivableReconciliation.validAllocationCount.toLocaleString('fa-IR')}</div></div><div><div className="text-[10px] text-text-secondary">مغایرت/هشدار</div><div className="mt-1 text-sm font-black">{zoneReceivableReconciliation.issues.length.toLocaleString('fa-IR')}</div></div><div><div className="text-[10px] text-text-secondary">مانده پیش از بستانکاری</div><div className="mt-1 text-sm font-black">{zoneReceivableReconciliation.totalOutstandingBeforeCredits.toLocaleString('fa-IR')}</div></div></div><p className="text-[10px] leading-5 text-text-secondary">{zoneReceivableReconciliation.blockedReason} مبلغ پیش از بستانکاری صرفاً برای تشخیص کیفیت داده نمایش داده می‌شود و در رتبه‌بندی وظایف استفاده نمی‌شود.</p>{zoneReceivableReconciliation.issues.slice(0,3).map((issue,index)=><p key={`${issue.code}-${index}`} className="text-[10px] leading-5 text-warning">{issue.message}</p>)}{zoneReceivableReconciliation.issues.length>3&&<p className="text-[10px] text-text-secondary">{(zoneReceivableReconciliation.issues.length-3).toLocaleString('fa-IR')} مورد دیگر در ممیزی مالی وجود دارد.</p>}{zoneReceivableReconciliation.authoritative&&<div className="space-y-2 border-t border-border pt-3"><h3 className="text-sm font-black text-text-main">اولویت پیگیری بر اساس ماندهٔ معتبر</h3><p className="text-[10px] leading-5 text-text-secondary">مرتب‌سازی بر پایهٔ ماندهٔ باز و شدت تأخیر؛ امتیاز فقط اولویت عملیاتی است، نه پیش‌بینی احتمال وصول.</p>{zoneReceivableReconciliation.priorities.length===0?<p className="text-xs text-text-secondary">ماندهٔ باز معتبری برای اولویت‌بندی وجود ندارد.</p>:<div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[520px] text-right text-xs"><thead className="bg-white text-text-secondary"><tr><th className="p-2">رتبه</th><th className="p-2">مشتری</th><th className="p-2">ماندهٔ معتبر</th><th className="p-2">معوق</th><th className="p-2">روز تأخیر</th></tr></thead><tbody>{zoneReceivableReconciliation.priorities.filter(row=>zoneCustomerIds.has(row.customerId)).map(row=><tr key={row.customerId} className="border-t border-border"><td className="p-2 font-black">{row.rank.toLocaleString('fa-IR')}</td><td className="p-2">{visibleCustomers.find(customer=>customer.id===row.customerId)?.name || row.customerId}</td><td className="p-2 font-bold">{row.outstandingAmount.toLocaleString('fa-IR')}</td><td className="p-2">{row.overdueAmount.toLocaleString('fa-IR')}</td><td className="p-2">{row.maxDaysOverdue.toLocaleString('fa-IR')}</td></tr>)}</tbody></table></div>}</div>}</div><p className="text-[11px] leading-5 text-text-secondary">این گزارش فقط وقتی اولویت را نمایش می‌دهد که منبع بستانکاری ارائه شده و تطبیق مالی بدون مغایرت باشد. داده‌ها همچنان در state محلی هستند؛ تأیید حسابداری، Backend و SQL Server واقعی هنوز انجام نشده است.</p></Card>}
    {mode==='operations' && selectedZone && <Card padding="lg" className="space-y-4"><div><h2 className="text-base font-black text-text-main">ثبت نتیجهٔ واقعی وظیفهٔ وصول</h2><p className="mt-1 text-xs leading-6 text-text-secondary">این بخش فقط وظایف وصول همین زون و مشتریان قابل مشاهده را نشان می‌دهد. مبلغ وصول فقط از پرداخت CLEARED همان مشتری خوانده می‌شود؛ قول پرداخت یا مراجعه به‌تنهایی وصول مالی محسوب نمی‌شود.</p></div>{zoneCollectionTasks.length===0 ? <p className="rounded-xl border border-dashed border-border p-4 text-sm text-text-secondary">برای این زون هنوز وظیفهٔ وصولی ثبت نشده است.</p> : <><label className="block text-xs font-bold text-text-secondary">وظیفه<select value={outcomeTaskId} onChange={event=>{const id=event.target.value;setOutcomeTaskId(id);setOutcomeCode('');setOutcomePaymentId('');setOutcomeReason('');setOutcomeFollowUpDate('');setOutcomeNote('');}} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-text-main"><option value="">انتخاب وظیفه</option>{[...zoneCollectionTasks].sort((a,b)=>{const ca=String(a.customerId||a.accountId||''),cb=String(b.customerId||b.accountId||'');return (priorityByCustomer.get(ca)?.rank??Number.MAX_SAFE_INTEGER)-(priorityByCustomer.get(cb)?.rank??Number.MAX_SAFE_INTEGER);}).map(task=><option key={task.id} value={task.id}>{task.title} · {task.status==='COMPLETED'?'تکمیل‌شده':'باز'}</option>)}</select></label>{selectedOutcomeTask && <div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-bold text-text-secondary">نتیجه<select value={outcomeCode} onChange={event=>setOutcomeCode(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-text-main"><option value="">انتخاب نتیجه</option>{COLLECTION_OUTCOME_OPTIONS.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>{outcomeCode==='PAYMENT_RECORDED' && <label className="block text-xs font-bold text-text-secondary">پرداخت نهایی‌شدهٔ مشتری<select value={outcomePaymentId} onChange={event=>setOutcomePaymentId(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-text-main"><option value="">انتخاب پرداخت CLEARED</option>{availablePayments.map(payment=><option key={payment.id} value={payment.id}>{payment.date} · {payment.amount.toLocaleString('fa-IR')} · {payment.method}</option>)}</select>{availablePayments.length===0&&<span className="mt-1 block font-normal text-warning">برای این مشتری پرداخت نهایی‌شدهٔ معتبر موجود نیست.</span>}</label>}<Input label="تاریخ پیگیری بعدی (برای تعهد پرداخت الزامی)" type="date" value={outcomeFollowUpDate} onChange={event=>setOutcomeFollowUpDate(event.target.value)}/><label className="block text-xs font-bold text-text-secondary sm:col-span-2">علت عدم وصول / نتیجهٔ ناموفق<textarea value={outcomeReason} onChange={event=>setOutcomeReason(event.target.value)} rows={2} className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-text-main" placeholder="برای عدم وصول، عدم حضور یا اختلاف مالی الزامی است" /></label><div className="sm:col-span-2 rounded-xl border border-border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><div className="text-xs font-bold text-text-main">مدرک مراجعه / وصول</div><p className="mt-1 text-[11px] leading-5 text-text-secondary">تصویر JPEG/PNG/WebP یا PDF تا ۵ مگابایت؛ فقط برای کاربران دارای دسترسی به همین وظیفه.</p></div><label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary/10 px-3 text-xs font-bold text-primary"><Paperclip size={14}/> افزودن مدرک<input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={!canOnTask(selectedOutcomeTask)} onChange={event=>{uploadCollectionEvidence(event.target.files?.[0]);event.currentTarget.value='';}} /></label></div><div className="mt-3 space-y-2">{taskEvidence(selectedOutcomeTask.id).length===0?<p className="text-xs text-text-secondary">هنوز مدرکی برای این وظیفه ثبت نشده است.</p>:taskEvidence(selectedOutcomeTask.id).map((file:any)=><div key={file.id} className="flex items-center justify-between gap-2 rounded-lg bg-canvas p-2 text-xs"><span className="min-w-0 truncate">{file.fileName} · {(file.fileSize/1024).toFixed(1)} KB</span><button type="button" className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1" onClick={()=>downloadEvidence(file)}><Download size={13}/> دریافت</button></div>)}</div></div><label className="block text-xs font-bold text-text-secondary sm:col-span-2">یادداشت نتیجه / شرح مدرک (اختیاری)<textarea value={outcomeNote} onChange={event=>setOutcomeNote(event.target.value)} rows={2} className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-text-main" placeholder="شرح تماس یا مراجعه؛ این یادداشت جایگزین فایل مدرک نیست" /></label><div className="sm:col-span-2 rounded-xl border border-border bg-canvas p-3 text-xs leading-6 text-text-secondary">{outcomeCode==='PAYMENT_RECORDED' ? (availablePayments.length ? `مبلغ ثبت‌شونده از پرداخت انتخابی خوانده می‌شود: ${((availablePayments.find(payment=>payment.id===outcomePaymentId)?.amount)||0).toLocaleString('fa-IR')}` : 'تا ثبت پرداخت معتبر، مبلغ وصول قابل ثبت نیست.') : 'مبلغ وصول برای این نتیجه ثبت نمی‌شود.'}</div><Button block disabled={!canOnTask(selectedOutcomeTask)||!outcomeCode||(outcomeCode==='PAYMENT_RECORDED'&&(!outcomePaymentId||availablePayments.length===0))} onClick={saveCollectionOutcome} icon={<CheckCircle2 size={15}/>}>ثبت نتیجه و تکمیل وظیفه</Button>{!canOnTask(selectedOutcomeTask)&&<p className="text-xs text-warning">مجوز و محدودهٔ دسترسی برای ویرایش این وظیفه کافی نیست.</p>}{selectedOutcomeTask.resultHistory?.length>0&&<div className="sm:col-span-2 space-y-2 border-t border-border pt-3"><h3 className="text-sm font-black text-text-main">تاریخچهٔ نتایج</h3>{[...selectedOutcomeTask.resultHistory].reverse().map((item:any,index:number)=><div key={`${item.recordedAt}-${index}`} className="rounded-xl border border-border p-3 text-xs leading-6"><div className="font-bold text-text-main">{COLLECTION_OUTCOME_OPTIONS.find(option=>option.value===item.outcome)?.label||item.outcome}</div><div className="text-text-secondary">{new Date(item.recordedAt).toLocaleString('fa-IR')}{item.collectedAmount!==undefined?` · مبلغ ثبت‌شده: ${Number(item.collectedAmount).toLocaleString('fa-IR')}`:''}</div>{item.failureReason&&<div>علت: {item.failureReason}</div>}{item.note&&<div>یادداشت: {item.note}</div>}</div>)}</div>}</div>}</>}</Card>}
    <Card padding="md" className="flex items-start gap-3 border-warning/30 bg-warning-soft"><Clock3 size={18} className="mt-1 shrink-0 text-warning"/><div className="text-xs leading-6 text-text-main"><strong>محدودیت‌های باقی‌مانده:</strong> نقشهٔ کاشی‌ای و رسم لمسی اضافه شده است؛ هنوز آزمون واقعی شبکه/آیفون، ارائه‌دهندهٔ دارای SLA برای ترافیک تجاری، چاپ نقشه و سرویس سمت سرور/قرارداد مالی نهایی باید جداگانه تأیید شوند. برای این موارد هیچ نتیجهٔ ساختگی نمایش داده نمی‌شود.</div></Card>
  </div>;
}
