import React, { createContext, useContext, useState, useEffect } from 'react';
import t, { Lang, Translations } from '../i18n/translations';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  T: Translations;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('cms_lang') as Lang) || 'en';
  });

  const setLang = (l: Lang) => {
    localStorage.setItem('cms_lang', l);
    setLangState(l);
  };

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Apply dir + font to <html> element
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    document.documentElement.style.fontFamily =
      lang === 'ar' ? "'Cairo', system-ui, sans-serif" : "'Inter', system-ui, sans-serif";
  }, [lang, dir]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, T: t[lang] as unknown as Translations, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
