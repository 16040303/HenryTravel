import React, { useState } from 'react';
import { Search, ShieldAlert, Phone, Key, HelpCircle, MessageSquare, Star, Info, CalendarClock, CreditCard } from 'lucide-react';
import { BookingStatus, Booking } from '../types';
import { checkBooking, submitFeedback } from '../lib/api';
import { BOOKING_STATUSES, getZaloLink } from '../constants';
import { useToast } from './Toast';
import { useLanguage } from '../contexts/LanguageContext';
import { LookupSkeleton } from './common/Skeleton';
import EmptyState from './common/EmptyState';

export default function LookupView() {
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const [bookingCode, setBookingCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searching, setSearching] = useState(false);
  
  // Results structures
  const [lookupResult, setLookupResult] = useState<BookingStatus | null>(null);

  // Review states inside lookup page
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedCode = bookingCode.trim().toUpperCase();
    const normalizedPhone = phoneNumber.trim();

    if (!normalizedCode || !normalizedPhone) {
      showToast('warning', language === 'vi'
        ? 'Vui l?ng nh?p m? booking v? s? ?i?n tho?i.'
        : (language === 'ko' ? '?? ??? ????? ??? ???.' : 'Please enter both booking code and phone number.')
      );
      return;
    }

    setBookingCode(normalizedCode);
    setPhoneNumber(normalizedPhone);
    setSearching(true);
    setFeedbackSuccess('');
    try {
      const result = await checkBooking(normalizedCode, normalizedPhone);
      setLookupResult(result);
    } catch (err) {
      console.error(err);
      showToast('error', language === 'vi' ? 'Kh?ng th? tra c?u l?c n?y. Vui l?ng th? l?i.' : 'Lookup failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleLookupFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupResult?.booking) return;
    if (!comment.trim()) {
      showToast('warning', language === 'vi'
        ? 'Vui l?ng nh?p n?i dung ??nh gi?.'
        : (language === 'ko' ? '?? ??? ??? ???.' : 'Please write your feedback content.')
      );
      return;
    }

    setSubmittingFeedback(true);
    try {
      await submitFeedback({
        villaId: lookupResult.booking.villaId,
        guestName: reviewerName.trim() || lookupResult.booking.fullName,
        rating,
        comment: comment.trim()
      });

      setFeedbackSuccess(t('look.feedbackSuccess'));
      setComment('');
    } catch (err) {
      console.error(err);
      showToast('error', language === 'vi' ? 'Ch?a g?i ???c ??nh gi?. Vui l?ng th? l?i.' : 'Could not submit feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="bg-[#fcf9f8] min-h-screen py-12 px-4">
      <div className="max-w-[720px] mx-auto flex flex-col gap-8">
        
        {/* Lookup Card Visual form */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-xl p-6 sm:p-8">
          <div className="text-center max-w-md mx-auto mb-8">
            <span className="text-[#fe6a34] text-xs font-extrabold tracking-widest uppercase">{t('look.titleTag')}</span>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-neutral-800 mt-1">{t('look.title')}</h1>
            <p className="text-xs text-neutral-400 mt-1 font-semibold leading-relaxed">
              {t('look.subtitle')}
            </p>
          </div>

          <form onSubmit={handleLookupSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-[#0071c2]" />
                  {t('look.enterCodeLabel')}
                </label>
                <input 
                  type="text"
                  required
                  placeholder={t('look.enterCode')}
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value)}
                  className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs font-bold text-neutral-800 uppercase outline-none focus:border-[#0071c2]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#0071c2]" />
                  {t('look.enterPhoneLabel')}
                </label>
                <input 
                  type="tel"
                  required
                  placeholder={t('look.enterPhone')}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs font-bold text-neutral-800 outline-none focus:border-[#0071c2]"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={searching}
              className="w-full bg-[#0071c2] hover:bg-[#005899] disabled:bg-neutral-400 text-white font-black py-3 rounded-xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {searching ? t('look.searching') : t('look.checkBtn')}
            </button>
          </form>
        </div>

        {/* Display Outcomes structures details box */}
        {searching ? (
          <LookupSkeleton />
        ) : lookupResult && (
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-xl p-6 sm:p-8 animate-scaleIn">
            {lookupResult.found && lookupResult.booking ? (
              <div className="flex flex-col gap-6">
                
                {/* Result header banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-100 pb-4 gap-3">
                  <div>
                    <span className="text-[10px] text-neutral-400 font-extrabold pb-0.5 block uppercase">{t('look.resultHeader')}</span>
                    <h3 className="text-base font-bold text-neutral-800">{lookupResult.booking.villaName}</h3>
                  </div>

                  {/* Booking Badge classification */}
                  <span className={`px-3 py-1 text-xs font-extrabold uppercase tracking-wide rounded-full border ${
                    BOOKING_STATUSES[lookupResult.booking.status as keyof typeof BOOKING_STATUSES]?.colorClass || 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {t(`status.${lookupResult.booking.status}`)}
                  </span>
                </div>

                {/* Grid records summaries */}
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-neutral-600 bg-neutral-50 p-4 rounded-xl border border-neutral-100/60">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-neutral-400 uppercase font-black">{t('look.guestName')}</span>
                    <span className="text-neutral-800 font-bold mt-0.5">{lookupResult.booking.fullName}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-neutral-400 uppercase font-black">{t('look.guestPhone')}</span>
                    <span className="text-neutral-800 font-bold mt-0.5">{lookupResult.booking.phone}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-neutral-400 uppercase font-black">{t('look.bookingDates')}</span>
                    <span className="text-neutral-800 font-bold mt-0.5">
                      {lookupResult.booking.checkIn} - {lookupResult.booking.checkOut}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-neutral-400 uppercase font-black">{t('look.totalCost')}</span>
                    <span className="text-[#fe6a34] font-black text-sm mt-0.5">
                      {lookupResult.booking.totalPrice.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                </div>

                {/* Specific custom text based on booking status */}
                {lookupResult.booking.status === 'PENDING' && (
                  <div className="bg-[#ffdbd0]/30 border border-red-100 p-4 rounded-xl flex items-start gap-2.5">
                    <CalendarClock className="w-5 h-5 text-[#fe6a34] shrink-0 mt-0.5" />
                    <div className="text-xs text-red-950 font-semibold leading-normal">
                      <p className="font-extrabold">{t('look.pendingTitle')}</p>
                      <p className="mt-1 font-medium">
                        {t('look.pendingDesc')}
                      </p>
                      <a 
                        href={getZaloLink(`Chốt giữ chỗ Booking mã ${lookupResult.booking?.code}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded text-[10px] uppercase shadow"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-white" />
                        {t('look.btnConfirmZalo')}
                      </a>
                    </div>
                  </div>
                )}

                {lookupResult.booking.status === 'CONFIRMED' && (
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-2.5">
                    <CreditCard className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-950 font-semibold leading-normal">
                      <p className="font-extrabold text-emerald-800">{t('look.confirmTitle')}</p>
                      <p className="mt-1 font-medium text-emerald-700">
                        {t('look.confirmDesc')}
                      </p>
                    </div>
                  </div>
                )}

                {lookupResult.booking.status === 'CANCELLED' && (
                  <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-xl flex items-start gap-2.5">
                    <Info className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="text-xs text-neutral-600 leading-normal font-semibold">
                      <p className="font-extrabold">{t('look.cancelledTitle')}</p>
                      <p className="mt-1 font-medium">
                        {t('look.cancelledDesc')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Submitting Feedback form in lookup outcome (Screen 4 Specification) */}
                <div className="border-t border-neutral-100 pt-6 mt-2">
                  <div className="mb-4">
                    <h4 className="font-bold text-sm text-neutral-800 flex items-center gap-1">
                      <MessageSquare className="w-4 h-4 text-[#0071c2]" />
                      {t('look.feedbackHeader')}
                    </h4>
                    <p className="text-[10px] text-neutral-400 font-semibold leading-tight mt-0.5">{t('look.feedbackDesc')}</p>
                  </div>

                  {feedbackSuccess ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-xs font-bold">
                      ✓ {feedbackSuccess}
                    </div>
                  ) : (
                    <form onSubmit={handleLookupFeedbackSubmit} className="flex flex-col gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase">{t('look.feedbackName')}</span>
                          <input 
                            type="text"
                            placeholder={language === 'vi' ? 'Ví dụ: Tùng Chi' : (language === 'ko' ? '예: 김철수' : 'e.g. John Doe')}
                            value={reviewerName}
                            onChange={(e) => setReviewerName(e.target.value)}
                            className="bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold rounded-lg outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase">{t('look.feedbackRating')}</span>
                          <select
                            value={rating}
                            onChange={(e) => setRating(Number(e.target.value))}
                            className="bg-[#fcf9f8] border border-neutral-200 px-3 py-2 text-xs font-semibold rounded-lg outline-none cursor-pointer"
                          >
                            <option value="5">{t('look.rating5')}</option>
                            <option value="4">{t('look.rating4')}</option>
                            <option value="3">{t('look.rating3')}</option>
                            <option value="2">{t('look.rating2')}</option>
                            <option value="1">{t('look.rating1')}</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase">{t('look.feedbackComment')}</span>
                        <textarea
                          required
                          rows={3}
                          placeholder={t('look.feedbackCommentPlaceholder')}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="bg-neutral-50 border border-neutral-200 p-3 text-xs font-semibold rounded-lg outline-none resize-none"
                        />
                      </div>

                      <button 
                        type="submit"
                        disabled={submittingFeedback}
                        className="self-end bg-[#fe6a34] hover:bg-[#ab3500] text-white font-bold text-xs py-2 px-5 rounded-lg transition-colors cursor-pointer"
                      >
                        {submittingFeedback ? (language === 'vi' ? 'Đang gửi phản hồi...' : (language === 'ko' ? '전송 중...' : 'Sending...')) : t('look.feedbackBtn')}
                      </button>
                    </form>
                  )}
                </div>

              </div>
            ) : (
              <EmptyState
                title={t('look.notFoundTitle')}
                description={t('look.notFoundDesc')}
                icon="search"
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
}
