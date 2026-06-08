import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../contexts/LanguageContext';

interface CustomDatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  buttonClassName?: string;
  language?: string;
  minDate?: string;
}

export default function CustomDatePicker({
  id,
  value,
  onChange,
  label,
  className = '',
  buttonClassName = '',
  language: propLanguage,
  minDate,
}: CustomDatePickerProps) {
  const { language, t } = useLanguage();
  const activeLanguage = propLanguage || language;
  const pickerId = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [viewDate, setViewDate] = useState(() => new Date(value || new Date().toISOString().slice(0, 10)));
  const selected = new Date(value || new Date().toISOString().slice(0, 10));
  const year = Number.isNaN(viewDate.getTime()) ? new Date().getFullYear() : viewDate.getFullYear();
  const month = Number.isNaN(viewDate.getTime()) ? new Date().getMonth() : viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const monthLabel = new Intl.DateTimeFormat(activeLanguage === 'vi' ? 'vi-VN' : activeLanguage === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month, 1));

  const formatDisplayDate = (dateValue: string) => {
    const [dateYear, dateMonth, dateDay] = dateValue.split('-');
    return dateYear && dateMonth && dateDay ? `${dateDay}/${dateMonth}/${dateYear}` : (label || t('common.selectDate'));
  };

  const isBeforeMinDate = (dateValue: string) => {
    if (!minDate) return false;
    return new Date(dateValue) < new Date(minDate);
  };

  const selectDate = (dateValue: string) => {
    if (isBeforeMinDate(dateValue)) return;
    onChange(dateValue);
    setViewDate(new Date(dateValue));
    setOpen(false);
  };

  const shiftMonth = (delta: number) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  useEffect(() => {
    const closeOtherPickers = (event: Event) => {
      const detail = (event as CustomEvent<{ pickerId: string }>).detail;
      if (detail?.pickerId !== pickerId) {
        setOpen(false);
      }
    };

    window.addEventListener('custom-date-picker-open', closeOtherPickers);
    return () => window.removeEventListener('custom-date-picker-open', closeOtherPickers);
  }, [pickerId]);

  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPopupPosition({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 296),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || popupRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  const toggleOpen = () => {
    setOpen((current) => {
      const nextOpen = !current;
      if (nextOpen) {
        window.dispatchEvent(new CustomEvent('custom-date-picker-open', { detail: { pickerId } }));
      }
      return nextOpen;
    });
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        onClick={toggleOpen}
        className={buttonClassName || 'w-full bg-neutral-50 py-2.5 border border-neutral-200 rounded-lg text-sm font-semibold outline-none px-3 cursor-pointer text-left text-[#1c1b1b]'}
      >
        {formatDisplayDate(value)}
      </button>

      {open && createPortal(
        <div
          ref={popupRef}
          className="fixed z-[9999] w-[280px] rounded-2xl border border-neutral-100 bg-white p-3 shadow-2xl shadow-neutral-900/15 animate-scaleIn"
          style={{ top: popupPosition.top, left: popupPosition.left }}
        >
          <div className="mb-3 flex items-center justify-between border-b border-neutral-100 pb-2">
            <span className="text-xs font-black capitalize text-neutral-800">{monthLabel}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="rounded-lg px-2 py-1 text-[12px] font-black text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
                aria-label={t('common.previousMonth')}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="rounded-lg px-2 py-1 text-[12px] font-black text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
                aria-label={t('common.nextMonth')}
              >
                ›
              </button>
              <button
                type="button"
                onClick={() => selectDate(new Date().toISOString().slice(0, 10))}
                className="rounded-lg px-2 py-1 text-[10px] font-bold text-[#0071c2] hover:bg-[#edf3ff]"
              >
                {t('common.today')}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-[10px] font-bold text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-neutral-400">
            {(activeLanguage === 'vi'
              ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
              : activeLanguage === 'ko'
                ? ['월', '화', '수', '목', '금', '토', '일']
                : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            ).map((day) => (
              <span key={day}>{day}</span>
            ))}
            {Array.from({ length: offset }).map((_, index) => (
              <span key={`empty-${index}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
              const dateValue = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = dateValue === value;
              const isDisabled = isBeforeMinDate(dateValue);
              return (
                <button
                  key={dateValue}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDate(dateValue)}
                  className={`aspect-square rounded-xl text-[11px] font-bold transition-all ${isSelected
                    ? 'bg-[#0071c2] text-white shadow-sm shadow-[#0071c2]/30'
                    : isDisabled
                      ? 'text-neutral-300 cursor-not-allowed opacity-50'
                      : 'text-neutral-700 hover:bg-[#edf3ff] hover:text-[#005899]'
                    }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
