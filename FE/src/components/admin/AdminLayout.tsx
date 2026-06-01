import React, { useState } from 'react';
import { 
  Building2, CalendarCheck, Landmark, AlertCircle, Sparkles, 
  ArrowUpRight, PlusCircle, CalendarDays, ClipboardList, 
  MessageSquare, Sliders, LogOut, ShieldCheck, User 
} from 'lucide-react';
import { AdminStats, AdminUser, EntityId, VillaDetail, Booking, Feedback } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import AdminDashboard from './AdminDashboard';
import AdminVillaManager from './AdminVillaManager';
import AdminBookingManager from './AdminBookingManager';
import AdminFeedbackManager from './AdminFeedbackManager';
import AdminAvailabilityManager from './AdminAvailabilityManager';
import AdminSettings from './AdminSettings';

interface AdminLayoutProps {
  villas: VillaDetail[];
  bookings: Booking[];
  feedbacks: Feedback[];
  onAddVilla: (v: Omit<VillaDetail, 'id' | 'rating' | 'reviewsCount' | 'bookedDates' | 'pendingDates' | 'images'>) => Promise<void>;
  onDeleteVilla: (id: EntityId, name: string) => void;
  onUpdateVilla: (v: VillaDetail) => void | Promise<void>;
  onDuplicateVilla: (id: EntityId) => void | Promise<void>;
  onBulkDeleteVillas: (ids: EntityId[]) => void;
  onBulkStatusUpdateVillas: (ids: EntityId[], active: boolean) => void;
  onApproveBooking: (code: string) => void;
  onRejectBooking: (code: string) => void;
  onCompleteBooking: (code: string) => void;
  onToggleVerifyFeedback: (id: string) => void;
  onUpdateVillaAvailability: (villaId: EntityId, bookedDates: string[], pendingDates: string[]) => void;
  onLogout: () => void;
  adminStats?: AdminStats;
  adminUser?: AdminUser;
  mutationLoading?: boolean;
  isRefreshing?: boolean;
  activeTab: 'dashboard' | 'villas' | 'bookings' | 'feedback' | 'availability' | 'settings';
  onTabChange: (tab: 'dashboard' | 'villas' | 'bookings' | 'feedback' | 'availability' | 'settings') => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

export default function AdminLayout({
  villas,
  bookings,
  feedbacks,
  onAddVilla,
  onDeleteVilla,
  onUpdateVilla,
  onDuplicateVilla,
  onBulkDeleteVillas,
  onBulkStatusUpdateVillas,
  onApproveBooking,
  onRejectBooking,
  onCompleteBooking,
  onToggleVerifyFeedback,
  onUpdateVillaAvailability,
  onLogout,
  adminStats,
  adminUser,
  mutationLoading = false,
  isRefreshing = false,
  activeTab,
  onTabChange,
  scrollRef
}: AdminLayoutProps) {
  const { language } = useLanguage();

  // Trigger add villa modal directly from dashboard quick action
  const [directOpenAddVilla, setDirectOpenAddVilla] = useState(false);

  const pendingBookingsCount = adminStats?.pendingBookings ?? bookings.filter(b => b.status === 'PENDING').length;
  const confirmedBookingsCount = adminStats?.confirmedBookings ?? bookings.filter(b => b.status === 'CONFIRMED').length;
  const cancelledBookingsCount = adminStats?.cancelledBookings ?? bookings.filter(b => b.status === 'CANCELLED').length;

  const totalRevenue = bookings
    .filter(b => b.status === 'CONFIRMED')
    .reduce((sum, curr) => sum + curr.totalPrice, 0) + 128000000;

  const handleOpenAddVillaDirectly = () => {
    setDirectOpenAddVilla(true);
    onTabChange('villas');
  };

  interface MenuItem {
    readonly id: 'dashboard' | 'villas' | 'bookings' | 'feedback' | 'availability' | 'settings';
    readonly label: string;
    readonly icon: React.ReactNode;
    readonly badge?: number;
  }

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: language === 'vi' ? 'Tổng quan' : 'Dashboard', icon: <Landmark className="w-4.5 h-4.5" /> },
    { id: 'villas', label: language === 'vi' ? 'Quản lý Villa' : 'Villas Manager', icon: <Building2 className="w-4.5 h-4.5" /> },
    { id: 'bookings', label: language === 'vi' ? 'Quản lý Đơn' : 'Bookings', icon: <ClipboardList className="w-4.5 h-4.5" />, badge: pendingBookingsCount > 0 ? pendingBookingsCount : undefined },
    { id: 'feedback', label: language === 'vi' ? 'Đánh giá' : 'Feedbacks', icon: <MessageSquare className="w-4.5 h-4.5" /> },
    { id: 'availability', label: language === 'vi' ? 'Lịch trống' : 'Availability', icon: <CalendarDays className="w-4.5 h-4.5" /> },
    { id: 'settings', label: language === 'vi' ? 'Cấu hình' : 'Settings', icon: <Sliders className="w-4.5 h-4.5" /> }
  ];

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row gap-6 px-4 md:px-8 py-5 max-w-[1280px] mx-auto w-full overflow-hidden animate-fadeIn">
      {/* 1. Desktop Left Sidebar / Mobile Header Navigation Selector Tabs */}
      <aside className="lg:w-72 shrink-0 bg-white border border-neutral-100 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col gap-5 self-start lg:self-stretch w-full max-h-full overflow-hidden">
        {/* Admin profile snippet desktop */}
        <div className="hidden lg:flex items-center gap-3 bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
          <div className="w-10 h-10 rounded-full bg-[#0071c2]/10 text-[#0071c2] flex items-center justify-center font-bold">
            AD
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-black text-neutral-800 truncate">{adminUser?.name || 'Quản trị viên'}</span>
            <span className="text-[10px] text-neutral-400 font-semibold mt-0.5 truncate">{adminUser?.email || 'admin@villa.com'}</span>
          </div>
        </div>

        {/* Sidebar Nav anchors */}
        <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto overscroll-contain p-1 lg:p-0 bg-neutral-50 lg:bg-transparent rounded-2xl border lg:border-0 border-neutral-100 gap-1 scrollbar-safe shrink-0 lg:min-h-0 w-full">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (item.id !== 'villas') {
                    setDirectOpenAddVilla(false);
                  }
                }}
                className={`flex items-center justify-center lg:justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap lg:w-full select-none ${
                  isActive
                    ? 'bg-[#0071c2] text-white shadow-sm shadow-[#0071c2]/20'
                    : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span className="hidden lg:inline">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`px-2 py-0.5 text-[9px] font-black rounded-full leading-none ml-2 ${isActive ? 'bg-white text-[#0071c2]' : 'bg-red-500 text-white animate-pulse'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="flex-1 min-h-0 w-full overflow-hidden flex flex-col relative">
        {isRefreshing && (
          <div className="absolute left-0 right-0 top-0 z-20 h-1 overflow-hidden rounded-full bg-[#edf3ff]">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-[#0071c2]" />
          </div>
        )}
        <div ref={scrollRef} className="app-scroll scrollbar-safe h-full min-h-0 w-full pr-0 lg:pr-1 pb-8 pt-1">
        {activeTab === 'dashboard' && (
          <AdminDashboard
            villas={villas}
            bookings={bookings}
            feedbacks={feedbacks}
            onNavigateToTab={(tab) => {
              onTabChange(tab);
              if (tab !== 'villas') {
                setDirectOpenAddVilla(false);
              }
            }}
            onOpenAddVilla={handleOpenAddVillaDirectly}
            stats={adminStats}
          />
        )}

        {activeTab === 'villas' && (
          <AdminVillaManager
            villas={villas}
            onAddVilla={onAddVilla}
            onDeleteVilla={onDeleteVilla}
            onUpdateVilla={onUpdateVilla}
            onDuplicateVilla={onDuplicateVilla}
            onBulkDeleteVillas={onBulkDeleteVillas}
            onBulkStatusUpdateVillas={onBulkStatusUpdateVillas}
            showAddModalDirectly={directOpenAddVilla}
            onCloseAddModalDirectly={() => setDirectOpenAddVilla(false)}
            mutationLoading={mutationLoading}
          />
        )}

        {activeTab === 'bookings' && (
          <AdminBookingManager
            bookings={bookings}
            onApproveBooking={onApproveBooking}
            onRejectBooking={onRejectBooking}
            onCompleteBooking={onCompleteBooking}
            mutationLoading={mutationLoading}
          />
        )}

        {activeTab === 'feedback' && (
          <AdminFeedbackManager
            feedbacks={feedbacks}
            villas={villas}
            onToggleVerifyFeedback={onToggleVerifyFeedback}
            mutationLoading={mutationLoading}
          />
        )}

        {activeTab === 'availability' && (
          <AdminAvailabilityManager
            villas={villas}
            onUpdateVillaAvailability={onUpdateVillaAvailability}
          />
        )}

        {activeTab === 'settings' && (
          <AdminSettings
            onLogout={onLogout}
          />
        )}
        </div>
      </section>
    </div>
  );
}
