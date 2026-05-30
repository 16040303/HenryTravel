import React, { useState } from 'react';
import { 
  Sliders, MessageSquare, Clock, Globe, Shield, 
  LogOut, CheckCircle2, Phone, Compass, AlertCircle 
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface AdminSettingsProps {
  onLogout: () => void;
}

export default function AdminSettings({ onLogout }: AdminSettingsProps) {
  const { language } = useLanguage();
  
  // Persisted configurations prefilled from localStorage or default values
  const [holdTimeMode, setHoldTimeMode] = useState<'preset' | 'custom'>(() => {
    return (localStorage.getItem('bookingHoldTimeMode') || 'preset') as 'preset' | 'custom';
  });

  const [holdMinutes, setHoldMinutes] = useState(() => {
    return Number(localStorage.getItem('admin_hold_minutes') || 15);
  });

  const [customMinutes, setCustomMinutes] = useState(() => {
    return Number(localStorage.getItem('bookingHoldTimeMinutes') || 45);
  });
  
  const [zaloUrl, setZaloUrl] = useState(() => {
    return localStorage.getItem('admin_zalo_url') || 'https://zalo.me/0901234567';
  });

  const [whatsappUrl, setWhatsappUrl] = useState(() => {
    return localStorage.getItem('admin_whatsapp_url') || 'https://wa.me/0901234567';
  });

  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('admin_currency_type') || 'VND';
  });

  const [timezone, setTimezone] = useState(() => {
    return localStorage.getItem('admin_timezone') || 'Asia/Ho_Chi_Minh';
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSaveConfigs = (e: React.FormEvent) => {
    e.preventDefault();

    let resolvedMinutes = holdMinutes;
    if (holdTimeMode === 'custom') {
      if (!Number.isInteger(customMinutes) || customMinutes < 5 || customMinutes > 1440) {
        setValidationError(
          language === 'vi' 
            ? 'Số phút tùy chỉnh phải là số nguyên dương trong khoảng từ 5 đến 1440 phút!' 
            : 'Custom hold minutes must be a positive integer between 5 and 1440 minutes!'
        );
        return; // Do not save!
      }
      resolvedMinutes = customMinutes;
    }

    setValidationError(''); // Clear error

    localStorage.setItem('bookingHoldTimeMode', holdTimeMode);
    if (holdTimeMode === 'custom') {
      localStorage.setItem('bookingHoldTimeMinutes', String(customMinutes));
    }
    localStorage.setItem('admin_hold_minutes', String(resolvedMinutes));
    localStorage.setItem('admin_zalo_url', zaloUrl);
    localStorage.setItem('admin_whatsapp_url', whatsappUrl);
    localStorage.setItem('admin_currency_type', currency);
    localStorage.setItem('admin_timezone', timezone);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn max-w-2xl mx-auto">
      {/* Settings Grid Panel */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 sm:p-8 flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-[#0071c2]" />
            <span>{language === 'vi' ? 'Cấu hình hệ thống VillaStay' : 'System Configuration Settings'}</span>
          </h3>
          <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
            {language === 'vi' ? 'Căn chỉnh holding time, hotline liên lạc và các cài đặt tiền tệ hiển thị toàn trang' : 'Tune reservation holds timeline, support deep-links, and operational formats'}
          </p>
          {/* Active Hold Time summary badge */}
          <div className="mt-2.5 bg-[#edf3ff] text-[#005899] font-black text-[9px] py-1 px-3.5 rounded-full inline-block uppercase tracking-wider border border-[#a1c9ff]/20">
            {language === 'vi' ? 'Thời gian tạm khóa hiện tại:' : 'Active Hold Time Setting:'}{' '}
            {holdTimeMode === 'custom' ? `Tùy chỉnh: ${customMinutes} phút` : `${holdMinutes} phút`}
          </div>
        </div>

        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-scaleIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{language === 'vi' ? 'Lưu cấu hình hệ thống thành công!' : 'Configs saved successfully!'}</span>
          </div>
        )}

        {validationError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-scaleIn">
            <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSaveConfigs} className="flex flex-col gap-5 text-xs font-semibold text-neutral-600">
          
          {/* Config 1: Hold Time */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#fe6a34]" />
              {language === 'vi' ? 'Thời gian tạm khóa giữ phòng (Booking Hold Time)' : 'Reservation Hold Time'}
            </label>
            <select
              value={holdTimeMode === 'custom' ? 'custom' : String(holdMinutes)}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'custom') {
                  setHoldTimeMode('custom');
                } else {
                  setHoldTimeMode('preset');
                  setHoldMinutes(Number(val));
                }
              }}
              className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] text-neutral-800 text-xs cursor-pointer font-bold"
            >
              <option value="15">15 phút</option>
              <option value="30">30 phút</option>
              <option value="60">60 phút (1 tiếng)</option>
              <option value="120">120 phút (2 tiếng)</option>
              <option value="custom">{language === 'vi' ? 'Tùy chỉnh' : 'Custom...'}</option>
            </select>

            {/* Custom Input UI */}
            {holdTimeMode === 'custom' && (
              <div className="flex flex-col gap-1.5 mt-2 animate-scaleIn bg-neutral-50/50 p-3.5 rounded-xl border border-neutral-200/50 border-l-4 border-l-[#0071c2]">
                <label className="text-[10px] font-bold text-[#0071c2] uppercase">
                  {language === 'vi' ? 'Thời gian tùy chỉnh' : 'Custom hold time'}
                </label>
                <input
                  type="number"
                  min={5}
                  max={1440}
                  required
                  placeholder={language === 'vi' ? 'Nhập số phút giữ phòng' : 'Enter hold minutes'}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Number(e.target.value))}
                  className="bg-white border border-neutral-200 rounded-lg p-2 font-mono text-xs text-neutral-850 outline-none focus:border-[#0071c2] w-full max-w-xs font-bold"
                />
                <p className="text-[9px] text-[#0071c2] font-semibold leading-normal font-sans mt-0.5">
                  * {language === 'vi' 
                    ? 'Thời gian khách được giữ phòng trước khi admin xác nhận hoặc hệ thống tự hủy.' 
                    : 'Duration a guest is allowed to hold dates block before manual confirm or auto-expiration.'}
                </p>
              </div>
            )}

            <p className="text-[9px] text-neutral-400 font-normal leading-normal mt-0.5">
              * {language === 'vi' ? 'Hệ thống tự động hủy giữ phòng và giải phóng biệt thự sau thời gian này nếu không xác nhận cọc.' : 'System cancels pending holds automatically after this threshold.'}
            </p>
          </div>

          {/* Config 2: Zalo URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-[#0071c2]" />
              {language === 'vi' ? 'Đường dẫn liên kết Zalo hỗ trợ (Zalo URL)' : 'Zalo Support URL'}
            </label>
            <input
              type="url"
              required
              value={zaloUrl}
              onChange={(e) => setZaloUrl(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] font-mono text-neutral-850 text-xs"
              placeholder="https://zalo.me/..."
            />
            <p className="text-[9px] text-neutral-400 font-normal leading-normal">
              * {language === 'vi' ? 'URL deep-link cưng chiều khách mở trực tiếp khung chat ứng dụng Zalo.' : 'Deep-link URL to launch Zalo chat conversation window.'}
            </p>
          </div>

          {/* Config 3: WhatsApp URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              {language === 'vi' ? 'Đường dẫn liên kết WhatsApp (WhatsApp URL)' : 'WhatsApp Support URL'}
            </label>
            <input
              type="url"
              required
              value={whatsappUrl}
              onChange={(e) => setWhatsappUrl(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] font-mono text-neutral-850 text-xs"
              placeholder="https://wa.me/..."
            />
          </div>

          {/* Config 4: Currency */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-[#0071c2]" />
              {language === 'vi' ? 'Đơn vị tiền tệ chính hiển thị (Currency)' : 'Currency Display Format'}
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] text-neutral-800 text-xs cursor-pointer"
            >
              <option value="VND">VND (₫)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>

          {/* Config 5: Timezone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              {language === 'vi' ? 'Múi giờ vận hành hệ thống (Timezone)' : 'Operating Timezone'}
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] text-neutral-800 text-xs cursor-pointer"
            >
              <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
              <option value="UTC">UTC (GMT+0)</option>
              <option value="America/New_York">America/New_York (GMT-5)</option>
            </select>
          </div>

          {/* Submit Actions */}
          <button
            type="submit"
            className="self-end bg-[#0071c2] hover:bg-[#005899] text-white font-black py-2.5 px-6 rounded-xl cursor-pointer shadow hover:scale-101 transition-all"
          >
            {language === 'vi' ? 'Cập nhật cấu hình' : 'Update Configurations'}
          </button>
        </form>
      </div>

      {/* Account Session Logout */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 sm:p-8 flex flex-col gap-5 border-l-4 border-l-rose-500">
        <div>
          <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider flex items-center gap-1">
            <Shield className="w-4 h-4 text-rose-500" />
            <span>{language === 'vi' ? 'Bảo mật & Phiên làm việc' : 'Security & Administrative Sessions'}</span>
          </h4>
          <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
            {language === 'vi' ? 'Quản lý phiên hoạt động hiện tại' : 'Close administrative session'}
          </p>
        </div>

        <div className="bg-neutral-50 border border-neutral-100 p-4 rounded-xl flex items-center justify-between text-xs">
          <div className="flex flex-col gap-0.5 leading-none font-semibold">
            <span className="text-neutral-400 uppercase text-[8px] font-black">{language === 'vi' ? 'Tài khoản' : 'Account'}</span>
            <span className="text-neutral-800 font-bold mt-1 text-sm">admin (Quản trị cao cấp)</span>
          </div>

          <button
            onClick={onLogout}
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{language === 'vi' ? 'Đăng xuất' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
