import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  Divider,
  useTheme,
  Paper,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  DirectionsWalk as HikingIcon,
  Restaurant as RestaurantIcon,
  Museum as MuseumIcon,
  Explore as ExploreIcon,
  Map as MapIcon,
  AutoAwesome as SparklesIcon
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SectionTitle from '../components/SectionTitle';
import ScrollToTop from '../components/ScrollToTop';

interface Content {
  id: string;
  section: string;
  title: string;
  description: string;
  image_url: string;
  section_group: string;
  display_order: number;
  translations: {
    it?: {
      title: string;
      description: string;
    };
    en?: {
      title: string;
      description: string;
    };
  };
}

interface Tour {
  id: string;
  title: string;
  description: string;
  image_url: string;
  duration: string;
  price: number;
  category: 'city' | 'region' | 'unique';
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
}

interface Experience {
  id: string;
  title: string;
  description: string;
  icon: React.ReactElement; // L'icona è un elemento React
  image: string;
  link: string;
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

export default function ToursPage() {
  const { language, t } = useLanguage();
  const theme = useTheme();
  const [tours, setTours] = useState<Tour[]>([]);
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch tours
        const { data: toursData, error: toursError } = await supabase
          .from('tours')
          .select('*')
          .order('created_at');

        if (toursError) throw toursError;
        setTours(toursData || []);

        // Fetch adventures
        const { data: adventuresData, error: adventuresError } = await supabase
          .from('adventures')
          .select('*')
          .order('created_at');

        if (adventuresError) throw adventuresError;
        setAdventures(adventuresData || []);

        // Fetch content for tour and experience tiles
        const { data: contentData, error: contentError } = await supabase
          .from('content')
          .select('*')
          .in('section', ['tour-city', 'tour-region', 'tour-unique', 'experience-food', 'experience-culture'])
          .order('display_order');

        if (contentError) throw contentError;
        setContents(contentData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(language === 'it'
          ? 'Errore nel caricamento dei dati. Riprova più tardi.'
          : 'Error loading data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const adventuresSubscription = supabase
      .channel('adventures_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'adventures' }, payload => {
        fetchData();
      })
      .subscribe();

    const contentSubscription = supabase
      .channel('content_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content' }, payload => {
        fetchData();
      })
      .subscribe();

    return () => {
      adventuresSubscription.unsubscribe();
      contentSubscription.unsubscribe();
    };
  }, [language]);

  const getContent = (section: string): Content | undefined => {
    return contents.find(c => c.section === section);
  };

  const getTranslatedContent = (content?: Content) => {
    if (!content) return { title: '', description: '', image_url: '' };
    return {
      title: content.translations?.[language]?.title || content.title,
      description: content.translations?.[language]?.description || content.description,
      image_url: content.image_url
    };
  };

  const categories = [
    {
      id: 'city',
      title: language === 'it' ? 'Tour in Città' : 'City Tours',
      description: language === 'it'
        ? 'Scopri le meravigliose città della Calabria con le nostre guide esperte'
        : 'Discover the wonderful cities of Calabria with our expert guides',
      icon: <MapIcon />,
      image: getTranslatedContent(getContent('tour-city')).image_url || '/images/city-tours.jpg'
    },
    {
      id: 'region',
      title: language === 'it' ? 'Tour in Calabria' : 'Calabria Tours',
      description: language === 'it'
        ? 'Esplora le bellezze naturali e culturali della regione'
        : 'Explore the natural and cultural beauties of the region',
      icon: <ExploreIcon />,
      image: getTranslatedContent(getContent('tour-region')).image_url || '/images/region-tours.jpg'
    },
    {
      id: 'unique',
      title: language === 'it' ? 'Esperienze Uniche' : 'Unique Experiences',
      description: language === 'it'
        ? 'Vivi momenti indimenticabili con le nostre esperienze esclusive'
        : 'Live unforgettable moments with our exclusive experiences',
      icon: <SparklesIcon />,
      image: getTranslatedContent(getContent('tour-unique')).image_url || '/images/unique-tours.jpg'
    }
  ];

  const adventureTypes = {
    horse: { it: 'Gite a cavallo', en: 'Horseback Riding' },
    rafting: { it: 'Rafting', en: 'Rafting' },
    quad: { it: 'Escursioni in Quad', en: 'Quad Excursions' },
    flight: { it: 'In Volo', en: 'Flying Experience' },
    diving: { it: 'Immersioni', en: 'Scuba Diving' },
    boat: { it: 'Tour in Barca', en: 'Boat Tours' },
    water: { it: 'Giochi d\'acqua', en: 'Water Activities' }
  };

  const experiences: Experience[] = [
    {
      id: 'food',
      title: getTranslatedContent(getContent('experience-food')).title || (language === 'it' ? 'Gastronomia' : 'Gastronomy'),
      description: getTranslatedContent(getContent('experience-food')).description || (language === 'it'
        ? 'Assapora i sapori autentici della tradizione calabrese'
        : 'Taste the authentic flavors of Calabrian tradition'),
      icon: <RestaurantIcon />,
      image: getTranslatedContent(getContent('experience-food')).image_url || '/images/gastronomy.jpg',
      link: '/gastronomy',
      translations: {
        it: {
          title: getTranslatedContent(getContent('experience-food')).title || (language === 'it' ? 'Gastronomia' : 'Gastronomy'),
          description: getTranslatedContent(getContent('experience-food')).description || (language === 'it'
            ? 'Assapora i sapori autentici della tradizione calabrese'
            : 'Taste the authentic flavors of Calabrian tradition')
        },
        en: {
          title: getTranslatedContent(getContent('experience-food')).title || (language === 'it' ? 'Gastronomia' : 'Gastronomy'),
          description: getTranslatedContent(getContent('experience-food')).description || (language === 'it'
            ? 'Assapora i sapori autentici della tradizione calabrese'
            : 'Taste the authentic flavors of Calabrian tradition')
        }
      }
    },
    {
      id: 'culture',
      title: getTranslatedContent(getContent('experience-culture')).title || (language === 'it' ? 'Arte e Cultura' : 'Art & Culture'),
      description: getTranslatedContent(getContent('experience-culture')).description || (language === 'it'
        ? 'Scopri la ricca storia della Magna Grecia'
        : 'Discover the rich history of Magna Graecia'),
      icon: <MuseumIcon />,
      image: getTranslatedContent(getContent('experience-culture')).image_url || '/images/culture.jpg',
      link: '/culture',
      translations: {
        it: {
          title: getTranslatedContent(getContent('experience-culture')).title || (language === 'it' ? 'Arte e Cultura' : 'Art & Culture'),
          description: getTranslatedContent(getContent('experience-culture')).description || (language === 'it'
            ? 'Scopri la ricca storia della Magna Grecia'
            : 'Discover the rich history of Magna Graecia')
        },
        en: {
          title: getTranslatedContent(getContent('experience-culture')).title || (language === 'it' ? 'Arte e Cultura' : 'Art & Culture'),
          description: getTranslatedContent(getContent('experience-culture')).description || (language === 'it'
            ? 'Scopri la ricca storia della Magna Grecia'
            : 'Discover the rich history of Magna Graecia')
        }
      }
    }
  ];

  if (loading) {
    return (
      <>
        <Header />
        <Box sx={{ pt: 12, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={60} />
        </Box>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <Box sx={{ pt: 12, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 2,
              bgcolor: 'error.light',
              color: 'error.contrastText'
            }}
          >
            <Typography variant="h6" gutterBottom>
              {error}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.reload()}
              sx={{ mt: 2 }}
            >
              {language === 'it' ? 'Riprova' : 'Try Again'}
            </Button>
          </Paper>
        </Box>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <ScrollToTop />
      <Box sx={{ pt: 8, pb: 6, minHeight: 'calc(100vh - 64px)', bgcolor: theme.palette.grey[100] }}>
        <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 4, md: 6 } }}>
            <Button
              component={Link}
              to="/"
              variant="outlined"
              color="info"
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2, textTransform: 'none', borderColor: theme.palette.info.main }}
            >
              {language === 'it' ? 'Torna alla Home' : 'Back to Home'}
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h3" component="h1" fontWeight="700" color="black" sx={{ fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' } }}>
                {t('tours_page')}
              </Typography>
            </Box>
          </Box>

          {/* Tour Categories Section */}
          <Box component="section" sx={{ mb: 10 }}>
            <SectionTitle
              title={language === 'it' ? 'Tour Organizzati' : 'Organized Tours'}
              subtitle={language === 'it'
                ? 'Scegli tra le nostre diverse tipologie di tour ed esperienze per scoprire il meglio della Calabria'
                : 'Choose from our different types of tours and experiences to discover the best of Calabria'
              }
            />
            <Grid container spacing={4}>
              {categories.map((category) => (
                <Grid item xs={12} md={4} key={category.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 4,
                      overflow: 'hidden',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: theme.shadows[10],
                        '& .MuiCardMedia-root': {
                          transform: 'scale(1.05)'
                        }
                      }
                    }}
                    elevation={3}
                  >
                    <CardMedia
                      component="img"
                      // Altezza dell'immagine per le categorie. Puoi regolarla.
                      // pt: '66.67%' rimosso, altezza gestita da `height` o `component="img"` implicita
                      height="180" // Imposta un'altezza fissa per l'immagine
                      image={category.image}
                      alt={category.title}
                      sx={{
                        objectFit: 'cover',
                        transition: 'transform 0.6s ease-in-out',
                      }}
                    />
                    <CardContent sx={{ flexGrow: 1, p: 2.5, textAlign: 'center' /* Centra il contenuto */ }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1.5 }}>
                        {React.cloneElement(category.icon, {
                          sx: {
                            fontSize: { xs: 28, md: 32 },
                            color: 'primary.main' // Colore dell'icona adattato
                          }
                        })}
                      </Box>
                      <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom color="text.primary">
                        {category.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" component="div">
                        {category.description}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ p: 2, justifyContent: 'center', mt: 'auto' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        component={Link}
                        to={`/tours/${category.id}`}
                        fullWidth
                      >
                        {language === 'it' ? 'Esplora' : 'Explore'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Adventures Section ( rimane invariata come riferimento ) */}
          <Box component="section" sx={{ mb: 10 }}>
            <SectionTitle
              title={language === 'it' ? 'Avventure' : 'Adventures'}
              subtitle={language === 'it'
                ? 'Scopri le emozionanti avventure che abbiamo preparato per te'
                : 'Discover the exciting adventures we have prepared for you'
              }
            />
            <Grid container spacing={3} justifyContent="center">
              {adventures.map((adventure) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={adventure.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 4,
                      overflow: 'hidden',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[6]
                      }
                    }}
                    elevation={2}
                  >
                    <CardMedia
                      component="img"
                      height="160"
                      image={adventure.image_url || '/images/placeholder.jpg'}
                      alt={adventure.translations[language]?.title || adventure.title}
                      sx={{
                        width: '100%',
                        // height: 160, // Già specificato in prop height
                        objectFit: 'cover',
                        background: '#e0e0e0',
                        transition: 'transform 0.5s',
                        '&:hover': { transform: 'scale(1.05)' }
                      }}
                    />
                    <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                      <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom>
                        {adventure.translations[language]?.title || adventure.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} component="div">
                        <div dangerouslySetInnerHTML={{ __html: adventure.translations[language]?.description || '' }} />
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ p: 2, justifyContent: 'center', mt: 'auto' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        component={Link}
                        to={`/adventure/${adventure.adventure_type}`}
                        fullWidth
                      >
                        {language === 'it' ? 'Scopri di più' : 'Learn more'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Suggestions Section (formerly Experiences) */}
          <Box component="section">
            <SectionTitle
              title={language === 'it' ? 'I nostri suggerimenti' : 'Our Suggestions'}
              subtitle={language === 'it'
                ? 'Scopri le esperienze che abbiamo selezionato per te'
                : 'Discover the experiences we have selected for you'
              }
            />
            <Grid container spacing={4}>
              {experiences.map((experience) => (
                <Grid item xs={12} md={6} key={experience.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 4,
                      overflow: 'hidden',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: theme.shadows[10],
                        '& .MuiCardMedia-root': {
                          transform: 'scale(1.05)'
                        }
                      }
                    }}
                    elevation={3}
                  >
                    <CardMedia
                      component="img"
                      height="200" // Altezza immagine per suggerimenti
                      image={experience.image}
                      alt={experience.translations[language]?.title || experience.title}
                      sx={{
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease-in-out',
                      }}
                    />
                    <CardContent sx={{ flexGrow: 1, p: 2.5, textAlign: 'center' /* Centra il contenuto */ }}>
                       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1.5 }}>
                        {React.cloneElement(experience.icon, {
                          sx: {
                            fontSize: { xs: 28, md: 32 },
                            color: 'primary.main' // Colore dell'icona adattato
                          }
                        })}
                      </Box>
                      <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom color="text.primary">
                        {experience.translations[language]?.title || experience.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" component="div">
                        <div dangerouslySetInnerHTML={{ __html: experience.translations[language]?.description || '' }} />
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ p: 2, justifyContent: 'center', mt: 'auto' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        component={Link}
                        to={experience.link}
                        fullWidth
                      >
                        {language === 'it' ? 'Esplora' : 'Explore'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>
      <Footer />
    </>
  );
}