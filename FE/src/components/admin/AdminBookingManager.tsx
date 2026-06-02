import React, { useEffect, useState } from 'react';
import {
  ClipboardList, Search, Eye, Check, X, Copy,
  Calendar, Users, DollarSign, Clock, Phone, Mail,
  Download, Printer, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Booking } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../Toast';
import { getZaloLink } from '../../constants';
import { exportAdminBookingsCsv } from '../../lib/api';

interface AdminBookingManagerProps {
  bookings: Booking[];
  onApproveBooking: (code: string) => void;
  onRejectBooking: (code: string) => void;
  onCompleteBooking: (code: string) => void;
  mutationLoading?: boolean;
}

export default function AdminBookingManager({
  bookings,
  onApproveBooking,
  onRejectBooking,
  onCompleteBooking,
  mutationLoading = false
}: AdminBookingManagerProps) {
  const { language } = useLanguage();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusTab, setActiveStatusTab] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('PENDING');

  // Details Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!selectedBooking) return;
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [selectedBooking]);

  // 1. Calculate stats counts
  const totalPending = bookings.filter(b => b.status === 'PENDING').length;
  const totalConfirmed = bookings.filter(b => b.status === 'CONFIRMED' && new Date(b.checkOut) >= new Date()).length;
  const totalCompleted = bookings.filter(b => b.status === 'CONFIRMED' && new Date(b.checkOut) < new Date()).length;
  const totalCancelled = bookings.filter(b => b.status === 'CANCELLED').length;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast('success', language === 'vi'
      ? `Đã sao chép mã đặt phòng: ${code}`
      : `Copied booking code: ${code}`
    );
  };

  // 2. Export CSV from backend with current status filter
  const handleExportCSV = async () => {
    try {
      await exportAdminBookingsCsv({
        status: activeStatusTab === 'ALL'
          ? undefined
          : activeStatusTab === 'PENDING'
            ? 'pending_hold'
            : activeStatusTab.toLowerCase(),
      });
      showToast('success', language === 'vi' ? 'Đã xuất file CSV thành công!' : 'CSV exported successfully!');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : (language === 'vi' ? 'Không thể xuất CSV.' : 'Could not export CSV.'));
    }
  };

  // 3. Printing Receipt Invoice Helper
  const handlePrintBooking = (b: Booking) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      showToast('error', 'Trình chặn pop-up đã chặn quyền in hóa đơn. Vui lòng mở lại!');
      return;
    }

    const isCompleted = b.status === 'CONFIRMED' && new Date(b.checkOut) < new Date();
    const resolvedStatusText =
      isCompleted ? 'COMPLETED (HOÀN TẤT)' :
        b.status === 'CONFIRMED' ? 'CONFIRMED (ĐÃ CỌC)' :
          b.status === 'PENDING' ? 'PENDING (ĐỢI CỌC)' : 'CANCELLED (ĐÃ HỦY)';

    const printHtml = `
      <html>
        <head>
          <title>Hoa don thanh toan - ${b.code}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; margin: 40px; line-height: 1.5; font-size: 14px; }
            .header { text-align: center; border-bottom: 2px solid #005899; padding-bottom: 20px; margin-bottom: 30px; }
            .brand { font-size: 26px; font-weight: 900; color: #005899; }
            .brand span { color: #fe6a34; }
            .title { font-size: 18px; font-weight: 700; text-transform: uppercase; margin-top: 5px; color: #555; }
            .receipt-code { font-family: monospace; font-size: 14px; background: #eee; padding: 4px 12px; border-radius: 4px; display: inline-block; margin-top: 10px; font-weight: bold; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .card { background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 12px; }
            .card h4 { margin: 0 0 10px 0; color: #005899; border-bottom: 1px solid #dee2e6; padding-bottom: 5px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
            .row { display: flex; justify-content: justify; margin-bottom: 8px; }
            .label { color: #888; font-weight: 600; width: 130px; }
            .value { font-weight: 700; color: #333; }
            .price-total { text-align: right; background: #edf3ff; border: 1px solid #0071c2; padding: 15px; border-radius: 12px; margin-top: 20px; }
            .price-total span { font-size: 20px; font-weight: 900; color: #fe6a34; font-family: monospace; }
            .footer { text-align: center; margin-top: 50px; font-size: 11px; color: #999; border-top: 1px solid #dee2e6; padding-top: 20px; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
            .badge-pending { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
            .badge-confirmed { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
            .badge-completed { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
            .badge-cancelled { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">Henry<span>Travel</span></div>
            <div class="title">Hóa đơn thanh toán giữ chỗ</div>
            <div class="receipt-code">MÃ ĐƠN: ${b.code}</div>
          </div>

          <div class="grid">
            <div class="card">
              <h4>Thông tin khách hàng</h4>
              <div class="row"><span class="label">Khách hàng:</span><span class="value">${b.fullName}</span></div>
              <div class="row"><span class="label">Số điện thoại:</span><span class="value">${b.phone}</span></div>
              <div class="row"><span class="label">Email:</span><span class="value">${b.email || 'N/A'}</span></div>
              <div class="row"><span class="label">Trạng thái:</span>
                <span class="badge ${isCompleted ? 'badge-completed' :
        b.status === 'CONFIRMED' ? 'badge-confirmed' :
          b.status === 'PENDING' ? 'badge-pending' : 'badge-cancelled'
      }">${resolvedStatusText}</span>
              </div>
            </div>

            <div class="card">
              <h4>Thông tin kỳ nghỉ</h4>
              <div class="row"><span class="label">Biệt thự:</span><span class="value">${b.villaName}</span></div>
              <div class="row"><span class="label">Nhận phòng:</span><span class="value">${b.checkIn}</span></div>
              <div class="row"><span class="label">Trả phòng:</span><span class="value">${b.checkOut}</span></div>
              <div class="row"><span class="label">Lượng khách:</span><span class="value">${b.guests} người (Max)</span></div>
            </div>
          </div>

          <div class="price-total">
            <div style="font-weight: 800; color: #005899; font-size: 13px; text-transform: uppercase;">Tổng thanh toán tiền cọc</div>
            <div style="margin-top: 5px;"><span>${b.totalPrice.toLocaleString('vi-VN')}₫</span></div>
          </div>

          <div class="footer">
            Cảm ơn quý khách đã tin tưởng và lựa chọn đặt phòng tại HenryTravel homestay.<br>
            Hệ thống đặt phòng tự động HenryTravel - Hotline 24/7: 0901 234 567
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  // Filter bookings
  const filteredBookings = bookings.filter(b => {
    const matchesSearch =
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.villaName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeStatusTab === 'ALL' || b.status === activeStatusTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* 1. Header Booking Statistics metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Pending Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-3 hover:-translate-y-0.5 transition-transform duration-250">
          <div className="w-8.5 h-8.5 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[18px] font-black text-amber-600 font-mono">{totalPending}</span>
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mt-1">{language === 'vi' ? 'Đang đợi cọc' : 'Awaiting holds'}</span>
          </div>
        </div>

        {/* Confirmed Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-3 hover:-translate-y-0.5 transition-transform duration-250">
          <div className="w-8.5 h-8.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[18px] font-black text-emerald-600 font-mono">{totalConfirmed}</span>
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mt-1">{language === 'vi' ? 'Đã cọc cọc' : 'Confirmed stays'}</span>
          </div>
        </div>

        {/* Completed Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-3 hover:-translate-y-0.5 transition-transform duration-250">
          <div className="w-8.5 h-8.5 rounded-full bg-blue-50 text-[#0071c2] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[18px] font-black text-[#0071c2] font-mono">{totalCompleted}</span>
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mt-1">{language === 'vi' ? 'Hoàn tất stay' : 'Checked out'}</span>
          </div>
        </div>

        {/* Cancelled Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-3 hover:-translate-y-0.5 transition-transform duration-250">
          <div className="w-8.5 h-8.5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[18px] font-black text-rose-500 font-mono">{totalCancelled}</span>
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mt-1">{language === 'vi' ? 'Đơn đã hủy' : 'Holds cancelled'}</span>
          </div>
        </div>
      </div>

      {/* 2. Search query and action buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3.5 top-3 text-neutral-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder={language === 'vi' ? 'Tìm theo tên, SĐT, mã đặt phòng...' : 'Search guest, phone, code...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold outline-none focus:bg-white focus:border-[#0071c2]"
          />
        </div>

        {/* Action Triggers Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            className="bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-250 font-bold text-xs py-2 px-4.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            title="Export CSV to Excel"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Xuất file CSV</span>
          </button>

          {/* Status Tabs capsules */}
          <div className="flex bg-neutral-100 p-0.5 rounded-xl border border-neutral-200/50">
            {(['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'] as const).map((tab) => {
              const labelMap = {
                ALL: language === 'vi' ? 'Tất cả' : 'All',
                PENDING: language === 'vi' ? 'Chờ duyệt' : 'Pending',
                CONFIRMED: language === 'vi' ? 'Đã duyệt' : 'Confirmed',
                CANCELLED: language === 'vi' ? 'Đã huỷ' : 'Cancelled'
              };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveStatusTab(tab)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeStatusTab === tab
                      ? 'bg-white text-neutral-800 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                >
                  {labelMap[tab]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bookings Queue table */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden flex flex-col">
        <div className="w-full overflow-x-auto scrollbar-safe">
          <table className="w-full min-w-[900px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-100 font-bold text-neutral-400 uppercase tracking-widest text-[9px] bg-neutral-50/50">
                <th className="p-4">{language === 'vi' ? 'Khách hàng' : 'Guest'}</th>
                <th className="p-4">{language === 'vi' ? 'Mã số' : 'Booking Code'}</th>
                <th className="p-4">{language === 'vi' ? 'Điểm lưu trú' : 'Accommodation'}</th>
                <th className="p-4">{language === 'vi' ? 'Thời gian nhận/trả' : 'Dates'}</th>
                <th className="p-4">{language === 'vi' ? 'Trị giá' : 'Cost'}</th>
                <th className="p-4 text-center">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                <th className="p-4 text-right">{language === 'vi' ? 'Hành động' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="font-semibold text-neutral-700">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400 italic">
                    {language === 'vi' ? 'Chưa có lịch sử đặt phòng nào trùng khớp' : 'No matching bookings history found'}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const isCompleted = b.status === 'CONFIRMED' && new Date(b.checkOut) < new Date();

                  const statusColor =
                    isCompleted ? 'bg-blue-50 text-blue-800 border-blue-200' :
                      b.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        b.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          'bg-neutral-50 text-neutral-500 border-neutral-200';

                  const statusText =
                    isCompleted ? 'COMPLETED' : b.status;

                  return (
                    <tr key={b.code} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50">
                      {/* Guest Info */}
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5 leading-snug">
                          <span className="font-bold text-neutral-800">{b.fullName}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">{b.phone}</span>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="p-4 font-mono font-bold text-neutral-600">
                        <button
                          onClick={() => copyCode(b.code)}
                          className="hover:text-[#0071c2] cursor-pointer flex items-center gap-1"
                          title="Click to Copy"
                        >
                          <span>{b.code}</span>
                          <Copy className="w-3 h-3 text-neutral-300" />
                        </button>
                      </td>

                      {/* Villa */}
                      <td className="p-4 max-w-[150px] truncate font-bold text-neutral-800">
                        {b.villaName}
                      </td>

                      {/* Dates */}
                      <td className="p-4 font-mono font-bold text-[11px] text-neutral-600">
                        {b.checkIn} - {b.checkOut}
                      </td>

                      {/* Price */}
                      <td className="p-4 font-mono font-black text-[#fe6a34] text-xs">
                        {b.totalPrice.toLocaleString('vi-VN')}₫
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase border ${statusColor}`}>
                          {statusText}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="p-1.5 border border-neutral-200 hover:bg-neutral-50 hover:text-[#0071c2] rounded-lg text-neutral-400 transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Print icon shortcut */}
                          <button
                            onClick={() => handlePrintBooking(b)}
                            className="p-1.5 border border-neutral-200 hover:bg-neutral-50 hover:text-neutral-800 rounded-lg text-neutral-400 transition-colors cursor-pointer"
                            title="Print invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {b.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => onApproveBooking(b.code)}
                                disabled={mutationLoading}
                                className="p-1.5 border border-[#a1c9ff] bg-[#edf3ff] hover:bg-[#0071c2] hover:text-white rounded-lg text-[#0071c2] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                title="Approve"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onRejectBooking(b.code)}
                                disabled={mutationLoading}
                                className="p-1.5 border border-neutral-200 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-neutral-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                title="Cancel Hold"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {b.status === 'CONFIRMED' && (
                            <button
                              onClick={() => onCompleteBooking(b.code)}
                              disabled={mutationLoading}
                              className="p-1.5 border border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-neutral-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              title="Complete"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Receipt Detail Modal Popup overlay */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overflow-y-auto overscroll-contain p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scaleIn border my-auto mx-auto">
            {/* Header banner */}
            <div className="bg-[#003b66] text-white p-6 text-center flex flex-col items-center relative">
              <button
                onClick={() => setSelectedBooking(null)}
                className="absolute top-4 right-4 text-white/60 hover:text-white hover:bg-white/10 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
              <ClipboardList className="w-10 h-10 text-[#a1c9ff] mb-1.5" />
              <h3 className="text-sm font-display font-black text-white">{language === 'vi' ? 'Hóa đơn đặt phòng chi tiết' : 'Reservation Receipt'}</h3>
              <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full font-mono font-bold text-[9px] uppercase mt-2">
                CODE: {selectedBooking.code}
              </span>
            </div>

            {/* Content Receipt Body */}
            <div className="p-5 flex flex-col gap-4.5 text-xs font-semibold text-neutral-600 max-h-[75vh] overflow-y-auto overscroll-contain">

              {/* PRINT BUTTON TRIGGER */}
              <div className="flex justify-end border-b border-neutral-100 pb-2">
                <button
                  onClick={() => handlePrintBooking(selectedBooking)}
                  className="bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-250 py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all cursor-pointer font-bold text-[10px]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In hoá đơn (Print)</span>
                </button>
              </div>

              {/* 3. BOOKING TIMELINE COMPONENT */}
              <div className="flex flex-col gap-1.5 bg-neutral-50 p-4.5 rounded-2xl border border-neutral-100/50">
                <span className="text-[8px] uppercase font-bold text-neutral-400 tracking-wider">Lịch trình đơn hàng (Timeline)</span>

                {selectedBooking.status === 'CANCELLED' ? (
                  /* Cancelled Timeline */
                  <div className="flex items-center gap-2 mt-2 font-bold text-[10px]">
                    <div className="flex flex-col items-center">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">✓</div>
                      <div className="w-0.5 h-4 bg-rose-500" />
                      <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-[10px]">✗</div>
                    </div>
                    <div className="flex flex-col gap-5 leading-none">
                      <div className="flex flex-col mt-0.5">
                        <span className="text-neutral-800">1. Đã khởi tạo đơn hàng (Created)</span>
                        <span className="text-[8px] text-neutral-400 font-normal font-mono">{selectedBooking.createdAt.split('T')[0]}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-rose-600">2. Đã hủy giữ phòng (Cancelled)</span>
                        <span className="text-[8px] text-rose-500 font-medium">Lưu kho phòng giải phóng tự động</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Timeline (Created -> Pending -> Confirmed -> Completed) */
                  (() => {
                    const isConfirmed = selectedBooking.status === 'CONFIRMED';
                    const isCompleted = isConfirmed && new Date(selectedBooking.checkOut) < new Date();

                    return (
                      <div className="flex items-center gap-2 mt-2 font-bold text-[10px]">
                        <div className="flex flex-col items-center">
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">✓</div>
                          <div className="w-0.5 h-4 bg-emerald-500" />
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isConfirmed || isCompleted ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white animate-pulse'
                            }`}>
                            {isConfirmed || isCompleted ? '✓' : '2'}
                          </div>
                          <div className={`w-0.5 h-4 ${isCompleted ? 'bg-emerald-500' : 'bg-neutral-200'}`} />
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isCompleted ? 'bg-[#0071c2] text-white' : 'bg-neutral-100 text-neutral-400 border border-neutral-250'
                            }`}>
                            3
                          </div>
                        </div>
                        <div className="flex flex-col gap-4.5 leading-none justify-between">
                          {/* Step 1 */}
                          <div className="flex flex-col mt-0.5">
                            <span className="text-neutral-800">1. Đã tạo & Tạm giữ phòng 15p (Created)</span>
                            <span className="text-[8px] text-neutral-400 font-normal font-mono">{selectedBooking.createdAt.split('T')[0]}</span>
                          </div>
                          {/* Step 2 */}
                          <div className="flex flex-col">
                            <span className={isConfirmed || isCompleted ? 'text-neutral-800' : 'text-amber-600 animate-pulse'}>
                              {isConfirmed || isCompleted ? '2. Đã khớp cọc ngân hàng (Confirmed)' : '2. Đang chờ đối soát cọc (Pending)'}
                            </span>
                            <span className="text-[8px] text-neutral-400 font-normal">Khoá lịch calendar tự động chống trùng</span>
                          </div>
                          {/* Step 3 */}
                          <div className="flex flex-col">
                            <span className={isCompleted ? 'text-[#0071c2]' : 'text-neutral-400'}>
                              3. Hoàn tất lưu trú và trả phòng (Completed)
                            </span>
                            <span className="text-[8px] text-neutral-400 font-normal font-mono">{selectedBooking.checkOut}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Status Indicator */}
              <div className="flex justify-between items-center border-b border-neutral-100 pb-3 mt-1">
                <span className="text-neutral-400 uppercase text-[9px] font-bold">{language === 'vi' ? 'Trạng thái cọc' : 'Deposit Status'}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${selectedBooking.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                    selectedBooking.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-100' :
                      'bg-neutral-50 text-neutral-500 border-neutral-200'
                  }`}>
                  {selectedBooking.status}
                </span>
              </div>

              {/* Guest Details */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2.5">
                  <DollarSign className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col leading-tight">
                    <span className="text-[8px] uppercase font-bold text-neutral-400">{language === 'vi' ? 'Họ và tên khách' : 'FullName'}</span>
                    <span className="text-neutral-800 font-bold mt-0.5 text-sm">{selectedBooking.fullName}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col leading-tight">
                    <span className="text-[8px] uppercase font-bold text-neutral-400">{language === 'vi' ? 'Số điện thoại di động' : 'Phone'}</span>
                    <span className="text-neutral-800 font-bold mt-0.5 font-mono">{selectedBooking.phone}</span>
                  </div>
                </div>

                {selectedBooking.email && (
                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-[8px] uppercase font-bold text-neutral-400">Email</span>
                      <span className="text-neutral-800 font-bold mt-0.5 font-mono">{selectedBooking.email}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Accommodation grid */}
              <div className="bg-neutral-50 border border-neutral-100 p-3.5 rounded-xl flex flex-col gap-2.5">
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase font-bold text-neutral-400">{language === 'vi' ? 'Địa điểm nghỉ dưỡng' : 'Lodging'}</span>
                  <span className="text-neutral-800 font-black mt-0.5">{selectedBooking.villaName}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-neutral-200/50 pt-2.5 font-mono text-[11px]">
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold text-neutral-400 font-sans">{language === 'vi' ? 'Nhận phòng (Check-in)' : 'Check-in'}</span>
                    <span className="text-neutral-700 font-bold mt-0.5">{selectedBooking.checkIn}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold text-neutral-400 font-sans">{language === 'vi' ? 'Trả phòng (Check-out)' : 'Check-out'}</span>
                    <span className="text-neutral-700 font-bold mt-0.5">{selectedBooking.checkOut}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-neutral-200/50 pt-2.5">
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold text-neutral-400">{language === 'vi' ? 'Lượng khách' : 'Guests'}</span>
                    <span className="text-neutral-700 font-bold mt-0.5">{selectedBooking.guests} {language === 'vi' ? 'người' : 'guests'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold text-neutral-400">{language === 'vi' ? 'Số lượng phòng ngủ' : 'Bedrooms'}</span>
                    <span className="text-neutral-700 font-bold mt-0.5">{selectedBooking.rooms} {language === 'vi' ? 'phòng' : 'rooms'}</span>
                  </div>
                </div>
              </div>

              {/* Prices summary footer */}
              <div className="flex justify-between items-baseline mt-1 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                <span className="text-[#005899] font-black">{language === 'vi' ? 'Tổng tiền cọc yêu cầu' : 'Total Deposit cọc'}</span>
                <span className="text-lg font-black text-[#fe6a34] font-mono">
                  {selectedBooking.totalPrice.toLocaleString('vi-VN')}₫
                </span>
              </div>

              {/* Action Buttons inside receipt details */}
              <div className="flex gap-2.5 w-full pt-4 border-t">
                {selectedBooking.status === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => {
                        onApproveBooking(selectedBooking.code);
                        setSelectedBooking(null);
                      }}
                      className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl cursor-pointer shadow text-center transition-colors"
                    >
                      {language === 'vi' ? 'Duyệt chuyển khoản' : 'Approve Booking'}
                    </button>
                    <button
                      onClick={() => {
                        onRejectBooking(selectedBooking.code);
                        setSelectedBooking(null);
                      }}
                      className="flex-grow border border-neutral-200 hover:bg-neutral-50 text-neutral-500 font-bold py-2.5 rounded-xl cursor-pointer text-center transition-colors"
                    >
                      {language === 'vi' ? 'Từ chối cọc' : 'Cancel Hold'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      const msg = `Xin chào ${selectedBooking.fullName}, tôi cần liên hệ hỗ trợ về đơn hàng HenryTravel mã ${selectedBooking.code}.`;
                      window.open(getZaloLink(selectedBooking.phone, msg), '_blank');
                    }}
                    className="w-full bg-[#0071c2] hover:bg-[#005899] text-white font-black py-2.5 rounded-xl cursor-pointer text-center transition-colors"
                  >
                    {language === 'vi' ? 'Hỗ trợ khách hàng (Zalo)' : 'Contact Guest (Zalo)'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
