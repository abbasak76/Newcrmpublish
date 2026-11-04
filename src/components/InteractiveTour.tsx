import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  X,
  Sparkles,
  HelpCircle,
  Play,
  RotateCcw,
  Compass,
  ChevronRight
} from 'lucide-react';
import { AppState } from '../types';
import {
  TourStep,
  WhatsNewItem,
  WHATS_NEW_ITEMS,
  getStepsForModuleAndRole,
  loadTourState,
  saveTourState,
  TourStorageState,
  getAvailableModules
} from '../services/tourEngine';
import { cn } from '../lib/utils';

interface InteractiveTourProps {
  state: AppState;
  updateState?: (updater: (draft: AppState) => AppState | void) => void;
  defaultModule?: string;
}

export function InteractiveTour({ state, updateState, defaultModule = 'global' }: InteractiveTourProps) {
  const navigate = useNavigate();
  const [tourState, setTourState] = useState<TourStorageState>(() => loadTourState());
  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const [showWhatsNewModal, setShowWhatsNewModal] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentUser = state?.users?.find(u => u.id === state?.currentUserId);
  const currentRole = state?.roles?.find(r => r.id === currentUser?.roleId);

  // دریافت گام‌های متناسب با ماژول فعال و نقش کاربر
  const activeSteps = useMemo(() => {
    if (!tourState.activeModule) return [];
    return getStepsForModuleAndRole(tourState.activeModule, currentRole?.name);
  }, [tourState.activeModule, currentRole?.name]);

  const currentStep: TourStep | undefined = activeSteps[tourState.currentStepIndex];

  // محاسبه موقعیت المان هدف در صفحه برای نورافکن (Spotlight)
  useEffect(() => {
    if (!currentStep || tourState.isPaused) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      if (currentStep.targetSelector) {
        const el = document.querySelector(currentStep.targetSelector);
        if (el) {
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);
          // اسکرول نرم در صورت نیاز
          if (rect.top < 0 || rect.bottom > window.innerHeight) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }
      }
      setTargetRect(null);
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [currentStep, tourState.isPaused]);

  // کنترل کلیدهای کیبورد (Escape برای بستن، پیکان چپ و راست برای جابجایی در RTL)
  useEffect(() => {
    if (!currentStep || tourState.isPaused) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        pauseTour();
      } else if (e.key === 'ArrowLeft') {
        // بعدی در حالت راست به چپ
        handleNext();
      } else if (e.key === 'ArrowRight') {
        // قبلی در حالت راست به چپ
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentStep, tourState]);

  // ذخیره وضعیت در حافظه محلی
  const persist = (next: TourStorageState) => {
    setTourState(next);
    saveTourState(next);
  };

  const startTour = (module: string) => {
    persist({
      ...tourState,
      activeModule: module,
      currentStepIndex: 0,
      isPaused: false,
    });
    setShowSelectorModal(false);
  };

  const handleNext = () => {
    if (tourState.currentStepIndex >= activeSteps.length - 1) {
      finishTour();
    } else {
      persist({
        ...tourState,
        currentStepIndex: tourState.currentStepIndex + 1,
      });
    }
  };

  const handlePrev = () => {
    if (tourState.currentStepIndex > 0) {
      persist({
        ...tourState,
        currentStepIndex: tourState.currentStepIndex - 1,
      });
    }
  };

  const finishTour = () => {
    const mod = tourState.activeModule || 'global';
    persist({
      ...tourState,
      activeModule: null,
      currentStepIndex: 0,
      isPaused: false,
      completedModules: {
        ...tourState.completedModules,
        [mod]: true,
      },
    });
    if (updateState) {
      updateState(draft => {
        draft.onboardingCompleted = true;
      });
    }
  };

  const pauseTour = () => {
    persist({
      ...tourState,
      isPaused: true,
    });
  };

  const resumeTour = () => {
    persist({
      ...tourState,
      isPaused: false,
    });
  };

  const resetAllTours = () => {
    persist({
      activeModule: null,
      currentStepIndex: 0,
      isPaused: false,
      completedModules: {},
    });
  };

  // گوش دادن به رویدادهای سفارشی جهت باز کردن تور از بخش‌های دیگر برنامه
  useEffect(() => {
    const onOpenTour = (e: any) => {
      const mod = e.detail?.module || 'global';
      startTour(mod);
    };
    const onOpenWhatsNew = () => {
      setShowWhatsNewModal(true);
    };

    window.addEventListener('open-akhavan-tour', onOpenTour);
    window.addEventListener('open-akhavan-whats-new', onOpenWhatsNew);
    return () => {
      window.removeEventListener('open-akhavan-tour', onOpenTour);
      window.removeEventListener('open-akhavan-whats-new', onOpenWhatsNew);
    };
  }, [tourState]);

  // اگر توری فعال نیست و دکمه را هم نمایش نمی‌دهیم، چیزی رندر نکن
  const isTourActive = !!currentStep && !tourState.isPaused;

  return (
    <>
      {/* ================= ۱. لایه هایلایت و کارت راهنمای تعاملی (Spotlight) ================= */}
      {isTourActive && (
        <div className="fixed inset-0 z-50 pointer-events-auto overflow-hidden font-premium" dir="rtl">
          {/* پس‌زمینه نیمه‌تاریک با برش نورافکن در صورت وجود تارگت */}
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-300" onClick={pauseTour} />

          {/* حلقه هایلایت المان هدف */}
          {targetRect && (
            <div
              className="absolute pointer-events-none rounded-2xl ring-4 ring-primary shadow-2xl transition-all duration-300"
              style={{
                top: Math.max(0, targetRect.top - 6),
                left: Math.max(0, targetRect.left - 6),
                width: targetRect.width + 12,
                height: targetRect.height + 12,
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.45)',
              }}
            />
          )}

          {/* کارت راهنمای تعاملی مدرن */}
          <div
            className={cn(
              "absolute z-10 w-[92vw] max-w-sm sm:max-w-md bg-surface/98 dark:bg-slate-900/98 border border-border dark:border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl transition-all duration-300",
              !targetRect && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              targetRect && targetRect.top > 320 ? "bottom-6 left-1/2 -translate-x-1/2" : "top-20 left-1/2 -translate-x-1/2"
            )}
          >
            {/* هدر کارت */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold font-mono">
                  {(tourState.currentStepIndex + 1).toLocaleString('fa-IR')}
                </span>
                <span className="text-[11px] font-bold text-ink-soft">
                  گام {(tourState.currentStepIndex + 1).toLocaleString('fa-IR')} از {activeSteps.length.toLocaleString('fa-IR')}
                </span>
                {currentStep.isNewFeature && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                    قابلیت جدید
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={pauseTour}
                  className="p-1 rounded-lg text-ink-soft hover:text-ink hover:bg-canvas transition"
                  title="مکث در آموزش"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* عنوان و محتوا */}
            <div className="space-y-1.5 mb-4">
              <h3 className="text-sm sm:text-base font-extrabold text-ink leading-tight">
                {currentStep.title}
              </h3>
              <p className="text-xs sm:text-[13px] text-ink-soft leading-relaxed">
                {currentStep.content}
              </p>
            </div>

            {/* اقدام ویژه گام در صورت وجود */}
            {currentStep.actionRoute && (
              <button
                type="button"
                onClick={() => {
                  navigate(currentStep.actionRoute!);
                  handleNext();
                }}
                className="w-full mb-3 py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>{currentStep.actionLabel || 'مشاهده این بخش'}</span>
                <ChevronRight size={14} />
              </button>
            )}

            {/* فوتر: دکمه‌های ناوبری گام‌ها */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/80">
              <button
                type="button"
                onClick={finishTour}
                className="text-xs font-bold text-ink-soft hover:text-ink py-1.5 px-2 rounded-lg transition"
              >
                رد کردن آموزش
              </button>

              {/* نشانگرهای نقطه‌ای پیشرفت */}
              <div className="flex items-center gap-1">
                {activeSteps.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === tourState.currentStepIndex ? "w-6 bg-primary" : "w-1.5 bg-border"
                    )}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                {tourState.currentStepIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="p-2 rounded-xl border border-border bg-canvas hover:bg-surface text-ink text-xs font-bold transition active:scale-95"
                    title="گام قبلی"
                  >
                    <ArrowRight size={14} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="py-2 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                >
                  {tourState.currentStepIndex >= activeSteps.length - 1 ? (
                    <>
                      <CheckCircle2 size={14} />
                      <span>پایان</span>
                    </>
                  ) : (
                    <>
                      <span>بعدی</span>
                      <ArrowLeft size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ۲. مودال انتخاب ماژول آموزش (Module Tour Selector) ================= */}
      {showSelectorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-premium" dir="rtl">
          <div className="w-full max-w-lg bg-surface border border-border rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Compass size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-ink">مرکز آموزش و راهنمای تعاملی AKHAVAN CRM</h3>
                  <p className="text-xs text-ink-soft">آموزش گام‌به‌گام قابلیت‌ها متناسب با نقش شما ({currentRole?.name || 'کاربر'})</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSelectorModal(false)}
                className="p-1.5 rounded-xl hover:bg-canvas text-ink-soft"
              >
                <X size={18} />
              </button>
            </div>

            {/* لیست ماژول‌های قابل انتخاب */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto no-scrollbar pt-1">
              {getAvailableModules().map(mod => {
                const isCompleted = tourState.completedModules[mod.id];
                const stepsCount = getStepsForModuleAndRole(mod.id, currentRole?.name).length;

                return (
                  <div
                    key={mod.id}
                    onClick={() => startTour(mod.id)}
                    className="p-3.5 rounded-2xl border border-border/80 bg-canvas/70 hover:bg-surface hover:border-primary/40 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <strong className="text-xs font-bold text-ink block truncate">{mod.label}</strong>
                      <span className="text-[10px] text-ink-soft font-mono">
                        {stepsCount.toLocaleString('fa-IR')} گام آموزشی
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isCompleted && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                          <CheckCircle2 size={12} /> تکمیل شده
                        </span>
                      )}
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Play size={12} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button
                type="button"
                onClick={resetAllTours}
                className="text-xs text-ink-soft hover:text-danger flex items-center gap-1 transition"
              >
                <RotateCcw size={12} />
                <span>ریست وضعیت آموزش‌ها</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSelectorModal(false);
                  setShowWhatsNewModal(true);
                }}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <Sparkles size={13} />
                <span>مشاهده قابلیت‌های جدید (What's New)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ۳. مودال معرفی قابلیت‌های جدید (What's New Release Modal) ================= */}
      {showWhatsNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-premium" dir="rtl">
          <div className="w-full max-w-lg bg-surface border border-border rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-ink">قابلیت‌های جدید سامانه (نگارش ۰.۱۲.۳۱)</h3>
                  <p className="text-xs text-ink-soft">آخرین امکانات و ارتقای استانداردهای عملیاتی AKHAVAN CRM</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowWhatsNewModal(false)}
                className="p-1.5 rounded-xl hover:bg-canvas text-ink-soft"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar pt-1">
              {WHATS_NEW_ITEMS.map(item => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-border/80 bg-canvas/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-xs font-bold text-ink">{item.title}</strong>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[9px] font-black font-mono border",
                      item.tag === 'NEW' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      item.tag === 'IMPROVED' ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      {item.tag === 'NEW' ? 'جدید' : item.tag === 'IMPROVED' ? 'بهبودیافته' : 'امنیتی'}
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft leading-relaxed">{item.description}</p>
                  {item.route && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowWhatsNewModal(false);
                        navigate(item.route!);
                      }}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 pt-0.5"
                    >
                      <span>رفتن به این بخش</span>
                      <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowWhatsNewModal(false)}
                className="py-2 px-5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ابزار کمکی برای راه‌اندازی تور از دکمه‌ها یا منوهای دیگر
export function triggerTour(module: string = 'global') {
  window.dispatchEvent(new CustomEvent('open-akhavan-tour', { detail: { module } }));
}

export function triggerWhatsNew() {
  window.dispatchEvent(new CustomEvent('open-akhavan-whats-new'));
}
