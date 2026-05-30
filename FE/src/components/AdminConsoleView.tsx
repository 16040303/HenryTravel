import React, { useState, useEffect } from 'react';
import { 
  Building2, CalendarCheck, Landmark, ShieldCheck, Heart, Trash2, 
  PlusCircle, AlertCircle, FilePlus, Copy, Eye, CircleCheck, Check,
  Lock, User, LogIn, LogOut, EyeOff
} from 'lucide-react';
import { addVilla, getVillas } from '../lib/api';
import { VillaDetail, Booking } from '../types';
import { LOCATIONS, FACILITIES } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from './Toast';

interface AdminConsoleViewProps {
  onVillaAddedNotification: () => void;
}

export default function AdminConsoleView({ onVillaAddedNotification }: AdminConsoleViewProps) {
  const { language } = useLanguage();
  const { showToast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [totalRevenue, setTotalRevenue] = useState(128000000);
  const [allVillas, setAllVillas] = useState<VillaDetail[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Villa Modal Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVillaName, setNewVillaName] = useState('');
  const [newVillaLocation, setNewVillaLocation] = useState('Đà Lạt');
  const [newVillaPrice, setNewVillaPrice] = useState(2500000);
  const [newVillaType, setNewVillaType] = useState<'Villa' | 'Homestay' | 'Căn hộ'>('Villa');
  const [newVillaDescription, setNewVillaDescription] = useState('');
  const [newVillaAddress, setNewVillaAddress] = useState('');
  const [newVillaGuests, setNewVillaGuests] = useState(8);
  const [newVillaBedrooms, setNewVillaBedrooms] = useState(4);
  const [newVillaBathrooms, setNewVillaBathrooms] = useState(4);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(['wifi', 'kitchen']);
  const [dragOverImage, setDragOverImage] = useState(false);
  const [villaFileImageUrl, setVillaFileImageUrl] = useState('https://picsum.photos/400/300?random=15');

  // Success indicator triggers
  const [addSuccessMsg, setAddSuccessMsg] = useState('');

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('villastay_admin_authenticated');
    const localAuth = localStorage.getItem('villastay_admin_authenticated');
    if (sessionAuth === 'true' || localAuth === 'true') {
      setIsLoggedIn(true);
    }
    loadAdminStats();
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem('villastay_admin_authenticated');
    sessionStorage.removeItem('villastay_admin_authenticated');
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  const loadAdminStats = () => {
    setLoading(true);
    // Read from local storage directly for raw live admin metrics
    const rawVillas = localStorage.getItem('villastay_villas');
    const villasList: VillaDetail[] = rawVillas ? JSON.parse(rawVillas) : [];
    setAllVillas(villasList);

    const rawBookings = localStorage.getItem('villastay_bookings');
    const bookingsList: Booking[] = rawBookings ? JSON.parse(rawBookings) : [];
    setRecentBookings(bookingsList);

    // Calculate live revenue from confirmed bookings
    const rev = bookingsList
      .filter((b) => b.status === 'CONFIRMED')
      .reduce((sum, current) => sum + current.totalPrice, 0);
    setTotalRevenue(rev + 128000000); // base initial mock offset + live updates

    setLoading(false);
  };

  const handleAdminApproveHold = (code: string) => {
    const rawBookings = localStorage.getItem('villastay_bookings');
    if (rawBookings) {
      const bookingsList: Booking[] = JSON.parse(rawBookings);
      const bIndex = bookingsList.findIndex((item) => item.code === code);
      if (bIndex !== -1) {
        bookingsList[bIndex].status = 'CONFIRMED';
        localStorage.setItem('villastay_bookings', JSON.stringify(bookingsList));
        loadAdminStats();
        showToast('success', `Đã duyệt xác nhận thành công cho mã đặt chỗ: ${code}`);
      }
    }
  };

  const handleAdminRejectHold = (code: string) => {
    const rawBookings = localStorage.getItem('villastay_bookings');
    if (rawBookings) {
      const bookingsList: Booking[] = JSON.parse(rawBookings);
      const bIndex = bookingsList.findIndex((item) => item.code === code);
      if (bIndex !== -1) {
        bookingsList[bIndex].status = 'CANCELLED';
        localStorage.setItem('villastay_bookings', JSON.stringify(bookingsList));
        loadAdminStats();
        showToast('info', `Đã huỷ kích hoạt tạm giữ chỗ cho mã: ${code}`);
      }
    }
  };

  const deleteVillaAdmin = (id: number) => {
    const villaToDelete = allVillas.find((v) => v.id === id);
    const filtered = allVillas.filter((v) => v.id !== id);
    localStorage.setItem('villastay_villas', JSON.stringify(filtered));
    loadAdminStats();
    onVillaAddedNotification();
    showToast('info', `Đã xoá ${villaToDelete?.name || 'villa'} khỏi hệ thống`);
  };

  const handleFacilityCheckToggle = (id: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleMockImageUploadDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverImage(false);
    // Provide a beautiful mock random image url on dropping fake file
    const randomIdx = Math.floor(Math.random() * 50) + 10;
    setVillaFileImageUrl(`https://picsum.photos/400/300?random=${randomIdx}`);
  };

  const handleAddVillaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVillaName.trim() || !newVillaAddress.trim() || !newVillaDescription.trim()) {
      showToast('warning', 'Vui lòng điền đủ các trường bắt buộc!');
      return;
    }

    try {
      await addVilla({
        name: newVillaName,
        location: newVillaLocation,
        price: newVillaPrice,
        type: newVillaType,
        description: newVillaDescription,
        address: newVillaAddress,
        guestsCount: newVillaGuests,
        bedroomsCount: newVillaBedrooms,
        bathroomsCount: newVillaBathrooms,
        facilities: selectedFacilities,
        status: 'Available',
        image: villaFileImageUrl,
        policies: {
          time: ['Nhận phòng: Từ 14:00', 'Trả phòng: Trước 12:00'],
          other: ['Cần liên hệ đặt cọc trước.', 'Giữ vệ sinh chung.']
        }
      });

      setAddSuccessMsg('Đã thêm sản phẩm lưu trú mới vào cơ sở dữ liệu VillaStay thành công!');
      setNewVillaName('');
      setNewVillaDescription('');
      setNewVillaAddress('');
      
      // reload admin lists
      loadAdminStats();
      onVillaAddedNotification(); // Notify changes to listeners

      setTimeout(() => {
        setAddSuccessMsg('');
        setShowAddModal(false);
      }, 1500);

    } catch (err) {
      console.error(err);
    }
  };

  // Find booking items expecting validations
  const pendingBookings = recentBookings.filter((b) => b.status === 'PENDING');

  if (!isLoggedIn) {
    return (
      <div className="bg-[#f2f4f8] py-16 px-4 flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div id="admin-login-card" className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-neutral-200/80 p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden my-6">
          
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0071c2] to-[#fe6a34]" />

          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-[#edf3ff] text-[#0071c2] flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-8 h-8" />
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
                  className="w-full bg-neutral-50 border border-neutral-350 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold outline-none focus:bg-white focus:border-[#0071c2] focus:ring-1 focus:ring-[#0071c2]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                {language === 'ko' ? '운영 비밀번호' : language === 'en' ? 'Admin Password' : 'Mật khẩu quản trị'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={language === 'ko' ? '비밀번호를 입력해주세요...' : language === 'en' ? 'Enter password...' : 'Nhập mật khẩu...'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-350 rounded-xl py-2 pl-9 pr-10 text-xs font-semibold outline-none focus:bg-white focus:border-[#0071c2] focus:ring-1 focus:ring-[#0071c2]"
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
                  className="w-4 h-4 text-[#0071c2] rounded border-neutral-300 focus:ring-[#0071c2]"
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
              <LogIn className="w-4 h-4" />
              <span>{language === 'ko' ? '로그인 및 제어판 입장' : language === 'en' ? 'AUTHENTICATE USER' : 'XÁC THỰC ĐĂNG NHẬP'}</span>
            </button>
          </form>

          <div className="bg-[#edf3ff] border border-blue-100 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed">
            <span className="text-[#0071c2] font-extrabold text-sm self-start">💡</span>
            <div className="flex flex-col gap-0.5 text-left">
              <span className="text-[#005899] font-black">
                {language === 'ko' ? '데모 계정 정보:' : language === 'en' ? 'Demo credentials:' : 'Tài khoản thử nghiệm hệ thống:'}
              </span>
              <span className="text-neutral-600 font-semibold">
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

  return (
    <div className="bg-[#f2f4f8] min-h-screen py-10 px-4">
      <div className="max-w-[1280px] mx-auto px-2 md:px-6 flex flex-col gap-8">
        
        {/* Admin Header visual banner */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-neutral-300 pb-5 gap-4">
          <div>
            <span className="text-[#0071c2] text-xs font-black tracking-widest uppercase">Khu vực điều hành</span>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-neutral-800 mt-0.5">VillaStay Admin Dashboard</h1>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-[#0071c2] hover:bg-[#005899] text-white font-black text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow shadow-[#0071c2]/20 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thêm Villa Mới</span>
            </button>

            <button 
              onClick={handleLogout}
              className="border border-neutral-300 bg-white hover:bg-neutral-50 hover:text-red-500 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 text-neutral-600 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Stats Metrics Cards rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Stat 1 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200/50 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase">Sản phẩm Homestays (Villas)</span>
              <span className="text-3xl font-black text-neutral-800 font-display mt-1">{allVillas.length} mục</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0071c2] flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200/50 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase">Lượt Đặt Trực Tuyến</span>
              <span className="text-3xl font-black text-neutral-800 font-display mt-1">{recentBookings.length} lượt</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#fe6a34] flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200/50 flex items-center justify-between text-emerald-900 border-l-4 border-l-emerald-500">
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase">Tổng Doanh Thu Du Lịch</span>
              <span className="text-2xl font-black mt-1 font-display leading-tight text-neutral-800">
                {totalRevenue.toLocaleString('vi-VN')}₫
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Landmark className="w-6 h-6" />
            </div>
          </div>

          {/* Stat 4 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200/50 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase">Chờ duyệt biên lai</span>
              <span className={`text-3xl font-black mt-1 font-display ${pendingBookings.length > 0 ? 'text-red-600 animate-pulse' : 'text-neutral-800'}`}>
                {pendingBookings.length} yêu cầu
              </span>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${pendingBookings.length > 0 ? 'bg-red-50 text-red-500' : 'bg-neutral-50 text-neutral-400'}`}>
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Pending holds processing Alert panel (Approval Flow) */}
        {pendingBookings.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-extrabold text-sm uppercase tracking-wide">YÊU CẦU CHỜ DUYỆT TÀI CHÍNH TẠM GIỮ CHỖ</h3>
            </div>
            
            <div className="flex flex-col gap-3">
              {pendingBookings.map((b) => (
                <div 
                  key={b.code} 
                  className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex flex-col gap-1 text-semibold">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-neutral-800">{b.fullName} ({b.phone})</span>
                      <span className="bg-[#ffdbd0] text-[#390c00] px-2 py-0.2 rounded font-mono font-bold text-[10px] uppercase">{b.code}</span>
                    </div>
                    <span className="text-neutral-500">
                      Villa: <strong>{b.villaName}</strong> · Khoảng ngày: <strong>{b.checkIn}</strong> đến <strong>{b.checkOut}</strong>
                    </span>
                    <span className="text-[#fe6a34] font-bold">Trị giá: {b.totalPrice.toLocaleString('vi-VN')}₫</span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button 
                      onClick={() => handleAdminApproveHold(b.code)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Xác nhận đã chuyển khoản
                    </button>
                    <button 
                      onClick={() => handleAdminRejectHold(b.code)}
                      className="border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-500 hover:text-red-500 font-bold py-1.5 px-3 rounded text-[11px] cursor-pointer"
                    >
                      Xoá bỏ giữ chỗ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Business trend chart & listings list splits */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Trend Chart column */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-neutral-800">Thống kê Doanh Thu Tuần 2026</h3>
              <p className="text-[11px] text-neutral-400 font-semibold mt-0.5">Biểu đồ ước lượng biến động nhu cầu đặt biệt thự</p>
            </div>

            {/* Beautiful responsive custom bar chart visualizer using Tailwind */}
            <div className="h-44 flex items-end gap-3 pt-6 pb-2 border-b border-neutral-100 px-2 font-mono">
              {[
                { label: 'T2', val: 35, vol: '35M' },
                { label: 'T3', val: 48, vol: '48M' },
                { label: 'T4', val: 65, vol: '65M' },
                { label: 'T5', val: 40, vol: '40M' },
                { label: 'T6', val: 85, vol: '85M' },
                { label: 'T7', val: 100, vol: '100M' },
                { label: 'CN', val: 92, vol: '92M' }
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end relative">
                  <span className="text-[8px] font-bold text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-800 text-white rounded px-1.5 py-0.5 absolute -top-1 shadow z-10 whitespace-nowrap pointer-events-none">
                    {item.vol}
                  </span>
                  
                  {/* Glowing Bar */}
                  <div 
                    style={{ height: `${item.val}%` }} 
                    className="w-full bg-[#0071c2] hover:bg-[#fe6a34] group-hover:scale-x-105 rounded-t-md transition-all duration-300 shadow shadow-[#0071c2]/10"
                  />
                  <span className="text-[10px] text-neutral-500 font-black">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-[#005899] font-bold flex items-center gap-1 pt-3">
              <span className="w-2 h-2 rounded-full bg-[#0071c2] inline-block animate-pulse" />
              <span>Dự phòng: Lực cầu tăng vọt 20% vào dịp cuối tuần đón khách du lịch Đà Lạt.</span>
            </div>
          </div>

          {/* Recent list table column */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex flex-col">
            <h3 className="text-base font-bold text-neutral-800 mb-4">Các lượt đặt chỗ gần nhất</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 font-bold text-neutral-400 uppercase tracking-widest text-[9px]">
                    <th className="py-2.5">Khách hàng</th>
                    <th className="py-2.5">Biệt thự</th>
                    <th className="py-2.5">Tổng Tiền</th>
                    <th className="py-2.5 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-neutral-700">
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-neutral-400 italic">Chưa có lịch sử đặt phòng nào</td>
                    </tr>
                  ) : (
                    recentBookings.map((b, idx) => (
                      <tr key={idx} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50">
                        <td className="py-3">
                          <div className="flex flex-col leading-tight">
                            <span className="font-bold text-neutral-800">{b.fullName}</span>
                            <span className="text-[10px] text-neutral-400">{b.phone}</span>
                          </div>
                        </td>
                        <td className="py-3 max-w-[140px] truncate">{b.villaName}</td>
                        <td className="py-3 text-[#fe6a34] font-extrabold">{b.totalPrice.toLocaleString('vi-VN')}₫</td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase ${
                            b.status === 'CONFIRMED'
                              ? 'bg-emerald-150 text-emerald-800'
                              : b.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-neutral-100 text-neutral-500'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Existing product inventory panel */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
          <h3 className="text-base font-bold text-neutral-800 mb-4">Khảo sát Kho phòng du lịch ({allVillas.length})</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {allVillas.map((v) => (
              <div key={v.id} className="border border-neutral-100 rounded-xl p-3 flex gap-3 items-center">
                <img src={v.image} alt={v.name} className="w-14 h-14 object-cover rounded-lg shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs truncate text-neutral-800 leading-tight">{v.name}</h4>
                  <span className="text-[9px] text-[#0071c2] font-semibold block mt-0.5">{v.location} · {v.type}</span>
                  <span className="text-xs font-black text-[#fe6a34] block">{v.price.toLocaleString('vi-VN')}₫ / đêm</span>
                </div>
                <button 
                  onClick={() => deleteVillaAdmin(v.id)}
                  title="Xoá villa này"
                  className="text-neutral-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Insert custom Villa Modal popup containing drag-and-drop file upload */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 overflow-y-auto max-h-[90vh] shadow-2xl animate-scaleIn border">
            
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-neutral-100">
              <div>
                <h3 className="text-lg font-display font-black text-neutral-800">Thêm Cơ Sở Lưu Trú Mới</h3>
                <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">Mẫu khai báo và cập nhật dữ liệu khách sạn đại chúng</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-neutral-800 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {addSuccessMsg ? (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-5 rounded-2xl text-xs font-bold text-center animate-pulse">
                ✓ {addSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleAddVillaSubmit} className="flex flex-col gap-5">
                
                {/* Drag and drop image block container */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase">Hình ảnh giới thiệu sản phẩm (Drag-And-Drop / Chọn click)</span>
                  
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setDragOverImage(true); }}
                    onDragLeave={() => setDragOverImage(false)}
                    onDrop={handleMockImageUploadDrop}
                    onClick={() => {
                      // pick another random landscape image
                      const randomId = Math.floor(Math.random() * 50) + 10;
                      setVillaFileImageUrl(`https://picsum.photos/400/300?random=${randomId}`);
                    }}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-2 transition-all ${
                      dragOverImage ? 'bg-[#edf3ff] border-[#0071c2]' : 'bg-neutral-50 border-neutral-200/80 hover:bg-neutral-100/50'
                    }`}
                  >
                    <img src={villaFileImageUrl} alt="Upload thumb representation" className="w-32 h-20 object-cover rounded-xl shadow-sm border border-neutral-200" />
                    
                    <div className="flex flex-col leading-snug">
                      <span className="text-xs font-bold text-[#0071c2]">Thả tệp ảnh vào đây hoặc click để đổi</span>
                      <span className="text-[10px] text-neutral-400 font-semibold mt-0.5">Hỗ trợ JPG, PNG, WEBP tỷ lệ chuẩn 4:3 (Tự sinh hoặc Mock)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">Tên Villa / Homestay *</span>
                    <input 
                      type="text"
                      required
                      placeholder="Ví dụ: Pine Hill Retreat Villa"
                      value={newVillaName}
                      onChange={(e) => setNewVillaName(e.target.value)}
                      className="bg-neutral-50 border border-neutral-200 p-2 text-xs font-semibold rounded-lg outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">Khu vực địa điểm *</span>
                    <select 
                      value={newVillaLocation}
                      onChange={(e) => setNewVillaLocation(e.target.value)}
                      className="bg-neutral-50 border border-neutral-200 p-2 text-xs font-semibold rounded-lg outline-none cursor-pointer text-neutral-800"
                    >
                      {LOCATIONS.map(loc => (<option key={loc} value={loc}>{loc}</option>))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">Giá thuê 1 đêm *</span>
                    <input 
                      type="number"
                      required
                      value={newVillaPrice}
                      onChange={(e) => setNewVillaPrice(Number(e.target.value))}
                      className="bg-neutral-50 border border-neutral-200 p-2 text-xs font-semibold rounded-lg outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">Loại dịch vụ</span>
                    <select 
                      value={newVillaType}
                      onChange={(e) => setNewVillaType(e.target.value as any)}
                      className="bg-neutral-50 border border-neutral-200 p-2 text-xs font-semibold rounded-lg outline-none cursor-pointer text-neutral-800"
                    >
                      <option value="Villa">Villa (Biệt thự)</option>
                      <option value="Homestay">Homestay (Nhà dân)</option>
                      <option value="Căn hộ">Căn hộ dịch vụ</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">Địa chỉ cụ thể *</span>
                    <input 
                      type="text"
                      required
                      placeholder="Ví dụ: Phường 3, Đà Lạt"
                      value={newVillaAddress}
                      onChange={(e) => setNewVillaAddress(e.target.value)}
                      className="bg-neutral-50 border border-neutral-200 p-2 text-xs font-semibold rounded-lg outline-none"
                    />
                  </div>
                </div>

                {/* Sizing values checkboxes details */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">Lượng khách tối đa</span>
                    <input 
                      type="number"
                      value={newVillaGuests}
                      onChange={(e) => setNewVillaGuests(Number(e.target.value))}
                      className="bg-neutral-50 border border-neutral-200 p-2 text-xs font-semibold rounded-lg outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">Căn phòng ngủ</span>
                    <input 
                      type="number"
                      value={newVillaBedrooms}
                      onChange={(e) => setNewVillaBedrooms(Number(e.target.value))}
                      className="bg-neutral-50 border border-neutral-200 p-2 text-xs font-semibold rounded-lg outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">Phòng vệ sinh</span>
                    <input 
                      type="number"
                      value={newVillaBathrooms}
                      onChange={(e) => setNewVillaBathrooms(Number(e.target.value))}
                      className="bg-neutral-50 border border-neutral-200 p-2 text-xs font-semibold rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase">Mô tả đầy đủ chi tiết đặc trưng *</span>
                  <textarea 
                    rows={3}
                    required
                    placeholder="Giới thiệu nét thiết kế cảnh quan biệt thự..."
                    value={newVillaDescription}
                    onChange={(e) => setNewVillaDescription(e.target.value)}
                    className="bg-neutral-50 border border-neutral-200 p-3 text-xs font-semibold rounded-lg outline-none resize-none"
                  />
                </div>

                {/* Amenities selections list checkboxes */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase">Tiện ích đi kèm hiện hữu</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50 p-3 rounded-2xl border">
                    {FACILITIES.map(key => {
                      const isChecked = selectedFacilities.includes(key.id);
                      return (
                        <label key={key.id} className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleFacilityCheckToggle(key.id)}
                            className="w-4 h-4 text-[#0071c2] rounded border-neutral-300 focus:ring-[#0071c2]"
                          />
                          <span>{key.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t text-xs">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 font-bold text-neutral-500 hover:text-neutral-800"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    className="bg-[#0071c2] hover:bg-[#005899] text-white font-bold py-2.5 px-6 rounded-lg "
                  >
                    Thêm lưu trữ ngay
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
