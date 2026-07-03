/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ScrollToTop from './components/common/ScrollToTop';
import { ToastProvider, useToast } from './components/Toast';
import { SearchParams, FilterParams } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { queryClient } from './lib/queryClient';
import { usePublicSettingsQuery } from './hooks/queries';
import { getZaloLink, ZALO_PHONE_FALLBACK } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { Clock3 } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa';
import { SiKakaotalk, SiNaver, SiWechat, SiZalo } from 'react-icons/si';

const HomeView = lazy(() => import('./components/HomeView'));
const ListingView = lazy(() => import('./components/ListingView'));
const DetailView = lazy(() => import('./components/DetailView'));
const LookupView = lazy(() => import('./components/LookupView'));
const AdminConsoleView = lazy(() => import('./components/AdminConsoleView'));
const PolicyView = lazy(() => import('./components/PolicyView'));

const RouteFallback = () => (
  <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center px-4">
    <div className="rounded-2xl border border-neutral-100 bg-white/90 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#0071c2] shadow-sm">
      Đang tải...
    </div>
  </div>
);

const DEFAULT_SEARCH_PARAMS: SearchParams = {
  location: 'All',
  checkIn: '',
  checkOut: '',
  guests: 1,
  rooms: 1,
};

const DEFAULT_FILTER_PARAMS: FilterParams = {
  priceMin: 0,
  priceMax: 100000000,
  type: 'All',
  facilities: [],
};

const parseSafeNumber = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const parseListingQuery = (searchString: string, pathname = '/villas'): { search: SearchParams; filter: FilterParams } => {
  const query = new URLSearchParams(searchString);
  const accommodationType = query.get('accommodationType');
  const pathType = pathname === '/hotel_resort'
    ? 'hotel_resort'
    : pathname === '/villas'
      ? 'villa'
      : pathname === '/all'
        ? 'All'
        : null;
  const validType = pathType || (accommodationType === 'villa' || accommodationType === 'hotel_resort' ? accommodationType : 'All');
  const repeatedFacilities = query.getAll('facilities');
  const facilities = repeatedFacilities.length > 1
    ? repeatedFacilities
    : (query.get('facilities') || '').split(',');

  return {
    search: {
      location: query.get('location') || DEFAULT_SEARCH_PARAMS.location,
      checkIn: query.get('checkIn') || DEFAULT_SEARCH_PARAMS.checkIn,
      checkOut: query.get('checkOut') || DEFAULT_SEARCH_PARAMS.checkOut,
      guests: parseSafeNumber(query.get('guests'), DEFAULT_SEARCH_PARAMS.guests),
      rooms: parseSafeNumber(query.get('rooms'), DEFAULT_SEARCH_PARAMS.rooms),
    },
    filter: {
      priceMin: parseSafeNumber(query.get('priceMin'), DEFAULT_FILTER_PARAMS.priceMin),
      priceMax: parseSafeNumber(query.get('priceMax'), DEFAULT_FILTER_PARAMS.priceMax),
      type: validType,
      facilities: facilities.map(item => item.trim()).filter(Boolean),
    },
  };
};

const buildListingQuery = (search: SearchParams, filter: FilterParams) => {
  const query = new URLSearchParams();
  if (search.location && search.location !== 'All' && search.location !== 'Tất cả địa điểm') query.set('location', search.location);
  if (search.checkIn) query.set('checkIn', search.checkIn);
  if (search.checkOut) query.set('checkOut', search.checkOut);
  if (search.guests) query.set('guests', String(search.guests));
  if (search.rooms) query.set('rooms', String(search.rooms));
  if (filter.priceMin) query.set('priceMin', String(filter.priceMin));
  if (filter.priceMax && filter.priceMax !== DEFAULT_FILTER_PARAMS.priceMax) query.set('priceMax', String(filter.priceMax));
  if (filter.facilities.length > 0) query.set('facilities', filter.facilities.join(','));
  const value = query.toString();
  const basePath = filter.type === 'hotel_resort' ? '/hotel_resort' : filter.type === 'villa' ? '/villas' : '/all';
  return value ? `${basePath}?${value}` : basePath;
};

const buildWeChatLink = (id: string) => `weixin://dl/chat?${encodeURIComponent(id)}`;
const buildKakaoTalkLink = (id: string) => `kakaotalk://search?query=${encodeURIComponent(id)}`;
const isMobileDevice = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const getWhatsAppPhoneFromUrl = (url: string) => {
  const match = url.match(/(?:wa\.me\/|phone=)(\d+)/);
  if (!match) return '';
  const digits = match[1];
  return digits && !digits.startsWith('0') ? '+' + digits : digits;
};

function AppContent() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const initialRouteKeyRef = useRef(`${location.pathname}${location.search}${location.hash}`);
  const didRestoreScrollRef = useRef(false);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    if (location.pathname !== '/villas') return;
    const query = new URLSearchParams(location.search);
    const legacyType = query.get('accommodationType');
    if (legacyType !== 'villa' && legacyType !== 'hotel_resort') return;

    query.delete('accommodationType');
    const nextSearch = query.toString();
    const nextPath = legacyType === 'hotel_resort' ? '/hotel_resort' : '/villas';
    navigate(`${nextPath}${nextSearch ? `?${nextSearch}` : ''}`, { replace: true });
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (isAdminRoute) return;

    const routeKey = `${location.pathname}${location.search}${location.hash}`;
    const scrollKey = `henrytravel_scroll:${routeKey}`;
    let saveTimer: number | null = null;

    const saveScroll = () => {
      sessionStorage.setItem(scrollKey, String(window.scrollY));
    };

    const throttledSaveScroll = () => {
      if (saveTimer) return;
      saveTimer = window.setTimeout(() => {
        saveTimer = null;
        saveScroll();
      }, 300);
    };

    const shouldRestoreSavedScroll =
      !didRestoreScrollRef.current &&
      routeKey === initialRouteKeyRef.current;

    const restoreOrResetScroll = () => {
      if (shouldRestoreSavedScroll) {
        const savedRaw = sessionStorage.getItem(scrollKey);
        const savedScroll = savedRaw === null ? NaN : Number(savedRaw);
        if (Number.isFinite(savedScroll) && savedScroll >= 0) {
          window.scrollTo({ top: savedScroll, behavior: 'instant' as ScrollBehavior });
          didRestoreScrollRef.current = true;
          return;
        }
      }

      if (!shouldRestoreSavedScroll) {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
    };

    requestAnimationFrame(() => {
      restoreOrResetScroll();
      window.setTimeout(restoreOrResetScroll, 150);
      window.setTimeout(restoreOrResetScroll, 450);
    });

    window.addEventListener('scroll', throttledSaveScroll, { passive: true });
    window.addEventListener('pagehide', saveScroll);
    window.addEventListener('beforeunload', saveScroll);
    document.addEventListener('visibilitychange', saveScroll);

    return () => {
      if (saveTimer) window.clearTimeout(saveTimer);
      saveScroll();
      window.removeEventListener('scroll', throttledSaveScroll);
      window.removeEventListener('pagehide', saveScroll);
      window.removeEventListener('beforeunload', saveScroll);
      document.removeEventListener('visibilitychange', saveScroll);
    };
  }, [isAdminRoute, location.pathname, location.search, location.hash]);

  // Dynamic page title based on route
  useEffect(() => {
    const path = location.pathname;
    let title = 'HenryTravel';
    if (path === '/') title = `HenryTravel — ${t('home.heroTitle')}`;
    else if (path === '/villas') title = `${t('nav.listings')} — HenryTravel`;
    else if (path.startsWith('/villas/')) title = `${t('home.viewDetails')} — HenryTravel`;
    else if (path === '/lookup') title = `${t('nav.lookup')} — HenryTravel`;
    else if (path === '/admin') title = `${t('nav.admin')} — HenryTravel`;
    document.title = title;
  }, [location.pathname, t]);

  // Trigger state increments to re-fetch villas list from storage across components
  const [villasTriggerUpdate, setVillasTriggerUpdate] = useState<number>(0);
  const publicSettingsQuery = usePublicSettingsQuery();
  const publicSettings = publicSettingsQuery.data;
  const publicZaloPhone = publicSettings?.zaloPhone || ZALO_PHONE_FALLBACK;
  const publicZaloUrl = publicSettings?.zaloUrl || getZaloLink(publicZaloPhone || ZALO_PHONE_FALLBACK);
  const publicWhatsAppUrl = publicSettings?.whatsappUrl || '';
  const publicWeChatId = publicSettings?.wechatId || '';
  const publicKakaoTalkId = publicSettings?.kakaoTalkId || '';
  const publicSocialLinks = {
    tikTokUrl: publicSettings?.tikTokUrl || '',
    facebookPersonalUrl: publicSettings?.facebookPersonalUrl || '',
    facebookFanpageUrl: publicSettings?.facebookFanpageUrl || '',
    naverBlogUrl: publicSettings?.naverBlogUrl || '',
    instagramWorkUrl: publicSettings?.instagramWorkUrl || '',
  };

  const listingQueryState = parseListingQuery(location.search, location.pathname);
  const activeSearchParams = listingQueryState.search;
  const activeFilterParams = listingQueryState.filter;


  const handleSearchSubmitFromHome = (search: SearchParams, filter: FilterParams) => {
    navigate(buildListingQuery(search, filter));
  };

  const handleListingSearchParamsUpdate = (search: SearchParams, filter?: FilterParams) => {
    navigate(buildListingQuery(search, filter || activeFilterParams));
  };

  const handleVillaAddedGlobally = () => {
    setVillasTriggerUpdate(prev => prev + 1);
  };

  // Helper to resolve currently active view name for Navbar highlights
  const getActiveView = (): 'home' | 'listings' | 'detail' | 'lookup' | 'admin' => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path === '/all' || path.startsWith('/hotel_resort') || path.startsWith('/villas')) {
      // Check if it is a detail path (e.g. /villas/7 or /hotel_resort/7)
      const isDetail = /^\/(villas|hotel_resort)\/[\w-]+/.test(path);
      return isDetail ? 'detail' : 'listings';
    }
    if (path.startsWith('/lookup')) return 'lookup';
    if (path.startsWith('/admin')) return 'admin';
    return 'home';
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

  const handleNavigateFromNavbar = (targetView: 'home' | 'listings' | 'lookup' | 'admin') => {
    if (targetView === 'home') navigate('/');
    else if (targetView === 'listings') navigate('/villas');
    else if (targetView === 'lookup') navigate('/lookup');
    else if (targetView === 'admin') navigate('/admin');
  };

  return (
    <div id="app-root" className={`min-h-screen-safe bg-[#fcf9f8] font-sans antialiased selection:bg-[#fe6a34]/20 selection:text-[#fe6a34] flex flex-col no-horizontal-scroll ${isAdminRoute ? 'h-screen-safe overflow-hidden' : ''}`}>

      <div className={isAdminRoute ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'flex flex-1 flex-col'}>
        {/* Persisted Branding Navbar Header */}
        <Navbar
          currentView={getActiveView()}
          onNavigate={handleNavigateFromNavbar}
          selectedVillaIdForDetail={null}
        />

        <main className={isAdminRoute ? 'min-h-0 flex-1 overflow-hidden' : 'min-h-[calc(100dvh-8rem)] flex-1'}>
          <Suspense fallback={<RouteFallback />}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <HomeView
                      onSearch={handleSearchSubmitFromHome}
                      onViewDetail={(id, type) => navigate(type === 'Khách sạn - resort' ? `/hotel_resort/${id}` : `/villas/${id}`)}
                      villasTriggerUpdate={villasTriggerUpdate}
                    />
                  </motion.div>
                } />

                <Route path="/all" element={
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <ListingView
                      initialSearchParams={activeSearchParams}
                      initialFilterParams={activeFilterParams}
                      onViewDetail={(id, type) => navigate(type === 'Khách sạn - resort' ? `/hotel_resort/${id}` : `/villas/${id}`)}
                      villasTriggerUpdate={villasTriggerUpdate}
                      onSearchParamsUpdate={handleListingSearchParamsUpdate}
                    />
                  </motion.div>
                } />

                <Route path="/villas" element={
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <ListingView
                      initialSearchParams={activeSearchParams}
                      initialFilterParams={activeFilterParams}
                      onViewDetail={(id) => navigate(`/villas/${id}`)}
                      villasTriggerUpdate={villasTriggerUpdate}
                      onSearchParamsUpdate={handleListingSearchParamsUpdate}
                    />
                  </motion.div>
                } />

                <Route path="/hotel_resort" element={
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <ListingView
                      initialSearchParams={activeSearchParams}
                      initialFilterParams={activeFilterParams}
                      onViewDetail={(id) => navigate(`/hotel_resort/${id}`)}
                      villasTriggerUpdate={villasTriggerUpdate}
                      onSearchParamsUpdate={handleListingSearchParamsUpdate}
                    />
                  </motion.div>
                } />

                <Route path="/villas/:id" element={
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <DetailView
                      onBack={() => navigate('/villas')}
                      onNavigateToLookup={() => navigate('/lookup')}
                      onBookingSuccessNotify={handleVillaAddedGlobally}
                      initialSearchParams={activeSearchParams}
                    />
                  </motion.div>
                } />

                <Route path="/hotel_resort/:id" element={
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <DetailView
                      onBack={() => navigate('/hotel_resort')}
                      onNavigateToLookup={() => navigate('/lookup')}
                      onBookingSuccessNotify={handleVillaAddedGlobally}
                      initialSearchParams={activeSearchParams}
                    />
                  </motion.div>
                } />

                <Route path="/policies/:slug" element={
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <PolicyView />
                  </motion.div>
                } />

                <Route path="/lookup" element={
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <LookupView />
                  </motion.div>
                } />

                <Route path="/admin" element={
                  <motion.div
                    className="h-full min-h-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <AdminConsoleView
                      onVillaAddedNotification={handleVillaAddedGlobally}
                    />
                  </motion.div>
                } />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </main>
      </div>

      {!isAdminRoute && <ScrollToTop />}

      {/* Persistence brand footer element translated dynamically */}
      {!isAdminRoute && (
        <footer className="bg-neutral-900 text-neutral-400 py-12 px-4 border-t border-neutral-800 shrink-0 mt-12">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 text-sm">

            <div className="flex flex-col gap-3">
              <span className="text-xl font-extrabold text-white">
                Henry<span className="text-[#fe6a34]">Travel</span>
              </span>
              <p className="text-xs text-neutral-500 leading-relaxed font-normal whitespace-pre-line">
                {t('footer.brandDesc')}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-white font-bold uppercase text-xs tracking-wider">{t('footer.social')}</span>
              <div className="flex flex-col gap-1.5 text-xs text-neutral-500 font-semibold">
                {publicSocialLinks.facebookFanpageUrl && (
                  <a href={publicSocialLinks.facebookFanpageUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 hover:text-white text-left cursor-pointer transition-colors duration-200">
                    <FaFacebookF size={14} color="#1877F2" />
                    <span>{t('contact.facebookFanpage')}</span>
                  </a>
                )}
                {publicSocialLinks.facebookPersonalUrl && (
                  <a href={publicSocialLinks.facebookPersonalUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 hover:text-white text-left cursor-pointer transition-colors duration-200">
                    <FaFacebookF size={14} color="#1877F2" />
                    <span>{t('contact.facebookPersonal')}</span>
                  </a>
                )}
                {publicSocialLinks.instagramWorkUrl && (
                  <a href={publicSocialLinks.instagramWorkUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 hover:text-white text-left cursor-pointer transition-colors duration-200">
                    <FaInstagram size={14} color="#E4405F" />
                    <span>{t('contact.instagram')}</span>
                  </a>
                )}
                {publicSocialLinks.tikTokUrl && (
                  <a href={publicSocialLinks.tikTokUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 hover:text-white text-left cursor-pointer transition-colors duration-200">
                    <FaTiktok size={14} color="#ffffff" />
                    <span>{t('contact.tiktok')}</span>
                  </a>
                )}
                {publicSocialLinks.naverBlogUrl && (
                  <a href={publicSocialLinks.naverBlogUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 hover:text-white text-left cursor-pointer transition-colors duration-200">
                    <SiNaver size={14} color="#03C75A" />
                    <span>{t('contact.naverBlog')}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-white font-bold uppercase text-xs tracking-wider">{t('footer.contactInfo')}</span>
              <div className="flex flex-col gap-1.5 text-xs text-neutral-500 font-semibold">
                {publicZaloUrl && (
                  <a href={publicZaloUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white text-left cursor-pointer transition-colors duration-200">
                    <SiZalo size={14} color="#0068ff" />
                    <span>Zalo{publicZaloPhone ? `: ${publicZaloPhone}` : ''}</span>
                  </a>
                )}
                {publicWhatsAppUrl && (
                  <a href={publicWhatsAppUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white text-left cursor-pointer transition-colors duration-200">
                    <FaWhatsapp size={14} color="#25D366" />
                    <span>WhatsApp{getWhatsAppPhoneFromUrl(publicWhatsAppUrl) ? `: ${getWhatsAppPhoneFromUrl(publicWhatsAppUrl)}` : ''}</span>
                  </a>
                )}
                {publicWeChatId && (
                  <button
                    type="button"
                    onClick={() => handleAppContactClick(buildWeChatLink(publicWeChatId), publicWeChatId, 'WeChat')}
                    className="flex items-center gap-2 hover:text-white text-left cursor-pointer transition-colors duration-200"
                    title={t('contact.wechatTooltip')}
                  >
                    <SiWechat size={14} color="#07C160" />
                    <span>WeChat ID: {publicWeChatId}</span>
                  </button>
                )}
                {publicKakaoTalkId && (
                  <button
                    type="button"
                    onClick={() => handleAppContactClick(buildKakaoTalkLink(publicKakaoTalkId), publicKakaoTalkId, 'KakaoTalk')}
                    className="flex items-center gap-2 hover:text-white text-left cursor-pointer transition-colors duration-200"
                    title={t('contact.kakaoTooltip')}
                  >
                    <SiKakaotalk size={14} color="#FEE500" />
                    <span>KakaoTalk ID: {publicKakaoTalkId}</span>
                  </button>
                )}
                <span className="flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5 text-[#fe6a34]" />
                  <span>{t('footer.workingHours')}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-white font-bold uppercase text-xs tracking-wider">{t('look.bookingDetails')}</span>
              <div className="flex flex-col gap-1.5 text-xs text-neutral-500 font-semibold">
                <Link to="/lookup" className="hover:text-white text-left cursor-pointer transition-colors duration-200">{t('nav.lookup')}</Link>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-white font-bold uppercase text-xs tracking-wider">{t('footer.policies')}</span>
              <div className="flex flex-col gap-1.5 text-xs text-neutral-500 font-semibold">
                <Link to="/policies/stay" className="hover:text-white text-left cursor-pointer transition-colors duration-200">{t('detail.policies')}</Link>
                <Link to="/policies/hold" className="hover:text-white text-left cursor-pointer transition-colors duration-200">{t('footer.holdGuarantee')}</Link>
                <Link to="/policies/secure" className="hover:text-white text-left cursor-pointer transition-colors duration-200">{t('footer.secureTransaction')}</Link>
              </div>
            </div>

          </div>

          <div className="max-w-[1280px] mx-auto px-4 md:px-8 border-t border-neutral-800 mt-10 pt-6 text-center text-xs text-neutral-600 font-semibold">
            {t('footer.copyright')}
          </div>
        </footer>
      )}

    </div>
  );
}

function LanguageScopedApp() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const storageKey = isAdminRoute ? 'HenryTravel_admin_language' : 'HenryTravel_public_language';

  return (
    <LanguageProvider storageKey={storageKey}>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </LanguageProvider>
  );
}

export default function App() {
  return (
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <LanguageScopedApp />
      </QueryClientProvider>
    </HashRouter>
  );
}
