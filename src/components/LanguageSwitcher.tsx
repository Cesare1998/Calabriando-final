import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocation } from 'react-router-dom';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isScrolled = window.scrollY > 50;

  const toggleLanguage = () => {
    setLanguage(language === 'it' ? 'en' : 'it');
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 transition-colors duration-300 ${
        isHomePage && !isScrolled
          ? 'text-white hover:text-primary-400' 
          : 'text-gray-700 hover:text-primary-600'
      }`}
      aria-label={`Switch to ${language === 'it' ? 'English' : 'Italian'}`}
    >
      <Globe className="w-5 h-5" />
      <span className="uppercase font-medium">{language}</span>
    </button>
  );
}