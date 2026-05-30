/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import ListingView from './components/ListingView';
import DetailView from './components/DetailView';
import LookupView from './components/LookupView';
import AdminConsoleView from './components/AdminConsoleView';
import { ToastProvider } from './components/Toast';

import { SearchParams, FilterParams } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Trigger state increments to re-fetch villas list from storage across components
  const [villasTriggerUpdate, setVillasTriggerUpdate] = useState<number>(0);

  // Extracted search & filter query criteria backed by sessionStorage for refresh persistence
  const [activeSearchParams, setActiveSearchParams] = useState<SearchParams>(() => {
    const saved = sessionStorage.getItem('villastay_search');
    return saved ? JSON.parse(saved) : {
      location: 'Đà Lạt',
      checkIn: '2026-06-20',
      checkOut: '2026-06-23',
      guests: 2,
      rooms: 1
    };
  });

  const [activeFilterParams, setActiveFilterParams] = useState<FilterParams>(() => {
    const saved = sessionStorage.getItem('villastay_filters');
    return saved ? JSON.parse(saved) : {
      priceMin: 0,
      priceMax: 10000000,
      type: 'All',
      facilities: []
    };
  });

  const handleSearchSubmitFromHome = (search: SearchParams, filter: FilterParams) => {
    setActiveSearchParams(search);
    sessionStorage.setItem('villastay_search', JSON.stringify(search));
    setActiveFilterParams(filter);
    sessionStorage.setItem('villastay_filters', JSON.stringify(filter));
    navigate('/villas');
  };

  const handleVillaAddedGlobally = () => {
    setVillasTriggerUpdate(prev => prev + 1);
  };

  // Helper to resolve currently active view name for Navbar highlights
  const getActiveView = (): 'home' | 'listings' | 'detail' | 'lookup' | 'admin' => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/villas')) {
      // Check if it is a detail path (e.g. /villas/7)
      const isDetail = /^\/villas\/\d+/.test(path);
      return isDetail ? 'detail' : 'listings';
    }
    if (path.startsWith('/lookup')) return 'lookup';
    if (path.startsWith('/admin')) return 'admin';
    return 'home';
  };

  const handleNavigateFromNavbar = (targetView: 'home' | 'listings' | 'lookup' | 'admin') => {
    if (targetView === 'home') navigate('/');
    else if (targetView === 'listings') navigate('/villas');
    else if (targetView === 'lookup') navigate('/lookup');
    else if (targetView === 'admin') navigate('/admin');
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#fcf9f8] font-sans antialiased selection:bg-[#fe6a34]/20 selection:text-[#fe6a34] flex flex-col justify-between">
      
      <div>
        {/* Persisted Branding Navbar Header */}
        <Navbar 
          currentView={getActiveView()} 
          onNavigate={handleNavigateFromNavbar} 
          selectedVillaIdForDetail={null}
        />

        {/* Main View Router switch layout with smooth 2026 core animations */}
        <main className="min-h-[calc(100vh-8rem)]">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <HomeView 
                    onSearch={handleSearchSubmitFromHome} 
                    onViewDetail={(id) => navigate(`/villas/${id}`)}
                    villasTriggerUpdate={villasTriggerUpdate}
                  />
                </motion.div>
              } />

              <Route path="/villas" element={
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <ListingView 
                    initialSearchParams={activeSearchParams}
                    initialFilterParams={activeFilterParams}
                    onViewDetail={(id) => navigate(`/villas/${id}`)}
                    villasTriggerUpdate={villasTriggerUpdate}
                  />
                </motion.div>
              } />

              <Route path="/villas/:id" element={
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <DetailView 
                    onBack={() => navigate('/villas')}
                    onNavigateToLookup={() => navigate('/lookup')}
                    onBookingSuccessNotify={handleVillaAddedGlobally}
                  />
                </motion.div>
              } />

              <Route path="/lookup" element={
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <LookupView />
                </motion.div>
              } />

              <Route path="/admin" element={
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
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
        </main>
      </div>

      {/* Persistence brand footer element translated dynamically */}
      <footer className="bg-neutral-900 text-neutral-400 py-12 px-4 border-t border-neutral-800 shrink-0 mt-12">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 text-sm">
          
          <div className="md:col-span-4 flex flex-col gap-3">
            <span className="text-xl font-extrabold text-white">
              Villa<span className="text-[#fe6a34]">Stay</span>
            </span>
            <p className="text-xs text-neutral-500 leading-relaxed font-normal">
              {t('home.heroSubtitle')}
            </p>
          </div>

          <div className="md:col-span-3 flex flex-col gap-2.5">
            <span className="text-white font-bold uppercase text-xs tracking-wider">{t('home.popularLocations')}</span>
            <div className="flex flex-col gap-1.5 text-xs text-neutral-500 font-semibold">
              <Link 
                to="/villas" 
                onClick={() => {
                  const updated = { ...activeSearchParams, location: 'Đà Lạt' };
                  setActiveSearchParams(updated);
                  sessionStorage.setItem('villastay_search', JSON.stringify(updated));
                }} 
                className="hover:text-white text-left cursor-pointer transition-colors duration-200"
              >
                {t('fac.landscape')} - {t('loc.dalat')}
              </Link>
              <Link 
                to="/villas" 
                onClick={() => {
                  const updated = { ...activeSearchParams, location: 'Vũng Tàu' };
                  setActiveSearchParams(updated);
                  sessionStorage.setItem('villastay_search', JSON.stringify(updated));
                }} 
                className="hover:text-white text-left cursor-pointer transition-colors duration-200"
              >
                {t('fac.beach_access')} - {t('loc.vungtau')}
              </Link>
              <Link 
                to="/villas" 
                onClick={() => {
                  const updated = { ...activeSearchParams, location: 'Phú Quốc' };
                  setActiveSearchParams(updated);
                  sessionStorage.setItem('villastay_search', JSON.stringify(updated));
                }} 
                className="hover:text-white text-left cursor-pointer transition-colors duration-200"
              >
                {t('nav.listings')} - {t('loc.phuquoc')}
              </Link>
              <Link 
                to="/villas" 
                onClick={() => {
                  const updated = { ...activeSearchParams, location: 'Hội An' };
                  setActiveSearchParams(updated);
                  sessionStorage.setItem('villastay_search', JSON.stringify(updated));
                }} 
                className="hover:text-white text-left cursor-pointer transition-colors duration-200"
              >
                {t('nav.home')} - {t('loc.hoian')}
              </Link>
            </div>
          </div>

          <div className="md:col-span-3 flex flex-col gap-2.5">
            <span className="text-white font-bold uppercase text-xs tracking-wider">{t('look.bookingDetails')}</span>
            <div className="flex flex-col gap-1.5 text-xs text-neutral-500 font-semibold">
              <Link to="/lookup" className="hover:text-white text-left cursor-pointer transition-colors duration-200">{t('nav.lookup')}</Link>
              <a href="https://zalo.me/0901234567" target="_blank" rel="noopener noreferrer" className="hover:text-white text-left cursor-pointer transition-colors duration-200">{t('nav.zaloSupport')} (Hotline 24/7)</a>
              <span className="text-neutral-600 block mt-1">Working hours: 07:00 – 23:00</span>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col gap-2.5">
            <span className="text-white font-bold uppercase text-xs tracking-wider">Policies</span>
            <div className="flex flex-col gap-1.5 text-xs text-neutral-500 font-semibold">
              <span>{t('detail.policies')}</span>
              <span>15 Minutes Guaranteed Reservation</span>
              <span>Secure Transactions</span>
            </div>
          </div>

        </div>

        <div className="max-w-[1280px] mx-auto px-4 md:px-8 border-t border-neutral-800 mt-10 pt-6 text-center text-xs text-neutral-600 font-semibold">
          © 2026 VillaStay International Ltd. Dedicated to delivering state-of-the-art vacation stays & automated holds.
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </ToastProvider>
    </LanguageProvider>
  );
}
