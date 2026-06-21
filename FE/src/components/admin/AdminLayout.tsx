import React, { useEffect, useMemo, useState, useTransition } from 'react';
import {
  Building2, Landmark, CalendarDays, ClipboardList,
  MessageSquare, Sliders, LogOut, Info, Menu, X
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
  onAddVilla: (v: Omit<VillaDetail, 'id' | 'rating' | 'reviewsCount' | 'bookedDates' | 'pendingDates' | 'blockedDates'>) => Promise<void>;
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
  activeTab: 'dashboard' | 'villas' | 'bookings' | 'feedback' | 'availability' | 'info' | 'settings';
  onTabChange: (tab: 'dashboard' | 'villas' | 'bookings' | 'feedback' | 'availability' | 'info' | 'settings') => void;
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
  const { t } = useLanguage();

  // Trigger add villa modal directly from dashboard quick action
  const [directOpenAddVilla, setDirectOpenAddVilla] = useState(false);

  const [isTabPending, startTabTransition] = useTransition();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const pendingBookingsCount = useMemo(
    () => adminStats?.pendingBookings ?? bookings.filter(b => b.status === 'PENDING').length,
    [adminStats?.pendingBookings, bookings]
  );
  const confirmedBookingsCount = useMemo(
    () => adminStats?.confirmedBookings ?? bookings.filter(b => b.status === 'CONFIRMED').length,
    [adminStats?.confirmedBookings, bookings]
  );
  const cancelledBookingsCount = useMemo(
    () => adminStats?.cancelledBookings ?? bookings.filter(b => b.status === 'CANCELLED').length,
    [adminStats?.cancelledBookings, bookings]
  );

  const totalRevenue = useMemo(
    () => bookings
      .filter(b => b.status === 'CONFIRMED')
      .reduce((sum, curr) => sum + curr.totalPrice, 0) + 128000000,
    [bookings]
  );

  const switchAdminTab = (tab: AdminLayoutProps['activeTab']) => {
    startTabTransition(() => {
      onTabChange(tab);
    });
  };

  const handleOpenAddVillaDirectly = () => {
    setDirectOpenAddVilla(true);
    switchAdminTab('villas');
  };

  interface MenuItem {
    readonly id: 'dashboard' | 'villas' | 'bookings' | 'feedback' | 'availability' | 'info' | 'settings';
    readonly label: string;
    readonly icon: React.ReactNode;
    readonly badge?: number;
  }

  const menuItems: MenuItem[] = useMemo(() => [
    { id: 'dashboard', label: t('admin.nav.dashboard'), icon: <Landmark className="w-4.5 h-4.5" /> },
    { id: 'villas', label: t('admin.nav.villas'), icon: <Building2 className="w-4.5 h-4.5" /> },
    { id: 'bookings', label: t('admin.nav.bookings'), icon: <ClipboardList className="w-4.5 h-4.5" />, badge: pendingBookingsCount > 0 ? pendingBookingsCount : undefined },
    { id: 'feedback', label: t('admin.nav.feedback'), icon: <MessageSquare className="w-4.5 h-4.5" /> },
    { id: 'availability', label: t('admin.nav.availability'), icon: <CalendarDays className="w-4.5 h-4.5" /> },
    { id: 'info', label: t('admin.nav.info'), icon: <Info className="w-4.5 h-4.5" /> },
    { id: 'settings', label: t('admin.nav.settings'), icon: <Sliders className="w-4.5 h-4.5" /> }
  ], [pendingBookingsCount, t]);

  const handleMenuItemClick = (item: MenuItem) => {
    switchAdminTab(item.id);
    if (item.id !== 'villas') {
      setDirectOpenAddVilla(false);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-1 min-h-0 w-full max-w-[1280px] flex-col gap-4 overflow-hidden px-4 py-4 mx-auto md:px-8 lg:flex-row lg:gap-6 lg:py-5 animate-fadeIn">
      {/* Mobile admin header */}
      <div className="sticky top-0 z-40 -mx-4 -mt-4 flex items-center justify-between border-b border-neutral-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:-mx-8 md:px-8 lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:bg-neutral-50 active:scale-95"
          aria-label="Open admin menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 px-3 text-center">
          <p className="truncate text-sm font-black text-neutral-900">Henry Admin</p>
          <p className="truncate text-[11px] font-semibold text-neutral-400">{menuItems.find((item) => item.id === activeTab)?.label}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600 shadow-sm transition hover:bg-red-100 active:scale-95"
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile off-canvas menu */}
      <div className={`fixed inset-0 z-50 lg:hidden ${isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <button
          type="button"
          className={`absolute inset-0 bg-neutral-950/45 backdrop-blur-[2px] transition-opacity ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close admin menu overlay"
        />
        <aside className={`absolute left-0 top-0 flex h-full w-[min(280px,85vw)] flex-col overflow-hidden rounded-r-[2rem] border-r border-white/20 bg-white shadow-2xl transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <div className="min-w-0">
              <p className="text-base font-black text-neutral-900">Henry Admin</p>
              <p className="truncate text-xs font-semibold text-neutral-400">{adminUser?.email || 'admin@villa.com'}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200 active:scale-95"
              aria-label="Close admin menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4 scrollbar-safe">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleMenuItemClick(item)}
                  className={`flex min-h-12 w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black transition-all ${
                    isActive
                      ? 'bg-[#0071c2] text-white shadow-lg shadow-[#0071c2]/20'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span className={`ml-2 rounded-full px-2 py-1 text-[10px] font-black leading-none ${isActive ? 'bg-white text-[#0071c2]' : 'bg-red-500 text-white'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-neutral-100 p-4">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onLogout();
              }}
              className="flex min-h-12 w-full items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition hover:bg-red-100 active:scale-[0.98]"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span>{t('admin.logout')}</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Desktop left sidebar */}
      <aside className="hidden lg:flex lg:w-72 shrink-0 bg-white border border-neutral-100 rounded-3xl p-5 shadow-sm flex-col gap-5 self-stretch max-h-full overflow-hidden">
        {/* Admin profile snippet desktop */}
        <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
          <div className="w-10 h-10 rounded-full bg-[#0071c2]/10 text-[#0071c2] flex items-center justify-center font-bold">
            AD
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-black text-neutral-800 truncate">{adminUser?.name || t('admin.profileFallback')}</span>
            <span className="text-[10px] text-neutral-400 font-semibold mt-0.5 truncate">{adminUser?.email || 'admin@villa.com'}</span>
          </div>
        </div>

        {/* Sidebar Nav anchors */}
        <nav className="flex flex-col overflow-x-hidden overflow-y-auto overscroll-contain bg-transparent gap-1 scrollbar-safe shrink-0 min-h-0 w-full">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuItemClick(item)}
                className={`flex min-h-11 items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap w-full select-none ${
                  isActive
                    ? 'bg-[#0071c2] text-white shadow-sm shadow-[#0071c2]/20'
                    : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
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
        {(isRefreshing || isTabPending) && (
          <div className="absolute left-0 right-0 top-0 z-20 h-1 overflow-hidden rounded-full bg-[#edf3ff]">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-[#0071c2]" />
          </div>
        )}
        <div ref={scrollRef} className="app-scroll scrollbar-safe flex-1 min-h-0 w-full pr-0 lg:pr-1 pb-8 pt-1 overflow-x-hidden">
        {activeTab === 'dashboard' && (
          <AdminDashboard
            villas={villas}
            bookings={bookings}
            feedbacks={feedbacks}
            onNavigateToTab={(tab) => {
              switchAdminTab(tab);
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

        {activeTab === 'info' && (
          <AdminSettings
            onLogout={onLogout}
            section="info"
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
