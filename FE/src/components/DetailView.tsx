import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Star, MapPin, Calendar, Heart, Share2, Compass, Waves, Wifi, 
  ParkingCircle, Utensils, Flame, Mountain, PawPrint, Users, MessageSquare, 
  Clock, ShieldAlert, BadgeInfo, CheckCircle2, Copy 
} from 'lucide-react';
import { VillaDetail, Feedback, BookingResult } from '../types';
import { getVillaById, createBooking, getVillaFeedbacks, submitFeedback } from '../lib/api';
import { getZaloLink, FACILITIES } from '../constants';
import { useBookingCountdown } from '../hooks/useBookingCountdown';
import { useLanguage } from '../contexts/LanguageContext';
import OptimizedImage from './OptimizedImage';
import { useToast } from './Toast';

interface DetailViewProps {
  villaId: number;
  onBack: () => void;
  onNavigateToLookup: () => void;
  onBookingSuccessNotify?: () => void; // callbacks to alert top parent if needed
}

export default function DetailView({ villaId, onBack, onNavigateToLookup, onBookingSuccessNotify }: DetailViewProps) {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [villa, setVilla] = useState<VillaDetail | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Form States
  const [newFeedbackName, setNewFeedbackName] = useState('');
  const [newFeedbackRating, setNewFeedbackRating] = useState(5);
  const [newFeedbackComment, setNewFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState('');

  // Booking Form dates input state
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [checkIn, setCheckIn] = useState('2026-06-20');
  const [checkOut, setCheckOut] = useState('2026-06-23');
  const [guestsCount, setGuestsCount] = useState(2);
  const [roomsCount, setRoomsCount] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Booking outcome state
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Dynamic price summaries calculation using check dates
  const [daysCount, setDaysCount] = useState(3);
  const [totalCost, setTotalCost] = useState(0);

  // Countdown timer hook powered by hold timer
  const currentHoldTime = bookingResult ? bookingResult.holdExpireAt : null;
  const timer = useBookingCountdown(currentHoldTime);

  useEffect(() => {
    async function loadVilla() {
      setLoading(true);
      const data = await getVillaById(villaId);
      if (data) {
        setVilla(data);
        const fList = await getVillaFeedbacks(villaId);
        setFeedbacks(fList);
        
        // Populate standard configs
        setTotalCost(data.price * 3);
      }
      setLoading(false);
    }
    loadVilla();
  }, [villaId]);

  // Recalculate days and prices whenever check dates are updated
  useEffect(() => {
    if (!villa) return;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end.getTime() > start.getTime()) {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysCount(diffDays);
      setTotalCost(diffDays * villa.price);
    } else {
      setDaysCount(0);
      setTotalCost(0);
    }
  }, [checkIn, checkOut, villa]);

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 py-16 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-[#0071c2] border-t-transparent rounded-full" />
        <p className="mt-4 text-xs font-bold text-neutral-400">Đang tải thông tin chi tiết biệt thự...</p>
      </div>
    );
  }

  if (!villa) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 py-16 text-center">
        <h2 className="text-xl font-bold text-neutral-800">Không tìm thấy biệt thự</h2>
        <button onClick={onBack} className="mt-4 bg-[#0071c2] text-white px-4 py-2 rounded-lg">Quay lại</button>
      </div>
    );
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingName.trim() || !bookingPhone.trim()) {
      showToast('warning', 'Vui lòng điền đầy đủ tên và số điện thoại liên hệ!');
      return;
    }
    if (daysCount <= 0) {
      showToast('error', 'Ngày check-out phải lớn hơn ngày check-in!');
      return;
    }

    setBookingLoading(true);
    try {
      const resp = await createBooking({
        fullName: bookingName,
        phone: bookingPhone,
        email: bookingEmail || `${bookingPhone}@vietnamstay.com`,
        villaId: villa.id,
        checkIn,
        checkOut,
        guests: guestsCount,
        rooms: roomsCount,
        totalPrice: totalCost
      });

      if (resp.success) {
        setBookingResult(resp);
        setShowBookingModal(true);
        if (onBookingSuccessNotify) {
          onBookingSuccessNotify();
        }
      } else {
        showToast('error', resp.message || 'Xảy ra lỗi trong lúc đặt chỗ!');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Có lỗi hệ thống trong lúc kết nối máy chủ!');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReviewFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackName.trim() || !newFeedbackComment.trim()) {
      showToast('warning', 'Vui lòng điền đầy đủ thông tin nhận xét!');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      await submitFeedback({
        villaId: villa.id,
        guestName: newFeedbackName,
        rating: newFeedbackRating,
        comment: newFeedbackComment
      });

      setFeedbackSuccessMsg('Cực kỳ cảm ơn đánh giá của bạn! Đánh giá đã được lưu vào hệ thống.');
      setNewFeedbackName('');
      setNewFeedbackComment('');
      
      // Reload feedbacks list
      const updatedFeedbacks = await getVillaFeedbacks(villa.id);
      setFeedbacks(updatedFeedbacks);

      // Reload villa info to reflect updated ratings in UI
      const refreshVilla = await getVillaById(villa.id);
      if (refreshVilla) {
        setVilla(refreshVilla);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const copyBookingCode = () => {
    if (bookingResult) {
      navigator.clipboard.writeText(bookingResult.bookingCode);
      showToast('success', `Đã sao chép mã đặt phòng: ${bookingResult.bookingCode}`);
    }
  };

  // Build the Zalo Action button Link with context about booking
  const zaloSupportMessage = bookingResult
    ? `Xin chào VillaStay, tôi vừa đặt phòng với mã giữ chỗ [ ${bookingResult.bookingCode} ] tại ${villa.name}. Vui lòng xác nhận giao dịch giúp tôi.`
    : `Xin chào VillaStay, tôi cần hỗ trợ đặt phòng tại ${villa.name}.`;
  const zaloSupportUrl = getZaloLink(zaloSupportMessage);

  return (
    <div className="bg-[#fcf9f8] min-h-screen pb-20">
      
      {/* Breadcrumbs and navigation controls */}
      <div className="bg-white border-b border-neutral-100 py-3.5 px-4">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 flex items-center justify-between">
          <button 
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-[#0071c2] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
            <span>Vietnam</span>
            <span>/</span>
            <span>{villa.location}</span>
            <span>/</span>
            <span className="text-neutral-700 font-extrabold">{villa.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 py-8">
        
        {/* Title Block Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-[#edf3ff] text-[#005899] text-[10px] font-black uppercase py-0.5 px-2.5 rounded-full">
                {villa.type}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-black text-[#fe6a34]">
                <Star className="w-3.5 h-3.5 fill-[#fe6a34] text-[#fe6a34]" />
                <span>{villa.rating}</span>
                <span className="text-neutral-400 font-normal">({feedbacks.length} bình luận)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-neutral-800 leading-tight">
              {villa.name}
            </h1>

            <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 mt-2">
              <MapPin className="w-4 h-4 text-neutral-400" />
              <span>{villa.address} · {villa.location}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <button className="flex items-center gap-1.5 border border-neutral-200 bg-white hover:bg-neutral-50 rounded-lg py-2 px-3.5 shadow-sm text-neutral-600 cursor-pointer">
              <Heart className="w-4 h-4 hover:fill-red-500 text-neutral-400" />
              <span>Yêu thích</span>
            </button>
            <button className="flex items-center gap-1.5 border border-neutral-200 bg-white hover:bg-neutral-50 rounded-lg py-2 px-3.5 shadow-sm text-neutral-600 cursor-pointer">
              <Share2 className="w-4 h-4 text-neutral-400" />
              <span>Chia sẻ</span>
            </button>
          </div>
        </div>

        {/* Bento Gallery Grid (Satisfying detail bento-grid specs) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl overflow-hidden mb-10 shadow-sm">
          {/* Main big block */}
          <div className="md:col-span-2 relative aspect-[4/3] md:aspect-square bg-neutral-100">
            <OptimizedImage 
              src={villa.images[0] || villa.image} 
              alt="Main angle" 
              className="w-full h-full object-cover hover:scale-101 transition-transform duration-500 cursor-zoom-in"
              isHero={true}
              aspectRatioClassName="h-full w-full"
            />
          </div>

          {/* Sub blocks */}
          <div className="grid grid-cols-2 md:grid-cols-1 md:col-span-1 gap-3">
            <div className="relative aspect-[4/3] md:aspect-auto md:h-full bg-neutral-100">
              <OptimizedImage 
                src={villa.images[1] || 'https://picsum.photos/400/300?random=11'} 
                alt="Room detail 1" 
                className="w-full h-full object-cover hover:scale-102 transition-transform duration-500 cursor-zoom-in"
                aspectRatioClassName="h-full w-full"
              />
            </div>
            <div className="relative aspect-[4/3] md:aspect-auto md:h-full bg-neutral-100">
              <OptimizedImage 
                src={villa.images[2] || 'https://picsum.photos/400/300?random=12'} 
                alt="Bathroom detail" 
                className="w-full h-full object-cover hover:scale-102 transition-transform duration-500 cursor-zoom-in"
                aspectRatioClassName="h-full w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-1 md:col-span-1 gap-3">
            <div className="relative aspect-[4/3] md:aspect-auto md:h-full bg-neutral-100">
              <OptimizedImage 
                src={villa.images[3] || 'https://picsum.photos/400/300?random=13'} 
                alt="Scenic detail" 
                className="w-full h-full object-cover hover:scale-102 transition-transform duration-500 cursor-zoom-in"
                aspectRatioClassName="h-full w-full"
              />
            </div>
            <div className="relative aspect-[4/3] md:aspect-auto md:h-full bg-[#eee]">
              <OptimizedImage 
                src={villa.images[4] || 'https://picsum.photos/400/300?random=14'} 
                alt="Outdoor view" 
                className="w-full h-full object-cover hover:scale-102 transition-transform duration-500 cursor-zoom-in opacity-80"
                aspectRatioClassName="h-full w-full"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-extrabold text-xs pointer-events-none text-center p-2">
                + {villa.images.length > 5 ? villa.images.length - 5 : 2} {language === 'vi' ? 'hình ảnh khác' : (language === 'ko' ? '개의 사진 더보기' : 'more photos')}
              </div>
            </div>
          </div>
        </div>

        {/* Splits Layout: Left info details vs Right secure Form trigger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Columns details */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            
            {/* Overview quick summaries section */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="flex flex-col items-center border-r border-neutral-100 last:border-0 py-1">
                <Users className="w-5 h-5 text-[#0071c2] mb-1.5" />
                <span className="text-[10px] uppercase font-bold text-neutral-400">Sức chứa</span>
                <span className="text-sm font-black text-neutral-800 mt-0.5">{villa.guestsCount || 8} khách</span>
              </div>
              <div className="flex flex-col items-center border-r border-[#fcf9f8] sm:border-neutral-100 last:border-0 py-1">
                <Clock className="w-5 h-5 text-[#0071c2] mb-1.5" />
                <span className="text-[10px] uppercase font-bold text-neutral-400">Phòng ngủ</span>
                <span className="text-sm font-black text-neutral-800 mt-0.5">{villa.bedroomsCount || 4} phòng ngủ</span>
              </div>
              <div className="flex flex-col items-center border-r border-neutral-100 last:border-0 py-1">
                <Compass className="w-5 h-5 text-[#0071c2] mb-1.5" />
                <span className="text-[10px] uppercase font-bold text-neutral-400">Phòng vệ sinh</span>
                <span className="text-sm font-black text-neutral-800 mt-0.5">{villa.bathroomsCount || 4} phòng tắm</span>
              </div>
              <div className="flex flex-col items-center last:border-0 py-1">
                <CheckCircle2 className="w-5 h-5 text-[#0071c2] mb-1.5" />
                <span className="text-[10px] uppercase font-bold text-neutral-400">Trạng thái</span>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 py-0.5 px-2 rounded-full mt-0.5">Sẵn sàng</span>
              </div>
            </div>

            {/* Description Text block */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-display font-black text-neutral-800">Giới thiệu dịch vụ</h3>
              <p className="text-sm text-neutral-600 leading-relaxed font-normal whitespace-pre-line text-justify">
                {villa.description}
              </p>
            </div>

            {/* Dynamic Amenities Grid list */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-display font-black text-neutral-800">Cơ sở vật chất & Tiện nghi</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {FACILITIES.map(key => {
                  const hasFacility = villa.facilities.includes(key.id);
                  return (
                    <div 
                      key={key.id}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold ${
                        hasFacility 
                          ? 'bg-emerald-50/50 border-emerald-100/60 text-neutral-800' 
                          : 'opacity-40 bg-neutral-50/50 border-neutral-100 text-neutral-400'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasFacility ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-400'}`}>
                        {/* Static mapping of lucide icons for facilities */}
                        {key.id === 'wifi' && <Wifi className="w-4 h-4" />}
                        {key.id === 'pool' && <Waves className="w-4 h-4" />}
                        {key.id === 'local_parking' && <ParkingCircle className="w-4 h-4" />}
                        {key.id === 'kitchen' && <Utensils className="w-4 h-4" />}
                        {key.id === 'outdoor_grill' && <Flame className="w-4 h-4" />}
                        {key.id === 'landscape' && <Mountain className="w-4 h-4" />}
                        {key.id === 'beach_access' && <Compass className="w-4 h-4" />}
                        {key.id === 'pets' && <PawPrint className="w-4 h-4" />}
                      </span>
                      <div className="flex flex-col leading-tight">
                        <span>{key.label}</span>
                        {hasFacility && <span className="text-[9px] font-bold text-emerald-600 mt-0.5">Miễn phí</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Side-by-Side Double Calendar visual layout (Screen 3 Spec) */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-display font-black text-neutral-800">Lịch xem phòng có sẵn</h3>
                  <p className="text-[11px] text-neutral-400 font-semibold mt-0.5">Chọn khoảng ngày trống không bị gạch ngang bôi đỏ</p>
                </div>
                <span className="text-xs font-black bg-indigo-50 text-[#0071c2] py-1 px-3.5 rounded-full uppercase tracking-wider">Lịch Năm 2026</span>
              </div>

              {/* Side by side months container */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-neutral-100">
                {/* Month 1: May 2026 */}
                <div className="flex flex-col gap-2">
                  <div className="text-center font-bold text-xs text-neutral-700 pb-2 border-b border-neutral-50">Tháng 5/2026</div>
                  <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px]">
                    {['Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'CN'].map(w => (
                      <span key={w} className="text-[9px] font-bold text-neutral-400 py-1">{w}</span>
                    ))}
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                      const dateStr = `2026-05-${day.toString().padStart(2, '0')}`;
                      const isBooked = villa.bookedDates.includes(dateStr);
                      const isPending = villa.pendingDates.includes(dateStr);
                      
                      let bgClass = 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100';
                      if (isBooked) bgClass = 'bg-red-100 text-red-500 line-through cursor-not-allowed';
                      else if (isPending) bgClass = 'bg-amber-100 text-amber-800 font-bold';

                      return (
                        <div key={day} className={`py-1.5 rounded text-center text-[10px] font-semibold ${bgClass}`}>
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Month 2: June 2026 */}
                <div className="flex flex-col gap-2">
                  <div className="text-center font-bold text-xs text-neutral-700 pb-2 border-b border-neutral-50">Tháng 6/2026</div>
                  <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px]">
                    {['Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'CN'].map(w => (
                      <span key={w} className="text-[9px] font-bold text-neutral-400 py-1">{w}</span>
                    ))}
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
                      const dateStr = `2026-06-${day.toString().padStart(2, '0')}`;
                      const isBooked = villa.bookedDates.includes(dateStr);
                      const isPending = villa.pendingDates.includes(dateStr);
                      // Highlight active search check points
                      const startDay = new Date(checkIn).getDate();
                      const endDay = new Date(checkOut).getDate();
                      const inSelectRange = day >= startDay && day <= endDay;

                      let bgClass = 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100';
                      if (inSelectRange) bgClass = 'bg-[#0071c2] text-white font-extrabold';
                      else if (isBooked) bgClass = 'bg-red-100 text-red-500 line-through';
                      else if (isPending) bgClass = 'bg-amber-100 text-amber-800 font-bold';

                      return (
                        <div key={day} className={`py-1.5 rounded text-center text-[10px] font-semibold ${bgClass}`}>
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Legends index block */}
              <div className="flex gap-4 text-[10px] text-neutral-500 font-extrabold pt-2 border-t border-neutral-50">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-red-100 inline-block" />
                  <span>Đã đặt kín</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-100 inline-block" />
                  <span>Đang giữ tạm</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-[#0071c2] inline-block" />
                  <span>Lịch bạn chọn</span>
                </span>
              </div>
            </div>

            {/* Core House Rules Policies list */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-display font-black text-neutral-800">Quy định chung của căn</h3>
              <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-extrabold text-amber-800 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-4 h-4 text-[#fe6a34]" />
                    Thời gian nhận trả phòng
                  </span>
                  <div className="flex flex-col gap-1 text-xs font-semibold text-neutral-700 mt-1">
                    {villa.policies.time.map((t, idx) => (
                      <p key={idx} className="flex items-center gap-1.5">✓ {t}</p>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-extrabold text-amber-800 uppercase tracking-widest flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4 text-[#fe6a34]" />
                    Chính sách đi kèm
                  </span>
                  <div className="flex flex-col gap-1 text-xs font-semibold text-neutral-700 mt-1">
                    {villa.policies.other.map((o, idx) => (
                      <p key={idx} className="flex items-center gap-1.5">✓ {o}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Feedbacks reviews presentation box */}
            <div className="flex flex-col gap-5 pt-4 border-t border-neutral-100">
              <h3 className="text-xl font-display font-black text-neutral-800">Đánh giá thực tế ({feedbacks.length})</h3>
              
              <div className="flex flex-col gap-4">
                {feedbacks.length === 0 ? (
                  <p className="text-xs font-semibold text-neutral-400 italic">Chưa có bình luận nào cho biệt thự này. Hãy là người đầu tiên trải nghiệm!</p>
                ) : (
                  feedbacks.map((f) => (
                    <div key={f.id} className="bg-white p-5 rounded-xl border border-neutral-100 shadow-sm flex flex-col gap-2 animate-fadeIn">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-neutral-800">{f.guestName}</span>
                        <div className="flex items-center gap-0.5 text-xs text-[#fe6a34] font-bold">
                          <Star className="w-3.5 h-3.5 fill-[#fe6a34] text-[#fe6a34]" />
                          <span>{f.rating} / 5.0</span>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500 font-semibold leading-relaxed">
                        {f.comment}
                      </p>
                      <div className="text-[10px] text-neutral-400 font-bold flex items-center gap-1">
                        <span>Đã lưu kỳ nghỉ tháng 12/2024</span>
                        {f.isVerified && <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">✓ Khách đặt thực tế</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Form trigger to submit new reviews */}
              <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200/50 mt-4 flex flex-col gap-4">
                <div>
                  <h4 className="font-bold text-sm text-neutral-800">Gửi nhận xét của bạn</h4>
                  <p className="text-[11px] text-neutral-400 font-semibold mt-0.5">Chúng tôi trân quý phản hồi của bạn để nâng tầm chất lượng</p>
                </div>

                {feedbackSuccessMsg ? (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{feedbackSuccessMsg}</span>
                  </div>
                ) : (
                  <form onSubmit={handleReviewFeedbackSubmit} className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-neutral-600 uppercase">Họ và tên của bạn</span>
                        <input 
                          type="text"
                          required
                          value={newFeedbackName}
                          onChange={(e) => setNewFeedbackName(e.target.value)}
                          placeholder="Ví dụ: Nguyễn Văn Hải"
                          className="bg-white border border-neutral-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-[#0071c2]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-neutral-600 uppercase">Đánh giá số sao</span>
                        <select
                          value={newFeedbackRating}
                          onChange={(e) => setNewFeedbackRating(Number(e.target.value))}
                          className="bg-white border border-neutral-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-[#0071c2] cursor-pointer"
                        >
                          <option value="5">⭐️⭐️⭐️⭐️⭐️ (5/5 tuyệt vời)</option>
                          <option value="4">⭐️⭐️⭐️⭐️ (4/5 rất hài lòng)</option>
                          <option value="3">⭐️⭐️⭐️ (3/5 bình thường)</option>
                          <option value="2">⭐️⭐️ (2/5 chất lượng kém)</option>
                          <option value="1">⭐️ (1/5 tệ hại)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-neutral-600 uppercase">Bình luận của khách</span>
                      <textarea
                        required
                        rows={3}
                        value={newFeedbackComment}
                        onChange={(e) => setNewFeedbackComment(e.target.value)}
                        placeholder="Hãy chia sẻ trải nghiệm thực tế về phòng ốc, cách phục vụ của quản gia, khu nướng BBQ..."
                        className="bg-white border border-neutral-200 rounded-lg p-3 text-xs font-semibold outline-none focus:border-[#0071c2] resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmittingFeedback}
                      className="self-end bg-[#0071c2] hover:bg-[#005899] disabled:bg-neutral-400 text-white font-bold text-xs py-2 px-5 rounded-lg cursor-pointer"
                    >
                      {isSubmittingFeedback ? 'Đang gửi...' : 'Gửi nhận xét ngay'}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>

          {/* Right Columns secure sticky Booking parameters form */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 bg-white p-6 rounded-2xl border border-neutral-100 shadow-xl flex flex-col gap-5">
              
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400">Giá phòng bình quân</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-[#fe6a34] font-display">
                    {villa.price.toLocaleString('vi-VN')}₫
                  </span>
                  <span className="text-xs text-neutral-400"> / đêm</span>
                </div>
              </div>

              {/* Core Check form */}
              <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4 border-t border-neutral-100 pt-4">
                
                {/* Dates pickers */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Check-in</label>
                    <input 
                      type="date"
                      required
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-1.5 text-xs font-bold text-neutral-700 outline-none focus:border-[#0071c2]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Check-out</label>
                    <input 
                      type="date"
                      required
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="bg-neutral-50 border border-neutral-200.rounded px-3.5 py-1.5 text-xs font-bold text-neutral-700 outline-none"
                    />
                  </div>
                </div>

                {/* Amount counters */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Lượng khách</label>
                    <select
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Number(e.target.value))}
                      className="bg-neutral-50 border border-neutral-200 px-3.5 py-1.5 text-xs font-bold text-neutral-700 rounded-lg outline-none cursor-pointer"
                    >
                      {[1,2,3,4,6,8,10,12].map(g => (
                        <option key={g} value={g}>{g} Khách</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Số phòng</label>
                    <select
                      value={roomsCount}
                      onChange={(e) => setRoomsCount(Number(e.target.value))}
                      className="bg-neutral-50 border border-neutral-200 px-3.5 py-1.5 text-xs font-bold text-neutral-700 rounded-lg outline-none cursor-pointer"
                    >
                      {[1,2,3,4,5].map(r => (
                        <option key={r} value={r}>{r} Phòng</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Personal Information forms */}
                <div className="flex flex-col gap-3.5 border-t border-neutral-100 pt-4">
                  <h4 className="font-bold text-xs uppercase text-neutral-400 tracking-wider">Thông tin khách hàng</h4>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Họ và tên</label>
                    <input 
                      type="text"
                      required
                      value={bookingName}
                      onChange={(e) => setBookingName(e.target.value)}
                      placeholder="Nguyễn Văn Hải"
                      className="bg-neutral-50 border border-neutral-200 p-2 text-xs font-semibold outline-none focus:border-[#0071c2]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Số điện thoại liên hệ</label>
                    <input 
                      type="tel"
                      required
                      value={bookingPhone}
                      onChange={(e) => setBookingPhone(e.target.value)}
                      placeholder="Số điện thoại di động"
                      className="bg-neutral-50 border border-neutral-200 p-2 text-xs font-semibold outline-none focus:border-[#0071c2]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Địa chỉ Email</label>
                    <input 
                      type="email"
                      value={bookingEmail}
                      onChange={(e) => setBookingEmail(e.target.value)}
                      placeholder="nhieu@example.com (không bắt buộc)"
                      className="bg-neutral-50 border border-neutral-200 p-2 text-xs font-semibold outline-none focus:border-[#0071c2]"
                    />
                  </div>
                </div>

                {/* Live Checkout summary details */}
                <div className="bg-neutral-50 border border-neutral-100 p-3 rounded-xl flex flex-col gap-2 mt-2">
                  <div className="flex justify-between text-xs text-neutral-500 font-semibold">
                    <span>{villa.price.toLocaleString('vi-VN')}₫ x {daysCount} đêm</span>
                    <span>{(daysCount * villa.price).toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500 font-semibold border-b border-neutral-100 pb-2">
                    <span>Thuế GTGT & phí phục vụ</span>
                    <span className="text-emerald-600 font-bold">Miễn phí</span>
                  </div>
                  <div className="flex justify-between text-xs items-center">
                    <span className="font-extrabold text-[#005899]">Tổng cộng thanh toán</span>
                    <span className="text-[#fe6a34] font-black text-lg">
                      {totalCost.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                </div>

                {/* Urgency tag ticker (Screen 3 Spec) */}
                <div className="flex items-center gap-1.5 bg-[#ffdbd0]/30 border border-red-100 px-3 py-2 rounded-xl text-[10px] text-red-900 font-extrabold leading-normal">
                  <BadgeInfo className="w-4 h-4 text-[#fe6a34] shrink-0" />
                  <span>Cực kỳ gấp! Hiện có 4 khách nán lại đang xem villa này ngay lúc này. Hãy chốt giữ chỗ trước khi hết phòng!</span>
                </div>

                <button 
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full bg-[#fe6a34] hover:bg-[#ab3500] disabled:bg-neutral-400 text-white font-black py-3 rounded-xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#fe6a34]/30"
                >
                  {bookingLoading ? 'Đang gửi thông tin...' : 'Đặt phòng ngay'}
                </button>

                <p className="text-[10px] text-neutral-400 text-center font-semibold mt-1">
                  * Hoàn lại bảo đảm giữ chỗ 15 phút. Bạn vui lòng liên hệ Zalo sau khi đặt để kích hoạt xác nhận phòng lập tức.
                </p>
              </form>

            </div>
          </div>

        </div>

      </div>

      {/* Success Holding Booking Modal Layout containing custom active timer (15 mins count) */}
      {showBookingModal && bookingResult && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scaleIn border border-neutral-100">
            
            {/* Header Success Accent */}
            <div className="bg-[#003b66] text-white p-6 text-center flex flex-col items-center">
              <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-3 shadow">
                <CheckCircle2 className="w-8 h-8 font-black" />
              </div>

              <h3 className="text-xl font-display font-black tracking-tight text-white leading-tight">Yêu cầu giữ chỗ thành công!</h3>
              <p className="text-xs text-[#a1c9ff] font-bold mt-1 uppercase tracking-wider">Mã Booking: {bookingResult.bookingCode}</p>
            </div>

            {/* Hold Ticker Counter Box (15 minutes countdown hold holdExpireAt) */}
            <div className="p-6 flex flex-col items-center text-center gap-5">
              
              <div className="bg-amber-50 border border-amber-200 rounded-2xl py-4 px-6 w-full max-w-sm flex flex-col items-center gap-1 shadow-sm">
                <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest flex items-center gap-1.5 mb-1.5 animate-pulse">
                  <Clock className="w-3.5 h-3.5 text-[#fe6a34]" />
                  Thời gian tạm khóa giữ phòng
                </span>

                {timer.isExpired ? (
                  <span className="text-xl font-black text-rose-500">Đã hết bảo lưu! Vui lòng đặt lại</span>
                ) : (
                  <div className="flex items-center gap-2 font-mono text-3xl font-black text-[#fe6a34]">
                    <span>{timer.minutes.toString().padStart(2, '0')}</span>
                    <span className="animate-pulse">:</span>
                    <span>{timer.seconds.toString().padStart(2, '0')}</span>
                  </div>
                )}

                <p className="text-[10px] text-neutral-500 font-semibold leading-normal mt-2">
                  * Tránh Overbooking, VillaStay tự động tạm hoãn giữ riêng phòng cho bạn trong <strong>15 phút</strong>. Quý khách vui lòng chốt phòng qua Zalo bên dưới để hoàn tất xác nhận chính thức.
                </p>
              </div>

              {/* Booking Info review rows */}
              <div className="w-full text-left bg-neutral-50 p-4 rounded-xl border border-neutral-100/60 text-xs font-semibold text-neutral-600 flex flex-col gap-2">
                <div className="flex justify-between border-b border-neutral-100 pb-1">
                  <span>Khách đặt:</span>
                  <span className="text-neutral-800 font-bold">{bookingName}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-1">
                  <span>Số điện thoại:</span>
                  <span className="text-neutral-800 font-bold">{bookingPhone}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-1">
                  <span>Điểm lưu trú:</span>
                  <span className="text-neutral-850 font-bold text-right">{villa.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tổng cộng thanh toán:</span>
                  <span className="text-[#fe6a34] font-black">{totalCost.toLocaleString('vi-VN')}₫</span>
                </div>
              </div>

              {/* Action Buttons trigger */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                {/* Zalo Button Action */}
                <a 
                  href={zaloSupportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#fe6a34] hover:bg-[#ab3500] text-white font-black py-3 rounded-xl text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#fe6a34]/30"
                >
                  <MessageSquare className="w-4 h-4 fill-white text-[#fe6a34]" />
                  <span>Xác nhận qua Zalo</span>
                </a>

                {/* Neutral backup button */}
                <button 
                  onClick={copyBookingCode}
                  className="flex items-center justify-center gap-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 font-bold text-xs py-3 rounded-xl px-4"
                >
                  <Copy className="w-4 h-4" />
                  <span>Sao chép Code</span>
                </button>
              </div>

              <div className="flex flex-col gap-2 w-full pt-4 border-t border-neutral-100 text-[10px] text-neutral-400 font-semibold">
                <button 
                  type="button"
                  onClick={onNavigateToLookup}
                  className="text-[#0071c2] font-black hover:underline cursor-pointer"
                >
                  Hoặc bạn có thể tự tra cứu trạng thái giữ phòng tại đây →
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowBookingModal(false)}
                  className="text-neutral-500 hover:text-neutral-800 font-bold"
                >
                  Đóng cửa sổ
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
