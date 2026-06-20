import React, { createContext, useEffect, useState, useContext, ReactNode } from 'react';
import { Language, TRANSLATIONS } from '../i18n';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children, storageKey = 'HenryTravel_public_language' }: { children: ReactNode; storageKey?: string }) {
  // Try to read default language from localstorage, fallback to 'vi'
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(storageKey) || localStorage.getItem('HenryTravel_language');
    if (saved === 'en' || saved === 'vi' || saved === 'ko' || saved === 'zh') {
      return saved as Language;
    }
    return 'vi';
  });

  useEffect(() => {
    const saved = localStorage.getItem(storageKey) || localStorage.getItem('HenryTravel_language');
    setLanguageState(saved === 'en' || saved === 'vi' || saved === 'ko' || saved === 'zh' ? saved : 'vi');
  }, [storageKey]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(storageKey, lang);
  };

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    const dictionary = TRANSLATIONS[language];
    let template = dictionary[key] || (language !== 'vi' ? TRANSLATIONS['en'][key] : undefined) || TRANSLATIONS['vi'][key] || key;

    if (replacements) {
      Object.keys(replacements).forEach((k) => {
        template = template.replace(`{${k}}`, String(replacements[k]));
      });
    }
    return template;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
