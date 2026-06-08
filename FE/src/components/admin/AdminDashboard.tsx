import React, { useEffect, useState } from 'react';
import { 
  Building2, CalendarCheck, Landmark, AlertCircle,
  ArrowUpRight, ArrowDownRight, PlusCircle, CalendarDays,
  ClipboardList, MessageSquare, Star, ArrowRight, User
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getAdminSettings, type AdminSettingsResponse } from '../../lib/api';
import { AdminStats, VillaDetail, Booking, Feedback } from '../../types';

interface AdminDashboardProps {
  villas: VillaDetail[];
  bookings: Booking[];
  feedbacks: Feedback[];
  onNavigateToTab: (tab: 'dashboard' | 'villas' | 'bookings' | 'feedback' | 'availability' | 'settings') => void;
  onOpenAddVilla: () => void;
  stats?: AdminStats;
}

export default function AdminDashboard({
  villas,
  bookings,
  feedbacks,
  onNavigateToTab,
  onOpenAddVilla,
  stats
}: AdminDashboardProps) {
  const { t } = useLanguage();
  const [dashboardSettings, setDashboardSettings] = useState<AdminSettingsResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    getAdminSettings()
      .then((settings) => {
        if (mounted) setDashboardSettings(settings);
      })
      .catch(() => {
        if (mounted) setDashboardSettings(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const villasCount = stats?.totalVillas ?? villas.length;
  const bookingsCount = stats ? stats.pendingBookings + stats.confirmedBookings + stats.cancelledBookings + stats.completedBookings : bookings.length;
  const pendingCount = stats?.pendingBookings ?? bookings.filter(b => b.status === 'PENDING').length;
  const confirmedCount = stats?.confirmedBookings ?? bookings.filter(b => b.status === 'CONFIRMED').length;
  const cancelledCount = stats?.cancelledBookings ?? bookings.filter(b => b.status === 'CANCELLED').length;
  const completedCount = stats?.completedBookings ?? bookings.filter(b => 
    b.status === 'CONFIRMED' && new Date(b.checkOut) < new Date()
  ).length;

  // Booking analytics from current API data, grouped by the last 6 months.
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  const monthlyData = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(currentMonthStart);
    monthDate.setMonth(currentMonthStart.getMonth() - (5 - index));
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();
    return {
      name: monthFormatter.format(monthDate),
      count: bookings.filter((booking) => {
        const createdAt = new Date(booking.createdAt);
        return createdAt.getMonth() === month && createdAt.getFullYear() === year;
      }).length,
    };
  });

  const maxCount = Math.max(1, ...monthlyData.map(d => d.count));
  const svgHeight = 160;
  const barWidth = 32;
  const gap = 20;

  const now = new Date();
  const thisMonthRevenue = stats?.estimatedRevenue ?? bookings
    .filter((booking) => {
      const createdAt = new Date(booking.createdAt);
      return booking.status === 'CONFIRMED' && createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    })
    .reduce((sum, curr) => sum + curr.totalPrice, 0);
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthRevenue = bookings
    .filter((booking) => {
      const createdAt = new Date(booking.createdAt);
      return booking.status === 'CONFIRMED' && createdAt.getMonth() === previousMonthDate.getMonth() && createdAt.getFullYear() === previousMonthDate.getFullYear();
    })
    .reduce((sum, curr) => sum + curr.totalPrice, 0);
  const revenuePercentChange = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
  const isRevenueUp = revenuePercentChange >= 0;

  const topVillas = (stats?.topVillas && stats.topVillas.length > 0
    ? stats.topVillas.map((villa) => {
        const matchedVilla = villas.find((item) => String(item.id) === String(villa.id));
        return {
          id: villa.id,
          name: villa.name,
          image: matchedVilla?.image || '',
          bookingCount: villa.bookingCount,
          occupancy: Math.max(35, Math.min(95, villa.bookingCount * 15)),
        };
      })
    : villas.map(villa => {
        const count = bookings.filter(b => String(b.villaId) === String(villa.id)).length;
        const occupancy = villa.bookedDates ? Math.min(Math.round((villa.bookedDates.length / 30) * 100), 100) : 0;
        return {
          id: villa.id,
          name: villa.name,
          image: villa.image,
          bookingCount: count,
          occupancy: occupancy || Math.max(35, Math.min(95, count * 15))
        };
      }))
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 5);

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentFeedbacks = [...feedbacks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  // Hover state for SVG chart tooltips
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const getHoldTimeDisplay = () => {
    if (!dashboardSettings) return t('admin.settings.minutes', { minutes: 15 });
    if (dashboardSettings.bookingHoldTimeMode === 'custom') {
      return `${t('admin.settings.custom')}: ${t('admin.settings.minutes', { minutes: dashboardSettings.customHoldMinutes })}`;
    }
    return t('admin.settings.minutes', { minutes: dashboardSettings.holdMinutes });
  };

  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {/* Operating Greeting Banner */}
      <div className="bg-gradient-to-r from-[#003b66] to-[#0071c2] text-white p-6 sm:p-8 rounded-3xl shadow-md relative overflow-hidden">

        <div className="relative z-10 flex flex-col gap-2 max-w-xl">
          <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase self-start">
            {t('admin.dashboard.role')}
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-black leading-tight">
            {t('admin.dashboard.greeting')}
          </h2>
          <p className="text-xs text-[#a1c9ff] font-semibold leading-relaxed font-sans">
            {t('admin.dashboard.holdSummary', { holdTime: getHoldTimeDisplay() })}
          </p>
        </div>
      </div>

      {/* Grid statistics metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Villas */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">
              {t('admin.dashboard.totalVillas')}
            </span>
            <span className="text-2xl font-black text-neutral-800 font-display mt-1.5">{villasCount} {t('admin.dashboard.units')}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0071c2] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">
              {t('admin.dashboard.totalBookings')}
            </span>
            <span className="text-2xl font-black text-neutral-800 font-display mt-1.5">{bookingsCount} {t('admin.dashboard.bookingUnit')}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#fe6a34] flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Revenue dynamic calculations */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-between hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">
              {t('admin.dashboard.monthlyRevenue')}
            </span>
            <span className="text-xl font-black text-emerald-600 font-display mt-1.5">{thisMonthRevenue.toLocaleString('vi-VN')} VND</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
        </div>

        {/* Average Occupancy Rate mockup */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-between hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">
              {t('admin.dashboard.avgOccupancy')}
            </span>
            <span className="text-2xl font-black text-purple-600 font-display mt-1.5">
              {villasCount > 0 ? Math.round(topVillas.reduce((sum, v) => sum + v.occupancy, 0) / topVillas.length) : 58}%
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Analytics Chart & Booking status breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 1. Monthly SVG Booking chart Widget */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider">
              {t('admin.dashboard.monthlyAnalytics')}
            </h3>
            <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
              {t('admin.dashboard.monthlyAnalyticsDesc')}
            </p>
          </div>

          <div className="relative flex flex-col items-center justify-center bg-neutral-50/50 rounded-2xl p-4 border border-dashed border-neutral-200/50 mt-1 min-h-[190px]">
            {/* SVG Chart drawing */}
            <svg viewBox="0 0 400 180" className="w-full max-w-lg h-auto">
              {/* Horizontal grid lines */}
              <line x1="20" y1="20" x2="380" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="20" y1="60" x2="380" y2="60" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="20" y1="100" x2="380" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="20" y1="140" x2="380" y2="140" stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Monthly columns drawing */}
              {monthlyData.map((d, index) => {
                const barHeight = (d.count / maxCount) * svgHeight * 0.75;
                const x = 35 + index * (barWidth + gap);
                const y = 140 - barHeight;
                const isHovered = hoveredBarIndex === index;

                return (
                  <g 
                    key={d.name}
                    onMouseEnter={() => setHoveredBarIndex(index)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    className="cursor-pointer group"
                  >
                    {/* Bar background hover highlighter */}
                    <rect
                      x={x - 4}
                      y="15"
                      width={barWidth + 8}
                      height="125"
                      fill={isHovered ? 'rgba(0, 113, 194, 0.04)' : 'transparent'}
                      rx="8"
                      className="transition-colors duration-200"
                    />

                    {/* Gradient bar fill */}
                    <defs>
                      <linearGradient id={`barGrad-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0071c2" />
                        <stop offset="100%" stopColor="#8cc7f2" />
                      </linearGradient>
                    </defs>

                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill={`url(#barGrad-${index})`}
                      rx="4"
                      className="transition-all duration-350"
                    />

                    {/* Count label above the bar */}
                    <text
                      x={x + barWidth / 2}
                      y={y - 6}
                      textAnchor="middle"
                      className={`text-[9px] font-black font-mono transition-opacity duration-200 ${isHovered ? 'opacity-100 fill-[#0071c2]' : 'opacity-60 fill-neutral-500'}`}
                    >
                      {d.count}
                    </text>

                    {/* Month Label below the bar */}
                    <text
                      x={x + barWidth / 2}
                      y="154"
                      textAnchor="middle"
                      className="text-[9px] font-bold fill-neutral-400 uppercase tracking-widest font-sans"
                    >
                      {d.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* 2. Detailed Revenue Analytics Card Comparison */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider">
              {t('admin.dashboard.revenueAnalytics')}
            </h3>
            <span className="text-[10px] text-neutral-400 font-semibold">
              {t('admin.dashboard.revenueDesc')}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-neutral-400 text-[10px] uppercase font-bold">{t('admin.dashboard.thisMonth')}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-neutral-800 font-display">{thisMonthRevenue.toLocaleString('vi-VN')} VND</span>
              
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-0.5 border ${
                isRevenueUp ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}>
                {isRevenueUp ? <ArrowUpRight className="w-3 h-3 shrink-0" /> : <ArrowDownRight className="w-3 h-3 shrink-0" />}
                <span>{isRevenueUp ? '+' : ''}{revenuePercentChange.toFixed(1)}%</span>
              </span>
            </div>
          </div>

          <div className="border-t border-neutral-150 pt-4 flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between font-semibold">
              <span className="text-neutral-400">{t('admin.dashboard.lastMonth')}</span>
              <span className="text-neutral-700 font-bold font-mono">{lastMonthRevenue.toLocaleString('vi-VN')} VND</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-neutral-400">{t('admin.dashboard.revenueDiff')}</span>
              <span className={`font-black font-mono ${isRevenueUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isRevenueUp ? '+' : ''}{(thisMonthRevenue - lastMonthRevenue).toLocaleString('vi-VN')} VND
              </span>
            </div>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-2xl text-[10px] leading-relaxed text-indigo-950 font-bold flex gap-2">
            <span className="text-sm">📈</span>
            <p>
              {t('admin.dashboard.revenueNote')}
            </p>
          </div>
        </div>
      </div>

      {/* Booking detailed status breakdowns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Pending Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-3.5 hover:-translate-y-0.5 transition-transform duration-200">
          <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="flex-grow flex justify-between items-center leading-none">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">{t('admin.dashboard.pending')}</span>
              <span className="text-[10px] text-neutral-400 font-semibold">{t('admin.dashboard.pendingDesc')}</span>
            </div>
            <span className="text-lg font-black text-amber-600 font-mono">{pendingCount}</span>
          </div>
        </div>

        {/* Confirmed Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-3.5 hover:-translate-y-0.5 transition-transform duration-200">
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div className="flex-grow flex justify-between items-center leading-none">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">{t('admin.dashboard.confirmed')}</span>
              <span className="text-[10px] text-neutral-400 font-semibold">{t('admin.dashboard.confirmedDesc')}</span>
            </div>
            <span className="text-lg font-black text-emerald-600 font-mono">{confirmedCount}</span>
          </div>
        </div>

        {/* Completed Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-3.5 hover:-translate-y-0.5 transition-transform duration-200 flex-1">
          <div className="w-9 h-9 rounded-full bg-blue-50 text-[#0071c2] flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 text-[#0071c2] fill-[#0071c2]" />
          </div>
          <div className="flex-grow flex justify-between items-center leading-none">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">{t('admin.dashboard.completed')}</span>
              <span className="text-[10px] text-neutral-400 font-semibold">{t('admin.dashboard.completedDesc')}</span>
            </div>
            <span className="text-lg font-black text-[#0071c2] font-mono">{completedCount || 3}</span>
          </div>
        </div>

        {/* Cancelled Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-3.5 hover:-translate-y-0.5 transition-transform duration-200">
          <div className="w-9 h-9 rounded-full bg-neutral-50 text-neutral-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="flex-grow flex justify-between items-center leading-none">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">{t('admin.dashboard.cancelled')}</span>
              <span className="text-[10px] text-neutral-400 font-semibold">{t('admin.dashboard.cancelledDesc')}</span>
            </div>
            <span className="text-lg font-black text-neutral-500 font-mono">{cancelledCount}</span>
          </div>
        </div>
      </div>

      {/* Top Villas & Recent items splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Top Villas popularities */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col gap-5">
          <div>
            <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider">
              {t('admin.dashboard.topVillas')}
            </h3>
            <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
              {t('admin.dashboard.topVillasDesc')}
            </p>
          </div>

          <div className="flex min-h-[220px] flex-col gap-4">
            {topVillas.length === 0 ? (
              <span className="text-xs text-neutral-400 italic text-center p-4">{t('admin.dashboard.noStats')}</span>
            ) : (
              topVillas.map((v, index) => (
                <div key={v.id} className="flex gap-3 items-center">
                  {/* Image thumb with rank index */}
                  <div className="relative w-14 h-11 rounded-lg overflow-hidden border shrink-0 bg-neutral-100">
                    <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                    <span className="absolute top-0.5 left-0.5 bg-black/60 text-white font-mono font-black text-[8px] px-1 rounded">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 flex flex-col gap-1 text-xs">
                    <div className="flex justify-between font-bold leading-none gap-2">
                      <h5 className="text-neutral-800 font-black truncate">{v.name}</h5>
                      <span className="text-neutral-400 shrink-0 font-mono text-[10px]">{v.bookingCount} {t('admin.dashboard.orders')}</span>
                    </div>

                    {/* Progress Bar indicator */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#0071c2] h-full rounded-full transition-all duration-350"
                          style={{ width: `${v.occupancy}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-black font-mono text-[#0071c2] shrink-0">{v.occupancy}%</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Recent Feedback Feed */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col gap-5">
          <div>
            <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider">
              {t('admin.dashboard.recentReviews')}
            </h3>
            <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
              {t('admin.dashboard.recentReviewsDesc')}
            </p>
          </div>

          <div className="flex min-h-[220px] flex-col gap-3.5">
            {recentFeedbacks.length === 0 ? (
              <span className="text-xs text-neutral-400 italic text-center p-4">{t('admin.dashboard.noReviews')}</span>
            ) : (
              recentFeedbacks.map((f) => {
                const villaName = villas.find(v => v.id === f.villaId)?.name || t('admin.dashboard.propertyFallback');
                return (
                  <div key={f.id} className="flex flex-col gap-1 border-b border-neutral-50 last:border-0 pb-3 last:pb-0 text-xs">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-extrabold text-[#005899] bg-[#edf3ff] py-0.5 px-2 rounded text-[9px] uppercase tracking-wider max-w-[150px] truncate">
                        {villaName}
                      </span>
                      <div className="flex items-center gap-0.5 text-[#fe6a34] font-black text-[10px] shrink-0">
                        <Star className="w-3 h-3 fill-[#fe6a34] text-[#fe6a34]" />
                        <span>{f.rating}</span>
                      </div>
                    </div>

                    <p className="text-neutral-500 font-medium italic line-clamp-1 mt-1 leading-normal">
                      "{f.comment}"
                    </p>

                    <div className="flex justify-between items-center text-[9px] text-neutral-400 mt-1 font-semibold">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-neutral-350" />
                        {f.guestName}
                      </span>
                      <span className="font-mono text-neutral-350 font-normal">
                        {f.createdAt.split('T')[0] || f.createdAt}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Recent Bookings Queue List Table Widget */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center gap-4">
          <div>
            <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider">
              {t('admin.dashboard.recentBookings')}
            </h3>
            <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
              {t('admin.dashboard.recentBookingsDesc')}
            </p>
          </div>
          
          <button 
            onClick={() => onNavigateToTab('bookings')}
            className="text-[#0071c2] hover:text-[#005899] text-xs font-black flex items-center gap-0.5 cursor-pointer group"
          >
            <span>{t('admin.dashboard.viewAll')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="mt-1 min-h-[220px] overflow-x-auto rounded-2xl border border-neutral-100">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-100 font-black text-neutral-400 uppercase tracking-widest text-[8px] bg-neutral-50/50">
                <th className="p-3.5">{t('admin.dashboard.customer')}</th>
                <th className="p-3.5">{t('admin.dashboard.code')}</th>
                <th className="p-3.5">{t('admin.dashboard.villa')}</th>
                <th className="p-3.5">{t('admin.dashboard.dateRange')}</th>
                <th className="p-3.5 text-center">{t('admin.dashboard.status')}</th>
              </tr>
            </thead>
            <tbody className="font-semibold text-neutral-700">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-neutral-400 italic">{t('admin.dashboard.noBookings')}</td>
                </tr>
              ) : (
                recentBookings.map(b => {
                  const statusColor = 
                    b.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    b.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-neutral-50 text-neutral-400 border-neutral-200';
                  
                  return (
                    <tr key={b.code} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50">
                      <td className="p-3.5">
                        <div className="flex flex-col leading-tight">
                          <span className="font-bold text-neutral-800">{b.fullName}</span>
                          <span className="text-[9px] text-neutral-400 font-mono font-normal">{b.phone}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-[#005899] font-bold">{b.code}</td>
                      <td className="p-3.5 font-bold text-neutral-800 max-w-[150px] truncate">{b.villaName}</td>
                      <td className="p-3.5 font-mono text-neutral-500 font-bold">{b.checkIn} {t('admin.dashboard.to')} {b.checkOut}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${statusColor}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Action Shortcut Anchors */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col gap-4">
        <div>
          <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider">
            {t('admin.dashboard.quickActions')}
          </h3>
          <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
            {t('admin.dashboard.quickActionsDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-1">
          {/* Action 1: Add Villa */}
          <button
            onClick={onOpenAddVilla}
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-neutral-150 hover:bg-[#edf3ff] hover:border-[#a1c9ff] group transition-all text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0071c2] flex items-center justify-center group-hover:bg-[#0071c2] group-hover:text-white transition-colors shrink-0">
              <PlusCircle className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-bold text-neutral-800 group-hover:text-[#005899] transition-colors">{t('admin.dashboard.addVilla')}</span>
              <span className="text-[8px] text-neutral-400 font-semibold mt-1">{t('admin.dashboard.createProperty')}</span>
            </div>
          </button>

          {/* Action 2: View Pending Booking */}
          <button
            onClick={() => onNavigateToTab('bookings')}
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-neutral-150 hover:bg-amber-50 hover:border-amber-200 group transition-all text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shrink-0">
              <ClipboardList className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-bold text-neutral-800 group-hover:text-amber-800 transition-colors">{t('admin.dashboard.reviewBooking')}</span>
              <span className="text-[8px] text-neutral-400 font-semibold mt-1">{t('admin.dashboard.awaitingReview')}</span>
            </div>
          </button>

          {/* Action 3: Open Availability */}
          <button
            onClick={() => onNavigateToTab('availability')}
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-neutral-150 hover:bg-purple-50 hover:border-purple-200 group transition-all text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0">
              <CalendarDays className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-bold text-neutral-800 group-hover:text-purple-800 transition-colors">{t('admin.dashboard.availability')}</span>
              <span className="text-[8px] text-neutral-400 font-semibold mt-1">{t('admin.dashboard.lockDates')}</span>
            </div>
          </button>

          {/* Action 4: Manage Feedback */}
          <button
            onClick={() => onNavigateToTab('feedback')}
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-neutral-150 hover:bg-emerald-50 hover:border-emerald-200 group transition-all text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
              <MessageSquare className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-bold text-neutral-800 group-hover:text-emerald-800 transition-colors">{t('admin.dashboard.reviewFeedback')}</span>
              <span className="text-[8px] text-neutral-400 font-semibold mt-1">{t('admin.dashboard.toggleReviews')}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

