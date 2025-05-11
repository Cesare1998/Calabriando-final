import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'; // Aggiunto useRef
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import OptimizedImage from './OptimizedImage';
import { Box, Typography, Button, useTheme, useMediaQuery } from '@mui/material';
import { ExploreOutlined as ExploreIcon } from '@mui/icons-material';

interface Adventure {
  id: string;
  title: string;
  description: string;
  icon: string;
  image: string;
}

interface AdventureSlideshowProps {
  adventures: Adventure[];
}

const AUTO_SCROLL_INTERVAL = 10000; // 10 secondi
const MANUAL_PAUSE_DURATION = 5000; // 5 secondi

export default function AdventureSlideshow({ adventures }: AdventureSlideshowProps) {
  const { language } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Stato per la pausa indotta dall'utente
  const [isAutoScrollPausedByUser, setIsAutoScrollPausedByUser] = useState(false);
  // Ref per il timer che riattiva lo scorrimento automatico
  const resumeAutoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Funzione per ottenere l'indice corretto della slide (circolare)
  const getSlideIndex = useCallback((index: number) => {
    const length = adventures.length;
    if (length === 0) return 0;
    return ((index % length) + length) % length;
  }, [adventures.length]);

  // Logica per lo scorrimento automatico principale
  useEffect(() => {
    // Non fare nulla se ci sono poche slide o se l'utente ha messo in pausa
    if (adventures.length <= 1 || isAutoScrollPausedByUser) {
      return;
    }

    // Il timer parte (o riparte) per la slide corrente
    // e si resetta se currentSlide cambia o se isAutoScrollPausedByUser cambia
    const autoScrollTimer = setInterval(() => {
      setCurrentSlide((prev) => getSlideIndex(prev + 1));
    }, AUTO_SCROLL_INTERVAL);

    return () => {
      clearInterval(autoScrollTimer); // Pulisce il timer specifico di questa istanza dell'effetto
    };
  }, [adventures.length, currentSlide, isAutoScrollPausedByUser, getSlideIndex]);


  // Funzione chiamata ad ogni interazione manuale
  const handleManualInteraction = useCallback(() => {
    // Pulisce un eventuale timer di ripresa già esistente (se l'utente interagisce più volte velocemente)
    if (resumeAutoScrollTimerRef.current) {
      clearTimeout(resumeAutoScrollTimerRef.current);
    }
    // Mette in pausa lo scorrimento automatico
    setIsAutoScrollPausedByUser(true);

    // Imposta un nuovo timer per riprendere lo scorrimento automatico dopo MANUAL_PAUSE_DURATION
    resumeAutoScrollTimerRef.current = setTimeout(() => {
      setIsAutoScrollPausedByUser(false);
      // Quando isAutoScrollPausedByUser diventa false, l'useEffect dello scorrimento automatico
      // si riattiverà e farà partire un nuovo intervallo di AUTO_SCROLL_INTERVAL per la slide corrente.
    }, MANUAL_PAUSE_DURATION);
  }, [setIsAutoScrollPausedByUser]); // resumeAutoScrollTimerRef è stabile, setIsAutoScrollPausedByUser anche


  // Gestore per la pulizia del timer di resume in caso di unmount del componente
  useEffect(() => {
    return () => {
      if (resumeAutoScrollTimerRef.current) {
        clearTimeout(resumeAutoScrollTimerRef.current);
      }
    };
  }, []);


  // Funzioni per cambiare slide (ora invocano handleManualInteraction)
  const G_prevSlide = useCallback(() => {
    handleManualInteraction();
    setCurrentSlide(prev => getSlideIndex(prev - 1));
  }, [getSlideIndex, handleManualInteraction]);

  const G_nextSlide = useCallback(() => {
    handleManualInteraction();
    setCurrentSlide(prev => getSlideIndex(prev + 1));
  }, [getSlideIndex, handleManualInteraction]);

  // Gestori Touch (ora invocano handleManualInteraction)
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);

  const G_handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart || adventures.length <= 1) return;
    const touchEnd = e.touches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 60) { // Soglia di swipe
      handleManualInteraction(); // Pausa per interazione manuale
      if (diff > 0) { // Swipe verso sinistra (slide successiva)
        setCurrentSlide(prev => getSlideIndex(prev + 1));
      } else { // Swipe verso destra (slide precedente)
        setCurrentSlide(prev => getSlideIndex(prev - 1));
      }
      setTouchStart(null); // Resetta il punto di inizio del tocco
    }
  }, [touchStart, adventures.length, handleManualInteraction, getSlideIndex, setTouchStart]);

  const handleTouchEnd = () => setTouchStart(null);


  // Gestore per il click sui puntini di navigazione
  const handleDotClick = useCallback((index: number) => {
    handleManualInteraction();
    setCurrentSlide(index);
  }, [handleManualInteraction]);


  if (adventures.length === 0) {
    return (
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '70vh',
          minHeight: isMobile ? '450px' : '500px',
          bgcolor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography color="text.secondary">
          {language === 'it' ? 'Nessuna avventura da mostrare.' : 'No adventures to display.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '70vh',
        minHeight: isMobile ? '550px' : '500px',
        overflow: 'hidden'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={G_handleTouchMove} // Usa il gestore modificato
      onTouchEnd={handleTouchEnd}
    >
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {adventures.map((adventure, index) => {
          const position = (index - currentSlide + adventures.length) % adventures.length;
          const isActive = position === 0;
          const isPrev = position === adventures.length - 1;
          const isNext = position === 1;
          const isVisible = isActive || isPrev || isNext;

          if (!isVisible && adventures.length > 3) return null;

          let transformStyles = {
            zIndex: 10,
            transform: 'scale(0.6) translateX(100%)',
            opacity: 0,
            pointerEvents: 'none' as 'none'
          };

          if (isActive) {
            transformStyles = {
              zIndex: 30,
              transform: 'scale(1) translateX(0)',
              opacity: 1,
              pointerEvents: 'auto' as 'auto'
            };
          } else if (isPrev) {
            transformStyles = {
              zIndex: 20,
              transform: `scale(${isMobile ? 0.7 : 0.75}) translateX(${isMobile ? -65 : -75}%)`,
              opacity: 0.6,
              pointerEvents: 'none' as 'none'
            };
          } else if (isNext) {
            transformStyles = {
              zIndex: 20,
              transform: `scale(${isMobile ? 0.7 : 0.75}) translateX(${isMobile ? 65 : 75}%)`,
              opacity: 0.6,
              pointerEvents: 'none' as 'none'
            };
          } else {
             transformStyles = {
              zIndex: 5,
              transform: (index < currentSlide) ? 'scale(0.5) translateX(-150%)' : 'scale(0.5) translateX(150%)',
              opacity: 0,
              pointerEvents: 'none' as 'none'
            };
          }

          return (
            <Link
              key={adventure.id}
              to={`/adventure/detail/${adventure.id}`}
              style={{
                position: 'absolute',
                transition: 'transform 700ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 700ms ease-out',
                willChange: 'transform, opacity',
                WebkitTapHighlightColor: 'transparent',
                ...transformStyles
              }}
              onClick={(e) => !isActive && e.preventDefault()}
              aria-current={isActive ? "page" : undefined}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: isMobile ? '80vw' : { sm: '400px', md: '550px', lg: '700px', xl: '800px' },
                  maxWidth: isMobile ? '320px' : undefined,
                  aspectRatio: isMobile ? '9/14' : '16/10',
                  //borderRadius: theme.shape.borderRadius * (isMobile ? 3 : 4), // Bordi arrotondati
                  borderRadius:'16px', //card squadrata + bordi arrotondati
                  overflow: 'hidden',
                  boxShadow: isActive ? theme.shadows[16] : theme.shadows[8],
                  transition: 'box-shadow 0.3s ease-in-out',
                }}
              >
                <OptimizedImage
                  src={adventure.image}
                  alt={adventure.title}
                  className="w-full h-full object-cover"
                  preload={isActive || isNext || isPrev}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.1) 70%, transparent 100%)'
                  }}
                />
                {isActive && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      textAlign: 'center',
                      p: isMobile ? 2 : 3,
                      color: 'white',
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(5px)',
                        p: isMobile ? 1.5 : 2,
                        borderRadius: '50%',
                        mb: isMobile ? 1.5 : 2,
                        transition: 'transform 0.3s ease-out, background-color 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          bgcolor: 'rgba(255,255,255,0.25)',
                        }
                      }}
                    >
                      <ExploreIcon sx={{ color: 'white', fontSize: isMobile ? 24 : 28 }} />
                    </Box>
                    <Typography
                      variant={isMobile ? 'h5' : 'h4'}
                      component="h3"
                      fontWeight="bold"
                      mb={isMobile ? 0.5 : 1}
                      px={isMobile ? 1 : 2}
                      sx={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}
                    >
                      {adventure.title}
                    </Typography>
                    <Typography
                      variant={isMobile ? 'body2' : 'body1'}
                      component="div" 
                      sx={{
                        opacity: 0.9,
                        maxWidth: '95%',
                        px: isMobile ? 1 : 2,
                        textShadow: '1px 1px 2px rgba(0,0,0,0.4)',
                        fontSize: isMobile ? '0.875rem' : undefined,
                        textAlign: 'left', 
                        overflow: 'hidden', 
                        maxHeight: isMobile ? `calc(3 * 1.4em)` : `calc(3 * 1.5em)`, 
                        '& p': { 
                          marginBlockStart: isMobile ? '0.4em' : '0.5em',
                          marginBlockEnd: isMobile ? '0.4em' : '0.5em',
                          lineHeight: isMobile ? '1.4' : '1.5', 
                        },
                        '& ul, & ol': {
                          paddingInlineStart: '20px', 
                          marginBlockStart: '0.5em',
                          marginBlockEnd: '0.5em',
                        },
                        '& a': { 
                           color: theme.palette.secondary.light, 
                           textDecoration: 'underline',
                           fontWeight: 'bold',
                           '&:hover': {
                            color: theme.palette.secondary.main,
                           }
                        },
                      }}
                      dangerouslySetInnerHTML={{ __html: adventure.description }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      size={isMobile ? "small" : "medium"}
                      sx={{ mt: isMobile ? 2 : 3 }}
                      component={Link}
                      to={`/adventure/detail/${adventure.id}`}
                    >
                      {language === 'it' ? 'Scopri di più' : 'Learn more'}
                    </Button>
                  </Box>
                )}
              </Box>
            </Link>
          );
        })}
      </Box>

      {adventures.length > 1 && (
        <>
          <Box
            onClick={G_prevSlide} // Usa il gestore modificato
            sx={{
              position: 'absolute',
              left: { xs: 8, sm: 12, md: 16 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 40,
              bgcolor: 'rgba(0,0,0,0.3)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
              color: 'white',
              p: { xs: 1, sm: 1.5 },
              borderRadius: '50%',
              backdropFilter: 'blur(4px)',
              transition: 'all 0.3s',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label={language === 'it' ? "Diapositiva precedente" : "Previous slide"}
          >
            <ChevronLeft style={{ width: isMobile ? 20 : 24, height: isMobile ? 20 : 24 }} />
          </Box>
          <Box
            onClick={G_nextSlide} // Usa il gestore modificato
            sx={{
              position: 'absolute',
              right: { xs: 8, sm: 12, md: 16 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 40,
              bgcolor: 'rgba(0,0,0,0.3)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
              color: 'white',
              p: { xs: 1, sm: 1.5 },
              borderRadius: '50%',
              backdropFilter: 'blur(4px)',
              transition: 'all 0.3s',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label={language === 'it' ? "Diapositiva successiva" : "Next slide"}
          >
            <ChevronRight style={{ width: isMobile ? 20 : 24, height: isMobile ? 20 : 24 }} />
          </Box>
          <Box
            sx={{
              position: 'absolute',
              bottom: isMobile ? 12 : 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: isMobile ? 0.8 : 1,
              zIndex: 40,
              padding: '4px',
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderRadius: '12px',
              backdropFilter: 'blur(2px)',
            }}
          >
            {adventures.map((_, index) => (
              <Box
                key={index}
                onClick={() => handleDotClick(index)} // Usa il gestore modificato
                sx={{
                  width: index === currentSlide ? (isMobile ? 24 : 32) : (isMobile ? 10 : 12),
                  height: isMobile ? 10 : 12,
                  borderRadius: isMobile ? 5 : 6,
                  bgcolor: index === currentSlide ? 'primary.main' : 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  '&:hover': {
                    bgcolor: index === currentSlide ? 'primary.dark' : 'rgba(255, 255, 255, 0.8)',
                  },
                }}
                aria-label={`${language === 'it' ? 'Vai alla diapositiva' : 'Go to slide'} ${index + 1}`}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}