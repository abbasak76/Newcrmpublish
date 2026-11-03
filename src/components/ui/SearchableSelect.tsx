import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
}

export type SearchableOption = SelectOption;

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'انتخاب کنید...',
  label,
  required,
  disabled
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);
  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    (o.subLabel && o.subLabel.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full flex flex-col gap-1.5 relative" ref={wrapperRef} dir="rtl">
      {label && (
        <label className="text-xs font-bold text-text-main select-none flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-status-risk">*</span>}
        </label>
      )}

      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-white text-text-main text-sm rounded-xl border px-3.5 py-2.5 flex items-center justify-between transition-all cursor-pointer",
          isOpen ? "border-primary ring-2 ring-primary/20" : "border-slate-200 hover:border-slate-300",
          disabled && "bg-canvas text-text-secondary cursor-not-allowed opacity-70"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-text-secondary")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={cn("text-text-secondary transition-transform", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-[0_10px_25px_-5px_rgba(15,23,42,0.1)] z-50 max-h-60 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-canvas">
            <Search size={14} className="text-text-secondary" />
            <input 
              type="text" 
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="جستجو..."
              className="w-full bg-transparent text-xs outline-none text-text-main placeholder:text-text-secondary"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-text-secondary hover:text-text-main">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div 
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs cursor-pointer flex flex-col transition-colors",
                    value === option.value ? "bg-primary/10 text-primary font-bold" : "text-text-main hover:bg-canvas"
                  )}
                >
                  <span>{option.label}</span>
                  {option.subLabel && <span className="text-[10px] text-text-secondary mt-0.5">{option.subLabel}</span>}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-text-secondary">موردی یافت نشد.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
