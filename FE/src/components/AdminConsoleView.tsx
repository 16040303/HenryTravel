import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertCircle, Lock, User, LogIn, Eye, EyeOff, LogOut
} from 'lucide-react';
import { addVilla } from '../lib/api';
import { VillaDetail, Booking, Feedback } from '../types';
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
  const [loading, setLoading] = useState(true);

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
    const sessionAuth = sessionStorage.getItem('villastay_admin_authenticated');
    const localAuth = localStorage.getItem('villastay_admin_authenticated');
    if (sessionAuth === 'true' || localAuth === 'true') {
      setIsLoggedIn(true);
    }
    loadAdminStats();
  }, []);

  const loadAdminStats = () => {
    setLoading(true);
    // Read villas
    const rawVillas = localStorage.getItem('villastay_villas');
    const villasList: VillaDetail[] = rawVillas ? JSON.parse(rawVillas) : [];
    setAllVillas(villasList);

    // Read bookings
    const rawBookings = localStorage.getItem('villastay_bookings');
    const bookingsList: Booking[] = rawBookings ? JSON.parse(rawBookings) : [];
    setRecentBookings(bookingsList);

    // Read reviews
    const rawFeedbacks = localStorage.getItem('villastay_feedbacks');
    const feedbacksList: Feedback[] = rawFeedbacks ? JSON.parse(rawFeedbacks) : [];
    setAllFeedbacks(feedbacksList);

    setLoading(false);
  };

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().toLowerCase() === 'admin' && (password === 'admin123' || password === 'admin2026')) {
      if (rememberMe) {
        localStorage.setItem('villastay_admin_authenticated', 'true');
      } else {
        sessionStorage.setItem('villastay_admin_authenticated', 'true');
      }
      setIsLoggedIn(true);
      setLoginError('');
      loadAdminStats();
    } else {
      setLoginError(
        language === 'ko'
          ? '아이디 혹은 비밀번호가 투숙 관리 정보와 일치하지 않습니다.'
          : language === 'en'
            ? 'Incorrect admin username or password!'
            : 'Tên đăng nhập hoặc mật khẩu quản trị viên không chính xác!'
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
        localStorage.removeItem('villastay_admin_authenticated');
        sessionStorage.removeItem('villastay_admin_authenticated');
        setIsLoggedIn(false);
        setUsername('');
        setPassword('');
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        showToast('info', language === 'vi' ? 'Đã đăng xuất thành công.' : 'Logged out.');
      }
    });
  };

  // 1. ADD Villa
  const handleAddVilla = async (v: Omit<VillaDetail, 'id' | 'rating' | 'reviewsCount' | 'bookedDates' | 'pendingDates' | 'images'>) => {
    try {
      const list = [...allVillas];
      const newVilla: VillaDetail = {
        ...v,
        id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
        rating: 5.0,
        reviewsCount: 1,
        images: [v.image, 'https://picsum.photos/800/600?random=10'],
        bookedDates: [],
        pendingDates: []
      };
      
      list.push(newVilla);
      localStorage.setItem('villastay_villas', JSON.stringify(list));
      loadAdminStats();
      onVillaAddedNotification();
      showToast('success', language === 'vi' ? `Đã thêm thành công villa "${v.name}"` : `Added villa "${v.name}"`);
    } catch (err) {
      console.error(err);
      showToast('error', 'Lỗi hệ thống khi thêm biệt thự');
    }
  };

  // 2. DELETE Villa with double confirm modal
  const triggerDeleteVilla = (id: number, name: string) => {
    triggerConfirmModal({
      title: language === 'vi' ? 'Xóa cơ sở lưu trú?' : 'Delete Accommodation?',
      message: language === 'vi' 
        ? `Hành động này cực kỳ nguy hiểm và không thể khôi phục! Bạn sắp xóa biệt thự "${name}" khỏi cơ sở dữ liệu.`
        : `This will permanently remove "${name}" from the database. This action is irreversible!`,
      type: 'danger',
      onConfirm: () => {
        const filtered = allVillas.filter(v => v.id !== id);
        localStorage.setItem('villastay_villas', JSON.stringify(filtered));
        loadAdminStats();
        onVillaAddedNotification();
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        showToast('info', language === 'vi' ? `Đã xóa villa "${name}"` : `Removed villa "${name}"`);
      }
    });
  };

  // 3. UPDATE Villa properties
  const handleUpdateVilla = (v: VillaDetail) => {
    const list = allVillas.map(item => item.id === v.id ? v : item);
    localStorage.setItem('villastay_villas', JSON.stringify(list));
    loadAdminStats();
    onVillaAddedNotification();
    showToast('success', language === 'vi' ? `Đã cập nhật thông tin biệt thự` : `Updated villa properties.`);
  };

  // 4. APPROVE Booking Pending Hold with confirmation
  const triggerApproveBooking = (code: string) => {
    triggerConfirmModal({
      title: language === 'vi' ? 'Duyệt chuyển khoản đặt cọc?' : 'Approve Booking deposit?',
      message: language === 'vi'
        ? `Xác nhận rằng bạn đã nhận được thanh toán cọc ngân hàng thành công cho mã đơn "${code}"?`
        : `Verify that you have cleared the transfer deposit for code "${code}"?`,
      type: 'info',
      onConfirm: () => {
        const bookingsList = [...recentBookings];
        const bIdx = bookingsList.findIndex(item => item.code === code);
        if (bIdx !== -1) {
          bookingsList[bIdx].status = 'CONFIRMED';
          localStorage.setItem('villastay_bookings', JSON.stringify(bookingsList));
          
          // Secure the booking dates into villa's bookedDates
          const villasList = [...allVillas];
          const vIdx = villasList.findIndex(item => item.id === bookingsList[bIdx].villaId);
          if (vIdx !== -1) {
            const checkIn = bookingsList[bIdx].checkIn;
            // Add date check-in to bookedDates
            if (!villasList[vIdx].bookedDates.includes(checkIn)) {
              villasList[vIdx].bookedDates.push(checkIn);
            }
            // Remove from pending holds
            villasList[vIdx].pendingDates = villasList[vIdx].pendingDates.filter(x => x !== checkIn);
            localStorage.setItem('villastay_villas', JSON.stringify(villasList));
          }
          
          loadAdminStats();
          setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
          showToast('success', language === 'vi' ? `Đã duyệt chính thức đơn mã "${code}"` : `Booking code "${code}" approved.`);
        }
      }
    });
  };

  // 5. CANCEL/REJECT Booking Pending Hold with confirmation
  const triggerRejectBooking = (code: string) => {
    triggerConfirmModal({
      title: language === 'vi' ? 'Hủy giữ chỗ / Từ chối đơn?' : 'Cancel Hold / Decline booking?',
      message: language === 'vi'
        ? `Bạn có chắc chắn muốn hủy giữ phòng cho đơn mã "${code}"? Kho phòng sẽ được giải phóng lập tức.`
        : `Are you sure you want to cancel the pending hold for "${code}"? Room will be unlocked.`,
      type: 'danger',
      onConfirm: () => {
        const bookingsList = [...recentBookings];
        const bIdx = bookingsList.findIndex(item => item.code === code);
        if (bIdx !== -1) {
          bookingsList[bIdx].status = 'CANCELLED';
          localStorage.setItem('villastay_bookings', JSON.stringify(bookingsList));
          
          // Release dates from villa
          const villasList = [...allVillas];
          const vIdx = villasList.findIndex(item => item.id === bookingsList[bIdx].villaId);
          if (vIdx !== -1) {
            const checkIn = bookingsList[bIdx].checkIn;
            villasList[vIdx].pendingDates = villasList[vIdx].pendingDates.filter(x => x !== checkIn);
            villasList[vIdx].bookedDates = villasList[vIdx].bookedDates.filter(x => x !== checkIn);
            localStorage.setItem('villastay_villas', JSON.stringify(villasList));
          }
          
          loadAdminStats();
          setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
          showToast('info', language === 'vi' ? `Đã hủy giữ chỗ đơn mã "${code}"` : `Booking code "${code}" cancelled.`);
        }
      }
    });
  };

  // 6. TOGGLE VERIFIED Feedback showing/hiding
  const handleToggleVerifyFeedback = (id: string) => {
    const list = allFeedbacks.map(f => {
      if (f.id === id) {
        const updatedStatus = !f.isVerified;
        showToast('info', updatedStatus 
          ? (language === 'vi' ? 'Nhận xét đã hiển thị công khai.' : 'Review is now visible to public.')
          : (language === 'vi' ? 'Đã ẩn nhận xét này khỏi trang công khai.' : 'Review is hidden from public.')
        );
        return { ...f, isVerified: updatedStatus };
      }
      return f;
    });
    localStorage.setItem('villastay_feedbacks', JSON.stringify(list));
    loadAdminStats();
  };

  // 7. UPDATE Villa availability blocked/unblocked dates manually
  const handleUpdateVillaAvailability = (villaId: number, bookedDates: string[], pendingDates: string[]) => {
    const list = allVillas.map(v => {
      if (v.id === villaId) {
        return { ...v, bookedDates, pendingDates };
      }
      return v;
    });
    localStorage.setItem('villastay_villas', JSON.stringify(list));
    loadAdminStats();
    onVillaAddedNotification();
  };

  // 8. DUPLICATE Villa
  const handleDuplicateVilla = (id: number) => {
    const target = allVillas.find(v => v.id === id);
    if (!target) return;
    const newId = allVillas.length > 0 ? Math.max(...allVillas.map(x => x.id)) + 1 : 1;
    const duplicated: VillaDetail = {
      ...target,
      id: newId,
      name: `${target.name} (Copy)`,
      bookedDates: [],
      pendingDates: [],
      reviewsCount: 0,
      rating: 5.0,
      isActive: target.isActive !== undefined ? target.isActive : true
    };
    const list = [...allVillas, duplicated];
    localStorage.setItem('villastay_villas', JSON.stringify(list));
    loadAdminStats();
    onVillaAddedNotification();
    showToast('success', language === 'vi' ? `Đã nhân bản biệt thự "${target.name}"` : `Duplicated villa "${target.name}"`);
  };

  // 9. BULK DELETE Villas
  const handleBulkDeleteVillas = (ids: number[]) => {
    triggerConfirmModal({
      title: language === 'vi' ? `Xóa ${ids.length} biệt thự đã chọn?` : `Delete ${ids.length} selected?`,
      message: language === 'vi'
        ? `Bạn có chắc chắn muốn xóa vĩnh viễn ${ids.length} biệt thự khỏi cơ sở dữ liệu? Hành động này cực kỳ nguy hiểm và không thể khôi phục!`
        : `Are you sure you want to permanently delete these ${ids.length} accommodations? This action is irreversible!`,
      type: 'danger',
      onConfirm: () => {
        const filtered = allVillas.filter(v => !ids.includes(v.id));
        localStorage.setItem('villastay_villas', JSON.stringify(filtered));
        loadAdminStats();
        onVillaAddedNotification();
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        showToast('info', language === 'vi' ? `Đã xóa ${ids.length} biệt thự thành công.` : `Removed ${ids.length} villas.`);
      }
    });
  };

  // 10. BULK STATUS UPDATE
  const handleBulkStatusUpdateVillas = (ids: number[], active: boolean) => {
    const list = allVillas.map(v => ids.includes(v.id) ? { ...v, isActive: active } : v);
    localStorage.setItem('villastay_villas', JSON.stringify(list));
    loadAdminStats();
    onVillaAddedNotification();
    showToast('success', language === 'vi'
      ? `Đã cập nhật trạng thái hoạt động cho ${ids.length} biệt thự.`
      : `Updated active status for ${ids.length} villas.`
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
                {language === 'ko' ? '사용자 이름 / 이메일' : language === 'en' ? 'Username / Email' : 'Tên đăng nhập / Email'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-400">
                  <User className="w-4 h-4" />
                </span>
                <input 
                  id="admin-username-input"
                  type="text"
                  required
                  placeholder={language === 'ko' ? '아이디를 입력해주세요...' : language === 'en' ? 'Enter admin username...' : 'Nhập tên đăng nhập...'}
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
                    ? 'Username: admin · Password: admin123 or admin2026' 
                    : 'Tên đăng nhập: admin · Mật khẩu: admin123 hoặc admin2026'}
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
