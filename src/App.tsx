import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from './lib/storage';
import { playNotificationSound } from './lib/sound';
import { useWorkflowEngine } from './hooks/useWorkflowEngine';
import { Layout } from './components/Layout';
import { HomeWorkspace } from './components/HomeWorkspace';
import { CommandCenterWorkspace } from './components/CommandCenterWorkspace';
import { DashboardWorkspace } from './components/DashboardWorkspace';
import { LeadsWorkspace } from './components/LeadsWorkspace';
import { CustomersWorkspace } from './components/CustomersWorkspace';
import { NegotiationsWorkspace } from './components/NegotiationsWorkspace';
import { QuotesWorkspace } from './components/QuotesWorkspace';
import { TasksWorkspace } from './components/TasksWorkspace';
import { FinanceWorkspace } from './components/FinanceWorkspace';
import { OperationsControlWorkspace } from './components/OperationsControlWorkspace';
import { GeoIntelligenceWorkspace } from './components/GeoIntelligenceWorkspace';
import { ReportsWorkspace } from './components/ReportsWorkspace';
import { SettingsWorkspace } from './components/SettingsWorkspace';
import { ActivitiesWorkspace } from './components/ActivitiesWorkspace';
import { CasesWorkspace, CampaignsWorkspace, KnowledgeWorkspace } from './components/EnterpriseWorkspaces';
import { InternalAutomationWorkspace } from './components/InternalAutomationWorkspace';
import { GroupsWorkspace } from './components/GroupsWorkspace';
import { CalendarWorkspace } from './components/CalendarWorkspace';
import { ProfileWorkspace } from './workspaces/ProfileWorkspace';
import { CommandPalette } from './components/CommandPalette';
import { OnboardingTour } from './components/OnboardingTour';
import { LoginWorkspace } from './components/LoginWorkspace';
import { ApplyPage } from './components/onboarding/ApplyPage';
import { PersonnelFilePage } from './components/onboarding/PersonnelFilePage';
import { OnboardingAdminWorkspace } from './components/onboarding/OnboardingAdminWorkspace';
import { getTenantName } from './lib/orgPolicy';
import { computeMissing, getOnboardingConfig } from './lib/onboarding';
import { SideDrawer } from './components/ui/Modal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LiveAnnouncer } from './components/ui/LiveAnnouncer';
import { RBACService } from './lib/rbac';
import { ThemeProvider } from './theme/ThemeProvider';
import { requestDevicePermissions } from './lib/permissions';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

function AppContent() {
  const { state, updateState, error } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [permissionsSynced, setPermissionsSynced] = useState(false);

  useWorkflowEngine(state, updateState);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (state?.settings?.locale) {
      document.documentElement.dir = state.settings.locale.rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = state.settings.locale.language;
    }
  }, [state?.settings?.locale?.rtl, state?.settings?.locale?.language]);

  useEffect(() => {
    const root = document.documentElement;
    const scale = state?.settings?.uiScale || 'normal';
    root.style.fontSize = scale === 'large' ? '18px' : scale === 'extra-large' ? '20px' : '16px';
    root.dataset.performanceMode = state?.settings?.performanceMode || 'auto';
  }, [state?.settings?.uiScale, state?.settings?.performanceMode]);

  useEffect(() => {
    if (!state) return;
    const currentCount = state.notifications?.length || 0;
    const prevCount = parseInt(sessionStorage.getItem('notifCount') || '0', 10);
    
    if (prevCount > 0 && currentCount > prevCount) {
      if (state.settings?.privacy?.soundEnabled) playNotificationSound();
    }
    sessionStorage.setItem('notifCount', currentCount.toString());
  }, [state?.notifications?.length, state?.settings?.privacy?.soundEnabled]);

  useEffect(() => {
    // همگام‌سازی مجوزهای دستگاه؛ با تایم‌اوت تا در پیش‌نمایش/iframe هرگز روی «در حال بارگذاری» گیر نکند
    const withTimeout = <T,>(p: Promise<T>, ms = 1500) => Promise.race<T>([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('permission query timeout')), ms))]);
    const syncPerms = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const geo = await withTimeout(navigator.permissions.query({ name: 'geolocation' as any }));
          const notif = await withTimeout(navigator.permissions.query({ name: 'notifications' as any }));
          updateState(draft => {
            if (!draft.grantedDevicePermissions) draft.grantedDevicePermissions = { LOCATION: false, CAMERA: false, MICROPHONE: false, NOTIFICATIONS: false };
            draft.grantedDevicePermissions.LOCATION = geo.state === 'granted';
            draft.grantedDevicePermissions.NOTIFICATIONS = notif.state === 'granted';
          });
        }
      } catch (e) {
        console.warn('Permission query failed', e);
      } finally {
        setPermissionsSynced(true);
      }
    };
    syncPerms();
  }, [updateState]);

  const handleNotificationClick = (n: any) => {
    updateState(draft => {
      const notif = draft.notifications?.find((x: any) => x.id === n.id);
      if (notif) notif.read = true;
    });
    setIsNotificationsOpen(false);

    if (n.linkTab) {
      const routeMap: Record<string, string> = {
        home: '/',
        accounts: '/accounts',
        tasks: '/tasks',
        quotes: '/quotes',
        finance: '/finance',
        internal_automation: '/internal_automation',
        groups: '/groups'
      };
      navigate(routeMap[n.linkTab] || `/${n.linkTab}`);
    }
  };

  if (error) return <div className="p-8 text-center text-danger font-bold bg-danger-soft h-screen flex items-center justify-center" dir="rtl">{error}</div>;
  if (!state || !permissionsSynced) return <div className="p-8 text-center text-text-secondary h-screen flex justify-center items-center bg-canvas" dir="rtl">در حال بارگذاری...</div>;
  // صفحه ورود سه‌بعدی و احراز هویت
  const afterLogin = (u: { id: string }) => {
    updateState(draft => {
      draft.currentUserId = u.id;
    });
    const f = (state.personnelFiles || []).find((x: any) => x.userId === u.id);
    navigate(computeMissing(f, getOnboardingConfig(state)).length && getOnboardingConfig(state).enabled && (!f || f.status !== 'APPROVED') ? '/personnel-file' : '/');
  };
  if (location.pathname === '/login' || !state.currentUserId) return <LoginWorkspace state={state} tenantName={getTenantName(state)} logoUrl={(state.settings as any)?.orgConfig?.logoUrl} applyEnabled={getOnboardingConfig(state).enabled} onAuthenticated={afterLogin} />;
  if (location.pathname === '/apply') return <ApplyPage state={state} updateState={updateState} />;

  const currentUser = state.users?.find(u => u.id === state.currentUserId);
  const currentRole = state.roles?.find(r => r.id === currentUser?.roleId);
  const requiredDevicePerms = currentRole?.requiredDevicePermissions || [];
  // اجباری‌سازی دسترسی‌های دستگاه به‌صورت پیش‌فرض غیرفعال است (تنظیمات ← کاربران و نقش‌ها)؛ قابلیت حذف نشده
  const enforceDevicePerms = state.settings?.enforceDevicePermissions === true;
  const missingPerms = enforceDevicePerms ? requiredDevicePerms.filter(p => !state.grantedDevicePermissions?.[p]) : [];

  if (missingPerms.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-text-main p-6 text-center" dir="rtl">
        <div className="bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-5">
          <div className="w-16 h-16 bg-danger-soft text-danger rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-main">دسترسی‌های الزامی مسدود است</h2>
            <p className="text-sm text-text-secondary mt-2 leading-relaxed">
              با توجه به نقش شما ({currentRole?.name})، اجرای وظایف نیازمند تایید دسترسی‌های زیر است:
            </p>
            <div className="flex flex-wrap gap-2 justify-center my-3">
              {missingPerms.map(p => (
                <span key={p} className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-xl font-bold border border-red-100">
                  {p === 'LOCATION' ? 'موقعیت مکانی (GPS)' : p === 'NOTIFICATIONS' ? 'اعلان‌ها' : p === 'CAMERA' ? 'دوربین' : 'میکروفون'}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-2.5 w-full">
            <button 
              onClick={async () => {
                const res = await requestDevicePermissions(missingPerms as any);
                updateState(draft => {
                  if (!draft.grantedDevicePermissions) {
                    draft.grantedDevicePermissions = { LOCATION: false, CAMERA: false, MICROPHONE: false, NOTIFICATIONS: false };
                  }
                  missingPerms.forEach(p => {
                    draft.grantedDevicePermissions![p] = res[p] === true;
                  });
                });
              }}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl shadow-sm transition-all flex justify-center items-center gap-2 cursor-pointer"
            >
              <ShieldCheck size={20} /> بررسی و تایید دسترسی‌ها
            </button>
            <p className="text-xs leading-6 text-text-secondary" role="status">
              اگر دسترسی رد شده است، آن را از تنظیمات مرورگر یا سیستم‌عامل فعال کنید و سپس دوباره بررسی کنید. برنامه دسترسی ردشده را به‌صورت خودکار مجاز اعلام نمی‌کند.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const visibleNotifications = (state.notifications || []).filter(n => !n.recipientId || n.recipientId === state.currentUserId);
  const unreadNotificationsCount = visibleNotifications.filter(n => !n.read).length;
  const rbac = new RBACService(state);
  const guard = (tab: any, element: React.ReactNode) => rbac.canAccessWorkspace(tab) ? element : <Navigate to="/" replace />;
  const guardAny = (allowed: boolean, element: React.ReactNode) => allowed ? element : <Navigate to="/" replace />;

  return (
    <>
      <LiveAnnouncer />
      <Layout 
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        state={state}
        updateState={updateState}
      >
        <Routes>
          <Route path="/" element={<HomeWorkspace state={state} />} />
          <Route path="/command" element={guardAny(rbac.hasPermission('accounts.view') || rbac.hasPermission('internal.view'), <CommandCenterWorkspace state={state} updateState={updateState} />)} />
          <Route path="/dashboard" element={guard('dashboard', <DashboardWorkspace state={state} />)} />
          <Route path="/leads" element={guard('leads', <LeadsWorkspace state={state} updateState={updateState} setActiveTab={(t: string) => navigate(`/${t}`)} />)} />
          <Route path="/accounts/*" element={guard('accounts', <CustomersWorkspace state={state} updateState={updateState} />)} />
          <Route path="/customers/*" element={guard('accounts', <CustomersWorkspace state={state} updateState={updateState} />)} />
          <Route path="/opportunities" element={guard('leads', <NegotiationsWorkspace state={state} updateState={updateState} setActiveTab={(t: string) => navigate(`/${t}`)} />)} />
          <Route path="/quotes" element={guard('quotes', <QuotesWorkspace state={state} updateState={updateState} setActiveTab={(t: string) => navigate(`/${t}`)} />)} />
          <Route path="/activities" element={guard('activities', <ActivitiesWorkspace state={state} updateState={updateState} setActiveTab={(t: string) => navigate(`/${t}`)} />)} />
          <Route path="/tasks" element={guard('tasks', <TasksWorkspace state={state} updateState={updateState} />)} />
          <Route path="/finance" element={guard('finance', <FinanceWorkspace state={state} updateState={updateState} />)} />
          <Route path="/operations" element={guard('operations_control', <OperationsControlWorkspace state={state} updateState={updateState} />)} />
          <Route path="/operations_control" element={guard('operations_control', <OperationsControlWorkspace state={state} updateState={updateState} />)} />
          <Route path="/operations-control" element={guard('operations_control', <OperationsControlWorkspace state={state} updateState={updateState} />)} />
          <Route path="/geo-intelligence" element={guard('geo_intelligence', <GeoIntelligenceWorkspace state={state} updateState={updateState} />)} />
          <Route path="/geo_intelligence" element={guard('geo_intelligence', <GeoIntelligenceWorkspace state={state} updateState={updateState} />)} />
          <Route path="/cases" element={guard('cases', <CasesWorkspace state={state} updateState={updateState} setActiveTab={(t: string) => navigate(`/${t}`)} />)} />
          <Route path="/marketing" element={guard('marketing', <CampaignsWorkspace state={state} updateState={updateState} setActiveTab={(t: string) => navigate(`/${t}`)} />)} />
          <Route path="/knowledge" element={guard('knowledge', <KnowledgeWorkspace state={state} updateState={updateState} setActiveTab={(t: string) => navigate(`/${t}`)} />)} />
          <Route path="/internal_automation" element={guard('internal_automation', <InternalAutomationWorkspace state={state} updateState={updateState} setActiveTab={(t: string) => navigate(`/${t}`)} />)} />
          <Route path="/groups" element={guardAny(rbac.hasPermission('accounts.view') || rbac.hasPermission('internal.view') || rbac.hasPermission('internal.manage'), <GroupsWorkspace state={state} updateState={updateState} setActiveTab={(t: string) => navigate(`/${t}`)} />)} />
          <Route path="/calendar" element={guard('calendar', <CalendarWorkspace state={state} />)} />
          <Route path="/reports" element={guard('reports', <ReportsWorkspace state={state} updateState={updateState} setActiveTab={(t: string) => navigate(`/${t}`)} />)} />
          <Route path="/settings" element={guard('settings', <SettingsWorkspace state={state} updateState={updateState} />)} />
          <Route path="/onboarding" element={guard('onboarding', <OnboardingAdminWorkspace state={state} updateState={updateState} />)} />
          <Route path="/personnel-file" element={<PersonnelFilePage state={state} updateState={updateState} />} />
          <Route path="/profile" element={<ProfileWorkspace state={state} updateState={updateState} setActiveTab={(t: string) => navigate(`/${t}`)} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} state={state} updateState={updateState} />

      <SideDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} title="مرکز اعلان‌ها" subtitle={`${unreadNotificationsCount} اعلان جدید`} width="md">
        <div className="space-y-3" role="list" aria-live="polite">
          {visibleNotifications.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border-strong px-4 py-10 text-center text-xs font-medium text-text-secondary">اعلانی وجود ندارد.</div>
          )}
          {visibleNotifications.slice(-20).reverse().map(n => (
            <button key={n.id} role="listitem" onClick={() => handleNotificationClick(n)}
              className={`se-interactive se-pressable block min-h-[44px] w-full cursor-pointer rounded-2xl border p-4 text-start ${n.read ? 'border-border bg-canvas opacity-70' : 'border-primary/30 bg-white shadow-card'}`}>
              <div className="mb-1 flex items-start justify-between">
                <strong className="text-sm font-bold text-text-main">{n.title}</strong>
                {!n.read && <span className="mt-1 h-2 w-2 rounded-full bg-primary" aria-label="خوانده‌نشده" />}
              </div>
              <p className="text-xs leading-relaxed text-text-secondary">{n.message}</p>
            </button>
          ))}
        </div>
      </SideDrawer>

      <OnboardingTour state={state} updateState={updateState} setActiveTab={(t) => navigate(t === 'home' ? '/' : `/${t}`)} />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
