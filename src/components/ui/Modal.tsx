import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { X, ChevronLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar } from './Avatar';
import { APP_VERSION_LABEL } from '../../lib/version';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg',
  size,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const effectiveSize = size || maxWidth;
  const sheetDrag = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const widthClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" dir="rtl" role="dialog" aria-modal="true">
      <div onClick={onClose} className="fixed inset-0 bg-ink/40 backdrop-blur-sm animate-in fade-in transition-opacity" />
      
      <div
        ref={modalRef}
        className={cn(
          "relative w-full bg-surface shadow-2xl flex flex-col z-10",
          "rounded-t-3xl sm:rounded-3xl max-h-[90dvh] sm:max-h-[85vh]",
          "animate-in slide-in-from-bottom sm:zoom-in-95 duration-300",
          widthClasses[effectiveSize] || 'max-w-lg',
          className
        )}
      >
        {/* هندل کشیدن موبایل با مقاومت لمسی و بازگشت فنری */}
        <div
          className="w-full flex justify-center py-3 sm:hidden cursor-grab active:cursor-grabbing touch-none"
          onClick={onClose}
          aria-label="برای بستن پنجره به پایین بکشید"
          onPointerDown={e => {
            sheetDrag.current = e.clientY;
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            if (modalRef.current) modalRef.current.style.transition = 'none';
          }}
          onPointerMove={e => {
            if (sheetDrag.current !== null && modalRef.current) {
              const delta = e.clientY - sheetDrag.current;
              const dy = delta >= 0 ? delta : -Math.pow(Math.abs(delta), 0.72);
              modalRef.current.style.transform = `translateY(${dy}px)`;
            }
          }}
          onPointerUp={e => {
            const dy = sheetDrag.current !== null ? e.clientY - sheetDrag.current : 0;
            sheetDrag.current = null;
            if (modalRef.current) {
              modalRef.current.style.transition = 'transform 340ms cubic-bezier(0.22, 1.2, 0.36, 1)';
              modalRef.current.style.transform = '';
            }
            if (dy > 110) onCloseRef.current();
          }}
          onPointerCancel={() => {
            sheetDrag.current = null;
            if (modalRef.current) {
              modalRef.current.style.transition = 'transform 280ms cubic-bezier(0.22, 1.2, 0.36, 1)';
              modalRef.current.style.transform = '';
            }
          }}
        >
          <div className="w-12 h-1.5 bg-border-strong rounded-full" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h3 className="text-lg font-bold text-ink">{title}</h3>
            {subtitle && <p className="text-xs text-ink-soft mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 bg-canvas rounded-full text-ink-soft hover:text-ink cursor-pointer" aria-label="بستن"><X size={18} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {children}
        </div>

        {footer && (
          <div className="p-4 border-t border-border bg-surface shrink-0 sticky bottom-0 z-20 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  state?: any;
  title?: string;
  subtitle?: string;
  width?: 'sm' | 'md' | 'lg' | string;
  children?: React.ReactNode;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({ isOpen, onClose, state, title, subtitle, children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
      <div onClick={onClose} className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity" />
      <div className="fixed inset-y-0 right-0 z-50 flex">
        <div
          className={cn(
            "h-full bg-surface shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300",
            "w-[85vw] sm:w-[420px]"
          )}
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-ink">{title || 'منو'}</h3>
              {subtitle && <p className="text-xs text-ink-soft mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 text-ink-soft hover:text-ink rounded-xl hover:bg-canvas transition-colors cursor-pointer" aria-label="بستن">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
