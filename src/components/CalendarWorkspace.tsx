import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppState } from '../types';
import { 
  CalendarDays, Clock, ArrowLeft, ChevronRight, ChevronLeft, 
  Calendar as CalendarIcon, CheckSquare, FileText, Users, Plus 
} from 'lucide-react';
import { Card } from './ui/Card';
import { 
  getJalaliDate, 
  jalaliToGregorianISO, 
  getJalaliMonthDays, 
  JALALI_MONTH_NAMES, 
  toPersianDigits,
  formatAppDate
} from '../lib/utils';

export function CalendarWorkspace({ state }: { state: AppState }) {
  const navigate = useNavigate();
  const tasks = state.tasks || [];
  const meetings = state.internalMeetings || [];
  const cheques = state.cheques || [];
  
  const isJalali = state.settings?.locale?.calendar !== 'gregorian';
  const todayJalali = getJalaliDate();

  const [currentYear, setCurrentYear] = useState<number>(todayJalali.jy);
  const [currentMonth, setCurrentMonth] = useState<number>(todayJalali.jm);
  const [selectedDay, setSelectedDay] = useState<number | null>(todayJalali.jd);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TASKS' | 'MEETINGS' | 'CHEQUES'>('ALL');

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(prev => prev - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(prev => prev + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDay(null);
  };

  const handleGoToday = () => {
    setCurrentYear(todayJalali.jy);
    setCurrentMonth(todayJalali.jm);
    setSelectedDay(todayJalali.jd);
  };

  const daysInMonth = getJalaliMonthDays(currentYear, currentMonth);
  const monthName = JALALI_MONTH_NAMES[currentMonth - 1] || '';
  const monthYearDisplay = `${monthName} ${toPersianDigits(currentYear)}`;

  // Calculate day-of-week offset for day 1
  // In Iranian calendar, Saturday is index 0.
  const firstDayGDate = new Date(jalaliToGregorianISO(currentYear, currentMonth, 1));
  const gDay = firstDayGDate.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
  const startOffset = (gDay + 1) % 7; // Sat -> 0, Sun -> 1, Mon -> 2, ..., Fri -> 6

  const weekDays = ['شنبه', '۱شنبه', '۲شنبه', '۳شنبه', '۴شنبه', '۵شنبه', 'جمعه'];

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Group items for a day
  const itemsForDay = (day: number) => {
    const dayISO = jalaliToGregorianISO(currentYear, currentMonth, day);
    const dayTasks = tasks.filter(t => t.dueDate === dayISO);
    const dayMeetings = meetings.filter((m: any) => m.date === dayISO || (!m.date && day === todayJalali.jd && currentMonth === todayJalali.jm));
    const dayCheques = cheques.filter(c => c.dueDate === dayISO);

    return {
      tasks: dayTasks,
      meetings: dayMeetings,
      cheques: dayCheques,
      count: dayTasks.length + dayMeetings.length + dayCheques.length,
      iso: dayISO
    };
  };

  const activeDayData = selectedDay ? itemsForDay(selectedDay) : itemsForDay(todayJalali.jd);
  const activeDayISO = selectedDay ? jalaliToGregorianISO(currentYear, currentMonth, selectedDay) : jalaliToGregorianISO(currentYear, currentMonth, todayJalali.jd);

  return (
    <div className="w-full space-y-5 px-1 py-1 sm:px-3 sm:py-3 pb-32 font-premium" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-text-main tracking-tight">تقویم کاری و سررسیدهای خورشیدی</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            {isJalali ? `تقویم رسمی هجری شمسی (${monthYearDisplay})` : 'نمای تقویم میلادی'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/tasks')} 
            className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            میز کار وظایف <ArrowLeft size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Month Calendar Grid */}
        <Card padding="lg" className="bg-surface border border-border/80 shadow-subtle rounded-3xl p-6 lg:col-span-2 space-y-5">
          <div className="flex justify-between items-center border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <h2 className="text-base font-extrabold text-text-main">{monthYearDisplay}</h2>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-border/80 hover:bg-canvas text-text-secondary cursor-pointer transition-colors"
                title="ماه قبل"
              >
                <ChevronRight size={16} />
              </button>
              <button 
                onClick={handleGoToday}
                className="px-2.5 py-1 text-xs font-bold bg-canvas rounded-lg border border-border/80 text-text-main hover:bg-slate-100 transition-colors cursor-pointer"
              >
                امروز ({toPersianDigits(todayJalali.jd)} {JALALI_MONTH_NAMES[todayJalali.jm - 1]})
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-border/80 hover:bg-canvas text-text-secondary cursor-pointer transition-colors"
                title="ماه بعد"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-text-secondary">
            {weekDays.map((wd, i) => (
              <div key={i} className="py-2 text-[11px] font-extrabold">
                {i === 6 ? <span className="text-red-500">{wd}</span> : wd}
              </div>
            ))}
          </div>

          {/* Calendar Month Days */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: startOffset }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-16 rounded-xl bg-canvas/30" />
            ))}
            {days.map(d => {
              const isToday = d === todayJalali.jd && currentMonth === todayJalali.jm && currentYear === todayJalali.jy;
              const isSelected = selectedDay === d;
              const dayData = itemsForDay(d);

              return (
                <div
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`h-16 p-1.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-right ${
                    isSelected 
                      ? 'border-primary bg-primary/10 shadow-sm' 
                      : isToday 
                        ? 'border-primary/60 bg-primary/5 font-extrabold' 
                        : 'border-border/60 bg-surface hover:bg-canvas'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-mono font-bold ${isToday ? 'text-primary' : 'text-text-main'}`}>
                      {toPersianDigits(d)}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                  {dayData.count > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {dayData.tasks.length > 0 && (
                        <span className="px-1 py-0.2 text-[9px] rounded-md bg-blue-100 text-blue-800 font-bold font-mono">
                          {toPersianDigits(dayData.tasks.length)} وظیفه
                        </span>
                      )}
                      {dayData.cheques.length > 0 && (
                        <span className="px-1 py-0.2 text-[9px] rounded-md bg-amber-100 text-amber-800 font-bold font-mono">
                          {toPersianDigits(dayData.cheques.length)} چک
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Day Events & Agenda Sidebar */}
        <Card padding="lg" className="bg-surface border border-border/80 shadow-subtle rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-border/60 pb-3">
            <h3 className="font-extrabold text-sm text-text-main flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> 
              {selectedDay 
                ? `رویدادهای ${toPersianDigits(selectedDay)} ${monthName} ${toPersianDigits(currentYear)}` 
                : `برنامه امروز (${toPersianDigits(todayJalali.jd)} ${monthName})`}
            </h3>
          </div>

          <div className="flex gap-1 border-b border-border/60 pb-2">
            {[
              { id: 'ALL', label: 'همه' },
              { id: 'TASKS', label: 'وظایف' },
              { id: 'MEETINGS', label: 'جلسات' },
              { id: 'CHEQUES', label: 'چک‌ها' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-2.5 py-1 text-[11px] rounded-lg font-bold cursor-pointer transition-colors ${
                  activeFilter === f.id ? 'bg-primary text-white' : 'text-text-secondary hover:bg-canvas'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
            {/* Meetings list */}
            {(activeFilter === 'ALL' || activeFilter === 'MEETINGS') && activeDayData.meetings.map((m: any) => (
              <div key={m.id} className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-1">
                <div className="flex justify-between items-start">
                  <strong className="text-xs font-bold text-purple-900">{m.title}</strong>
                  <span className="text-[10px] font-mono text-purple-700 font-bold">{m.startTime} - {m.endTime}</span>
                </div>
                <div className="text-[10px] text-purple-600 flex items-center gap-1">
                  <Users size={11} /> {m.participantIds?.length || 1} شرکت‌کننده
                </div>
              </div>
            ))}

            {/* Tasks list */}
            {(activeFilter === 'ALL' || activeFilter === 'TASKS') && activeDayData.tasks.map(t => (
              <div 
                key={t.id} 
                onClick={() => navigate('/tasks')}
                className="p-3 rounded-2xl bg-canvas border border-border/80 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <div>
                  <span className="font-bold text-xs text-text-main group-hover:text-primary transition-colors block">{t.title}</span>
                  <span className="text-[10px] text-text-secondary mt-0.5 block font-mono">
                    سررسید: {formatAppDate(t.dueDate, state.settings?.locale)}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800">
                  وظیفه
                </span>
              </div>
            ))}

            {/* Cheques due list */}
            {(activeFilter === 'ALL' || activeFilter === 'CHEQUES') && activeDayData.cheques.map(c => (
              <div 
                key={c.id} 
                onClick={() => navigate('/finance')}
                className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between hover:border-amber-400 transition-colors cursor-pointer"
              >
                <div>
                  <span className="font-bold text-xs text-amber-900 block">{c.bankName || 'چک صیادی'}</span>
                  <span className="text-[10px] text-amber-700 font-mono mt-0.5 block">{c.chequeNumber || c.id}</span>
                </div>
                <div className="text-left font-mono">
                  <span className="text-xs font-bold text-amber-900">{c.amount.toLocaleString()} ریال</span>
                </div>
              </div>
            ))}

            {activeDayData.tasks.length === 0 && activeDayData.meetings.length === 0 && activeDayData.cheques.length === 0 && (
              <div className="text-center py-8 text-xs text-text-secondary">
                هیچ رویدادی برای این تاریخ ثبت نشده است.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
