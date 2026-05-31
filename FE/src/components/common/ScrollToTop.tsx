import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ScrollToTop() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label={t('common.backToTop')}
      className="fixed bottom-6 right-6 z-50 w-11 h-11 bg-[#0071c2] hover:bg-[#005899] text-white rounded-full shadow-lg shadow-[#0071c2]/25 flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer animate-fadeIn group"
    >
      <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
    </button>
  );
}
