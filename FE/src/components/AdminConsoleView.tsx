import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertCircle, Lock, User, LogIn, Eye, EyeOff, LogOut
} from 'lucide-react';
import {
  adminLogin,
  adminLogout,
  getAdminBookings,
  getAdminFeedbacks,
  getAdminStats,
  getAdminToken,
  getAdminVillas,
  getStoredAdminUser,
  mapAdminBookingToFrontendBooking,
  mapAdminFeedbackToFrontendFeedback,
  mapAdminVillaToFrontendVilla,
} from '../lib/api';
import { AdminStats, AdminUser, EntityId, VillaDetail, Booking, Feedback } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from './Toast';
import { AdminDashboardSkeleton } from './common/Skeleton';
import ConfirmModal from './common/ConfirmModal';
import AdminLayout from './admin/AdminLayout';

interface AdminConsoleViewProps {
  onVillaAddedNotification: () => void;
}

export default function AdminConsoleView({ onVillaAddedNotification }: AdminConsoleViewProps) {
  const { language } = useLanguage();
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
  const [adminDataError, setAdminDataError] = useState('');

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
    onConfirm: () => {}
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

  const loadAdminStats = async () => {
    setLoading(true);
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
      logoutToLogin('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    if (statsResult.status === 'fulfilled') {
      setAdminStats(statsResult.value);
    } else {
      errors.push(statsResult.reason instanceof Error ? statsResult.reason.message : 'Không tải được thống kê admin.');
    }

    if (villasResult.status === 'fulfilled') {
      setAllVillas(villasResult.value.villas.map(mapAdminVillaToFrontendVilla));
    } else {
      errors.push(villasResult.reason instanceof Error ? villasResult.reason.message : 'Không tải được danh sách villa.');
    }

    if (bookingsResult.status === 'fulfilled') {
      setRecentBookings(bookingsResult.value.bookings.map(mapAdminBookingToFrontendBooking));
    } else {
      errors.push(bookingsResult.reason instanceof Error ? bookingsResult.reason.message : 'Không tải được danh sách booking.');
    }

    if (feedbacksResult.status === 'fulfilled') {
      setAllFeedbacks(feedbacksResult.value.feedbacks.map(mapAdminFeedbackToFrontendFeedback));
    } else {
      errors.push(feedbacksResult.reason instanceof Error ? feedbacksResult.reason.message : 'Không tải được danh sách feedback.');
    }

    if (errors.length > 0) {
      setAdminDataError(errors.join(' '));
    }
    setLoading(false);
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
          : 'Email hoặc mật khẩu không đúng'
      );
    }
  };

  // Logout handler wrapper
  const triggerLogout = () => {
    triggerConfirmModal({
      title: language === 'vi' ? 'Đăng xuất tài khoản?' : 'Log Out?',
      message: language === 'vi' ? 'Bạn có muốn đăng xuất và kết thúc phiên làm việc quản trị không?' : 'Are you sure you want to end your administration session?',
      type: 'warning',
      onConfirm: () => {
        adminLogout();
        setIsLoggedIn(false);
        setAdminUser(null);
        setAdminStats(null);
        setUsername('');
        setPassword('');
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        showToast('info', language === 'vi' ? 'Đã đăng xuất thành công.' : 'Logged out.');
      }
    });
  };

  // 1. ADD Villa
  const handleAddVilla = async (v: Omit<VillaDetail, 'id' | 'rating' | 'reviewsCount' | 'bookedDates' | 'pendingDates' | 'images'>) => {
    showToast('info', language === 'vi' ? `Thêm villa "${v.name}" sẽ nối API ở phase sau.` : `Add villa "${v.name}" API will be connected in the next phase.`);
  };

  // 2. DELETE Villa with double confirm modal
  const triggerDeleteVilla = (_id: EntityId, name: string) => {
    showToast('info', language === 'vi' ? `Xóa villa "${name}" sẽ nối API ở phase sau.` : `Delete villa "${name}" API will be connected in the next phase.`);
  };

  // 3. UPDATE Villa properties
  const handleUpdateVilla = (v: VillaDetail) => {
    showToast('info', language === 'vi' ? `Cập nhật villa "${v.name}" sẽ nối API ở phase sau.` : `Update villa "${v.name}" API will be connected in the next phase.`);
  };

  // 4. APPROVE Booking Pending Hold with confirmation
  const triggerApproveBooking = (code: string) => {
    showToast('info', language === 'vi' ? `Duyệt booking "${code}" sẽ nối API ở phase sau.` : `Confirm booking "${code}" API will be connected in the next phase.`);
  };

  // 5. CANCEL/REJECT Booking Pending Hold with confirmation
  const triggerRejectBooking = (code: string) => {
    showToast('info', language === 'vi' ? `Hủy booking "${code}" sẽ nối API ở phase sau.` : `Cancel booking "${code}" API will be connected in the next phase.`);
  };

  // 6. TOGGLE VERIFIED Feedback showing/hiding
  const handleToggleVerifyFeedback = (_id: string) => {
    showToast('info', language === 'vi' ? 'Duyệt/ẩn feedback sẽ nối API ở phase sau.' : 'Feedback toggle API will be connected in the next phase.');
  };

  // 7. UPDATE Villa availability blocked/unblocked dates manually
  const handleUpdateVillaAvailability = (_villaId: EntityId, _bookedDates: string[], _pendingDates: string[]) => {
    showToast('info', language === 'vi' ? 'Cập nhật lịch trống sẽ nối API ở phase sau.' : 'Availability update API will be connected in the next phase.');
  };

  // 8. DUPLICATE Villa
  const handleDuplicateVilla = (id: EntityId) => {
    const target = allVillas.find(v => String(v.id) === String(id));
    showToast('info', language === 'vi' ? `Nhân bản villa "${target?.name || id}" sẽ nối API ở phase sau.` : `Duplicate villa "${target?.name || id}" API will be connected in the next phase.`);
  };

  // 9. BULK DELETE Villas
  const handleBulkDeleteVillas = (ids: EntityId[]) => {
    showToast('info', language === 'vi' ? `Xóa ${ids.length} villa sẽ nối API ở phase sau.` : `Bulk delete API for ${ids.length} villas will be connected in the next phase.`);
  };

  // 10. BULK STATUS UPDATE
  const handleBulkStatusUpdateVillas = (ids: EntityId[], _active: boolean) => {
    showToast('info', language === 'vi'
      ? `Cập nhật trạng thái ${ids.length} villa sẽ nối API ở phase sau.`
      : `Bulk status API for ${ids.length} villas will be connected in the next phase.`
    );
  };

  // Auth screen layout
  if (!isLoggedIn) {
    return (
      <div className="bg-[#f2f4f8] py-16 px-4 flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div id="admin-login-card" className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-neutral-200/80 p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden my-6">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0071c2] to-[#fe6a34]" />

          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-[#edf3ff] text-[#0071c2] flex items-center justify-center shadow-inner font-bold">
              AD
            </div>
            
            <h2 id="admin-login-title" className="text-xl font-display font-black text-neutral-800 mt-2">
              {language === 'ko' ? '관리자 Portal 로그인' : language === 'en' ? 'Admin Portal Sign In' : 'Đăng nhập hệ thống quản trị'}
            </h2>
            <p className="text-xs text-neutral-500 max-w-[320px] font-normal leading-relaxed">
              {language === 'ko' 
                ? '숙소 제어용 제한 구역입니다. 계속하려면 관리자 정보를 입력하십시오.' 
                : language === 'en' 
                  ? 'Restricted area. Please supply administrative credentials to access.' 
                  : 'Khu vực giới hạn dành riêng cho nhà điều hành VillaStay. Vui lòng đăng nhập để tiếp tục.'}
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
                {language === 'ko' ? '이메일' : language === 'en' ? 'Email' : 'Email'}
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
                {language === 'ko' ? '운영 비밀번호' : language === 'en' ? 'Admin Password' : 'Mật khẩu quản trị'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-400">
                  <Lock className="w-4 h-4 animate-pulse" />
                </span>
                <input 
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={language === 'ko' ? '비밀번호를 입력해주세요...' : language === 'en' ? 'Enter password...' : 'Nhập mật khẩu...'}
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
                  {language === 'ko' ? '로그인 정보 기억하기' : language === 'en' ? 'Remember login session' : 'Ghi nhớ phiên đăng nhập trên trình duyệt'}
                </span>
              </label>
            </div>

            <button 
              id="admin-login-submit"
              type="submit"
              className="mt-2 bg-[#0071c2] hover:bg-[#005899] text-white py-3 px-4 rounded-xl text-xs font-black tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#0071c2]/10 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span>{language === 'ko' ? '로그인 및 제어판 입장' : language === 'en' ? 'AUTHENTICATE USER' : 'XÁC THỰC ĐĂNG NHẬP'}</span>
            </button>
          </form>

          <div className="bg-[#edf3ff] border border-blue-100 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed">
            <span className="text-[#0071c2] font-extrabold text-sm self-start">💡</span>
            <div className="flex flex-col gap-0.5 text-left">
              <span className="text-[#005899] font-black font-display">
                {language === 'ko' ? '데모 계정 정보:' : language === 'en' ? 'Demo credentials:' : 'Tài khoản thử nghiệm hệ thống:'}
              </span>
              <span className="text-neutral-600 font-semibold font-mono">
                {language === 'ko' 
                  ? '아이디: admin · 패스워드: admin123 또는 admin2026' 
                  : language === 'en' 
                    ? 'Email: admin@villa.com · Password: admin123' 
                    : 'Email: admin@villa.com · Mật khẩu: admin123'}
              </span>
            </div>
          </div>
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
    <div className="bg-[#f8f9fc] min-h-screen pb-16">
      {/* Visual Admin header */}
      <div className="bg-white border-b border-neutral-100 py-4.5 px-4 sticky top-16 left-0 right-0 z-40 shadow-sm flex items-center justify-between">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-[#0071c2]/10 text-[#0071c2] px-2.5 py-0.5 rounded-full font-black text-[10px] tracking-wider uppercase">ADMIN PORTAL</span>
            <h1 className="text-sm font-black text-neutral-800 tracking-tight font-display">VillaStay Operating Console</h1>
          </div>
          <button
            onClick={triggerLogout}
            className="text-neutral-400 hover:text-red-500 font-bold text-xs flex items-center gap-1 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100 hover:bg-red-50 hover:border-red-100 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'vi' ? 'Đăng xuất' : 'Logout'}</span>
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
        onToggleVerifyFeedback={handleToggleVerifyFeedback}
        onUpdateVillaAvailability={handleUpdateVillaAvailability}
        onLogout={triggerLogout}
        adminStats={adminStats || undefined}
        adminUser={adminUser || undefined}
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
