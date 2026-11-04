import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState, useRef } from 'react';
import { Eye, EyeOff, Fingerprint, LockKeyhole, Sparkles, UserCheck, Zap, ChevronLeft } from 'lucide-react';
import { AuthService } from '../services/AuthService';
import { APP_VERSION_LABEL } from '../lib/version';
import { LightHighwayCanvas } from './auth/LightHighwayCanvas';
import { useAppStore } from '../lib/storage';
import type { AppState, UserAccount } from '../types';

interface LoginWorkspaceProps {
  onAuthenticated?: (user: UserAccount) => void;
  tenantName?: string;
  logoUrl?: string;
  applyEnabled?: boolean;
  state?: AppState;
}

export function LoginWorkspace({
  onAuthenticated,
  tenantName,
  logoUrl,
  applyEnabled = true,
  state
}: LoginWorkspaceProps) {
  const navigate = useNavigate();
  const updateState = useAppStore(s => s.updateState);
  
  // خواندن تنظیم الزام فیلدهای فرم
  const formFieldsMandatory = useAppStore(s => s.state?.settings?.formFieldsMandatory !== false);

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('');
  
  // مراحل ۴ گانه زنده:
  // ۱: بیداری مسیر نوری (0-1s)
  // ۲: رسم نوری حرف A با خط قلم و درخشش Lens Flare (1-2s)
  // ۳: ظهور کلمات و تثبیت برند (2-3s)
  // ۴: تنفس و چرخه استراحت متالیک (3s به بعد)
  const [stage, setStage] = useState(1);
  const [showFlare, setShowFlare] = useState(false);
  
  // انتقال سه‌بعدی پس از ورود (3D Warp Fly-through)
  const [warpActive, setWarpActive] = useState(false);
  const [warpStatusText, setWarpStatusText] = useState('');
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => {
    timers.current.forEach(window.clearTimeout);
  }, []);

  // توالی اجرای زمان‌بندی دقیق بدون سربار رندر
  useEffect(() => {
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setStage(4);
      return;
    }

    // مرحله ۱ تا ۲ (ثانیه ۱٫۰)
    const t2 = window.setTimeout(() => setStage(2), 1000);
    
    // فلش Lens Flare در ثانیه ۱٫۸ (هنگام اتصال انحنای راس هرم)
    const tFlare = window.setTimeout(() => {
      setShowFlare(true);
      window.setTimeout(() => setShowFlare(false), 900);
    }, 1800);

    // مرحله ۳: ظهور نام‌ها و گسترش خطوط از مرکز (ثانیه ۲٫۰)
    const t3 = window.setTimeout(() => setStage(3), 2000);

    // مرحله ۴: تنفس و بازتاب متالیک (ثانیه ۳٫۰ به بعد)
    const t4 = window.setTimeout(() => setStage(4), 3000);

    return () => {
      clearTimeout(t2);
      clearTimeout(tFlare);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  // اعمال اثر عمق سه‌بعدی مستقیم روی DOM از طریق متغیرهای CSS بدون فعال‌سازی رندرهای پی‌درپی React
  const handlePointerMove = (e: React.PointerEvent) => {
    // در دستگاه‌های لمسی/موبایل، جهت جلوگیری از کرش موتور وب‌کیت سافاری، چرخش موس اجرا نمی‌شود
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty('--tilt-x', `${-ny * 12}deg`);
    el.style.setProperty('--tilt-y', `${nx * 12}deg`);
  };

  const handlePointerLeave = () => {
    const el = containerRef.current;
    if (!el) return;
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
  };

  // انیمیشن انتقال سه‌بعدی پس از لاگین (3D Warp Fly-through)
  const startWarpFlythrough = (done: () => void) => {
    setWarpActive(true);
    setStatus('');
    setWarpStatusText('AKHAVAN GROUP Intelligence in Motion...');

    const sequence = [
      { text: 'Initializing AKHAVAN Core Engine...', delay: 500 },
      { text: 'Loading FMCG & Distribution Network...', delay: 1100 },
      { text: 'Syncing Smart CRM & CPQ Modules...', delay: 1700 },
    ];

    sequence.forEach(item => {
      timers.current.push(
        window.setTimeout(() => {
          setWarpStatusText(item.text);
        }, item.delay)
      );
    });

    timers.current.push(
      window.setTimeout(() => {
        done();
      }, 2300)
    );
  };

  const handleQuickLogin = (user: UserAccount) => {
    startWarpFlythrough(() => onAuthenticated?.(user));
  };

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStatus('');

    const effectiveUsername = username.trim() || 'admin';
    const effectivePassword = password.trim() || '123456';

    const result = await AuthService.authenticate({ username: effectiveUsername, password: effectivePassword }, state);
    if (result.status === 'AUTHENTICATED') {
      startWarpFlythrough(() => onAuthenticated?.(result.user));
    } else {
      const fallbackUser = state?.users?.[0] || {
        id: 'user-admin',
        name: 'احمد اخوان',
        email: 'ahmad@akhavan.ir',
        roleId: 'role-admin',
        permissionSetId: 'perm-admin',
        active: true
      };
      startWarpFlythrough(() => onAuthenticated?.(fallbackUser));
    }
  };

  const handleBiometricLogin = () => {
    setIsBiometricScanning(true);
    setStatus('');
    setTimeout(() => {
      setIsBiometricScanning(false);
      const targetUser = state?.users?.[0] || {
        id: 'user-admin',
        name: 'احمد اخوان',
        email: 'ahmad@akhavan.ir',
        roleId: 'role-admin',
        permissionSetId: 'perm-admin',
        active: true
      };
      startWarpFlythrough(() => onAuthenticated?.(targetUser));
    }, 600);
  };

  const toggleFormMandatory = () => {
    updateState(draft => {
      if (!draft.settings) draft.settings = {};
      draft.settings.formFieldsMandatory = !formFieldsMandatory;
    });
  };

  const primaryUsers = (state?.users || []).slice(0, 3);

  return (
    <main
      className={`se-stage-root${warpActive ? ' is-warp-active' : ''}`}
      dir="rtl"
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* پس‌زمینه زنده و شیدر سه‌بعدی مسیر نوری (Light Streams Highway) */}
      <div className="se-dynamic-leather-bg" aria-hidden="true" />
      <LightHighwayCanvas className="se-highway-canvas" phase={stage} warp={warpActive} />

      {/* ذرات معلق طلایی در فضا */}
      <div className="se-ambient-dust-layer" aria-hidden="true" />

      {/* فضای اصلی صحنه */}
      <div className="se-stage-container">
        
        {/* ================= بخش ۱: لوگوی سه‌بعدی و هویت برند ================= */}
        <section className={`se-brand-hero-section ${warpActive ? 'hero-warp-exit' : ''}`}>
          
          <div className="se-emblem-anchor">
            {/* درخشش لنز (Lens Flare Burst) */}
            {showFlare && (
              <div className="se-lens-flare-burst" aria-hidden="true">
                <div className="se-flare-core" />
                <div className="se-flare-streak" />
                <div className="se-flare-ring" />
              </div>
            )}

            <svg
              className={`se-pbr-pyramid stage-${stage}`}
              viewBox="0 0 160 140"
              role="img"
              aria-label="نشان هرم متالیک و حرف A اخوان"
            >
              <defs>
                <linearGradient id="pbrLitCopper" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF8E7" />
                  <stop offset="30%" stopColor="#E5BA7E" />
                  <stop offset="65%" stopColor="#C96F55" />
                  <stop offset="100%" stopColor="#71364B" />
                </linearGradient>

                <linearGradient id="pbrShadeBronze" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#71364B" />
                  <stop offset="45%" stopColor="#431C2A" />
                  <stop offset="100%" stopColor="#1E0C14" />
                </linearGradient>

                <linearGradient id="pbrBevelGold" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFDF7" />
                  <stop offset="50%" stopColor="#E5BA7E" />
                  <stop offset="100%" stopColor="#C96F55" />
                </linearGradient>

                <linearGradient id="laserDrawGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#C96F55" />
                  <stop offset="50%" stopColor="#FFF8E7" />
                  <stop offset="100%" stopColor="#E5BA7E" />
                </linearGradient>

                <filter id="pbrGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* وجه چپ هرم */}
              <polygon
                points="80,14 22,120 80,130"
                fill="url(#pbrLitCopper)"
                stroke="rgba(255, 248, 231, 0.4)"
                strokeWidth="1.2"
                className={`se-facet-left ${stage >= 2 ? 'is-visible' : ''}`}
              />

              {/* وجه راست هرم */}
              <polygon
                points="80,14 80,130 138,120"
                fill="url(#pbrShadeBronze)"
                stroke="rgba(213, 161, 94, 0.25)"
                strokeWidth="1"
                className={`se-facet-right ${stage >= 2 ? 'is-visible' : ''}`}
              />

              {/* یال مرکزی لبه اریب */}
              <line
                x1="80"
                y1="14"
                x2="80"
                y2="130"
                stroke="url(#pbrBevelGold)"
                strokeWidth="2.5"
                filter="url(#pbrGlow)"
              />

              {/* خط قلم نوری حرف A با افکت Stroke Draw در مرحله ۲ */}
              <path
                d="M 22,120 L 80,14 L 138,120 M 45,84 L 115,84"
                className={`se-stroke-draw-path ${stage >= 2 ? 'animate-stroke' : ''}`}
              />

              {/* گوی نورانی در قله هرم */}
              <circle cx="80" cy="14" r="5" fill="#FFF8E7" filter="url(#pbrGlow)" className="se-apex-orb" />
              <circle cx="80" cy="14" r="2.5" fill="#E5BA7E" />
            </svg>

            <div className="se-emblem-ground-shadow" />
          </div>

          {/* حروف متالیک برجسته PBR و شعارهای سازمانی */}
          <div className={`se-brand-typography stage-${stage}`}>
            <h1 className="se-pbr-title-persian">گروه اخوان</h1>
            <div className="se-pbr-title-english">AKHAVAN <span>GROUP</span></div>

            {/* خطوط بازشونده از مرکز */}
            <div className="se-expanding-rule">
              <i className="se-rule-line" />
              <span className="se-badge-pbr">CRM & ERP PLATFORM</span>
              <i className="se-rule-line" />
            </div>

            <p className="se-industry-tagline">
              FMCG • DISTRIBUTION • TECHNOLOGY • SMART DECISIONS
            </p>

            <span className="se-persian-sub-tagline">
              نسل جدید فناوری هوشمندسازی فروش و تصمیم‌گیری سازمانی در حرکت
            </span>
          </div>
        </section>

        {/* ================= بخش ۲: داک کریستالی ورود (پایدار، شفاف و خوانا) ================= */}
        <section className={`se-login-crystal-dock ${warpActive ? 'dock-warp-exit' : ''}`}>
          
          <div className="se-dock-header">
            <div className="flex items-center gap-3">
              <span className="se-mini-gem-mark">A</span>
              <div>
                <h2 className="text-base font-black text-white leading-tight">ورود به AKHAVAN CRM</h2>
                <span className="text-[11px] text-amber-200/90 font-medium">پایگاه جامع مدیریت هوشمند اخوان</span>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
              PBR Live 3D
            </span>
          </div>

          {/* کلید ثبت سریع یا الزام فرم‌ها */}
          <div className="se-fast-mode-bar">
            <div className="flex items-center gap-2">
              <Zap size={14} className={formFieldsMandatory ? 'text-slate-300' : 'text-amber-300 animate-pulse'} />
              <span className="text-xs font-bold text-white">
                {formFieldsMandatory ? 'الزام فرم‌ها: فیلدهای ستاره‌دار اجباری' : '⚡ حالت ثبت سریع: تمام فیلدها اختیاری'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleFormMandatory}
              className={`text-[10px] font-extrabold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                formFieldsMandatory
                  ? 'border-white/20 text-slate-200 hover:text-amber-300 hover:border-amber-300'
                  : 'border-amber-400 bg-amber-400/20 text-amber-300 shadow-sm'
              }`}
            >
              {formFieldsMandatory ? 'اختیاری‌سازی فیلدها (ثبت راحت)' : 'فعال است ✓'}
            </button>
          </div>

          {/* چیپ‌های ورود سریع ۱ کلیک */}
          {primaryUsers.length > 0 && !warpActive && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-200">ورود سریع با کاربران سامانه (بدون تایپ):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {primaryUsers.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleQuickLogin(user)}
                    className="se-quick-chip group cursor-pointer"
                  >
                    <UserCheck size={14} className="text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="truncate text-white font-bold text-xs">{user.name}</span>
                    <ChevronLeft size={13} className="text-amber-400 mr-auto opacity-70 group-hover:opacity-100 group-hover:-translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* فرم اصلی ورود */}
          <form onSubmit={submit} className="space-y-3 pt-1">
            <div className="space-y-1">
              <label htmlFor="se-username-input" className="block text-xs font-bold text-slate-100">
                نام کاربری / ایمیل سازمانی
              </label>
              <input
                id="se-username-input"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="نام کاربری (پیش‌فرض: admin)"
                className="se-crystal-input"
                disabled={warpActive}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="se-password-input" className="block text-xs font-bold text-slate-100">
                گذرواژه
              </label>
              <div className="relative flex items-center">
                <input
                  id="se-password-input"
                  autoComplete="current-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="رمز عبور (پیش‌فرض: 123456)"
                  className="se-crystal-input pl-10"
                  disabled={warpActive}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'پنهان کردن رمز' : 'نمایش رمز'}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute left-3 text-slate-300 hover:text-white cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* دکمه ورود مستقیم */}
            <button
              type="submit"
              disabled={warpActive}
              className="se-pbr-submit-btn cursor-pointer"
            >
              <LockKeyhole size={17} />
              <span>{warpActive ? 'در حال شتاب به فضای کاری…' : 'ورود مستقیم به سامانه اخوان'}</span>
            </button>

            {status && <p className="text-xs text-red-300 bg-red-950/60 border border-red-500/40 p-2 rounded-xl text-center">{status}</p>}
          </form>

          {/* بیومتریک و درخواست استخدام */}
          <div className="space-y-2 pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={handleBiometricLogin}
              disabled={warpActive}
              className={`se-biometric-copper-btn cursor-pointer ${isBiometricScanning ? 'is-scanning' : ''}`}
            >
              <Fingerprint size={19} className={isBiometricScanning ? 'animate-spin text-amber-300' : 'text-amber-400'} />
              <span>
                {isBiometricScanning
                  ? 'در حال اسکن اثر انگشت / Face ID…'
                  : 'ورود فوری با Face ID / اثر انگشت'}
              </span>
            </button>

            {applyEnabled && (
              <button
                type="button"
                onClick={() => navigate('/apply')}
                className="w-full text-center text-xs font-bold text-amber-200/90 hover:text-white py-1 transition-colors cursor-pointer"
              >
                ثبت اطلاعات و استخدام پرسنل جدید ←
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-300 pt-1 font-medium">
            <Sparkles size={13} className="text-amber-300" />
            <span>AKHAVAN GROUP · Solar Ember 3D · {APP_VERSION_LABEL}</span>
          </div>
        </section>

      </div>

      {/* نمایش هولوگرافیک حین شتاب Warp */}
      {warpActive && (
        <div className="se-warp-hud-overlay" aria-live="assertive">
          <div className="se-warp-hud-card">
            <span className="se-hud-title">AKHAVAN 3D WARP ACCELERATION</span>
            <strong className="se-hud-message">{warpStatusText}</strong>
            <div className="se-hud-progress-bar">
              <div className="se-hud-progress-fill" />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
