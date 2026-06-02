import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowLeft, Star, MapPin, Calendar, Share2, Compass, Waves, Wifi,
  ParkingCircle, Utensils, Flame, Mountain, PawPrint, Users, MessageSquare,
  Clock, ShieldAlert, BadgeInfo, CheckCircle2, Copy, XCircle
} from 'lucide-react';
import { VillaDetail, Feedback, BookingResult, Booking } from '../types';
import { getVillaById, createBooking, getVillaFeedbacks, submitFeedback, getPublicSettings, checkBooking } from '../lib/api';
import { getZaloLink, ZALO_PHONE_FALLBACK, FACILITIES } from '../constants';
import { useBookingCountdown } from '../hooks/useBookingCountdown';
import { useLanguage } from '../contexts/LanguageContext';
import OptimizedImage from './OptimizedImage';
import { useToast } from './Toast';
import BookingCalendar from './calendar/BookingCalendar';
import { VillaDetailSkeleton } from './common/Skeleton';
import EmptyState from './common/EmptyState';

interface DetailViewProps {
  villaId?: string;
  onBack: () => void;
  onNavigateToLookup: () => void;
  onBookingSuccessNotify?: () => void;
  initialSearchParams?: {
    checkIn: string;
    checkOut: string;
    guests: number;
    rooms: number;
  };
}

export default function DetailView({ villaId, onBack, onNavigateToLookup, onBookingSuccessNotify, initialSearchParams }: DetailViewProps) {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const { id } = useParams<{ id: string }>();

  // Determine active villa ID from route param or prop
  const activeVillaId = id || villaId || '';

  const [villa, setVilla] = useState<VillaDetail | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackSummary, setFeedbackSummary] = useState({ avgRating: 0, total: 0 });
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publicZaloPhone, setPublicZaloPhone] = useState(ZALO_PHONE_FALLBACK);
  const [publicZaloUrl, setPublicZaloUrl] = useState(() => getZaloLink(ZALO_PHONE_FALLBACK));

  // Review Form States
  const [newFeedbackName, setNewFeedbackName] = useState('');
  const [newFeedbackRating, setNewFeedbackRating] = useState(5);
  const [newFeedbackBookingCode, setNewFeedbackBookingCode] = useState('');
  const [newFeedbackPhone, setNewFeedbackPhone] = useState('');
  const [newFeedbackComment, setNewFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState('');

  // Booking Form dates input state
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [checkIn, setCheckIn] = useState(initialSearchParams?.checkIn || '2026-06-20');
  const [checkOut, setCheckOut] = useState(initialSearchParams?.checkOut || '2026-06-23');
  const [guestsCount, setGuestsCount] = useState(initialSearchParams?.guests || 2);
  const [roomsCount, setRoomsCount] = useState(initialSearchParams?.rooms || 1);
  const [activeBookingDateField, setActiveBookingDateField] = useState<'checkIn' | 'checkOut' | null>(null);
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
  const pollingIntervalRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const autoCloseTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const lastAutoClosedStatusRef = useRef<Booking['status'] | null>(null);

  const normalizeBookingStatus = (status?: string | null): Booking['status'] => {
    switch (status) {
      case 'pending_hold':
      case 'PENDING':
        return 'PENDING';
      case 'confirmed':
      case 'CONFIRMED':
        return 'CONFIRMED';
      case 'cancelled':
      case 'CANCELLED':
        return 'CANCELLED';
      case 'completed':
      case 'COMPLETED':
        return 'COMPLETED';
      default:
        return 'PENDING';
    }
  };

  const bookingStatus = normalizeBookingStatus(bookingResult?.booking?.status);
  const isBookingPending = bookingStatus === 'PENDING';
  const isBookingConfirmed = bookingStatus === 'CONFIRMED';
  const isBookingCancelled = bookingStatus === 'CANCELLED';
  const isBookingCompleted = bookingStatus === 'COMPLETED';

  useEffect(() => {
    async function loadVilla() {
      setLoading(true);
      const data = await getVillaById(activeVillaId);
      if (data) {
        setVilla(data);
        setFeedbackLoading(true);
        try {
          const fList = await getVillaFeedbacks(data.id);
          setFeedbacks(fList.feedbacks);
          setFeedbackSummary({ avgRating: fList.avgRating, total: fList.total });
        } finally {
          setFeedbackLoading(false);
        }

        // Populate standard configs
        setTotalCost(data.price * 3);
      }
      setLoading(false);
    }
    loadVilla();
  }, [activeVillaId]);

  useEffect(() => {
    let mounted = true;
    getPublicSettings()
      .then((settings) => {
        if (!mounted) return;
        setPublicZaloPhone(settings.zaloPhone || ZALO_PHONE_FALLBACK);
        setPublicZaloUrl(settings.zaloUrl || getZaloLink(settings.zaloPhone || ZALO_PHONE_FALLBACK));
      })
      .catch(() => {
        if (!mounted) return;
        setPublicZaloPhone(ZALO_PHONE_FALLBACK);
        setPublicZaloUrl(getZaloLink(ZALO_PHONE_FALLBACK));
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (pollingIntervalRef.current) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    const bookingCode = bookingResult?.bookingCode;
    const guestPhone = bookingResult?.booking?.phone || bookingPhone;

    if (!showBookingModal || !bookingCode || !guestPhone || !isBookingPending) return;

    pollingIntervalRef.current = window.setInterval(() => {
      checkBooking(bookingCode, guestPhone)
        .then((result) => {
          if (!result.found || !result.booking) return;
          setBookingResult((current) => {
            if (!current) return current;
            return {
              ...current,
              booking: {
                ...current.booking,
                ...result.booking,
                status: normalizeBookingStatus(result.booking.status),
                zaloLinks: result.booking.zaloLinks || current.booking?.zaloLinks || current.zaloLinks,
              },
              holdExpireAt: result.booking.holdExpireAt || current.holdExpireAt,
              zaloLinks: result.booking.zaloLinks || current.zaloLinks,
              holdMinutes: current.holdMinutes,
            };
          });
        })
        .catch(() => {
          // Polling is best-effort; keep UI stable and avoid toast spam.
        });
    }, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        window.clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [showBookingModal, bookingResult?.bookingCode, bookingResult?.booking?.phone, bookingPhone, isBookingPending]);

  useEffect(() => {
    if (!showBookingModal || !bookingResult) return;
    if (bookingStatus !== 'CONFIRMED' && bookingStatus !== 'CANCELLED') return;
    if (lastAutoClosedStatusRef.current === bookingStatus) return;

    lastAutoClosedStatusRef.current = bookingStatus;
    if (autoCloseTimeoutRef.current) {
      window.clearTimeout(autoCloseTimeoutRef.current);
    }
    autoCloseTimeoutRef.current = window.setTimeout(() => {
      setShowBookingModal(false);
      autoCloseTimeoutRef.current = null;
    }, bookingStatus === 'CONFIRMED' ? 3000 : 4000);

    return () => {
      if (autoCloseTimeoutRef.current) {
        window.clearTimeout(autoCloseTimeoutRef.current);
        autoCloseTimeoutRef.current = null;
      }
    };
  }, [showBookingModal, bookingStatus, bookingResult]);

  useEffect(() => () => {
    if (pollingIntervalRef.current) window.clearInterval(pollingIntervalRef.current);
    if (autoCloseTimeoutRef.current) window.clearTimeout(autoCloseTimeoutRef.current);
  }, []);

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
    return <VillaDetailSkeleton />;
  }

  if (!villa) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 py-16 text-center">
        <EmptyState
          title="Không tìm thấy biệt thự"
          description="Hệ thống không tìm thấy biệt thự tương ứng với mã yêu cầu. Vui lòng quay lại danh sách để khám phá các lựa chọn tuyệt vời khác!"
          actionText="Quay lại danh sách"
          onAction={onBack}
          icon="villa"
        />
      </div>
    );
  }

  const formatDisplayDate = (value: string) => {
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  };

  const formatFeedbackDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Đánh giá gần đây';
    return `Đánh giá ngày ${new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)}`;
  };

  const calculatedAvgRating = feedbacks.length > 0
    ? Number((feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbacks.length).toFixed(1))
    : 0;
  const displayAvgRating = villa.avgRating || feedbackSummary.avgRating || calculatedAvgRating;
  const displayFeedbackCount = villa.feedbackCount || feedbackSummary.total || feedbacks.length;

  const renderBookingDateCalendar = (
    field: 'checkIn' | 'checkOut',
    value: string,
    onSelect: (value: string) => void
  ) => {
    if (activeBookingDateField !== field) return null;
    const selected = new Date(value);
    const year = Number.isNaN(selected.getTime()) ? 2026 : selected.getFullYear();
    const month = Number.isNaN(selected.getTime()) ? 5 : selected.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const monthLabel = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'long',
      year: 'numeric'
    }).format(new Date(year, month, 1));

    return (
      <div className="absolute left-0 top-[calc(100%+8px)] z-[250] w-[280px] rounded-2xl border border-neutral-100 bg-white p-3 shadow-2xl shadow-neutral-900/15 animate-scaleIn">
        <div className="mb-3 flex items-center justify-between border-b border-neutral-100 pb-2">
          <span className="text-xs font-black capitalize text-neutral-800">{monthLabel}</span>
          <button
            type="button"
            onClick={() => setActiveBookingDateField(null)}
            className="rounded-lg px-2 py-1 text-[10px] font-bold text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
          >
            Đóng
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-neutral-400">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
            <span key={day}>{day}</span>
          ))}
          {Array.from({ length: offset }).map((_, index) => (
            <span key={`empty-${field}-${index}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(day => {
            const dateValue = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = dateValue === value;
            return (
              <button
                key={dateValue}
                type="button"
                onClick={() => {
                  onSelect(dateValue);
                  setActiveBookingDateField(null);
                }}
                className={`aspect-square rounded-xl text-[11px] font-bold transition-all ${isSelected
                  ? 'bg-[#0071c2] text-white shadow-sm shadow-[#0071c2]/30'
                  : 'text-neutral-700 hover:bg-[#edf3ff] hover:text-[#005899]'
                  }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

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
      const error = err as Error & { code?: string };
      const errorCode = error.code;
      const errorMessage = error.message || '';

      if (errorCode === 'DATE_OVERLAP' || errorMessage.toLowerCase().includes('booking trong khoảng ngày')) {
        showToast('warning', 'Ngày bạn chọn đã có khách giữ chỗ hoặc đặt phòng. Vui lòng chọn ngày khác.');
      } else if (errorCode === 'VILLA_UNAVAILABLE') {
        showToast('warning', 'Villa hiện không khả dụng. Vui lòng chọn villa khác hoặc liên hệ tư vấn viên.');
      } else if (errorCode === 'VALIDATION_ERROR' && errorMessage) {
        showToast('warning', errorMessage);
      } else if (errorMessage && !errorMessage.includes('Không thể kết nối máy chủ')) {
        showToast('error', errorMessage);
      } else {
        showToast('error', 'Chưa kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReviewFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackName.trim() || !newFeedbackBookingCode.trim() || !newFeedbackPhone.trim() || !newFeedbackComment.trim()) {
      showToast('warning', 'Vui lòng nhập tên, mã booking, số điện thoại và nội dung nhận xét!');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      await submitFeedback({
        bookingCode: newFeedbackBookingCode,
        phone: newFeedbackPhone,
        rating: newFeedbackRating,
        comment: newFeedbackComment
      });

      setFeedbackSuccessMsg('Cảm ơn bạn đã gửi đánh giá. Nhận xét đã được lưu lại.');
      setNewFeedbackName('');
      setNewFeedbackBookingCode('');
      setNewFeedbackPhone('');
      setNewFeedbackComment('');

      // Reload feedbacks list
      const updatedFeedbacks = await getVillaFeedbacks(villa.id);
      setFeedbacks(updatedFeedbacks.feedbacks);
      setFeedbackSummary({ avgRating: updatedFeedbacks.avgRating, total: updatedFeedbacks.total });

      // Reload villa info to reflect updated ratings in UI
      const refreshVilla = await getVillaById(villa.id);
      if (refreshVilla) {
        setVilla(refreshVilla);
      }
    } catch (err) {
      console.error(err);
      showToast('error', err instanceof Error ? err.message : 'Chưa gửi được đánh giá. Vui lòng thử lại.');
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

  const closeBookingModal = () => {
    if (pollingIntervalRef.current) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (autoCloseTimeoutRef.current) {
      window.clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }
    setShowBookingModal(false);
  };

  const bookingModalTitle = isBookingConfirmed
    ? 'Đặt phòng của bạn đã được xác nhận.'
    : isBookingCancelled
      ? 'Yêu cầu giữ chỗ đã được hủy.'
      : isBookingCompleted
        ? 'Đặt phòng đã hoàn tất.'
        : 'Đã gửi yêu cầu giữ chỗ';

  const bookingModalDescription = isBookingConfirmed
    ? 'Cảm ơn bạn. HenryTravel đã xác nhận đặt phòng này. Vui lòng lưu mã booking để tra cứu khi cần.'
    : isBookingCancelled
      ? 'Yêu cầu giữ chỗ đã được hủy. Bạn có thể chọn ngày khác hoặc liên hệ tư vấn viên để được hỗ trợ.'
      : isBookingCompleted
        ? 'Booking này đã được hệ thống ghi nhận hoàn tất.'
        : 'Phòng đang được giữ tạm. Bạn vui lòng nhắn Zalo để tư vấn viên xác nhận lại thông tin.';

  const handleShareVilla = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: villa.name,
      text: `Khám phá ${villa.name} tại ${villa.location} trên HenryTravel`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      showToast('success', 'Đã sao chép liên kết villa.');
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        showToast('error', 'Chưa thể chia sẻ liên kết. Vui lòng thử lại.');
      }
    }
  };

  const fallbackZaloSupportMessage = bookingResult
    ? `Xin chào HenryTravel, tôi vừa gửi yêu cầu giữ chỗ mã [ ${bookingResult.bookingCode} ] tại ${villa.name}. Nhờ anh/chị kiểm tra và xác nhận giúp tôi.`
    : `Xin chào HenryTravel, tôi cần tư vấn thêm về ${villa.name}.`;
  const zaloSupportMessage = bookingResult?.zaloLinks?.message || fallbackZaloSupportMessage;
  const fallbackPublicZaloUrl = getZaloLink(publicZaloPhone || ZALO_PHONE_FALLBACK, zaloSupportMessage) || publicZaloUrl;
  const zaloSupportUrl = bookingResult?.zaloLinks?.fallback || bookingResult?.zaloLinks?.web || fallbackPublicZaloUrl;

  const copyZaloMessage = () => {
    navigator.clipboard.writeText(zaloSupportMessage);
    showToast('success', 'Đã sao chép tin nhắn Zalo. Bạn chỉ cần dán vào khung chat.');
  };

  const openZaloSupport = () => {
    window.open(zaloSupportUrl, '_blank', 'noopener,noreferrer');
  };

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
                <span>{displayAvgRating}</span>
                <span className="text-neutral-400 font-normal">({displayFeedbackCount} bình luận)</span>
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
            <button
              type="button"
              onClick={handleShareVilla}
              className="flex items-center gap-1.5 border border-neutral-200 bg-white hover:bg-neutral-50 rounded-lg py-2 px-3.5 shadow-sm text-neutral-600 cursor-pointer"
            >
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
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold ${hasFacility
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

            {/* Range Booking Calendar replaces hardcoded May/June sections */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-xl font-display font-black text-neutral-800">
                  {language === 'vi' ? 'Lịch đặt phòng trực quan' : (language === 'ko' ? '실시간 예약 달력' : 'Interactive Reservation Calendar')}
                </h3>
                <span className="text-[9px] font-extrabold bg-[#edf3ff] text-[#005899] py-0.5 px-2 rounded-full uppercase tracking-wider">
                  Lịch còn trống
                </span>
              </div>
              <BookingCalendar
                bookedDates={villa.bookedDates}
                pendingDates={villa.pendingDates}
                checkIn={checkIn}
                checkOut={checkOut}
                onDateChange={(start, end) => {
                  setCheckIn(start);
                  setCheckOut(end);
                }}
              />
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
              <h3 className="text-xl font-display font-black text-neutral-800">Đánh giá thực tế ({displayFeedbackCount})</h3>

              <div className="flex flex-col gap-4">
                {feedbackLoading ? (
                  <div className="bg-white p-5 rounded-xl border border-neutral-100 shadow-sm text-xs font-bold text-neutral-400 animate-pulse">
                    Đang tải đánh giá thực tế...
                  </div>
                ) : feedbacks.length === 0 ? (
                  <EmptyState
                    title={language === 'vi' ? 'Chưa có đánh giá nào cho villa này.' : (language === 'ko' ? '등록된 리뷰가 없습니다' : 'No reviews yet for this villa.')}
                    description={language === 'vi' ? 'Các đánh giá đã xác thực từ khách lưu trú sẽ hiển thị tại đây.' : (language === 'ko' ? '인증된 투숙객 리뷰가 여기에 표시됩니다.' : 'Verified guest reviews will appear here.')}
                    icon="feedback"
                  />
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
                        <span>{formatFeedbackDate(f.createdAt)}</span>
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
                  <p className="text-[11px] text-neutral-400 font-semibold mt-0.5">Chia sẻ ngắn gọn để những khách sau dễ chọn hơn</p>
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
                          placeholder="Ví dụ: Nguyễn Văn A"
                          className="bg-white border border-neutral-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-[#0071c2]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-neutral-600 uppercase">Mã booking</span>
                        <input
                          type="text"
                          required
                          value={newFeedbackBookingCode}
                          onChange={(e) => setNewFeedbackBookingCode(e.target.value)}
                          placeholder="VB-2026-001"
                          className="bg-white border border-neutral-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-[#0071c2] uppercase"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-neutral-600 uppercase">Số điện thoại đặt phòng</span>
                        <input
                          type="tel"
                          required
                          value={newFeedbackPhone}
                          onChange={(e) => setNewFeedbackPhone(e.target.value)}
                          placeholder="090..."
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
                        placeholder="Bạn có thể chia sẻ về phòng, vị trí, tiện nghi hoặc cách hỗ trợ của chủ nhà..."
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
                <span className="text-[10px] uppercase font-bold text-neutral-400">Giá trung bình</span>
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
                  <div className="relative flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Check-in</label>
                    <button
                      type="button"
                      onClick={() => setActiveBookingDateField(activeBookingDateField === 'checkIn' ? null : 'checkIn')}
                      className="bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-1.5 text-left text-xs font-bold text-neutral-700 outline-none focus:border-[#0071c2]"
                    >
                      {formatDisplayDate(checkIn)}
                    </button>
                    {renderBookingDateCalendar('checkIn', checkIn, setCheckIn)}
                  </div>
                  <div className="relative flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Check-out</label>
                    <button
                      type="button"
                      onClick={() => setActiveBookingDateField(activeBookingDateField === 'checkOut' ? null : 'checkOut')}
                      className="bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-1.5 text-left text-xs font-bold text-neutral-700 outline-none focus:border-[#0071c2]"
                    >
                      {formatDisplayDate(checkOut)}
                    </button>
                    {renderBookingDateCalendar('checkOut', checkOut, setCheckOut)}
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
                      {[1, 2, 3, 4, 6, 8, 10, 12].map(g => (
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
                      {[1, 2, 3, 4, 5].map(r => (
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
                      placeholder="Nguyễn Văn A"
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
                      placeholder="vidu@gmail.com (không bắt buộc)"
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
                  <span>Nếu ngày này phù hợp, bạn có thể gửi yêu cầu giữ chỗ. Tư vấn viên sẽ liên hệ lại để xác nhận chi tiết.</span>
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full bg-[#fe6a34] hover:bg-[#ab3500] disabled:bg-neutral-400 text-white font-black py-3 rounded-xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#fe6a34]/30"
                >
                  {bookingLoading ? 'Đang gửi...' : 'Gửi yêu cầu giữ chỗ'}
                </button>

                <p className="text-[10px] text-neutral-400 text-center font-semibold mt-1">
                  * Phòng được giữ tạm trong 15 phút để bạn kịp xác nhận qua Zalo.
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
            <div className={`${isBookingCancelled ? 'bg-rose-700' : isBookingConfirmed || isBookingCompleted ? 'bg-emerald-700' : 'bg-[#003b66]'} text-white p-6 text-center flex flex-col items-center`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white mb-3 shadow ${isBookingCancelled ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                {isBookingCancelled ? <XCircle className="w-8 h-8 font-black" /> : <CheckCircle2 className="w-8 h-8 font-black" />}
              </div>

              <h3 className="text-xl font-display font-black tracking-tight text-white leading-tight">{bookingModalTitle}</h3>
              <p className="text-xs text-white/80 font-bold mt-1 tracking-wider">Mã booking: {bookingResult.bookingCode}</p>
            </div>
            <div className="p-6 flex flex-col items-center text-center gap-5">
              {isBookingPending ? (
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

                  {bookingResult.booking?.remainingMinutes !== undefined && (
                    <p className="text-[10px] text-amber-700 font-bold mt-1">
                      Còn khoảng {bookingResult.booking.remainingMinutes} phút giữ chỗ theo hệ thống.
                    </p>
                  )}

                  <p className="text-[10px] text-neutral-500 font-semibold leading-normal mt-2">
                    * Phòng được giữ tạm trong <strong>15 phút</strong>. Bạn vui lòng nhắn Zalo để tư vấn viên xác nhận lại thông tin.
                  </p>
                </div>
              ) : (
                <div className={`rounded-2xl py-4 px-6 w-full max-w-sm flex flex-col items-center gap-2 shadow-sm border ${isBookingCancelled ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                  {isBookingCancelled ? <XCircle className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
                  <p className="text-sm font-black leading-normal">{bookingModalDescription}</p>
                  {(isBookingConfirmed || isBookingCancelled) && (
                    <p className="text-[10px] font-semibold opacity-80">
                      Popup sẽ tự đóng sau vài giây. Mã booking: {bookingResult.bookingCode}
                    </p>
                  )}
                </div>
              )}

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

              {isBookingPending && (
                <div className="w-full rounded-2xl border border-[#a1c9ff]/40 bg-[#edf3ff]/60 p-4 text-left">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[#005899]">
                    <MessageSquare className="h-4 w-4" />
                    <span>Nội dung gửi cho tư vấn viên</span>
                  </div>
                  <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded-xl bg-white/80 p-3 text-[11px] font-semibold leading-relaxed text-neutral-700 border border-white">
                    {zaloSupportMessage}
                  </pre>
                  <p className="mt-2 text-[10px] font-semibold leading-normal text-neutral-500">
                    Zalo không luôn tự điền nội dung khi mở từ web/QR. Hãy sao chép tin nhắn rồi dán vào khung chat Zalo.
                  </p>
                </div>
              )}

              {/* Action Buttons trigger */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                {isBookingPending && (
                  <>
                    <button
                      type="button"
                      onClick={copyZaloMessage}
                      className="flex-1 bg-[#fe6a34] hover:bg-[#ab3500] text-white font-black py-3 rounded-xl text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#fe6a34]/30"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Sao chép tin nhắn</span>
                    </button>

                    <button
                      type="button"
                      onClick={openZaloSupport}
                      className="flex-1 bg-[#0071c2] hover:bg-[#005899] text-white font-black py-3 rounded-xl text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0071c2]/20"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Mở Zalo</span>
                    </button>
                  </>
                )}

                {/* Neutral backup button */}
                <button
                  type="button"
                  onClick={copyBookingCode}
                  className="flex items-center justify-center gap-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 font-bold text-xs py-3 rounded-xl px-4"
                >
                  <Copy className="w-4 h-4" />
                  <span>Code</span>
                </button>
              </div>

              <div className="flex flex-col gap-2 w-full pt-4 border-t border-neutral-100 text-[10px] text-neutral-400 font-semibold">
                <button
                  type="button"
                  onClick={onNavigateToLookup}
                  className="text-[#0071c2] font-black hover:underline cursor-pointer"
                >
                  Tra cứu trạng thái đặt phòng tại đây →
                </button>
                <button
                  type="button"
                  onClick={closeBookingModal}
                  className="text-neutral-500 hover:text-neutral-800 font-bold"
                >
                  Đóng
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
