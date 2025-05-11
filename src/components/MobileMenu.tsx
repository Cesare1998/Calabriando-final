import React from 'react';
import { Menu, X, Instagram, Facebook, Youtube } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export default function MobileMenu({ isOpen, onClose, onToggle }: MobileMenuProps) {
  const { t, language } = useLanguage();

  return (
    <>
      <button
        onClick={onToggle}
        className="lg:hidden text-current hover:text-primary-500 transition"
        aria-label="Toggle menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <div className="fixed right-0 top-0 h-full w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="relative h-full overflow-y-auto flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
                
                <div className="flex items-center gap-3 mb-6">
                  <img 
                    src="/calabriando-blue.png"
                    alt="Calabriando Logo"
                    className="w-10 h-10 object-contain"
                  />
                  <span className="text-xl font-bold text-primary-700">Calabriando</span>
                </div>
                
                <nav className="mt-8">
                  <ul className="space-y-4">
                    <li>
                      <Link
                        to="/tours"
                        onClick={onClose}
                        className="block text-gray-700 hover:text-primary-600 transition py-2 border-b border-gray-100"
                      >
                        {language === 'it' ? 'Tour ed esperienze' : 'Tours & experiences'}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/bb"
                        onClick={onClose}
                        className="block text-gray-700 hover:text-primary-600 transition py-2 border-b border-gray-100"
                      >
                        {t('nav.bb')}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/restaurants"
                        onClick={onClose}
                        className="block text-gray-700 hover:text-primary-600 transition py-2 border-b border-gray-100"
                      >
                        {t('nav.restaurants')}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/culture"
                        onClick={onClose}
                        className="block text-gray-700 hover:text-primary-600 transition py-2 border-b border-gray-100"
                      >
                        {t('nav.culture')}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/team"
                        onClick={onClose}
                        className="block text-gray-700 hover:text-primary-600 transition py-2 border-b border-gray-100"
                      >
                        {t('nav.team')}
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>

              <div className="mt-auto p-6 border-t border-gray-100">
                <div className="flex items-center justify-center gap-6">
                  <a
                    href="https://www.instagram.com/calabriando/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-primary-600 transition-colors duration-300"
                  >
                    <Instagram className="w-6 h-6" />
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-primary-600 transition-colors duration-300"
                  >
                    <Facebook className="w-6 h-6" />
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-primary-600 transition-colors duration-300"
                  >
                    <Youtube className="w-6 h-6" />
                  </a>
                </div>
                <div className="mt-6 text-center text-sm text-gray-500">
                  <p>© {new Date().getFullYear()} Calabriando</p>
                  <p>{language === 'it' ? 'Tutti i diritti riservati' : 'All rights reserved'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}