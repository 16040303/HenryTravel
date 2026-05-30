/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  const [view, setView] = useState<'home' | 'listings' | 'detail' | 'lookup' | 'admin'>('home');
  const { t } = useLanguage();
  
  // Active selected villa for the details layout
  const [selectedVillaId, setSelectedVillaId] = useState<number | null>(null);

  // Trigger state increments to re-fetch villas list from storage across components
  const [villasTriggerUpdate, setVillasTriggerUpdate] = useState<number>(0);

  // Extracted search & filter query criteria
  const [activeSearchParams, setActiveSearchParams] = useState<SearchParams>({
    location: 'Đà Lạt',
    checkIn: '2026-06-20',
    checkOut: '2026-06-23',
    guests: 2,
    rooms: 1
  });

  const [activeFilterParams, setActiveFilterParams] = useState<FilterParams>({
    priceMin: 0,
    priceMax: 10000000,
    type: 'All',
    facilities: []
  });

  const handleSearchSubmitFromHome = (search: SearchParams, filter: FilterParams) => {
    setActiveSearchParams(search);
    setActiveFilterParams(filter);
    setView('listings');
  };

  const handleViewDetailOfVilla = (id: number) => {
    setSelectedVillaId(id);
    setView('detail');
  };

  const handleNavigateFromNavbar = (targetView: 'home' | 'listings' | 'lookup' | 'admin') => {
    setView(targetView);
  };

  const handleVillaAddedGlobally = () => {
    setVillasTriggerUpdate(prev => prev + 1);
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#fcf9f8] font-sans antialiased selection:bg-[#fe6a34]/20 selection:text-[#fe6a34] flex flex-col justify-between">
      
      <div>
        {/* Persisted Branding Navbar Header */}
        <Navbar 
          currentView={view} 
          onNavigate={handleNavigateFromNavbar} 
          selectedVillaIdForDetail={selectedVillaId}
        />

        {/* Main View Router switch layout with smooth 2026 core animations */}
        <main className="min-h-[calc(100vh-8rem)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {view === 'home' && (
                <HomeView 
                  onSearch={handleSearchSubmitFromHome} 
                  onViewDetail={handleViewDetailOfVilla}
                  villasTriggerUpdate={villasTriggerUpdate}
                />
              )}

              {view === 'listings' && (
                <ListingView 
                  initialSearchParams={activeSearchParams}
                  initialFilterParams={activeFilterParams}
                  onViewDetail={handleViewDetailOfVilla}
                  villasTriggerUpdate={villasTriggerUpdate}
                />
              )}

              {view === 'detail' && selectedVillaId !== null && (
                <DetailView 
                  villaId={selectedVillaId}
                  onBack={() => setView('listings')}
                  onNavigateToLookup={() => setView('lookup')}
                  onBookingSuccessNotify={handleVillaAddedGlobally}
                />
              )}

              {view === 'lookup' && (
                <LookupView />
              )}

              {view === 'admin' && (
                <AdminConsoleView 
                  onVillaAddedNotification={handleVillaAddedGlobally}
                />
              )}
            </motion.div>
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
              <button onClick={() => { setActiveSearchParams({ ...activeSearchParams, location: 'Đà Lạt' }); setView('listings'); }} className="hover:text-white text-left cursor-pointer transition-colors duration-200">
                {t('fac.landscape')} - {t('loc.dalat')}
              </button>
              <button onClick={() => { setActiveSearchParams({ ...activeSearchParams, location: 'Vũng Tàu' }); setView('listings'); }} className="hover:text-white text-left cursor-pointer transition-colors duration-200">
                {t('fac.beach_access')} - {t('loc.vungtau')}
              </button>
              <button onClick={() => { setActiveSearchParams({ ...activeSearchParams, location: 'Phú Quốc' }); setView('listings'); }} className="hover:text-white text-left cursor-pointer transition-colors duration-200">
                {t('nav.listings')} - {t('loc.phuquoc')}
              </button>
              <button onClick={() => { setActiveSearchParams({ ...activeSearchParams, location: 'Hội An' }); setView('listings'); }} className="hover:text-white text-left cursor-pointer transition-colors duration-200">
                {t('nav.home')} - {t('loc.hoian')}
              </button>
            </div>
          </div>

          <div className="md:col-span-3 flex flex-col gap-2.5">
            <span className="text-white font-bold uppercase text-xs tracking-wider">{t('look.bookingDetails')}</span>
            <div className="flex flex-col gap-1.5 text-xs text-neutral-500 font-semibold">
              <button onClick={() => setView('lookup')} className="hover:text-white text-left cursor-pointer transition-colors duration-200">{t('nav.lookup')}</button>
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
        <AppContent />
      </ToastProvider>
    </LanguageProvider>
  );
}

