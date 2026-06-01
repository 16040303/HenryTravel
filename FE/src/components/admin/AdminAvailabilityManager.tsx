import React, { useState } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Info, Check, 
  HelpCircle, ShieldAlert, Sparkles, Lock, Unlock, X 
} from 'lucide-react';
import { EntityId, VillaDetail } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../Toast';

interface AdminAvailabilityManagerProps {
  villas: VillaDetail[];
  onUpdateVillaAvailability: (villaId: EntityId, bookedDates: string[], pendingDates: string[]) => void;
}

export default function AdminAvailabilityManager({
  villas,
  onUpdateVillaAvailability
}: AdminAvailabilityManagerProps) {
  const { language } = useLanguage();
  const { showToast } = useToast();

  const [activeVillaId, setActiveVillaId] = useState<EntityId>(() => {
    return villas.length > 0 ? villas[0].id : 0;
  });

  const activeVilla = villas.find(v => String(v.id) === String(activeVillaId));

  // Multi-day date selection states
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  // Calendar Year/Month navigation state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Format Helper
  const formatDateString = (y: number, m: number, d: number): string => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Day calculations
  const getDaysInMonth = (y: number, m: number): number => {
    return new Date(y, m + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (y: number, m: number): number => {
    return new Date(y, m, 1).getDay();
  };

  const daysInCurrentMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const dayCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    dayCells.push(null);
  }
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    dayCells.push(d);
  }

  // Toggles checked multi-day range check
  const handleDayClick = (dayNum: number) => {
    const clickedDateStr = formatDateString(year, month, dayNum);

    // If both rangeStart and rangeEnd are selected, or none are selected: reset start
    if ((rangeStart && rangeEnd) || !rangeStart) {
      setRangeStart(clickedDateStr);
      setRangeEnd(null);
    } else {
      // If rangeStart is selected but rangeEnd is empty
      if (new Date(clickedDateStr) >= new Date(rangeStart)) {
        setRangeEnd(clickedDateStr);
      } else {
        // Reset start if clicked date is earlier than start
        setRangeStart(clickedDateStr);
        setRangeEnd(null);
      }
    }
  };

  // Clear selections helper
  const handleClearSelection = () => {
    setRangeStart(null);
    setRangeEnd(null);
  };

  // Get all date strings between start and end (inclusive)
  const getDatesInRange = (startStr: string, endStr: string): string[] => {
    const dates: string[] = [];
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    // Copy date
    let current = new Date(start);
    while (current <= end) {
      const y = current.getFullYear();
      const m = current.getMonth();
      const d = current.getDate();
      dates.push(formatDateString(y, m, d));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  // Block the entire selected range
  const handleBlockSelectedRange = () => {
    if (!activeVilla || !rangeStart || !rangeEnd) return;

    const datesToBlock = getDatesInRange(rangeStart, rangeEnd);
    let updatedBooked = [...activeVilla.bookedDates];
    let updatedPending = [...activeVilla.pendingDates];

    datesToBlock.forEach(d => {
      if (!updatedBooked.includes(d)) {
        updatedBooked.push(d);
      }
      // Remove from pending if holds existed
      updatedPending = updatedPending.filter(x => x !== d);
    });

    onUpdateVillaAvailability(activeVilla.id, updatedBooked, updatedPending);
    showToast('warning', language === 'vi' 
      ? `Đã khóa giữ hàng loạt dải ngày từ ${rangeStart} đến ${rangeEnd}` 
      : `Blocked dates range from ${rangeStart} to ${rangeEnd}`
    );
    handleClearSelection();
  };

  // Unblock/Release range dates
  const handleUnblockSelectedRange = () => {
    if (!activeVilla || !rangeStart || !rangeEnd) return;

    const datesToUnlock = getDatesInRange(rangeStart, rangeEnd);
    let updatedBooked = [...activeVilla.bookedDates].filter(d => !datesToUnlock.includes(d));
    let updatedPending = [...activeVilla.pendingDates].filter(d => !datesToUnlock.includes(d));

    onUpdateVillaAvailability(activeVilla.id, updatedBooked, updatedPending);
    showToast('success', language === 'vi'
      ? `Đã giải phóng mở khoá hàng loạt dải ngày từ ${rangeStart} đến ${rangeEnd}`
      : `Unlocked dates range from ${rangeStart} to ${rangeEnd}`
    );
    handleClearSelection();
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
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header property selectors */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#0071c2]" />
            <span>{language === 'vi' ? 'Quản lý lịch trống & Đóng/Mở phòng' : 'Availability Calendar & Room Blocks'}</span>
          </h3>
          <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
            {language === 'vi' ? 'Chọn biệt thự để đóng lịch khóa phòng thủ công hoặc kiểm tra overbooking' : 'Select a villa to manually lock or inspect dates availability'}
          </p>
        </div>

        {/* Villa Select Dropdown */}
        <select
          value={activeVillaId}
          onChange={(e) => {
            setActiveVillaId(e.target.value);
            handleClearSelection();
          }}
          className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-xs font-bold text-neutral-700 outline-none cursor-pointer max-w-xs"
        >
          {villas.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      {activeVilla ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Calendar Grid Card */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 flex flex-col gap-5">
            {/* Multi-day Selection control Panel */}
            <div className="bg-indigo-50/50 border border-indigo-150 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-neutral-750">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] uppercase font-bold text-neutral-450 tracking-wider">Đang chọn dải ngày:</span>
                <div className="flex items-center gap-1 bg-white border border-neutral-200 py-1 px-3.5 rounded-xl font-mono text-[10px]">
                  <span>{rangeStart || 'YYYY-MM-DD'}</span>
                  <span className="text-neutral-400">➔</span>
                  <span>{rangeEnd || 'YYYY-MM-DD'}</span>
                </div>
                {(rangeStart || rangeEnd) && (
                  <button 
                    onClick={handleClearSelection}
                    className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-800 cursor-pointer"
                    title="Bỏ chọn"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              
              {rangeStart && rangeEnd && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBlockSelectedRange}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 py-1.5 px-3 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Khóa ngày</span>
                  </button>
                  <button
                    onClick={handleUnblockSelectedRange}
                    className="bg-[#edf3ff] hover:bg-[#0071c2] text-[#0071c2] hover:text-white border border-[#a1c9ff] py-1.5 px-3 rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Mở khóa</span>
                  </button>
                </div>
              )}
            </div>

            {/* Nav month */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h4 className="font-bold text-sm text-neutral-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0071c2]" />
                <span>{getMonthName(month)} {year}</span>
              </h4>
              
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-500 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-500 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              {(language === 'vi' 
                ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] 
                : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
              ).map((w, index) => (
                <span key={w} className={index === 0 || index === 6 ? 'text-red-400' : ''}>{w}</span>
              ))}
            </div>

            {/* Days block grids */}
            <div className="grid grid-cols-7 gap-2 text-center font-bold text-xs font-mono">
              {dayCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} />;
                }

                const dateStr = formatDateString(year, month, day);
                const booked = activeVilla.bookedDates.includes(dateStr);
                const pending = activeVilla.pendingDates.includes(dateStr);

                // Multi-day select highlighting evaluations
                const isSelectedStart = rangeStart === dateStr;
                const isSelectedEnd = rangeEnd === dateStr;
                const isWithinRange = rangeStart && rangeEnd && 
                                      new Date(dateStr) >= new Date(rangeStart) && 
                                      new Date(dateStr) <= new Date(rangeEnd);

                let cellClass = 'bg-white hover:bg-neutral-100 text-neutral-700 hover:rounded-lg cursor-pointer border border-neutral-100';
                let tooltipText = 'Available';

                if (booked) {
                  cellClass = 'bg-rose-50 border border-rose-200 text-rose-600 rounded-lg cursor-pointer hover:bg-rose-100';
                  tooltipText = 'Locked / Booked';
                } else if (pending) {
                  cellClass = 'bg-amber-50 border border-amber-200 text-amber-600 rounded-lg cursor-pointer hover:bg-amber-100';
                  tooltipText = 'Pending Hold';
                }

                // Range Selection Highlighting overrides
                if (isSelectedStart || isSelectedEnd) {
                  cellClass = 'bg-[#0071c2] text-white border-[#0071c2] rounded-lg cursor-pointer z-10 scale-102';
                } else if (isWithinRange) {
                  cellClass = 'bg-blue-50/70 border border-blue-200/80 text-blue-700 cursor-pointer';
                }

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    className={`py-3.5 transition-all flex flex-col items-center justify-center relative ${cellClass}`}
                    title={tooltipText}
                  >
                    <span>{day}</span>
                    {booked && !isWithinRange && !isSelectedStart && !isSelectedEnd && (
                      <span className="absolute bottom-1 text-[7px] text-rose-500 font-sans tracking-wide leading-none">BLOCK</span>
                    )}
                    {pending && !isWithinRange && !isSelectedStart && !isSelectedEnd && (
                      <span className="absolute bottom-1 text-[7px] text-amber-500 font-sans tracking-wide leading-none">HOLD</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend guide info */}
            <div className="border-t border-neutral-100 pt-4 mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 bg-white border border-neutral-200 rounded-md" />
                <span className="text-neutral-500">Mở phòng (Available)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 bg-rose-50 border border-rose-200 rounded-md" />
                <span className="text-rose-600">Đã khóa / Đặt phòng</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 bg-amber-50 border border-amber-200 rounded-md" />
                <span className="text-amber-600">Chờ duyệt (Pending)</span>
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <span className="text-[#0071c2]">💡 Chọn ngày nhận/trả</span>
              </div>
            </div>
          </div>

          {/* Right Info Sidebar Card */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 flex flex-col gap-4">
            <h4 className="font-bold text-xs uppercase text-neutral-400 tracking-wider">Thông số phòng nghỉ</h4>
            <div className="flex gap-3 items-center bg-neutral-50 p-3 rounded-xl border">
              <img src={activeVilla.image} alt={activeVilla.name} className="w-16 h-12 object-cover rounded-lg shrink-0" />
              <div className="min-w-0 flex-1">
                <h5 className="font-bold text-xs text-neutral-800 truncate leading-snug">{activeVilla.name}</h5>
                <span className="text-[10px] text-neutral-400 block mt-0.5">{activeVilla.location} · {activeVilla.type}</span>
              </div>
            </div>

            {/* Availability details overview metrics */}
            <div className="flex flex-col gap-2.5 text-xs border-t border-neutral-100 pt-4 mt-2">
              <div className="flex justify-between font-semibold">
                <span className="text-neutral-400">Số đêm đã bị khóa:</span>
                <span className="text-rose-600 font-black">{activeVilla.bookedDates.length} đêm</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-neutral-400">Số đêm đang chờ cọc:</span>
                <span className="text-amber-600 font-black">{activeVilla.pendingDates.length} đêm</span>
              </div>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl text-[11px] leading-relaxed text-indigo-950 font-semibold mt-3">
              <ShieldAlert className="w-5 h-5 text-indigo-500 mb-2 shrink-0" />
              <p className="font-bold">Chặn khoảng ngày (Airbnb Style):</p>
              <p className="mt-1 font-medium font-sans">
                Chọn Ngày Check-In (click lần 1) và Ngày Check-Out (click lần 2) trực tiếp trên lịch. Sử dụng thanh công cụ để Đóng dải ngày hoặc Mở dải ngày hàng loạt để thuận tiện điều phối phòng.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center p-8 bg-white border border-neutral-100 rounded-3xl">
          Chưa có villa nào đăng ký trong kho phòng
        </div>
      )}
    </div>
  );
}
