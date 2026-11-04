import React, { useState } from 'react';
import { AppState, NavigationTab, UserAccount } from '../types';
import { AuthService } from '../services/AuthService';
import { 
  User, Shield, Mail, Phone, MapPin, Building2, 
  CheckCircle2, RefreshCw, Key,
  TrendingUp, FileText, CheckSquare
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';

interface ProfileWorkspaceProps {
  state: AppState;
  updateState: (updater: (draft: AppState) => AppState | void) => void;
  setActiveTab: (tab: NavigationTab) => void;
}

export function ProfileWorkspace({ state, updateState, setActiveTab }: ProfileWorkspaceProps) {
  const currentUser = AuthService.getCurrentUser(state);
  const permissionSet = state.permissionSets?.find(p => p.id === currentUser?.permissionSetId);
  const userRole = state.roles?.find(r => r.id === currentUser?.roleId);
  
  const [editingPhone, setEditingPhone] = useState(currentUser?.phone || '');
  const [editingEmail, setEditingEmail] = useState(currentUser?.email || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const userTasks = (state.tasks || []).filter(t => t.assigneeId === currentUser?.id);
  const openTasksCount = userTasks.filter(t => t.status !== 'COMPLETED').length;
  const userQuotesCount = (state.quotes || []).filter(q => q.ownerId === currentUser?.id).length;
  const userOppsCount = (state.opportunities || []).filter(o => o.ownerId === currentUser?.id).length;

  const handleUserSwitch = (userId: string) => {
    updateState(draft => {
      draft.currentUserId = userId;
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    updateState(draft => {
      const u = draft.users.find(item => item.id === currentUser.id);
      if (u) {
        u.phone = editingPhone;
        u.email = editingEmail;
      }
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const branch = (state.branches || []).find((b: any) => b.id === currentUser?.branchId);
  const territory = (state.territories || []).find((t: any) => t.id === currentUser?.territoryId);

  if (!currentUser) {
    return <div className="p-8 text-center text-text-secondary">کاربری یافت نشد.</div>;
  }

  return (
    <div className="flex-1 overflow-auto bg-transparent p-4 sm:p-6 pb-28 md:pb-12 space-y-5" dir="rtl">
      <div className="bg-primary rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-hover/50 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-right">
          <Avatar 
            name={currentUser.name} 
            size="lg" 
            className="ring-4 ring-white/20 shadow-lg text-lg"
          />
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-extrabold">{currentUser.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
                {permissionSet?.name || 'مدیر سیستم'}
              </span>
            </div>
            <p className="text-xs text-white/90 leading-relaxed max-w-xl">
              محدوده دسترسی اطلاعاتی (دید): <strong className="font-mono bg-white/10 px-2 py-0.5 rounded">{userRole?.visibilityScope || 'ORG'}</strong>
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-white/80 pt-2 font-mono">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-white/60" />
                نام کاربری: {currentUser.username}
              </span>
              {branch && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-white/60" />
                  شعبه: {branch.name}
                </span>
              )}
              {territory && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-white/60" />
                  قلمرو: {territory.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md" className="flex items-center gap-4 bg-surface border-border/80">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
            <CheckSquare size={24} />
          </div>
          <div>
            <span className="text-xs text-text-secondary font-bold">وظایف در انتظار من</span>
            <div className="text-xl font-extrabold font-mono text-text-main mt-1">{openTasksCount} وظیفه</div>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-4 bg-surface border-border/80">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 shadow-xs">
            <FileText size={24} />
          </div>
          <div>
            <span className="text-xs text-text-secondary font-bold">پیش‌فاکتورهای ثبت‌شده من</span>
            <div className="text-xl font-extrabold font-mono text-text-main mt-1">{userQuotesCount} مورد</div>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-4 bg-surface border-border/80">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary-950/40 text-primary dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-xs text-text-secondary font-bold">فرصت‌های در دست مذاکره</span>
            <div className="text-xl font-extrabold font-mono text-text-main mt-1">{userOppsCount} فرصت</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card padding="lg" className="space-y-4 bg-surface border-border/80">
          <h3 className="font-bold text-base text-text-main flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> مشخصات تماس و اطلاعات فردی
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-text-main mb-1">شماره تماس همراه</label>
              <input 
                type="text" 
                value={editingPhone} 
                onChange={e => setEditingPhone(e.target.value)}
                className="w-full bg-canvas border border-border rounded-xl p-2.5 font-mono outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-text-main mb-1">پست الکترونیکی سازمانی</label>
              <input 
                type="email" 
                value={editingEmail} 
                onChange={e => setEditingEmail(e.target.value)}
                className="w-full bg-canvas border border-border rounded-xl p-2.5 font-mono outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button type="submit" variant="primary" size="sm">
                ذخیره تغییرات
              </Button>
              {saveSuccess && (
                <span className="text-primary font-bold flex items-center gap-1">
                  <CheckCircle2 size={16} /> ذخیره شد
                </span>
              )}
            </div>
          </form>
        </Card>

        <Card padding="lg" className="space-y-4 bg-surface border-border/80">
          <h3 className="font-bold text-base text-text-main flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" /> سوییچ سریع بین کاربران سازمانی (RBAC Simulator)
          </h3>
          <p className="text-xs text-text-secondary">
            برای تست سطوح دسترسی (DO) و قلمرو دید رکوردها (SEE)، می‌توانید حساب کاربری فعال را تغییر دهید.
          </p>

          <div className="space-y-2.5">
            {state.users.map(u => {
              const pSet = state.permissionSets?.find(p => p.id === u.permissionSetId);
              const r = state.roles?.find(role => role.id === u.roleId);
              const isCurrent = u.id === currentUser.id;

              return (
                <div 
                  key={u.id}
                  onClick={() => handleUserSwitch(u.id)}
                  className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${isCurrent ? 'bg-primary/5 border-primary/30 shadow-subtle' : 'bg-canvas border-border hover:bg-border'}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-bold text-text-main">{u.name}</strong>
                      <span className="text-[10px] text-text-secondary font-mono">(@{u.username})</span>
                    </div>
                    <span className="text-[11px] text-text-secondary block mt-0.5">
                      پروفایل: {pSet?.name} | محدوده دید: <strong className="font-mono text-info">{r?.visibilityScope}</strong>
                    </span>
                  </div>

                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${isCurrent ? 'bg-primary text-white' : 'bg-white text-text-main border border-border'}`}>
                    {isCurrent ? 'کاربر جاری' : 'انتخاب'}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
