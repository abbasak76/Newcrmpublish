import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { AppState } from '../types';
import { idbGet, idbSet, idbDel } from './idb';
import { generateSeedData } from './seed';
import { DEFAULT_COA_MIRROR, DEFAULT_REPORT_BUCKETS, DEFAULT_ACCOUNT_MAP_RULES } from './accountingMapping';

const STORAGE_VERSION = 19;
const STORAGE_NAME = 'akhavan_app_state';
const SYNC_CHANNEL_NAME = 'akhavan_state_sync_channel';

const MAX_LOG_RECORDS = 1000;
const MAX_NOTIFICATIONS = 200;

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await idbGet<string>(name);
    return typeof value === 'string' ? value : null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await idbDel(name);
  },
};

interface AppStore {
  state: AppState;
  updateState: (updater: (draft: AppState) => void | Partial<AppState>) => void;
  error: string | null;
}

const cloneState = (state: AppState): AppState => {
  if (typeof structuredClone === 'function') return structuredClone(state);
  return JSON.parse(JSON.stringify(state)) as AppState;
};

const ensureStateIntegrity = (state: AppState): AppState => {
  const base = generateSeedData();
  
  const safeAuditLogs = Array.isArray(state?.auditLogs) ? state.auditLogs.slice(-MAX_LOG_RECORDS) : [];
  const safeNotifications = Array.isArray(state?.notifications) ? state.notifications.slice(-MAX_NOTIFICATIONS) : [];
  const safeBusinessEvents = Array.isArray(state?.businessEvents) ? state.businessEvents.slice(-MAX_LOG_RECORDS) : [];

  // Remove only known placeholder gateway credentials from earlier demo seeds. Never expose them as live integrations.
  const placeholderTokens = new Set(['bot_eitaa_akhavan_9921', 'rubika_auth_882194', 'bot_bale_crm_34807', 'kav_api_771829', 'wh_secret_8912']);
  const safeMessagingChannels = (Array.isArray(state?.messagingChannels) ? state.messagingChannels : (base.messagingChannels || [])).map((channel: any) => {
    const isPlaceholder = placeholderTokens.has(channel?.botToken || '');
    if (isPlaceholder) {
      return { ...channel, active: false, status: 'NOT_CONFIGURED', botToken: '', webhookUrl: '', autoReply: false, lastPing: undefined, latencyMs: undefined };
    }
    // This client has no verified provider connection service; a local flag alone cannot prove connectivity.
    if (channel?.status === 'CONNECTED') return { ...channel, status: 'CONFIGURING' };
    return channel;
  });
  const safeMessagingLogs = (Array.isArray(state?.messagingLogs) ? state.messagingLogs : []).filter((log: any) => !['msg-1', 'msg-2', 'msg-3'].includes(log?.id));
  const safeAgentLogs = (Array.isArray(state?.agentLogs) ? state.agentLogs : []).filter((log: any) => !['alog-1', 'alog-2'].includes(log?.id));

  return {
    ...base,
    ...state,
    schemaVersion: typeof state?.schemaVersion === 'number' ? state.schemaVersion : STORAGE_VERSION,
    auditLogs: safeAuditLogs,
    notifications: safeNotifications,
    businessEvents: safeBusinessEvents,
    paymentAllocations: Array.isArray(state?.paymentAllocations) ? state.paymentAllocations : [],
    geoZones: Array.isArray(state?.geoZones) && state.geoZones.length > 0 ? state.geoZones : (base as any).geoZones || [],
    zoneGeometryVersions: Array.isArray(state?.zoneGeometryVersions) && state.zoneGeometryVersions.length > 0 ? state.zoneGeometryVersions : (base as any).zoneGeometryVersions || [],
    zoneAssignments: Array.isArray(state?.zoneAssignments) && state.zoneAssignments.length > 0 ? state.zoneAssignments : (base as any).zoneAssignments || [],
    geoMetricDefinitions: Array.isArray(state?.geoMetricDefinitions) ? state.geoMetricDefinitions : [],
    zoneMetricSnapshots: Array.isArray(state?.zoneMetricSnapshots) ? state.zoneMetricSnapshots : [],
    suppliers: Array.isArray(state?.suppliers) ? state.suppliers : (base as any).suppliers || [],
    purchaseRequests: Array.isArray(state?.purchaseRequests) ? state.purchaseRequests : (base as any).purchaseRequests || [],
    salesOrders: Array.isArray(state?.salesOrders) ? state.salesOrders : (base as any).salesOrders || [],
    dispatchPlans: Array.isArray(state?.dispatchPlans) ? state.dispatchPlans : (base as any).dispatchPlans || [],
    salesReturns: Array.isArray(state?.salesReturns) ? state.salesReturns : (base as any).salesReturns || [],
    commercialPolicies: Array.isArray(state?.commercialPolicies) ? state.commercialPolicies : (base as any).commercialPolicies || [],
    reconciliationCases: Array.isArray(state?.reconciliationCases) ? state.reconciliationCases : (base as any).reconciliationCases || [],
    seedMetadata: state?.seedMetadata || (base as any).seedMetadata,
    articles: Array.isArray(state?.articles) && state.articles.length > 0 ? state.articles : (base as any).articles || [],
    cases: Array.isArray(state?.cases) && state.cases.length > 0 ? state.cases : (base as any).cases || [],
    campaigns: Array.isArray(state?.campaigns) && state.campaigns.length > 0 ? state.campaigns : (base as any).campaigns || [],
    creditNotes: Array.isArray(state?.creditNotes) && state.creditNotes.length > 0 ? state.creditNotes : (base as any).creditNotes || [],
    financeRequests: Array.isArray(state?.financeRequests) && state.financeRequests.length > 0 ? state.financeRequests : (base as any).financeRequests || [],
    coaMirror: Array.isArray(state?.coaMirror) && state.coaMirror.length > 0 ? state.coaMirror : DEFAULT_COA_MIRROR,
    reportBuckets: Array.isArray(state?.reportBuckets) && state.reportBuckets.length > 0 ? state.reportBuckets : DEFAULT_REPORT_BUCKETS,
    accountMapRules: Array.isArray(state?.accountMapRules) && state.accountMapRules.length > 0 ? state.accountMapRules : DEFAULT_ACCOUNT_MAP_RULES,
    bankMaps: Array.isArray(state?.bankMaps) ? state.bankMaps : [],
    cashboxMaps: Array.isArray(state?.cashboxMaps) ? state.cashboxMaps : [],
    outbox: Array.isArray(state?.outbox) ? state.outbox : [],
    onboardingApplications: Array.isArray(state?.onboardingApplications) && state.onboardingApplications.length > 0 ? state.onboardingApplications : (base as any).onboardingApplications || [],
    personnelFiles: Array.isArray(state?.personnelFiles) && state.personnelFiles.length > 0 ? state.personnelFiles : (base as any).personnelFiles || [],
    internalRequests: Array.isArray(state?.internalRequests) && state.internalRequests.length > 0 ? state.internalRequests : (base as any).internalRequests || [],
    internalMeetings: Array.isArray(state?.internalMeetings) && state.internalMeetings.length > 0 ? state.internalMeetings : (base as any).internalMeetings || [],
    attachments: Array.isArray(state?.attachments) ? state.attachments : [],
    agents: Array.isArray(state?.agents) && state.agents.length > 0 ? state.agents : base.agents,
    agentLogs: safeAgentLogs,
    messagingChannels: safeMessagingChannels,
    messagingLogs: safeMessagingLogs,
    settings: {
      ...base.settings,
      ...(state?.settings || {}),
      locale: {
        ...(base.settings?.locale || {}),
        ...(state?.settings?.locale || {})
      }
    }
  };
};

const broadcastChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(SYNC_CHANNEL_NAME) : null;

export const useAppStore = create<AppStore>()(
  persist(
    (set: any) => {
      if (broadcastChannel) {
        broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'STATE_UPDATED') {
            idbGet(STORAGE_NAME).then((persistedStr) => {
              if (persistedStr) {
                const parsed = JSON.parse(persistedStr);
                set({ state: ensureStateIntegrity(parsed.state), error: null });
              }
            });
          }
        };
      }

      return {
        state: ensureStateIntegrity(generateSeedData()),
        error: null as string | null,
        updateState: (updater: (draft: AppState) => void | Partial<AppState>) =>
          set((prev: AppStore) => {
            try {
              const newState = cloneState(prev.state);
              const result = updater(newState);
              const finalState = ensureStateIntegrity(result ? { ...newState, ...result } : newState);
              
              if (broadcastChannel) {
                broadcastChannel.postMessage({ type: 'STATE_UPDATED', timestamp: Date.now() });
              }

              return { state: finalState, error: null };
            } catch (err: any) {
              console.error('[AKHAVAN][STATE_UPDATE_FAILED]', err);
              return { ...prev, error: err?.message || 'خطا در بروزرسانی اطلاعات سامانه.' };
            }
          }),
      };
    },
    {
      name: STORAGE_NAME,
      storage: createJSONStorage(() => idbStorage),
      version: STORAGE_VERSION,
      // Migrate older persisted local states by filling newly introduced seed-backed collections without replacing user data.
      merge: (persistedState: unknown, currentState: AppStore): AppStore => {
        const persisted = (persistedState || {}) as Partial<AppStore>;
        const persistedAppState = (persisted as any).state as AppState | undefined;
        return { ...currentState, ...persisted, state: ensureStateIntegrity(persistedAppState || currentState.state) };
      },
    }
  )
);
