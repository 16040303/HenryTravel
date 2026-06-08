import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, AlertCircle, Lock, User, LogIn, Eye, EyeOff, LogOut
} from 'lucide-react';
import {
  adminLogin,
  adminLogout,
  cancelAdminBooking,
  completeAdminBooking,
  confirmAdminBooking,
  createAdminVilla,
  deleteAdminVilla,
  getAdminBookings,
  getAdminFeedbacks,
  getAdminStats,
  getAdminToken,
  getAdminVillas,
  getStoredAdminUser,
  mapAdminBookingToFrontendBooking,
  mapAdminFeedbackToFrontendFeedback,
  mapAdminVillaToFrontendVilla,
  toggleAdminFeedback,
  updateAdminVilla,
  addAdminVillaMedia,
} from '../lib/api';
import { AdminStats, AdminUser, AdminVillaMutationPayload, EntityId, VillaDetail, Booking, Feedback } from '../types';
import type { UploadedMedia } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from './Toast';
import { AdminDashboardSkeleton } from './common/Skeleton';
import ConfirmModal from './common/ConfirmModal';
import AdminLayout from './admin/AdminLayout';

interface AdminConsoleViewProps {
  onVillaAddedNotification: () => void;
}

export default function AdminConsoleView({ onVillaAddedNotification }: AdminConsoleViewProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Model states
  const [allVillas, setAllVillas] = useState<VillaDetail[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [allFeedbacks, setAllFeedbacks] = useState<Feedback[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [adminDataError, setAdminDataError] = useState('');
  const [mutationLoading, setMutationLoading] = useState(false);
  const adminScrollRef = useRef<HTMLDivElement>(null);
  const didRestoreAdminScrollRef = useRef(false);
  type AdminTab = 'dashboard' | 'villas' | 'bookings' | 'feedback' | 'availability' | 'info' | 'settings';
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>(() => {
    const stored = sessionStorage.getItem('henrytravel_admin_active_tab') as AdminTab | null;
    return stored || 'dashboard';
  });

  useEffect(() => {
    if (!isLoggedIn || loading || didRestoreAdminScrollRef.current) return;

    const scrollKey = `henrytravel_admin_scroll:${activeAdminTab}`;

    const restoreAdminScroll = () => {
      const savedRaw = sessionStorage.getItem(scrollKey);
      const savedScroll = savedRaw === null ? NaN : Number(savedRaw);
      if (adminScrollRef.current && Number.isFinite(savedScroll) && savedScroll >= 0) {
        adminScrollRef.current.scrollTop = savedScroll;
        didRestoreAdminScrollRef.current = true;
      }
    };

    requestAnimationFrame(() => {
      restoreAdminScroll();
      window.setTimeout(restoreAdminScroll, 150);
      window.setTimeout(restoreAdminScroll, 450);
    });
  }, [isLoggedIn, loading, activeAdminTab, allVillas.length, recentBookings.length, allFeedbacks.length]);

  useEffect(() => {
    if (!isLoggedIn || loading) return;

    const scrollKey = `henrytravel_admin_scroll:${activeAdminTab}`;
    let saveTimer: number | null = null;

    const saveAdminScroll = () => {
      if (adminScrollRef.current) {
        sessionStorage.setItem(scrollKey, String(adminScrollRef.current.scrollTop));
      }
    };

    const throttledSaveAdminScroll = () => {
      if (saveTimer) return;
      saveTimer = window.setTimeout(() => {
        saveTimer = null;
        saveAdminScroll();
      }, 300);
    };

    const scrollElement = adminScrollRef.current;
    scrollElement?.addEventListener('scroll', throttledSaveAdminScroll, { passive: true });
    window.addEventListener('pagehide', saveAdminScroll);
    window.addEventListener('beforeunload', saveAdminScroll);
    document.addEventListener('visibilitychange', saveAdminScroll);
    return () => {
      if (saveTimer) window.clearTimeout(saveTimer);
      saveAdminScroll();
      scrollElement?.removeEventListener('scroll', throttledSaveAdminScroll);
      window.removeEventListener('pagehide', saveAdminScroll);
      window.removeEventListener('beforeunload', saveAdminScroll);
      document.removeEventListener('visibilitychange', saveAdminScroll);
    };
  }, [isLoggedIn, loading, activeAdminTab]);

  const handleAdminTabChange = (tab: AdminTab) => {
    setActiveAdminTab(tab);
    sessionStorage.setItem('henrytravel_admin_active_tab', tab);
  };

  // Global Confirmation modal configuration state
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => { }
  });

  const triggerConfirmModal = (config: Omit<typeof confirmModalConfig, 'isOpen'>) => {
    setConfirmModalConfig({
      ...config,
      isOpen: true
    });
  };

  useEffect(() => {
    const token = getAdminToken();
    const storedUser = getStoredAdminUser();
    if (token && storedUser) {
      setAdminUser(storedUser);
      setIsLoggedIn(true);
      loadAdminStats();
      return;
    }
    setLoading(false);
  }, []);

  const logoutToLogin = (message?: string) => {
    adminLogout();
    setAdminUser(null);
    setAdminStats(null);
    setIsLoggedIn(false);
    setLoading(false);
    if (message) setLoginError(message);
  };

  const isAuthError = (error: unknown) => {
    const status = (error as Error & { status?: number }).status;
    return status === 401 || status === 403;
  };

  const handleMutationError = (error: unknown, fallback: string) => {
    if (isAuthError(error)) {
      logoutToLogin(t('admin.authExpired'));
      return;
    }

    const code = (error as Error & { code?: string }).code;
    if (code === 'DATE_OVERLAP') {
      showToast('error', t('admin.dateOverlapError'));
      return;
    }
    if (code === 'VILLA_HAS_ACTIVE_BOOKINGS' || code === 'VILLA_HAS_BOOKINGS') {
      showToast('error', t('admin.villaHasBookingsError'));
      return;
    }

    showToast('error', error instanceof Error && error.message ? error.message : fallback);
  };

  const toAdminVillaPayload = (v: Partial<VillaDetail>): AdminVillaMutationPayload => {
    const status: AdminVillaMutationPayload['status'] = v.status === 'Maintenance'
      ? 'maintenance'
      : v.isActive === false || v.status === 'Hết phòng'
        ? 'hidden'
        : 'available';

    return {
      name: v.name?.trim(),
      nameEn: v.nameEn?.trim() || null,
      location: v.location?.trim(),
      locationEn: v.locationEn?.trim() || null,
      description: v.description?.trim() || '',
      descriptionEn: v.descriptionEn?.trim() || null,
      descriptionKo: v.descriptionKo?.trim() || null,
      price: Number(v.price) || 0,
      priceMax: v.priceMax === undefined ? null : v.priceMax,
      priceType: Number(v.price) > 0 ? 'fixed' : 'contact',
      status,
      maxGuests: Number(v.guestsCount) || 1,
      facilities: Array.isArray(v.facilities) ? v.facilities : [],
      depositRequired: true,
      depositAmount: null,
      accommodationType: v.type === 'Khách sạn - resort' ? 'hotel_resort' : 'villa',
    };
  };

  const validateVillaPayload = (payload: AdminVillaMutationPayload) => {
    if (!payload.name) throw new Error(t('admin.validationVillaName'));
    if (!payload.location) throw new Error(t('admin.validationVillaLocation'));
    if (!payload.price || payload.price <= 0) throw new Error(t('admin.validationVillaPrice'));
    if (payload.priceMax !== null && payload.priceMax !== undefined && payload.priceMax < payload.price) throw new Error(t('admin.validationVillaPriceRange'));
    if (!payload.maxGuests || payload.maxGuests <= 0) throw new Error(t('admin.validationVillaGuests'));
    if (!Array.isArray(payload.facilities)) throw new Error(t('admin.validationFacilitiesArray'));
  };

  const bookingApiId = (booking: Booking | undefined) => String(booking?.id || '');

  const loadAdminStats = async (options?: { preserveScroll?: boolean; silent?: boolean }) => {
    const previousScrollTop = options?.preserveScroll ? (adminScrollRef.current?.scrollTop ?? 0) : 0;
    if (options?.silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setAdminDataError('');
    const errors: string[] = [];

    const [statsResult, villasResult, bookingsResult, feedbacksResult] = await Promise.allSettled([
      getAdminStats(),
      getAdminVillas({ limit: 100 }),
      getAdminBookings({ limit: 100 }),
      getAdminFeedbacks({ limit: 100 }),
    ]);

    const settled = [statsResult, villasResult, bookingsResult, feedbacksResult];
    const authFailure = settled.find((result) => result.status === 'rejected' && isAuthError(result.reason));
    if (authFailure) {
      logoutToLogin(t('admin.authExpired'));
      return;
    }

    if (statsResult.status === 'fulfilled') {
      setAdminStats(statsResult.value);
    } else {
      errors.push(statsResult.reason instanceof Error ? statsResult.reason.message : t('admin.loadStatsError'));
    }

    if (villasResult.status === 'fulfilled') {
      setAllVillas(villasResult.value.villas.map(mapAdminVillaToFrontendVilla));
    } else {
      errors.push(villasResult.reason instanceof Error ? villasResult.reason.message : t('admin.loadVillasError'));
    }

    if (bookingsResult.status === 'fulfilled') {
      setRecentBookings(bookingsResult.value.bookings.map(mapAdminBookingToFrontendBooking));
    } else {
      errors.push(bookingsResult.reason instanceof Error ? bookingsResult.reason.message : t('admin.loadBookingsError'));
    }

    if (feedbacksResult.status === 'fulfilled') {
      setAllFeedbacks(feedbacksResult.value.feedbacks.map(mapAdminFeedbackToFrontendFeedback));
    } else {
      errors.push(feedbacksResult.reason instanceof Error ? feedbacksResult.reason.message : t('admin.loadFeedbacksError'));
    }

    if (errors.length > 0) {
      setAdminDataError(errors.join(' '));
    }
    setLoading(false);
    setIsRefreshing(false);
    if (options?.preserveScroll) {
      requestAnimationFrame(() => {
        if (adminScrollRef.current) {
          adminScrollRef.current.scrollTop = previousScrollTop;
        }
      });
    }
  };

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const response = await adminLogin(username, password);
      setAdminUser(response.user);
      setIsLoggedIn(true);
      setPassword('');
      await loadAdminStats();
    } catch (error) {
      adminLogout();
      setIsLoggedIn(false);
      setLoading(false);
      setLoginError(
        error instanceof Error && error.message
          ? error.message
          : t('admin.loginInvalid')
      );
    }
  };

  // Logout handler wrapper
  const triggerLogout = () => {
    triggerConfirmModal({
      title: t('admin.confirmLogoutTitle'),
      message: t('admin.confirmLogoutMessage'),
      type: 'warning',
      onConfirm: () => {
        adminLogout();
        setIsLoggedIn(false);
        setAdminUser(null);
        setAdminStats(null);
        setUsername('');
        setPassword('');
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        showToast('info', t('admin.logoutSuccess'));
      }
    });
  };

  const handleAddVilla = async (v: Omit<VillaDetail, 'id' | 'rating' | 'reviewsCount' | 'bookedDates' | 'pendingDates' | 'blockedDates'>) => {
    if (mutationLoading) return;
    setMutationLoading(true);
    try {
      const payload = toAdminVillaPayload(v);
      validateVillaPayload(payload);
      const createdVilla = await createAdminVilla(payload);
      if (v.media.length > 0) {
        await addAdminVillaMedia(createdVilla.id, v.media.map((media): UploadedMedia => ({
          type: media.type,
          url: media.url,
          secureUrl: media.url,
          publicId: String(media.id),
          thumbnailUrl: media.thumbnailUrl || undefined,
          width: media.width || undefined,
          height: media.height || undefined,
          duration: media.duration || undefined,
          format: media.type === 'video' ? 'video' : 'image',
          bytes: 0,
        })));
      }
      await loadAdminStats({ preserveScroll: true, silent: true });
      onVillaAddedNotification();
      showToast('success', t('admin.createVillaSuccess', { name: v.name }));
    } catch (error) {
      handleMutationError(error, t('admin.createVillaError'));
      throw error;
    } finally {
      setMutationLoading(false);
    }
  };

  // 2. DELETE Villa with double confirm modal
  const triggerDeleteVilla = (id: EntityId, name: string) => {
    triggerConfirmModal({
      title: t('admin.deleteVillaTitle'),
      message: t('admin.deleteVillaMessage', { name }),
      type: 'danger',
      onConfirm: async () => {
        if (mutationLoading) return;
        setMutationLoading(true);
        try {
          await deleteAdminVilla(String(id));
          await loadAdminStats({ preserveScroll: true, silent: true });
          setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
          showToast('success', t('admin.deleteVillaSuccess', { name }));
        } catch (error) {
          handleMutationError(error, t('admin.deleteVillaError'));
        } finally {
          setMutationLoading(false);
        }
      }
    });
  };

  // 3. UPDATE Villa properties
  const handleUpdateVilla = async (v: VillaDetail) => {
    if (mutationLoading) return;
    setMutationLoading(true);
    try {
      const payload = toAdminVillaPayload(v);
      validateVillaPayload(payload);
      await updateAdminVilla(String(v.id), payload);
      await loadAdminStats({ preserveScroll: true, silent: true });
      onVillaAddedNotification();
      showToast('success', t('admin.updateVillaSuccess', { name: v.name }));
    } catch (error) {
      handleMutationError(error, t('admin.updateVillaError'));
      throw error;
    } finally {
      setMutationLoading(false);
    }
  };

  // 4. APPROVE Booking Pending Hold with confirmation
  const triggerApproveBooking = (code: string) => {
    const booking = recentBookings.find(item => item.code === code || item.bookingCode === code);
    const id = bookingApiId(booking);
    if (!id) {
      showToast('error', t('admin.bookingMissingConfirm'));
      return;
    }
    triggerConfirmModal({
      title: t('admin.confirmBookingTitle'),
      message: t('admin.confirmBookingMessage', { code }),
      type: 'info',
      onConfirm: async () => {
        if (mutationLoading) return;
        setMutationLoading(true);
        try {
          await confirmAdminBooking(id);
          await loadAdminStats({ preserveScroll: true, silent: true });
          setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
          showToast('success', t('admin.confirmBookingSuccess', { code }));
        } catch (error) {
          handleMutationError(error, t('admin.confirmBookingError'));
        } finally {
          setMutationLoading(false);
        }
      }
    });
  };

  // 5. CANCEL/REJECT Booking Pending Hold with confirmation
  const triggerRejectBooking = (code: string) => {
    const booking = recentBookings.find(item => item.code === code || item.bookingCode === code);
    const id = bookingApiId(booking);
    if (!id) {
      showToast('error', t('admin.bookingMissingCancel'));
      return;
    }
    triggerConfirmModal({
      title: t('admin.cancelBookingTitle'),
      message: t('admin.cancelBookingMessage', { code }),
      type: 'danger',
      onConfirm: async () => {
        if (mutationLoading) return;
        setMutationLoading(true);
        try {
          await cancelAdminBooking(id, 'Admin cancelled booking');
          await loadAdminStats({ preserveScroll: true, silent: true });
          setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
          showToast('success', t('admin.cancelBookingSuccess', { code }));
        } catch (error) {
          handleMutationError(error, t('admin.cancelBookingError'));
        } finally {
          setMutationLoading(false);
        }
      }
    });
  };

  const triggerCompleteBooking = (code: string) => {
    const booking = recentBookings.find(item => item.code === code || item.bookingCode === code);
    const id = bookingApiId(booking);
    if (!id) {
      showToast('error', t('admin.bookingMissingComplete'));
      return;
    }
    triggerConfirmModal({
      title: t('admin.completeBookingTitle'),
      message: t('admin.completeBookingMessage', { code }),
      type: 'info',
      onConfirm: async () => {
        if (mutationLoading) return;
        setMutationLoading(true);
        try {
          await completeAdminBooking(id);
          await loadAdminStats({ preserveScroll: true, silent: true });
          setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
          showToast('success', t('admin.completeBookingSuccess', { code }));
        } catch (error) {
          handleMutationError(error, t('admin.completeBookingError'));
        } finally {
          setMutationLoading(false);
        }
      }
    });
  };

  const handleToggleVerifyFeedback = async (id: string) => {
    if (mutationLoading) return;
    setMutationLoading(true);
    try {
      const updated = await toggleAdminFeedback(id);
      setAllFeedbacks(prev => prev.map(feedback => (
        String(feedback.id) === String(updated.id)
          ? { ...feedback, isVerified: updated.verified }
          : feedback
      )));
      showToast('success', t('admin.feedbackUpdateSuccess'));
    } catch (error) {
      handleMutationError(error, t('admin.feedbackUpdateError'));
    } finally {
      setMutationLoading(false);
    }
  };

  // 7. UPDATE Villa availability blocked/unblocked dates manually
  const handleUpdateVillaAvailability = (_villaId: EntityId, _bookedDates: string[], _pendingDates: string[]) => {
    showToast('info', t('admin.availabilityLater'));
  };

  // 8. DUPLICATE Villa
  const handleDuplicateVilla = async (id: EntityId) => {
    const target = allVillas.find(v => String(v.id) === String(id));
    if (!target || mutationLoading) return;
    setMutationLoading(true);
    try {
      const payload = toAdminVillaPayload({ ...target, name: `${target.name} (Copy)` });
      validateVillaPayload(payload);
      await createAdminVilla(payload);
      await loadAdminStats({ preserveScroll: true, silent: true });
      onVillaAddedNotification();
      showToast('success', t('admin.duplicateVillaSuccess', { name: target.name }));
    } catch (error) {
      handleMutationError(error, t('admin.duplicateVillaError'));
    } finally {
      setMutationLoading(false);
    }
  };

  // 9. BULK DELETE Villas
  const handleBulkDeleteVillas = (ids: EntityId[]) => {
    showToast('info', t('admin.bulkDeleteLater', { count: ids.length }));
  };

  // 10. BULK STATUS UPDATE
  const handleBulkStatusUpdateVillas = (ids: EntityId[], _active: boolean) => {
    showToast('info', t('admin.bulkStatusLater', { count: ids.length }));
  };

  // Auth screen layout
  if (!isLoggedIn) {
    return (
      <div className="bg-[#f2f4f8] min-h-full px-4 py-8 sm:py-16 flex items-start justify-center overflow-y-auto overscroll-contain">
        <div id="admin-login-card" className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-neutral-200/80 p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden my-6">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0071c2] to-[#fe6a34]" />

          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-[#edf3ff] text-[#0071c2] flex items-center justify-center shadow-inner font-bold">
              AD
            </div>

            <h2 id="admin-login-title" className="text-xl font-display font-black text-neutral-800 mt-2">
              {t('admin.loginTitle')}
            </h2>
            <p className="text-xs text-neutral-500 max-w-[320px] font-normal leading-relaxed">
              {t('admin.loginDesc')}
            </p>
          </div>

          {loginError && (
            <div id="admin-login-error" className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-center gap-2 font-bold leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="admin-username-input"
                  type="text"
                  required
                  placeholder="admin@villa.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold outline-none focus:bg-white focus:border-[#0071c2]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                {t('admin.passwordLabel')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-400">
                  <Lock className="w-4 h-4 animate-pulse" />
                </span>
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={t('admin.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl py-2.5 pl-9 pr-10 text-xs font-semibold outline-none focus:bg-white focus:border-[#0071c2]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 cursor-pointer flex items-center justify-center bg-transparent border-0"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#0071c2] rounded border-neutral-350 focus:ring-[#0071c2]"
                />
                <span className="text-[11px] text-neutral-500 font-semibold">
                  {t('admin.rememberLogin')}
                </span>
              </label>
            </div>

            <button
              id="admin-login-submit"
              type="submit"
              className="mt-2 bg-[#0071c2] hover:bg-[#005899] text-white py-3 px-4 rounded-xl text-xs font-black tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#0071c2]/10 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span>{t('admin.loginButton')}</span>
            </button>
          </form>

          {(import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_CREDENTIALS === 'true') && (
            <div className="bg-[#edf3ff] border border-blue-100 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed">
              <span className="text-[#0071c2] font-extrabold text-sm self-start">💡</span>
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-[#005899] font-black font-display">
                  {t('admin.demoTitle')}
                </span>
                <span className="text-neutral-600 font-semibold font-mono">
                  {t('admin.demoCredentials')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard Loading skeleton screen
  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  // Logged-in admin layout
  return (
    <div className="bg-[#f8f9fc] h-full min-h-0 overflow-hidden flex flex-col">
      {/* Visual Admin header */}
      <div className="bg-white border-b border-neutral-100 px-4 py-3 sm:py-4.5 shrink-0 z-40 shadow-sm flex items-center justify-between">
        <div className="max-w-[1280px] mx-auto px-0 sm:px-4 md:px-8 w-full flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="shrink-0 bg-[#0071c2]/10 text-[#0071c2] px-2.5 py-1 rounded-full font-black text-[10px] tracking-wider uppercase">{t('admin.portal')}</span>
            <h1 className="truncate text-xs sm:text-sm font-black text-neutral-800 tracking-tight font-display">{t('admin.consoleTitle')}</h1>
          </div>
          <button
            onClick={triggerLogout}
            className="min-h-11 text-neutral-400 hover:text-red-500 font-bold text-xs flex items-center gap-1 bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-100 hover:bg-red-50 hover:border-red-100 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('admin.logout')}</span>
          </button>
        </div>
      </div>

      {adminDataError && (
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 pt-5">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-xs font-bold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{adminDataError}</span>
          </div>
        </div>
      )}

      <AdminLayout
        villas={allVillas}
        bookings={recentBookings}
        feedbacks={allFeedbacks}
        onAddVilla={handleAddVilla}
        onDeleteVilla={triggerDeleteVilla}
        onUpdateVilla={handleUpdateVilla}
        onDuplicateVilla={handleDuplicateVilla}
        onBulkDeleteVillas={handleBulkDeleteVillas}
        onBulkStatusUpdateVillas={handleBulkStatusUpdateVillas}
        onApproveBooking={triggerApproveBooking}
        onRejectBooking={triggerRejectBooking}
        onCompleteBooking={triggerCompleteBooking}
        onToggleVerifyFeedback={handleToggleVerifyFeedback}
        onUpdateVillaAvailability={handleUpdateVillaAvailability}
        onLogout={triggerLogout}
        adminStats={adminStats || undefined}
        adminUser={adminUser || undefined}
        mutationLoading={mutationLoading}
        isRefreshing={isRefreshing}
        activeTab={activeAdminTab}
        onTabChange={handleAdminTabChange}
        scrollRef={adminScrollRef}
      />

      {/* Global Confirmation modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        type={confirmModalConfig.type}
      />
    </div>
  );
}
