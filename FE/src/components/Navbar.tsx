import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { SearchCode, Home, Building2, ChevronDown, Hotel, X, Clock3, ExternalLink, Headset } from 'lucide-react';
import { FaWhatsapp, FaFacebookF, FaInstagram, FaTiktok } from 'react-icons/fa';
import { SiKakaotalk, SiNaver, SiWechat, SiZalo } from 'react-icons/si';
import { getZaloLink, ZALO_PHONE_FALLBACK } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublicSettingsQuery } from '../hooks/queries';
import { useToast } from './Toast';

interface NavbarProps {
  currentView?: 'home' | 'listings' | 'detail' | 'lookup' | 'admin';
  onNavigate?: (view: 'home' | 'listings' | 'lookup' | 'admin') => void;
  selectedVillaIdForDetail?: number | null;
}

export default function Navbar({ currentView, onNavigate, selectedVillaIdForDetail }: NavbarProps) {
  const { language, setLanguage, t } = useLanguage();
  const { showToast } = useToast();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileCategory, setMobileCategory] = useState<'villa' | 'hotel_resort' | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [, startLanguageTransition] = useTransition();
  const contactConsultMessage = t('contact.consultMessage');
  const publicSettingsQuery = usePublicSettingsQuery();
  const settings = publicSettingsQuery.data;
  const queryZaloPhone = settings?.zaloPhone || ZALO_PHONE_FALLBACK;
  const querySettingsZaloUrl = settings?.zaloUrl || getZaloLink(
    queryZaloPhone,
    contactConsultMessage
  );
  const zaloUrl = useMemo(
    () => querySettingsZaloUrl || getZaloLink(ZALO_PHONE_FALLBACK, contactConsultMessage),
    [querySettingsZaloUrl, contactConsultMessage]
  );
  const whatsappUrl = settings?.whatsappUrl || '';
  const wechatId = settings?.wechatId || '';
  const kakaoTalkId = settings?.kakaoTalkId || '';
  const socialLinks = useMemo(() => ({
    tikTokUrl: settings?.tikTokUrl || '',
    facebookPersonalUrl: settings?.facebookPersonalUrl || '',
    facebookFanpageUrl: settings?.facebookFanpageUrl || '',
    naverBlogUrl: settings?.naverBlogUrl || '',
    instagramWorkUrl: settings?.instagramWorkUrl || '',
  }), [settings]);

  const listingLink = (location: string, type: 'villa' | 'hotel_resort') => {
    const query = new URLSearchParams();
    if (location !== 'All') query.set('location', location);
    const value = query.toString();
    const basePath = type === 'hotel_resort' ? '/hotel_resort' : '/villas';
    return value ? `${basePath}?${value}` : basePath;
  };

  const isVillaCategoryActive = location.pathname.startsWith('/villas');
  const isHotelResortCategoryActive = location.pathname === '/hotel_resort';

  const renderLanguageFlag = (lang: 'vi' | 'en' | 'ko' | 'zh') => {
    const className = "h-3.5 w-5 overflow-hidden rounded-[2px] shadow-sm ring-1 ring-black/10";

    if (lang === 'vi') {
      return (
        <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
          <rect width="30" height="20" fill="#DA251D" />
          <polygon fill="#FFFF00" points="15,4 16.18,7.64 20,7.64 16.91,9.86 18.09,13.5 15,11.28 11.91,13.5 13.09,9.86 10,7.64 13.82,7.64" />
        </svg>
      );
    }

    if (lang === 'en') {
      return (
        <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
          <rect width="30" height="20" fill="#b22234" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} y={i * 3} width="30" height="1.5" fill="#fff" />)}
          <rect width="12" height="10.5" fill="#3c3b6e" />
          <circle cx="3" cy="2.5" r="0.6" fill="#fff" />
          <circle cx="6" cy="2.5" r="0.6" fill="#fff" />
          <circle cx="9" cy="2.5" r="0.6" fill="#fff" />
          <circle cx="3" cy="5" r="0.6" fill="#fff" />
          <circle cx="6" cy="5" r="0.6" fill="#fff" />
          <circle cx="9" cy="5" r="0.6" fill="#fff" />
          <circle cx="3" cy="7.5" r="0.6" fill="#fff" />
          <circle cx="6" cy="7.5" r="0.6" fill="#fff" />
          <circle cx="9" cy="7.5" r="0.6" fill="#fff" />
        </svg>
      );
    }

    if (lang === 'ko') {
      return (
        <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
          <rect width="30" height="20" rx="1" fill="#fff" />
          <g transform="translate(15 10) rotate(-33)">
            <path d="M0 -4a4 4 0 1 1 0 8a2 2 0 1 0 0 -4a2 2 0 1 1 0 -4" fill="#CD2E3A" />
            <path d="M0 4a4 4 0 1 1 0 -8a2 2 0 1 0 0 4a2 2 0 1 1 0 4" fill="#0047A0" />
          </g>
          <g stroke="#111" strokeWidth="0.9" strokeLinecap="square">
            <path d="M6.2 3.2l4 2.2M5.5 4.6l4 2.2M4.8 6l4 2.2" />
            <path d="M20.2 3.6l4-2.2M21 5.1l4-2.2M21.8 6.6l4-2.2" />
            <path d="M5.2 15.4l4-2.2M6 16.9l4-2.2M6.8 18.4l4-2.2" />
            <path d="M20.8 13.2l4 2.2M20 14.7l4 2.2M19.2 16.2l4 2.2" />
          </g>
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
        <rect width="30" height="20" fill="#DE2910" />
        <polygon fill="#FFDE00" points="6,3 6.7,5.1 9,5.1 7.1,6.4 7.8,8.6 6,7.3 4.2,8.6 4.9,6.4 3,5.1 5.3,5.1" />
        <circle cx="12" cy="4" r="0.8" fill="#FFDE00" />
        <circle cx="14" cy="6" r="0.8" fill="#FFDE00" />
        <circle cx="14" cy="9" r="0.8" fill="#FFDE00" />
        <circle cx="12" cy="12" r="0.8" fill="#FFDE00" />
      </svg>
    );
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!showContactModal) return;
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => {
      document.getElementById('navbar-contact-modal-body')?.scrollTo({ top: 0, behavior: 'auto' });
    });
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showContactModal]);


  const isMobileDevice = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const buildWeChatLink = (id: string) => `weixin://dl/chat?${encodeURIComponent(id)}`;
  const buildKakaoTalkLink = (id: string) => `kakaotalk://plusfriend/home/${encodeURIComponent(id)}`;
  const getWhatsAppPhoneFromUrl = (url: string) => {
    const match = url.match(/(?:wa\.me\/|phone=)(\d+)/);
    if (!match) return '';
    const digits = match[1];
    return digits && !digits.startsWith('0') ? '+' + digits : digits;
  };

  const handleAppContactClick = (appUrl: string, id: string, appName: string) => {
    if (isMobileDevice()) {
      window.location.href = appUrl;
      return;
    }

    void navigator.clipboard?.writeText(id)
      .then(() => showToast('success', `Đã sao chép ${appName} ID: ${id}`))
      .catch(() => showToast('warning', `Vui lòng sao chép ${appName} ID thủ công: ${id}`));
  };

  const contactLinkClass = "flex items-center justify-between gap-3 rounded-2xl border border-neutral-100 bg-white px-4 py-3 text-left text-xs font-bold text-neutral-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50";


  return (
    <header className={`sticky top-0 left-0 w-full ${showContactModal ? 'z-[9999]' : 'z-50'} bg-white/90 backdrop-blur-md border-b border-neutral-100 transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 h-16 flex items-center justify-between">

        {/* Brand Group */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer group"
          >
            <span className="text-2xl font-black tracking-tight text-[#005899] font-display">
              Henry<span className="text-[#fe6a34]">Travel</span>
            </span>
            <div className="hidden sm:flex h-7 items-center rounded-full border border-[#d7e8ff] bg-[#f5f9ff] px-2 shadow-sm transition-colors duration-200 group-hover:border-[#b8d8ff] group-hover:bg-white">
              {renderLanguageFlag(language)}
            </div>
          </Link>

          {/* Links for desktop */}
          <nav className="hidden md:flex items-center gap-1 font-medium text-sm">
            <NavLink
              to="/"
              className={({ isActive }) => `px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${isActive
                  ? 'text-[#005899] bg-[#edf3ff] font-semibold'
                  : 'text-neutral-600 hover:text-[#005899] hover:bg-neutral-50'
                }`}
            >
              <Home className="w-4 h-4" />
              {t('nav.home')}
            </NavLink>

            <div className="relative group">
              <NavLink
                to={listingLink('All', 'villa')}
                 className={() => `px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${isVillaCategoryActive
                    ? 'text-[#005899] bg-[#edf3ff] font-semibold'
                    : 'text-neutral-600 hover:text-[#005899] hover:bg-neutral-50'
                  }`}
              >
                <Building2 className="w-4 h-4" />
                {t('nav.villa')}
                <ChevronDown className="w-3.5 h-3.5" />
              </NavLink>
              <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute left-0 top-full pt-2 transition-all duration-200 z-50">
                <div className="w-52 rounded-2xl border border-neutral-100 bg-white p-2 shadow-xl shadow-neutral-900/10">
                  {[
                    ['nav.villaDanang', 'Đà Nẵng'],
                    ['nav.villaHoian', 'Hội An'],
                    ['nav.villaHue', 'Huế'],
                  ].map(([labelKey, location]) => (
                    <Link key={labelKey} to={listingLink(location, 'villa')} className="block rounded-xl px-3 py-2 text-xs font-bold text-neutral-600 hover:bg-[#edf3ff] hover:text-[#005899]">
                      {t(labelKey)}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative group">
              <NavLink
                to={listingLink('All', 'hotel_resort')}
                className={() => `px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${isHotelResortCategoryActive
                  ? 'text-[#005899] bg-[#edf3ff] font-semibold'
                  : 'text-neutral-600 hover:text-[#005899] hover:bg-neutral-50'
                }`}
              >
                <Hotel className="w-4 h-4" />
                {t('nav.hotelResort')}
                <ChevronDown className="w-3.5 h-3.5" />
              </NavLink>
              <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute left-0 top-full pt-2 transition-all duration-200 z-50">
                <div className="w-64 rounded-2xl border border-neutral-100 bg-white p-2 shadow-xl shadow-neutral-900/10">
                  {[
                    ['nav.hotelHoian', 'Hội An'],
                    ['nav.hotelDanang', 'Đà Nẵng'],
                    ['nav.hotelHue', 'Huế'],
                    ['nav.hotelNationwide', 'All'],
                  ].map(([labelKey, location]) => (
                    <Link key={labelKey} to={listingLink(location, 'hotel_resort')} className="block rounded-xl px-3 py-2 text-xs font-bold text-neutral-600 hover:bg-[#edf3ff] hover:text-[#005899]">
                      {t(labelKey)}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <NavLink
              to="/lookup"
              className={({ isActive }) => `px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${isActive
                  ? 'text-[#005899] bg-[#edf3ff] font-semibold'
                  : 'text-neutral-600 hover:text-[#005899] hover:bg-neutral-50'
                }`}
            >
              <SearchCode className="w-4 h-4" />
              {t('nav.lookup')}
            </NavLink>
          </nav>
        </div>

        {/* Support Buttons & Language Switcher Right */}
        <div className="flex items-center gap-3">

          {/* Custom language capsules */}
          <div className="flex items-center gap-1 rounded-full border border-neutral-200/70 bg-white/80 p-1 shadow-sm shadow-neutral-900/5 backdrop-blur">
            {(['vi', 'en', 'ko', 'zh'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => startLanguageTransition(() => setLanguage(lang))}
                aria-label={`Switch language to ${lang}`}
                className={`flex h-7 w-8 items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${language === lang
                    ? 'bg-[#edf3ff] ring-1 ring-[#9dccff] shadow-sm scale-105'
                    : 'opacity-70 hover:opacity-100 hover:bg-neutral-50'
                  }`}
              >
                {renderLanguageFlag(lang)}
              </button>
            ))}
          </div>

          {/* Support call for desktop/mobile */}
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            className="group bg-gradient-to-r from-[#0071c2] to-[#005899] hover:from-[#005899] hover:to-[#00477a] text-white px-2.5 sm:px-4 py-1.5 rounded-full text-xs font-bold leading-none flex items-center gap-2 shadow-lg shadow-[#0071c2]/25 hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-[#0071c2] shadow-sm transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-105">
              <Headset className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline pr-0.5">{t('contact.button')}</span>
          </button>
        </div>
      </div>

      {/* Sub navigation bar for small viewports */}
      <div className="relative md:hidden border-t border-neutral-100 bg-neutral-50/50">
        <div className="flex items-center justify-around py-2 px-2 text-xs font-semibold">
          <NavLink
            to="/"
            onClick={() => setMobileCategory(null)}
            className={({ isActive }) => `flex flex-col items-center gap-0.5 text-[10px] px-2 py-1 rounded-md cursor-pointer ${isActive ? 'text-[#0071c2] font-bold' : 'text-neutral-500'
              }`}
          >
            <Home className="w-4 h-4" />
            {t('nav.home')}
          </NavLink>
          <button
            type="button"
            onClick={() => setMobileCategory(mobileCategory === 'villa' ? null : 'villa')}
            className={`flex flex-col items-center gap-0.5 text-[10px] px-2 py-1 rounded-md cursor-pointer ${mobileCategory === 'villa' ? 'text-[#0071c2] font-bold' : 'text-neutral-500'}`}
          >
            <Building2 className="w-4 h-4" />
            {t('nav.villa')}
          </button>
          <button
            type="button"
            onClick={() => setMobileCategory(mobileCategory === 'hotel_resort' ? null : 'hotel_resort')}
            className={`flex flex-col items-center gap-0.5 text-[10px] px-2 py-1 rounded-md cursor-pointer ${mobileCategory === 'hotel_resort' ? 'text-[#0071c2] font-bold' : 'text-neutral-500'}`}
          >
            <Hotel className="w-4 h-4" />
            <span className="leading-tight text-center">{t('nav.hotelResort')}</span>
          </button>
          <NavLink
            to="/lookup"
            onClick={() => setMobileCategory(null)}
            className={({ isActive }) => `flex flex-col items-center gap-0.5 text-[10px] px-2 py-1 rounded-md cursor-pointer ${isActive ? 'text-[#0071c2] font-bold' : 'text-neutral-500'
              }`}
          >
            <SearchCode className="w-4 h-4" />
            {t('nav.lookup')}
          </NavLink>
        </div>

        {mobileCategory && (
          <div className="absolute left-2 right-2 top-full z-50 mt-1 rounded-2xl border border-neutral-100 bg-white p-2 shadow-xl shadow-neutral-900/15 animate-scaleIn">
            {(mobileCategory === 'villa'
              ? [
                  ['nav.villaDanang', 'Đà Nẵng'],
                  ['nav.villaHoian', 'Hội An'],
                  ['nav.villaHue', 'Huế'],
                ]
              : [
                  ['nav.hotelHoian', 'Hội An'],
                  ['nav.hotelDanang', 'Đà Nẵng'],
                  ['nav.hotelHue', 'Huế'],
                  ['nav.hotelNationwide', 'All'],
                ]
            ).map(([label, location]) => (
              <Link
                key={label}
                to={listingLink(location, mobileCategory)}
                onClick={() => setMobileCategory(null)}
                className="block rounded-xl px-3 py-2.5 text-xs font-bold text-neutral-600 hover:bg-[#edf3ff] hover:text-[#005899]"
              >
                {t(label)}
              </Link>
            ))}
          </div>
        )}
      </div>
      {showContactModal && (
        <div className="fixed inset-0 z-[1000] flex min-h-screen-safe w-full items-center justify-center overflow-y-auto bg-neutral-950/55 px-4 py-4 backdrop-blur-sm" onClick={() => setShowContactModal(false)}>
          <div className="flex max-h-modal-safe w-full max-w-lg flex-col overflow-hidden rounded-[28px] bg-neutral-50 shadow-2xl shadow-neutral-950/30" onClick={(e) => e.stopPropagation()}>
            <div className="relative shrink-0 overflow-hidden border-b border-[#0d4d72] bg-[#08324a] px-5 py-5 text-white">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#0b75ad]/45 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 left-8 h-32 w-32 rounded-full bg-[#fe6a34]/20 blur-3xl" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/15" />
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white shadow-md backdrop-blur transition active:scale-95 hover:bg-white/25 cursor-pointer"
                aria-label={t('contact.close')}
              >
                <X className="h-5 w-5" />
              </button>
              <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8ed4ff]">HenryTravel</p>
                <h2 className="mt-1 text-2xl font-black text-white">{t('contact.title')}</h2>
                <p className="mt-2 max-w-sm text-xs font-semibold leading-relaxed text-white/82">
                  {t('contact.desc')}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-3 py-2 text-xs font-black text-[#07507a] shadow-lg shadow-black/10">
                  <Clock3 className="h-4 w-4 text-[#0071c2]" />
                  <span>{t('footer.workingHours')} · {t('contact.timezone')}</span>
                </div>
              </div>
            </div>

            <div id="navbar-contact-modal-body" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-2.5">
                {zaloUrl && (
                  <a href={zaloUrl} target="_blank" rel="noopener noreferrer" className={contactLinkClass}>
                    <span className="flex items-center gap-3"><SiZalo size={18} color="#0068ff" /> Zalo{queryZaloPhone ? `: ${queryZaloPhone}` : ''}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
                  </a>
                )}
                {whatsappUrl && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={contactLinkClass}>
                    <span className="flex items-center gap-3"><FaWhatsapp size={18} color="#25D366" /> WhatsApp{getWhatsAppPhoneFromUrl(whatsappUrl) ? `: ${getWhatsAppPhoneFromUrl(whatsappUrl)}` : ''}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
                  </a>
                )}
                {wechatId && (
                  <button type="button" onClick={() => handleAppContactClick(buildWeChatLink(wechatId), wechatId, 'WeChat')} className={contactLinkClass}>
                    <span className="flex items-center gap-3"><SiWechat size={18} color="#07C160" /> {t('contact.wechatId')}: {wechatId}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
                  </button>
                )}
                {kakaoTalkId && (
                  <button type="button" onClick={() => handleAppContactClick(buildKakaoTalkLink(kakaoTalkId), kakaoTalkId, 'KakaoTalk')} className={contactLinkClass}>
                    <span className="flex items-center gap-3"><SiKakaotalk size={18} color="#FEE500" /> {t('contact.kakaoTalkId')}: {kakaoTalkId}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
                  </button>
                )}
                {socialLinks.facebookFanpageUrl && (
                  <a href={socialLinks.facebookFanpageUrl} target="_blank" rel="noopener noreferrer" className={contactLinkClass}>
                    <span className="flex items-center gap-3"><FaFacebookF size={16} color="#1877F2" /> {t('contact.facebookFanpage')}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
                  </a>
                )}
                {socialLinks.facebookPersonalUrl && (
                  <a href={socialLinks.facebookPersonalUrl} target="_blank" rel="noopener noreferrer" className={contactLinkClass}>
                    <span className="flex items-center gap-3"><FaFacebookF size={16} color="#1877F2" /> {t('contact.facebookPersonal')}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
                  </a>
                )}
                {socialLinks.instagramWorkUrl && (
                  <a href={socialLinks.instagramWorkUrl} target="_blank" rel="noopener noreferrer" className={contactLinkClass}>
                    <span className="flex items-center gap-3"><FaInstagram size={18} color="#E4405F" /> {t('contact.instagram')}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
                  </a>
                )}
                {socialLinks.tikTokUrl && (
                  <a href={socialLinks.tikTokUrl} target="_blank" rel="noopener noreferrer" className={contactLinkClass}>
                    <span className="flex items-center gap-3"><FaTiktok size={17} color="#111111" /> {t('contact.tiktok')}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
                  </a>
                )}
                {socialLinks.naverBlogUrl && (
                  <a href={socialLinks.naverBlogUrl} target="_blank" rel="noopener noreferrer" className={contactLinkClass}>
                    <span className="flex items-center gap-3"><SiNaver size={16} color="#03C75A" /> {t('contact.naverBlog')}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
                  </a>
                )}

              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
