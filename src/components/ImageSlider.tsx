import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import { useLanguage } from '../contexts/LanguageContext';

interface Slide {
  id: string;
  image: string;
  title: string;
  description: string;
}

interface ImageSliderProps {
  slides: Slide[];
}

export default function ImageSlider({ slides }: ImageSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<string[]>([]);
  const { language } = useLanguage();

  const nextSlide = useCallback(() => {
    if (!isTransitioning && slides.length > 1) {
      setIsTransitioning(true);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setTimeout(() => setIsTransitioning(false), 1000);
    }
  }, [slides.length, isTransitioning]);

  // Preload next image
  useEffect(() => {
    if (slides.length <= 1) return;
    
    const nextIndex = (currentSlide + 1) % slides.length;
    const nextImage = slides[nextIndex].image;
    
    if (!preloadedImages.includes(nextImage)) {
      const img = new Image();
      img.src = nextImage;
      setPreloadedImages(prev => [...prev, nextImage]);
    }
  }, [currentSlide, slides, preloadedImages]);

  useEffect(() => {
    if (slides.length <= 1) return;
    
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, slides.length]);

  const goToSlide = (index: number) => {
    if (!isTransitioning && slides.length > 1) {
      setIsTransitioning(true);
      setCurrentSlide(index);
      setTimeout(() => setIsTransitioning(false), 1000);
    }
  };

  const prevSlide = () => {
    if (!isTransitioning && slides.length > 1) {
      setIsTransitioning(true);
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      setTimeout(() => setIsTransitioning(false), 1000);
    }
  };

  if (slides.length === 0) {
    return (
      <div className="relative h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">No slides available</div>
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out will-change-transform ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute inset-0">
            <OptimizedImage
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
              preload={index === currentSlide || index === (currentSlide + 1) % slides.length}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>
          <div className="relative h-full flex items-center justify-center">
            <div className="container mx-auto px-4 md:px-8 text-center text-white max-w-5xl">
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">{slide.title}</h2>
              <p className="text-xl md:text-2xl max-w-3xl mx-auto animate-slide-up">{slide.description}</p>
              <div className="mt-10 animate-slide-up">
                <a href="#tours" className="inline-block px-8 py-4 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  {slides.length > 0 ? (
                    <>{index === 0 ? (language === 'it' ? 'Esplora i Tour' : 'Explore Tours') : (language === 'it' ? 'Scopri di più' : 'Learn More')}</>
                  ) : (
                    <>{language === 'it' ? 'Esplora i Tour' : 'Explore Tours'}</>
                  )}
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            disabled={isTransitioning}
            className="absolute left-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all hidden md:block disabled:opacity-50 z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={nextSlide}
            disabled={isTransitioning}
            className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all hidden md:block disabled:opacity-50 z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                disabled={isTransitioning}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-white scale-125 w-10'
                    : 'bg-white/50 hover:bg-white/75'
                } disabled:opacity-50`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}