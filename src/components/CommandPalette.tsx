import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Building2, UserCheck, TrendingUp, FileText, CheckSquare, 
  ShieldAlert, BookOpen, Megaphone, Activity, CalendarDays, Users 
} from 'lucide-react';
import { getPersianStatusLabel } from '../lib/labels';
import { AppState } from '../types';
import { formatCurrency, formatAppDate } from '../lib/utils';
import { RBACService } from '../lib/rbac';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  updateState: (updater: (draft: AppState) => AppState | void) => void;
}

export function CommandPalette({ isOpen, onClose, state, updateState }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const rbac = new RBACService(state);
    const config = state.settings?.orgConfig || ({} as any);
    const results: any[] = [];

    if (rbac.hasPermission('accounts.view')) {
      (state.accounts || []).forEach(a => {
        if (a.name.toLowerCase().includes(q) || (a.code && a.code.toLowerCase().includes(q)) || (a.phone && a.phone.includes(q))) {
          results.push({
            id: `acc_${a.id}`,
            title: a.name,
            subtitle: `مشتری تجاری | کد: ${a.code || '-'} | تلفن: ${a.phone || '-'}`,
            icon: Building2,
            action: () => {
              updateState(d => { 
                d.activeContextAccountId = a.id; 
                d.activeContextCustomerId = a.id; 
              });
              navigate('/accounts');
              onClose();
            }
          });
        }
      });
    }

    if (config.enableQuotes !== false && rbac.hasPermission('quotes.view')) {
      (state.quotes || []).forEach(qt => {
        if (qt.quoteNumber.toLowerCase().includes(q)) {
          results.push({
            id: `qt_${qt.id}`,
            title: `پیش‌فاکتور ${qt.quoteNumber}`,
            subtitle: `مبلغ: ${formatCurrency(qt.totalAmount)} ریال | وضعیت: ${getPersianStatusLabel(qt.status)}`,
            icon: FileText,
            action: () => {
              navigate('/quotes');
              onClose();
            }
          });
        }
      });
    }

    if (config.enableTasks !== false) {
      (state.tasks || []).forEach(t => {
        if (t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))) {
          results.push({
            id: `tsk_${t.id}`,
            title: t.title,
            subtitle: `وظیفه و پیگیری | مهلت: ${formatAppDate(t.dueDate, state.settings?.locale)} | وضعیت: ${getPersianStatusLabel(t.status)}`,
            icon: CheckSquare,
            action: () => {
              navigate('/tasks');
              onClose();
            }
          });
        }
      });
    }

    return results.slice(0, 10);
  }, [query, state, updateState, navigate, onClose]);

  if (!isOpen) return null;

  const isRtl = state.settings?.locale?.rtl !== false;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-text-main/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-canvas">
          <Search size={20} className="text-primary shrink-0" />
          <input 
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="جستجوی سراسری (مشتریان، پیش‌فاکتورها، تسک‌ها)..."
            className="flex-1 bg-transparent text-text-main placeholder:text-text-secondary text-sm outline-none font-bold"
            dir={isRtl ? 'rtl' : 'ltr'}
          />
          <button onClick={onClose} className="p-1 text-text-secondary hover:text-text-main rounded-md bg-white border border-slate-200 cursor-pointer shadow-sm">
            <span className="me-1.5 text-xs font-medium text-text-secondary">بستن</span><kbd className="se-kbd">Esc</kbd>
          </button>
        </div>

        <div className="max-h-[380px] overflow-y-auto p-2" dir={isRtl ? 'rtl' : 'ltr'}>
          {!query ? (
            <div className="p-8 text-center text-text-secondary flex flex-col items-center justify-center gap-2">
              <Search size={32} className="opacity-20" />
              <p className="text-xs font-bold">عبارت مورد نظر خود را برای جستجو وارد نمایید.</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="p-2 space-y-1">
              <span className="text-xs text-text-secondary font-bold block mb-2 px-2">نتایج جستجو ({searchResults.length})</span>
              {searchResults.map(item => {
                const IconComponent = item.icon;
                return (
                  <button 
                    key={item.id} 
                    onClick={item.action} 
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-canvas text-right transition-colors group cursor-pointer border border-transparent hover:border-slate-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <IconComponent size={16} />
                    </div>
                    <div>
                      <strong className="text-sm font-bold text-text-main block group-hover:text-primary">{item.title}</strong>
                      <span className="text-[11px] text-text-secondary block mt-0.5">{item.subtitle}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs font-bold text-text-secondary">هیچ نتیجه‌ای یافت نشد.</div>
          )}
        </div>
      </div>
    </div>
  );
}
