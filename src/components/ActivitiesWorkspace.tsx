import React from 'react';
import { AppState } from '../types';
import { Activity, PhoneCall, Calendar, MessageSquare, Plus } from 'lucide-react';
import { formatAppDate } from '../lib/utils';

export function ActivitiesWorkspace({ state, updateState, setActiveTab }: { state: AppState; updateState: any; setActiveTab: (tab: string) => void }) {
  const events = state.timelineEvents || [
    { id: '1', title: 'تماس تلفنی جهت هماهنگی جلسه دمو', description: 'با آقای مهندس حسینی صحبت شد و دمو برای دوشنبه ساعت ۱۰ تنظیم گردید.', dateTime: new Date().toISOString(), type: 'CALL' },
    { id: '2', title: 'صدور پیش‌فاکتور اولیه سیستم', description: 'پیش‌فاکتور ارسال و از طریق پیامک اطلاع‌رسانی شد.', dateTime: new Date(Date.now() - 86400000).toISOString(), type: 'QUOTE' },
  ];

  return (
    <div className="w-full space-y-4 px-1 py-1 sm:px-3 sm:py-3 pb-24 font-premium" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-ink">گاه‌شمار فعالیت‌ها و تعاملات</h2>
          <p className="text-xs text-ink-soft mt-1">لاگ تماس‌ها، یادداشت‌های پیگیری، جلسات و تغییرات وضعیت در پرونده‌ها</p>
        </div>
        <button 
          onClick={() => setActiveTab('accounts')}
          className="px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Plus size={15} /> ثبت تعامل در پروفایل مشتری ۳۶۰
        </button>
      </div>

      <div className="space-y-3">
        {events.map((ev: any) => (
          <div key={ev.id} className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-ink">{ev.title}</h4>
                <span className="text-[10px] text-ink-soft font-mono">
                  {formatAppDate(ev.dateTime, state.settings?.locale, 'full')}
                </span>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">{ev.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
