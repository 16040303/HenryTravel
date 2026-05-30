import React, { useState, useEffect } from 'react';
import { MessageSquare, Shield, Search, SearchCode, Home, Building2, Globe } from 'lucide-react';
import { getZaloLink } from '../constants';
import { useLanguage, Language } from '../contexts/LanguageContext';

interface NavbarProps {
  currentView: 'home' | 'listings' | 'detail' | 'lookup' | 'admin';
  onNavigate: (view: 'home' | 'listings' | 'lookup' | 'admin') => void;
  selectedVillaIdForDetail: number | null;
}

export default function Navbar({ currentView, onNavigate, selectedVillaIdForDetail }: NavbarProps) {
  const zaloUrl = getZaloLink('Xin chào VillaStay, tôi cần tư vấn về dịch vụ đặt phòng villa.');
  const { language, setLanguage, t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-neutral-100 transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 h-16 flex items-center justify-between">
        
        {/* Brand Group */}
        <div className="flex items-center gap-8">
          <button 
            onClick={() => onNavigate('home')} 
            className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer group"
          >
            <span className="text-2xl font-black tracking-tight text-[#005899] font-display">
              Villa<span className="text-[#fe6a34]">Stay</span>
            </span>
            <div className="hidden sm:block text-[10px] bg-[#edf3ff] text-[#00487f] uppercase font-bold py-0.5 px-2 rounded-full tracking-wider group-hover:bg-[#0071c2] group-hover:text-white transition-colors duration-200">
              {language.toUpperCase()}
            </div>
          </button>
 
          {/* Links for desktop */}
          <nav className="hidden md:flex items-center gap-1 font-medium text-sm">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'home' 
                  ? 'text-[#005899] bg-[#edf3ff] font-semibold' 
                  : 'text-neutral-600 hover:text-[#005899] hover:bg-neutral-50'
              }`}
            >
              <Home className="w-4 h-4" />
              {t('nav.home')}
            </button>
            
            <button
              onClick={() => onNavigate('listings')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'listings' || currentView === 'detail'
                  ? 'text-[#005899] bg-[#edf3ff] font-semibold' 
                  : 'text-neutral-600 hover:text-[#005899] hover:bg-neutral-50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              {t('nav.listings')}
            </button>

            <button
              onClick={() => onNavigate('lookup')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'lookup' 
                  ? 'text-[#005899] bg-[#edf3ff] font-semibold' 
                  : 'text-neutral-600 hover:text-[#005899] hover:bg-neutral-50'
              }`}
            >
              <SearchCode className="w-4 h-4" />
              {t('nav.lookup')}
            </button>

            <button
              onClick={() => onNavigate('admin')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'admin' 
                  ? 'text-[#005899] bg-[#edf3ff] font-semibold' 
                  : 'text-neutral-600 hover:text-[#005899] hover:bg-neutral-50'
              }`}
            >
              <Shield className="w-4 h-4" />
              {t('nav.admin')}
            </button>
          </nav>
        </div>

        {/* Support Buttons & Language Switcher Right */}
        <div className="flex items-center gap-3">
          
          {/* Custom language capsules */}
          <div className="flex bg-neutral-100 rounded-full p-0.5 border border-neutral-200/50">
            {(['vi', 'en', 'ko'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2 py-1 text-[10px] font-extrabold rounded-full uppercase transition-all duration-300 cursor-pointer ${
                  language === lang
                    ? 'bg-[#0071c2] text-white shadow'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Support call for desktop/mobile */}
          <a
            href={zaloUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0071c2] hover:bg-[#005899] text-white px-3 sm:px-4 py-2 rounded-full text-xs font-bold leading-none flex items-center gap-1.5 shadow-sm shadow-[#0071c2]/20 hover:scale-105 transition-all duration-300"
          >
            <MessageSquare className="w-4.5 h-4.5 fill-white text-[#0071c2] shrink-0" />
            <span className="hidden sm:inline">Zalo Support</span>
          </a>
        </div>
      </div>

      {/* Sub navigation bar for small viewports */}
      <div className="flex md:hidden items-center justify-around border-t border-neutral-100 bg-neutral-50/50 py-2 px-2 text-xs font-semibold">
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center gap-0.5 text-[10px] px-2 py-1 rounded-md cursor-pointer ${
            currentView === 'home' ? 'text-[#0071c2] font-bold' : 'text-neutral-500'
          }`}
        >
          <Home className="w-4 h-4" />
          {t('nav.home')}
        </button>
        <button
          onClick={() => onNavigate('listings')}
          className={`flex flex-col items-center gap-0.5 text-[10px] px-2 py-1 rounded-md cursor-pointer ${
            currentView === 'listings' || currentView === 'detail' ? 'text-[#0071c2] font-bold' : 'text-neutral-500'
          }`}
        >
          <Building2 className="w-4 h-4" />
          {t('nav.listings')}
        </button>
        <button
          onClick={() => onNavigate('lookup')}
          className={`flex flex-col items-center gap-0.5 text-[10px] px-2 py-1 rounded-md cursor-pointer ${
            currentView === 'lookup' ? 'text-[#0071c2] font-bold' : 'text-neutral-500'
          }`}
        >
          <SearchCode className="w-4 h-4" />
          {t('nav.lookup')}
        </button>
        <button
          onClick={() => onNavigate('admin')}
          className={`flex flex-col items-center gap-0.5 text-[10px] px-2 py-1 rounded-md cursor-pointer ${
            currentView === 'admin' ? 'text-[#0071c2] font-bold' : 'text-neutral-500'
          }`}
        >
          <Shield className="w-4 h-4" />
          {t('nav.admin')}
        </button>
      </div>
    </header>
  );
}

