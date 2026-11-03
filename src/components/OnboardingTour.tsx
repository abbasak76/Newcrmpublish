import React, { useState } from 'react';
import { AppState } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { ArrowLeft, ArrowRight, CheckCircle2, Compass, Users, CheckSquare, MessagesSquare, Settings } from 'lucide-react';

const TOUR_STEPS = [
  { key: 'home', title: 'نمای کلی کارها', description: 'از صفحه خانه، خلاصه وضعیت، اقدام‌های مهم و مسیرهای پرتکرار را دنبال کنید.', tab: 'home', icon: Compass },
  { key: 'accounts', title: 'مشتریان و پرونده ۳۶۰ درجه', description: 'برای مشاهده سابقه ارتباط، فعالیت‌ها، فرصت‌ها و وضعیت مالی، وارد پرونده مشتری شوید.', tab: 'accounts', icon: Users },
  { key: 'tasks', title: 'وظایف و پیگیری‌ها', description: 'وظیفه بسازید، مسئول فردی یا گروهی تعیین کنید، مهلت و اولویت بدهید و پیوست‌ها را مدیریت کنید.', tab: 'tasks', icon: CheckSquare },
  { key: 'groups', title: 'گفتگوها و تعاملات', description: 'از گفتگوهای مستقیم و گروهی، منشن، پاسخ به پیام و ساخت وظیفه از پیام استفاده کنید.', tab: 'groups', icon: MessagesSquare },
  { key: 'settings', title: 'تنظیمات و دسترسی‌ها', description: 'تنظیمات محیط، کاربران، نقش‌ها و اتصال‌ها را بر اساس مجوز خود مدیریت کنید.', tab: 'settings', icon: Settings },
] as const;

export function OnboardingTour({
  state,
  updateState,
  setActiveTab,
}: {
  state: AppState;
  updateState: (updater: (draft: AppState) => AppState | void) => void;
  setActiveTab: (tab: string) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  if (state.onboardingCompleted || dismissed) return null;

  const step = TOUR_STEPS[stepIndex];
  const StepIcon = step.icon;
  const finish = () => {
    updateState(draft => { draft.onboardingCompleted = true; });
    setDismissed(true);
  };
  const next = () => {
    if (stepIndex >= TOUR_STEPS.length - 1) finish();
    else setStepIndex(i => i + 1);
  };

  return (
    <Modal
      isOpen
      onClose={finish}
      title="راهنمای شروع کار با AKHAVAN CRM"
      subtitle={`گام ${stepIndex + 1} از ${TOUR_STEPS.length}`}
      size="md"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={finish}>فعلاً رد می‌کنم</Button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && <Button variant="outline" size="sm" onClick={() => setStepIndex(i => Math.max(0, i - 1))}><ArrowRight size={14} /> قبلی</Button>}
            <Button variant="primary" size="sm" onClick={next}>{stepIndex === TOUR_STEPS.length - 1 ? <><CheckCircle2 size={14} /> پایان راهنما</> : <>گام بعدی <ArrowLeft size={14} /></>}</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 py-2" dir="rtl">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-canvas p-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><StepIcon size={26} /></div>
          <div className="min-w-0 flex-1"><h3 className="text-sm font-extrabold text-text-main">{step.title}</h3><p className="mt-1 text-xs leading-6 text-text-secondary">{step.description}</p></div>
        </div>
        <div className="flex items-center justify-center gap-2" aria-label="پیشرفت راهنما">
          {TOUR_STEPS.map((item, index) => <span key={item.key} className={`h-1.5 rounded-full transition-all ${index === stepIndex ? 'w-8 bg-primary' : 'w-2 bg-border-strong'}`} />)}
        </div>
        <Button variant="outline" size="sm" onClick={() => setActiveTab(step.tab)} className="w-full">رفتن به این بخش</Button>
      </div>
    </Modal>
  );
}
