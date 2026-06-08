import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Info, Calendar } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../Toast';

interface BookingCalendarProps {
  bookedDates: string[]; // e.g. ["2026-06-25", "2026-06-26"]
  pendingDates: string[]; // e.g. ["2026-06-28"]
  blockedDates?: string[]; // manually blocked dates
  checkIn: string; // "YYYY-MM-DD"
  checkOut: string; // "YYYY-MM-DD"
  onDateChange: (checkIn: string, checkOut: string) => void;
}

export default function BookingCalendar({
  bookedDates = [],
  pendingDates = [],
  blockedDates = [],
  checkIn,
  checkOut,
  onDateChange
}: BookingCalendarProps) {
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  // State to hold the currently viewed month and year
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // Default to checkIn month or today's date if empty
    if (checkIn) return new Date(checkIn);
    return new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Standard helper to format date as "YYYY-MM-DD"
  const formatDateString = (y: number, m: number, d: number): string => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  // Helper to shift months
  const prevMonth = () => {
    const today = new Date();
    // Prevent going back beyond today's month
    if (year <= today.getFullYear() && month <= today.getMonth()) {
      return;
    }
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Days in month calculation
  const getDaysInMonth = (y: number, m: number): number => {
    return new Date(y, m + 1, 0).getDate();
  };

  // Day of week of the first day of month (0 = Sunday, 1 = Monday...)
  const getFirstDayOfMonth = (y: number, m: number): number => {
    return new Date(y, m, 1).getDay();
  };

  const daysInCurrentMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month); // Offset index

  // Generate grid cells
  const dayCells = [];
  // Prefix empty cells from previous month to align standard Sunday-Saturday rows
  for (let i = 0; i < firstDayIndex; i++) {
    dayCells.push(null);
  }
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    dayCells.push(d);
  }

  // Check state helpers
  const todayStr = formatDateString(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const isPastDate = (dateStr: string): boolean => {
    return dateStr < todayStr;
  };

  const isBooked = (dateStr: string): boolean => {
    return bookedDates.includes(dateStr);
  };

  const isPending = (dateStr: string): boolean => {
    return pendingDates.includes(dateStr);
  };

  const isBlocked = (dateStr: string): boolean => {
    return blockedDates.includes(dateStr);
  };

  const isSelectedCheckIn = (dateStr: string): boolean => {
    return checkIn === dateStr;
  };

  const isSelectedCheckOut = (dateStr: string): boolean => {
    return checkOut === dateStr;
  };

  const isSelectedRange = (dateStr: string): boolean => {
    if (!checkIn || !checkOut) return false;
    return dateStr >= checkIn && dateStr <= checkOut;
  };

  const handleDayClick = (dayNum: number) => {
    const clickedDateStr = formatDateString(year, month, dayNum);

    // 1. Prevent selecting past dates
    if (isPastDate(clickedDateStr)) {
      showToast('warning', t('calendar.pastError'));
      return;
    }

    // 2. Prevent selecting unavailable dates
    if (isBooked(clickedDateStr) || isBlocked(clickedDateStr)) {
      showToast('error', t('calendar.unavailableError'));
      return;
    }

    // 3. Selection flow logic
    if (!checkIn || (checkIn && checkOut)) {
      // Step A: Set Check-In only, clear Check-Out
      onDateChange(clickedDateStr, '');
    } else {
      // Step B: We have Check-In, selecting Check-Out
      if (clickedDateStr < checkIn) {
        // If clicked earlier date, reset Check-In to this date
        onDateChange(clickedDateStr, '');
      } else if (clickedDateStr === checkIn) {
        // Double click same date, clear checkout
        onDateChange(checkIn, '');
      } else {
        // Clicked date is after Check-In, let's validate range overlap
        let current = new Date(checkIn);
        const end = new Date(clickedDateStr);
        let hasUnavailableOverlap = false;

        while (current < end) {
          const checkStr = formatDateString(current.getFullYear(), current.getMonth(), current.getDate());
          if (isBooked(checkStr) || isBlocked(checkStr)) {
            hasUnavailableOverlap = true;
            break;
          }
          current.setDate(current.getDate() + 1);
        }

        if (hasUnavailableOverlap) {
          showToast('error', t('calendar.rangeUnavailableError'));
          return;
        }

        // Warn if range has pending dates
        let hasPendingOverlap = false;
        current = new Date(checkIn);
        while (current <= end) {
          const checkStr = formatDateString(current.getFullYear(), current.getMonth(), current.getDate());
          if (isPending(checkStr)) {
            hasPendingOverlap = true;
            break;
          }
          current.setDate(current.getDate() + 1);
        }

        if (hasPendingOverlap) {
          showToast('warning', t('calendar.pendingWarning'));
        }

        onDateChange(checkIn, clickedDateStr);
      }
    }
  };

  const monthNames = {
    vi: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  };

  const getMonthName = (m: number): string => {
    return monthNames[language as keyof typeof monthNames]?.[m] || monthNames.vi[m];
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 sm:p-5 flex flex-col gap-4 animate-scaleIn min-w-0 overflow-hidden">
      {/* Calendar Header with navigation switches */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <h4 className="font-bold text-sm text-neutral-800 flex items-center gap-1.5 font-display">
          <Calendar className="w-4 h-4 text-[#0071c2]" />
          <span>{getMonthName(month)} {year}</span>
        </h4>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer text-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={year <= new Date().getFullYear() && month <= new Date().getMonth()}
            aria-label={t('common.previousMonth')}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer text-neutral-500"
            aria-label={t('common.nextMonth')}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto scrollbar-safe overscroll-contain">
        <div className="min-w-[320px] flex flex-col gap-3">
      {/* Weekdays Row */}
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
        {(language === 'vi' 
          ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] 
          : (language === 'ko' ? ['일', '월', '화', '수', '목', '금', '토'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
        ).map((w, index) => (
          <span key={w} className={index === 0 || index === 6 ? 'text-red-400' : ''}>{w}</span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center font-semibold text-xs font-mono">
        {dayCells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />;
          }

          const dateStr = formatDateString(year, month, day);
          const past = isPastDate(dateStr);
          const booked = isBooked(dateStr);
          const pending = isPending(dateStr);
          const blocked = isBlocked(dateStr);
          const checkInSelected = isSelectedCheckIn(dateStr);
          const checkOutSelected = isSelectedCheckOut(dateStr);
          const inRangeSelected = isSelectedRange(dateStr);

          // Build class states
          let dayClass = 'bg-white text-neutral-700 hover:bg-neutral-100 hover:rounded-lg cursor-pointer';
          
          if (past) {
            dayClass = 'text-neutral-300 cursor-not-allowed opacity-40';
          } else if (booked) {
            dayClass = 'bg-rose-50 border border-rose-100 text-rose-500 line-through rounded-lg cursor-not-allowed';
          } else if (blocked) {
            dayClass = 'bg-slate-100 border border-slate-200 text-slate-500 line-through rounded-lg cursor-not-allowed';
          } else if (pending) {
            dayClass = 'bg-amber-50 border border-amber-200 text-amber-600 rounded-lg cursor-pointer hover:bg-amber-100';
          }

          // Active range overrides
          if (!past && !booked && !blocked) {
            if (checkInSelected) {
              dayClass = 'bg-[#0071c2] text-white font-extrabold rounded-l-lg rounded-r-none ring-2 ring-offset-1 ring-[#0071c2] scale-[1.05] z-10';
            } else if (checkOutSelected) {
              dayClass = 'bg-[#0071c2] text-white font-extrabold rounded-r-lg rounded-l-none ring-2 ring-offset-1 ring-[#0071c2] scale-[1.05] z-10';
            } else if (inRangeSelected) {
              dayClass = 'bg-[#edf3ff] text-[#00487f] font-bold rounded-none';
            }
          }

          return (
            <button
              key={`day-${day}`}
              type="button"
              disabled={past || booked || blocked}
              onClick={() => handleDayClick(day)}
              className={`py-2 transition-all flex items-center justify-center cursor-pointer ${dayClass}`}
              title={
                booked 
                  ? t('calendar.booked') 
                  : blocked
                    ? t('calendar.blocked')
                    : past
                      ? t('calendar.past')
                      : (pending ? t('calendar.pending') : (checkInSelected ? t('home.checkIn') : t('calendar.available')))
              }
            >
              {day}
            </button>
          );
        })}
      </div>
      </div>
      </div>

      {/* Legend Block */}
      <div className="border-t border-neutral-100 pt-3 mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-white border border-neutral-200 rounded" />
          <span>{t('calendar.available')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-[#0071c2] rounded" />
          <span>{t('calendar.selected')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-amber-50 border border-amber-200 rounded" />
          <span>{t('calendar.pending')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-rose-50 border border-rose-100 rounded line-through" />
          <span>{t('calendar.booked')}</span>
        </div>
      </div>
    </div>
  );
}
