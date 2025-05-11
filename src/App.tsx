import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useLanguage } from './contexts/LanguageContext';
import { supabase } from './lib/supabase';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Alert,
  AlertTitle,
  CircularProgress,
  Paper,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Hiking as HikingIcon,
  LocationCity as CityIcon,
  Star as SpecialIcon,
  ArrowForward as ArrowForwardIcon,
  Restaurant as RestaurantIcon,
  Museum as MuseumIcon,
  Explore as ExploreIcon,
  // LocationOn as LocationOnIcon // Esempio se necessario per il footer
} from '@mui/icons-material';

// Import components
import Header from './components/Header';
// Footer.js - RICORDA:
// Per risolvere i problemi di decentramento nel footer su mobile (come visto in IMG_0010.PNG):
// 1. Assicurati che le colonne del footer (Contatti, Esplora, ecc.) usino Grid item con `xs={12}`
//    per impilarsi verticalmente su schermi piccoli.
// 2. Applica `textAlign: { xs: 'center', md: 'left' }` (o come preferisci) ai contenitori
//    di testo principali all'interno di ogni colonna del footer.
// 3. Per gli elenchi di link o contatti (es. icona + testo), usa `Box` con `display: 'flex'`,
//    `alignItems: 'center'`, e `justifyContent: { xs: 'center', md: 'flex-start' }`
//    per un corretto allineamento e centratura su mobile se necessario.
import Footer from './components/Footer';
import HeroSlider from './components/HeroSlider';
import SectionTitle from './components/SectionTitle';
import FeatureCard from './components/FeatureCard';
import ReviewsSection from './components/ReviewsSection';
import WhatsAppFloat from './components/WhatsAppFloat';
import AdventureSlideshow from './components/AdventureSlideshow';
import SpecialPage from './pages/SpecialPage';
import SpecialPageDetail from './pages/SpecialPageDetail';

// Import types
interface Content {
  id: string;
  section: string;
  title: string;
  description: string;
  image_url: string;
  translations: {
    it: {
      title: string;
      description: string;
    };
    en: {
      title: string;
      description: string;
    };
  };
}

interface Adventure {
  id: string;
  title: string;
  description: string;
  image_url: string;
  adventure_type: string;
  translations: {
    it: {
      title: string;
      description: string;
    };
    en: {
      title: string;
      description: string;
    };
  };
  visible_in_home: boolean;
}

// Adventure icons mapping
const ADVENTURE_ICONS: Record<string, React.ReactNode> = {
  horse: <ExploreIcon />,
  rafting: <ExploreIcon />,
  quad: <ExploreIcon />,
  flight: <ExploreIcon />,
  diving: <ExploreIcon />,
  boat: <ExploreIcon />,
  water: <ExploreIcon />,
  trekking: <HikingIcon />
};

// Retry operation helper
const RETRY_DELAYS = [1000, 2000, 5000];
const MAX_RETRIES = 3;

async function retryOperation<T>(
  operation: () => Promise<T>,
  retryCount = 0
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retryCount >= MAX_RETRIES) {
      throw error;
    }
    
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[retryCount]));
    
    return retryOperation(operation, retryCount + 1);
  }
}

function App() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [contents, setContents] = useState<Content[]>([]);
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!supabase) {
          throw new Error('Supabase client not initialized. Please check your environment variables.');
        }

        const [contentResult, adventuresResult] = await Promise.allSettled([
          retryOperation(loadContent),
          retryOperation(loadAdventures)
        ]);

        if (contentResult.status === 'rejected') {
          console.error('Error loading content:', contentResult.reason);
          throw new Error('Failed to load content data');
        }

        if (adventuresResult.status === 'rejected') {
          console.error('Error loading adventures:', adventuresResult.reason);
          throw new Error('Failed to load adventures data');
        }

      } catch (err) {
        console.error('Error initializing data:', err);
        setError(
          err instanceof Error 
            ? `Error loading data: ${err.message}. Please check your internet connection and try again.` 
            : 'An unexpected error occurred while loading data. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const loadContent = async () => {
    const { data, error: supabaseError } = await supabase
      .from('content')
      .select('*')
      .order('display_order');

    if (supabaseError) {
      console.error('Supabase error loading content:', supabaseError);
      throw new Error(`Failed to load content: ${supabaseError.message}`);
    }

    if (data) {
      setContents(data);
    }
    return data;
  };

  const loadAdventures = async () => {
    const { data, error: supabaseError } = await supabase
      .from('adventures')
      .select('*')
      .order('created_at');

    if (supabaseError) {
      console.error('Supabase error loading adventures:', supabaseError);
      throw new Error(`Failed to load adventures: ${supabaseError.message}`);
    }

    if (data) {
      setAdventures(data);
    }
    return data;
  };

  const getContent = (section: string) => {
    const content = contents.find(c => c.section === section);
    if (!content) return { title: '', description: '', image_url: '' };

    return {
      title: content.translations?.[language]?.title || content.title,
      description: content.translations?.[language]?.description || content.description,
      image_url: content.image_url
    };
  };

  const heroSlides = [
    getContent('hero-1'),
    getContent('hero-2'),
    getContent('hero-3'),
    getContent('hero-4')
  ].filter(content => content.image_url).map((content, index) => ({
    id: `hero-${index + 1}`,
    image: content.image_url,
    title: content.title,
    description: content.description
  }));

  const specialContent = getContent('special-section');
  const welcomeContent = getContent('welcome-section');
  const welcomeVideo = getContent('welcome-video');
  
  const experienceContent = [
    getContent('experience-food'),
    getContent('experience-culture')
  ];

  const tourContent = [
    getContent('tour-city'),
    getContent('tour-region'),
    getContent('tour-unique')
  ];

  const adventureItems = adventures
    .filter(adventure => adventure.visible_in_home)
    .map(adventure => ({
      id: adventure.id,
      title: adventure.translations[language].title,
      description: adventure.translations[language].description,
      icon: Object.keys(ADVENTURE_ICONS).includes(adventure.adventure_type) ? adventure.adventure_type : 'horse',
      image: adventure.image_url
    }));

  const ctaContent = getContent('cta');

  if (error) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          p: 3 
        }}
      >
        <Alert 
          severity="error" 
          variant="filled"
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => window.location.reload()}
            >
              {language === 'it' ? 'Riprova' : 'Try Again'}
            </Button>
          }
          sx={{ maxWidth: 500 }}
        >
          <AlertTitle>{language === 'it' ? 'Errore' : 'Error'}</AlertTitle>
          {error}
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <HeroSlider slides={heroSlides} />

      {/* Welcome Section */}
      <Box component="section" sx={{ py: { xs: 6, sm: 8, md: 10 } }}>
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 10 } }}> {/* Ridotto padding orizzontale per xs */}
          <Grid container spacing={{ xs: 3, md: 6 }} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box>
                <Typography 
                  variant="h3" 
                  component="h2" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 700,
                    position: 'relative',
                    display: 'inline-block',
                    pb: 1,
                    mb: 3,
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' } // Responsive font size
                  }}
                >
                  {welcomeContent.title || (language === 'it' ? 'Benvenuti in Calabriando' : 'Welcome to Calabriando')}
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '40%',
                      height: '4px',
                      bgcolor: 'primary.main',
                      borderRadius: '2px'
                    }} 
                  />
                </Typography>
                <Typography
                  variant="body1" // Usa Typography per il testo
                  component="div" // Per dangerouslySetInnerHTML
                  sx={{ fontSize: { xs: '0.9rem', sm: '1rem'} }} // Responsive font size
                  dangerouslySetInnerHTML={{ 
                    __html: welcomeContent.description || (language === 'it' 
                      ? 'Calabriando è la tua guida definitiva per scoprire le meraviglie della Calabria. Offriamo esperienze autentiche e indimenticabili, dai tour culturali alle avventure nella natura, dalle degustazioni gastronomiche alle escursioni marine. La nostra missione è farti vivere la vera essenza di questa terra straordinaria.'
                      : 'Calabriando is your ultimate guide to discovering the wonders of Calabria. We offer authentic and unforgettable experiences, from cultural tours to nature adventures, from food tastings to marine excursions. Our mission is to help you experience the true essence of this extraordinary land.')
                  }} 
                />
                <Button 
                  variant="outlined" 
                  color="primary" 
                  endIcon={<ArrowForwardIcon />}
                  sx={{ mt: 3 }} // Aumentato margine superiore
                >
                  {language === 'it' ? 'Scopri di più' : 'Learn more'}
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={6} 
                sx={{ 
                  borderRadius: 2, // Standardizzato border radius
                  overflow: 'hidden',
                  position: 'relative',
                  paddingTop: '56.25%', // 16:9 aspect ratio
                }}
              >
                <iframe
                  src={welcomeVideo.description || "https://www.youtube.com/embed/your-video-id"} // URL di fallback più sicuro
                  title="Calabriando Presentation"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 0
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Special Section (formerly Sila Section) - CORRETTA */}
      <Box 
        component="section" 
        sx={{ 
          py: { xs: 10, sm: 15, md: 20 }, // Padding verticale responsive
          position: 'relative',
          color: 'white',
          overflow: 'hidden',
          display: 'flex', // Aggiunto per centrare il container
          alignItems: 'center', // Aggiunto per centrare il container verticalmente
          justifyContent: 'center' // Aggiunto per centrare il container orizzontalmente
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            backgroundImage: `url(${specialContent.image_url || 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?auto=format&fit=crop&q=80'})`,
            backgroundSize: 'cover', // *** CORREZIONE CHIAVE: cover per adattare meglio l'immagine ***
            backgroundPosition: 'center center', // Centra l'immagine
            backgroundRepeat: 'no-repeat',
          }} 
        />
        {/* Overlay scuro opzionale per migliorare la leggibilità del testo */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)', // Esempio: overlay nero al 40% di opacità
            zIndex: 0
          }} 
        />
        <Container 
          maxWidth="md" 
          sx={{ 
            position: 'relative', 
            zIndex: 1, 
            textAlign: 'center',
            px: { xs: 2, sm: 3 } // Padding orizzontale per il container su mobile
          }}
        >
          <Typography
            // variant={isMobile ? "h4" : "h2"} // Puoi usare useMediaQuery per cambiare variante
            component="h2"
            dangerouslySetInnerHTML={{ __html: specialContent.title }}
            sx={{
              fontWeight: 700,
              mb: { xs: 2, md: 1 }, // Margine inferiore responsive (era marginBottom: 8)
              fontSize: { xs: '2rem', sm: '2.2rem', md: '2.5rem' }, // Dimensione font responsive
              color: 'white' // Assicura colore bianco se non ereditato
            }}
          />
          <Typography
            // variant={isMobile ? "body1" : "h6"}
            component="div" // Per dangerouslySetInnerHTML
            dangerouslySetInnerHTML={{ __html: specialContent.description }}
            sx={{
              mb: { xs: 3, md: 4 }, // Margine inferiore responsive (era marginBottom: 32)
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }, // Dimensione font responsive
              maxWidth: '700px', // Limita la larghezza del testo per una migliore leggibilità
              mx: 'auto', // Centra il blocco di testo se maxWidth è applicato
              color: 'white' // Assicura colore bianco
            }}
          />
          <Button 
            variant="contained" 
            color="secondary" 
            size="large"
            component="a"
            href="/special" // Assicurati che questo link sia corretto o usa navigate()
            sx={{ 
              mt: { xs: 2, md: 3 }, // Margine superiore responsive (era mt: 4)
              px: { xs: 3, md: 4 }, 
              py: { xs: 1, md: 1.5 } 
            }}
          >
            {language === 'it' ? 'Eventi Speciali' : 'Special Events'}
          </Button>
        </Container>
      </Box>

      {/* Tours Section */}
      <Box component="section" id="tours" sx={{ py: { xs: 6, sm: 8, md: 10 } }}>
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 10 } }}>
          <SectionTitle 
            title={t('tours.title')} 
            subtitle={language === 'it' 
              ? 'Scopri la Calabria attraverso i nostri tour guidati, progettati per offrirti un\'esperienza autentica e indimenticabile'
              : 'Discover Calabria through our guided tours, designed to offer you an authentic and unforgettable experience'
            }
          />
          
          <Grid container spacing={{ xs: 2, md: 4 }}>
            {[
              {
                type: 'city',
                icon: <ExploreIcon />,
                image: tourContent[0].image_url,
                title: tourContent[0].title,
                description: tourContent[0].description
              },
              {
                type: 'region',
                icon: <CityIcon />,
                image: tourContent[1].image_url,
                title: tourContent[1].title,
                description: tourContent[1].description
              },
              {
                type: 'unique',
                icon: <SpecialIcon />,
                image: tourContent[2].image_url,
                title: tourContent[2].title,
                description: tourContent[2].description
              }
            ].map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.type}> {/* Aggiunto sm={6} per 2 colonne su tablet */}
                <FeatureCard
                  title={item.title}
                  description={item.description}
                  image={item.image}
                  link={`/tours/${item.type}`}
                  icon={item.icon}
                  elevation={3}
                />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Adventures Section */}
      {adventureItems.length > 0 && (
        <Box component="section" id="adventures" sx={{ py: { xs: 6, sm: 8, md: 10 }, bgcolor: 'grey.50' }}>
          <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 10 } }}>
            <SectionTitle 
              title={language === 'it' ? 'Le Nostre Avventure' : 'Our Adventures'}
              subtitle={language === 'it'
                ? 'Scopri le emozionanti avventure che abbiamo preparato per te, immergiti nella natura e vivi esperienze indimenticabili'
                : 'Discover the exciting adventures we have prepared for you, immerse yourself in nature and live unforgettable experiences'
              }
            />
            
            <AdventureSlideshow adventures={adventureItems} />
          </Container>
        </Box>
      )}

      {/* Experiences Section */}
      <Box component="section" id="experiences" sx={{ py: { xs: 6, sm: 8, md: 10 } }}>
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 10 } }}>
          <SectionTitle 
            title={t('experiences.title')}
            subtitle={language === 'it'
              ? 'Vivi la Calabria attraverso esperienze autentiche che ti permetteranno di scoprire la vera essenza di questa terra'
              : 'Experience Calabria through authentic experiences that will allow you to discover the true essence of this land'
            }
          />
          
          <Grid container spacing={{ xs: 2, md: 4 }}>
            {[
              {
                type: 'gastronomy',
                icon: <RestaurantIcon />,
                image: experienceContent[0].image_url,
                title: experienceContent[0].title,
                description: experienceContent[0].description
              },
              {
                type: 'culture',
                icon: <MuseumIcon />,
                image: experienceContent[1].image_url,
                title: experienceContent[1].title,
                description: experienceContent[1].description
              }
            ].map((item) => (
              <Grid item xs={12} sm={6} key={item.type}>
                <FeatureCard
                  title={item.title}
                  description={item.description}
                  image={item.image}
                  link={`/${item.type}`}
                  icon={item.icon}
                  elevation={3}
                />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Reviews Section */}
      <ReviewsSection />

      {/* CTA Section */}
      <Box 
        component="section" 
        sx={{ 
          py: { xs: 10, sm: 15, md: 20 }, // Padding verticale responsive
          position: 'relative',
          color: 'white',
          overflow: 'hidden',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            backgroundImage: `url(${ctaContent.image_url || 'https://images.unsplash.com/photo-1541777750-47555f6eddaf?auto=format&fit=crop&q=80'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }} 
        />
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', // Overlay per leggibilità
            zIndex: 0
          }} 
        />
        <Container 
          maxWidth={false} // Usa false per controllare il padding con px
          sx={{ 
            position: 'relative', 
            zIndex: 1, 
            textAlign: 'center', 
            px: { xs: 2, sm: 3, md: 10 } // Padding orizzontale responsive
          }}
        >
          <Typography 
            // variant="h2" // Lascia che sx controlli la dimensione
            component="h2" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              mb: { xs: 2, md: 3},
              fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.2rem' } // Responsive font size
            }}
          >
            {ctaContent.title || t('cta.title')}
          </Typography>
          <Typography 
            // variant="h6" // Lascia che sx controlli la dimensione
            paragraph // Aggiunge margin-bottom
            sx={{ 
              mb: { xs: 3, md: 4}, // Responsive margin-bottom
              opacity: 0.9,
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' }, // Responsive font size
              maxWidth: '800px', // Limita larghezza per leggibilità
              mx: 'auto' // Centra
            }}
            component="div"
            dangerouslySetInnerHTML={{ __html: ctaContent.description || t('cta.description') }}
          />
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center', alignItems: 'center' }}>
            <Button 
              variant="contained" 
              color="secondary" 
              size="large"
              href="mailto:calabriandoita@gmail.com"
              sx={{ px: { xs: 3, md: 4 }, py: {xs: 1.2, md: 1.5}, borderRadius: 2, width: { xs: '80%', sm: 'auto'} }} // Responsive padding & width
            >
              {language === 'it' ? 'Contattaci' : 'Contact Us'}
            </Button>
            <Button 
              variant="outlined" 
              color="inherit" // Il colore sarà bianco a causa del genitore
              size="large"
              href="/tours"
              sx={{ 
                px: { xs: 3, md: 4 }, 
                py: {xs: 1.2, md: 1.5},
                borderRadius: 2, // Standardizza border radius
                borderColor: 'white',
                width: { xs: '80%', sm: 'auto'}, // Responsive width
                '&:hover': {
                  borderColor: 'white', // Mantieni il colore del bordo
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              {language === 'it' ? 'Esplora i Tour' : 'Explore Tours'}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      {/* RICORDA di applicare le correzioni responsive direttamente nel componente Footer.js */}
      {/* basate sui suggerimenti forniti all'inizio di questo file. */}
      <Footer /> 
      
      {/* WhatsApp Float Button */}
      <WhatsAppFloat 
        phoneNumber="+393451840638" // Sostituisci con il numero reale
        message={language === 'it' 
          ? "Ciao! Sono interessato alle vostre esperienze in Calabria." 
          : "Hello! I'm interested in your experiences in Calabria."
        } 
      />

      <Routes>
        <Route path="/special" element={<SpecialPage />} />
        <Route path="/special/:id" element={<SpecialPageDetail />} />
      </Routes>
    </Box>
  );
}

export default App;