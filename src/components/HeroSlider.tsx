import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Box, 
  Typography, 
  Button, 
  Container,
  useTheme,
  useMediaQuery,
  Fade
} from '@mui/material';

interface Slide {
  id: string;
  image: string;
  title: string;
  description: string;
}

interface HeroSliderProps {
  slides: Slide[];
}

export default function HeroSlider({ slides }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<string[]>([]);
  const { language } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide, slides.length]);

  const scrollToTours = () => {
    const toursSection = document.getElementById('tours');
    if (toursSection) {
      toursSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (slides.length === 0) {
    return (
      <Box 
        sx={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'grey.900'
        }}
      >
        <Typography variant="h5" color="white">No slides available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      {slides.map((slide, index) => (
        <Box
          key={slide.id}
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: index === currentSlide ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
            zIndex: index === currentSlide ? 1 : 0,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7))'
              }
            }}
          />
          
          <Container maxWidth={false} sx={{ height: '100%', position: 'relative', zIndex: 2, px: { xs: 3, sm: 5, md: 10 } }}>
            <Box 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center', 
                textAlign: 'center'
              }}
            >
              <Fade in={index === currentSlide} timeout={1000}>
                <Typography 
                  variant="h1" 
                  component="h1" 
                  color="white" 
                  sx={{ 
                    mb: 2,
                    fontWeight: 700,
                    fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                  }}
                >
                  {slide.title}
                </Typography>
              </Fade>
              
              <Fade in={index === currentSlide} timeout={1000} style={{ transitionDelay: '300ms' }}>
                <Typography 
                  variant="h5" 
                  color="white" 
                  sx={{ 
                    mb: 4, 
                    maxWidth: 'md',
                    opacity: 0.9,
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  {slide.description}
                </Typography>
              </Fade>
              
              <Fade in={index === currentSlide} timeout={1000} style={{ transitionDelay: '600ms' }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  onClick={scrollToTours}
                  sx={{ 
                    mt: 2,
                    px: 4,
                    py: 1.5,
                    borderRadius: 8,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 500
                  }}
                >
                  {language === 'it' ? 'Esplora i Tour' : 'Explore Tours'}
                </Button>
              </Fade>
            </Box>
          </Container>
        </Box>
      ))}
    </Box>
  );
}