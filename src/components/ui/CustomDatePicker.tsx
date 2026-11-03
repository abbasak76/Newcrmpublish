import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getJalaliDate, jalaliToGregorianISO, JALALI_MONTH_NAMES, getJalaliMonthDays, toPersianDigits } from '../../lib/jalali';
import { Calendar as CalendarIcon, ChevronDown, Check } from 'lucide-react';
import { Modal } from './Modal';

export interface CustomDatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  calendarType?: 'jalali' | 'gregorian';
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // 220px
const PADDING_Y = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2; // 88px

interface WheelColumnProps {
  items: Array<{ value: number; label: string }>;
  selectedValue: number;
  onSelect: (value: number) => void;
  title: string;
}

const WheelColumn: React.FC<WheelColumnProps> = ({ items, selectedValue, onSelect, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<any>(null);

  const selectedIndex = Math.max(0, items.findIndex(item => item.value === selectedValue));

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior
      });
    }
  }, []);

  // همگام‌سازی موقعیت اسکرول هنگام باز شدن یا تغییر مقدار
  useEffect(() => {
    if (selectedIndex >= 0) {
      // بعد از رندر، بدون انیمیشن به نقطه هدف می‌پرد تا بلافاصله دقیق و تراز باشد
      const timer = setTimeout(() => {
        scrollToIndex(selectedIndex, 'instant');
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [selectedIndex, scrollToIndex]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    scrollTimeoutRef.current = setTimeout(() => {
      if (!containerRef.current) return;
      const scrollTop = containerRef.current.scrollTop;
      const rawIndex = Math.round(scrollTop / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, rawIndex));
      
      const targetItem = items[clampedIndex];
      if (targetItem && targetItem.value !== selectedValue) {
        onSelect(targetItem.value);
      }
      // تراز قطعی روی پیکسل هدف
      scrollToIndex(clampedIndex, 'smooth');
      isScrollingRef.current = false;
    }, 120);
  };

  const handleItemClick = (index: number, val: number) => {
    onSelect(val);
    scrollToIndex(index, 'smooth');
  };

  return (
    <div className="flex-1 flex flex-col items-center min-w-0">
      <div className="text-[11px] font-bold text-ink-soft mb-1 tracking-tight select-none">
        {title}
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full overflow-y-auto no-scrollbar relative touch-pan-y"
        style={{
          height: `${CONTAINER_HEIGHT}px`,
          paddingTop: `${PADDING_Y}px`,
          paddingBottom: `${PADDING_Y}px`,
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {items.map((item, index) => {
          const isSelected = item.value === selectedValue;
          return (
            <div
              key={item.value}
              onClick={() => handleItemClick(index, item.value)}
              style={{
                height: `${ITEM_HEIGHT}px`,
                scrollSnapAlign: 'center',
                scrollSnapStop: 'always',
              }}
              className={`flex items-center justify-center cursor-pointer select-none transition-all duration-150 ${
                isSelected
                  ? 'text-primary font-black text-lg scale-110 drop-shadow-xs'
                  : 'text-ink-soft/75 font-semibold text-sm hover:text-ink'
              }`}
            >
              <span className="truncate px-1">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeDate = value ? new Date(value) : new Date();
  const validDate = isNaN(activeDate.getTime()) ? new Date() : activeDate;
  const initial = getJalaliDate(validDate);
  
  const [year, setYear] = useState(initial.jy);
  const [month, setMonth] = useState(initial.jm);
  const [day, setDay] = useState(initial.jd);

  // به روزرسانی استیت هنگام تغییر پراپ value
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const j = getJalaliDate(d);
        setYear(j.jy);
        setMonth(j.jm);
        setDay(j.jd);
      }
    }
  }, [value]);

  const daysInMonth = getJalaliMonthDays(year, month);
  const safeDay = Math.min(day, daysInMonth);

  // سال‌ها از ۱۴۰۰ تا ۱۴۱۰
  const years = Array.from({ length: 11 }, (_, i) => 1400 + i);

  const dayItems = Array.from({ length: daysInMonth }, (_, i) => ({
    value: i + 1,
    label: toPersianDigits(i + 1)
  }));

  const monthItems = JALALI_MONTH_NAMES.map((name, i) => ({
    value: i + 1,
    label: name
  }));

  const yearItems = years.map(y => ({
    value: y,
    label: toPersianDigits(y)
  }));

  const handleConfirm = () => {
    const finalDay = Math.min(day, daysInMonth);
    onChange(jalaliToGregorianISO(year, month, finalDay));
    setIsOpen(false);
  };

  const handleSetToday = () => {
    const nowJ = getJalaliDate(new Date());
    setYear(nowJ.jy);
    setMonth(nowJ.jm);
    setDay(nowJ.jd);
  };

  const display = value ? `${toPersianDigits(day)} ${JALALI_MONTH_NAMES[month - 1]} ${toPersianDigits(year)}` : placeholder;

  return (
    <div className={className} dir="rtl">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full bg-surface border border-border rounded-xl p-3 text-sm font-medium text-ink flex items-center justify-between shadow-xs hover:border-primary transition cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon size={18} className="text-primary shrink-0" />
          <span className="truncate">{display}</span>
        </div>
        <ChevronDown size={16} className="text-ink-soft shrink-0" />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="انتخاب تاریخ"
        footer={
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={handleSetToday}
              className="py-3 px-4 bg-surface hover:bg-canvas border border-border text-ink rounded-xl font-bold text-xs transition cursor-pointer shrink-0"
            >
              امروز
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Check size={16} />
              <span>تایید تاریخ</span>
            </button>
          </div>
        }
      >
        <div className="relative py-2">
          {/* لنز مرکزی تراز شده دقیقاً در ارتفاع عنصر فعال (iOS Selection Lens) */}
          <div
            className="absolute inset-x-2 rounded-xl border border-primary/30 bg-primary/8 dark:bg-primary/15 pointer-events-none shadow-xs z-0"
            style={{
              top: `${PADDING_Y + 22}px`, // +22 برای عنوان هر ستون
              height: `${ITEM_HEIGHT}px`,
            }}
          />

          {/* محو شدگی تدریجی بالا و پایین برای حس عمق چرخ اسکرول iOS */}
          <div
            className="pointer-events-none absolute inset-x-0 top-6 h-16 bg-gradient-to-b from-surface via-surface/80 to-transparent z-10"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface via-surface/80 to-transparent z-10"
          />

          {/* سه ستون روز، ماه، سال به صورت مستقل با پدینگ متقارن */}
          <div className="flex items-center justify-between gap-1 relative z-5">
            {/* ستون روز (سمت راست در RTL) */}
            <WheelColumn
              title="روز"
              items={dayItems}
              selectedValue={safeDay}
              onSelect={setDay}
            />

            {/* خط جداکننده ستون‌ها */}
            <div className="w-px h-32 bg-border/40 shrink-0 self-center" />

            {/* ستون ماه (وسط) */}
            <WheelColumn
              title="ماه"
              items={monthItems}
              selectedValue={month}
              onSelect={setMonth}
            />

            {/* خط جداکننده ستون‌ها */}
            <div className="w-px h-32 bg-border/40 shrink-0 self-center" />

            {/* ستون سال (سمت چپ در RTL) */}
            <WheelColumn
              title="سال"
              items={yearItems}
              selectedValue={year}
              onSelect={setYear}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
