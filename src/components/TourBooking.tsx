import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Building, Map, Sparkles } from 'lucide-react';

export default function TourBooking() {
  const { language, t } = useLanguage();

  const categories = [
    {
      id: 'city',
      title: language === 'it' ? 'Tour in Città' : 'City Tours',
      description: language === 'it'
        ? 'Scopri le meravigliose città della Calabria con le nostre guide esperte'
        : 'Discover the wonderful cities of Calabria with our expert guides',
      icon: Building,
      image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80'
    },
    {
      id: 'region',
      title: language === 'it' ? 'Tour in Calabria' : 'Calabria Tours',
      description: language === 'it'
        ? 'Esplora le bellezze naturali e culturali della regione'
        : 'Explore the natural and cultural beauties of the region',
      icon: Map,
      image: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?auto=format&fit=crop&q=80'
    },
    {
      id: 'unique',
      title: language === 'it' ? 'Esperienze Uniche' : 'Unique Experiences',
      description: language === 'it'
        ? 'Vivi momenti indimenticabili con le nostre esperienze esclusive'
        : 'Live unforgettable moments with our exclusive experiences',
      icon: Sparkles,
      image: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&q=80'
    }
  ];

  return (
    <div className="py-16 sm:py-20 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">{t('tours.title')}</h2>
        <p className="text-gray-600 text-center mb-8 sm:mb-12 max-w-2xl mx-auto">
          {language === 'it'
            ? 'Scegli tra le nostre diverse tipologie di tour ed esperienze per scoprire il meglio della Calabria'
            : 'Choose from our different types of tours and experiences to discover the best of Calabria'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/tours/${category.id}`}
              className="group relative overflow-hidden rounded-2xl shadow-lg aspect-[4/3] transition-transform hover:scale-[1.02]"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${category.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-full mb-4 transform transition-transform duration-500 group-hover:scale-110">
                  <category.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 px-4">
                  {category.title}
                </h3>
                <p className="text-sm sm:text-base text-white/90 max-w-[90%] line-clamp-3 px-4">
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/tours"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition"
          >
            {language === 'it' ? 'Scopri tutti i tour' : 'Discover all tours'}
          </Link>
        </div>
      </div>
    </div>
  );
}