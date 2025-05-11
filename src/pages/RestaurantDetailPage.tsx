import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  useTheme,
  Paper,
  CircularProgress,
  Chip,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Euro as EuroIcon,
  Phone as PhoneIcon,
  AccessTime as ClockIcon,
  Restaurant as RestaurantIcon,
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Info as InfoIcon,
  PhotoLibrary as GalleryIcon,
  Map as MapIcon
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  location: string;
  cuisine: string;
  price_range: string;
  phone: string;
  email?: string;
  hours: string;
  images: string[];
  category: string;
  translations: {
    it: {
      name: string;
      description: string;
      cuisine: string;
    };
    en: {
      name: string;
      description: string;
      cuisine: string;
    };
  };
}

const CATEGORIES = {
  pizzerie: { it: 'Pizzerie', en: 'Pizzerias' },
  tipici: { it: 'Ristoranti Tipici', en: 'Traditional Restaurants' },
  pesce: { it: 'Ristoranti di Pesce', en: 'Seafood Restaurants' },
  fast_food: { it: 'Fast Food', en: 'Fast Food' },
  gelaterie: { it: 'Gelaterie', en: 'Ice Cream Shops' },
  lidi_sul_mare: { it: 'Lidi sul Mare', en: 'Beaches on the sea' },
  tavole_calde: { it: 'Tavole Calde', en: 'Hot Tables' },
  divertimento: { it: 'Via del divertimento', en: 'Entertainment District' }
  // Assicurati che tutte le categorie usate siano definite qui se necessario
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`restaurant-tabpanel-${index}`}
      aria-labelledby={`restaurant-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const theme = useTheme();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadRestaurant();
  }, [id]);

  const loadRestaurant = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setRestaurant(data);
    } catch (err) {
      console.error('Error loading restaurant:', err);
    } finally {
      setLoading(false);
    }
  };

  // handleContact function (invariata)
  const handleContact = () => {
    if (!restaurant) return;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (restaurant.email && !isMobile) {
      window.location.href = `mailto:${restaurant.email}?subject=${encodeURIComponent(
        language === 'it'
          ? `Richiesta informazioni - ${restaurant.translations[language].name}`
          : `Information Request - ${restaurant.translations[language].name}`
      )}`;
    } else if (restaurant.phone) {
      window.location.href = `tel:${restaurant.phone}`;
    }
  };


  const handleNextImage = () => {
    if (!restaurant?.images?.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % restaurant.images.length);
  };

  const handlePrevImage = () => {
    if (!restaurant?.images?.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + restaurant.images.length) % restaurant.images.length);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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

  if (!restaurant) {
    return (
      <>
        <Header />
        <Box sx={{ pt: 12, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
            <Typography variant="h5" color="error" gutterBottom>
              {language === 'it' ? 'Ristorante non trovato' : 'Restaurant not found'}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/restaurants"
              sx={{ mt: 2 }}
            >
              {language === 'it' ? 'Torna ai Ristoranti' : 'Back to Restaurants'}
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
      <Box sx={{ pt: 12, minHeight: '100vh', bgcolor: 'background.default' }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Button
              component={Link}
              to="/restaurants" // O una route più generica se questa pagina è usata per più sezioni
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2 }}
            >
              {language === 'it' ? 'Torna ai Ristoranti' : 'Back to Restaurants'}
            </Button>
          </Box>

          <Paper
            elevation={4}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              mb: 6
            }}
          >
            <Box sx={{ position: 'relative', height: { xs: 300, md: 400 } }}>
              {restaurant.images && restaurant.images.length > 0 ? (
                <>
                  <Box
                    component="img"
                    src={restaurant.images[currentImageIndex]}
                    alt={restaurant.translations[language].name}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  {restaurant.images.length > 1 && (
                    <>
                      <IconButton
                        onClick={handlePrevImage}
                        sx={{
                          position: 'absolute',
                          left: 16,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          bgcolor: 'rgba(255, 255, 255, 0.8)',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.9)'
                          },
                          zIndex: 2
                        }}
                      >
                        <ArrowBackIcon />
                      </IconButton>
                      <IconButton
                        onClick={handleNextImage}
                        sx={{
                          position: 'absolute',
                          right: 16,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          bgcolor: 'rgba(255, 255, 255, 0.8)',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.9)'
                          },
                          zIndex: 2
                        }}
                      >
                        <ArrowForwardIcon />
                      </IconButton>
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 16,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          gap: 1,
                          zIndex: 2
                        }}
                      >
                        {restaurant.images.map((_, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: idx === currentImageIndex ? 'primary.main' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              transition: 'all 0.3s'
                            }}
                            onClick={() => setCurrentImageIndex(idx)}
                          />
                        ))}
                      </Box>
                    </>
                  )}
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.4), transparent)',
                      zIndex: 1
                    }}
                  />
                </>
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.200'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {language === 'it' ? 'Nessuna immagine disponibile' : 'No image available'}
                  </Typography>
                </Box>
              )}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: { xs: 3, md: 6 },
                  zIndex: 2
                }}
              >
                <Typography
                  variant="h3"
                  component="h1"
                  color="white"
                  fontWeight="bold"
                  gutterBottom
                >
                  {restaurant.translations[language].name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={CATEGORIES[restaurant.category as keyof typeof CATEGORIES]?.[language] || restaurant.category}
                    color="primary"
                    sx={{ color: 'white', bgcolor: 'primary.main' }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RestaurantIcon sx={{ color: 'white' }} />
                    <Typography variant="h6" color="white">
                      {restaurant.translations[language].cuisine}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  aria-label="restaurant tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab
                    icon={<InfoIcon />}
                    label={language === 'it' ? 'Informazioni' : 'Information'}
                    id="restaurant-tab-0"
                    aria-controls="restaurant-tabpanel-0"
                  />
                  {restaurant.images && restaurant.images.length > 0 && (
                    <Tab
                      icon={<GalleryIcon />}
                      label={language === 'it' ? 'Galleria' : 'Gallery'}
                      id="restaurant-tab-1"
                      aria-controls="restaurant-tabpanel-1"
                    />
                  )}
                  <Tab
                    icon={<MapIcon />}
                    label={language === 'it' ? 'Mappa' : 'Map'}
                    id={`restaurant-tab-${restaurant.images && restaurant.images.length > 0 ? 2 : 1}`}
                    aria-controls={`restaurant-tabpanel-${restaurant.images && restaurant.images.length > 0 ? 2 : 1}`}
                  />
                </Tabs>
              </Box>

              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
                      {language === 'it' ? 'Descrizione' : 'Description'}
                    </Typography>
                    {/* SEZIONE MODIFICATA PER RENDER HTML */}
                    <Typography
                      variant="body1"
                      paragraph
                      component="div"
                      dangerouslySetInnerHTML={{ __html: restaurant.translations[language].description }}
                      sx={{
                        '& p': { // Esempio per stilare i paragrafi dentro l'HTML
                          marginBlockStart: '1em',
                          marginBlockEnd: '1em',
                        },
                        '& ul, & ol': { // Esempio per liste
                           paddingInlineStart: '40px',
                        },
                        '& a': { // Esempio per link
                          color: theme.palette.primary.main,
                          textDecoration: 'underline'
                        }
                        // Aggiungi altri stili globali per gli elementi HTML se necessario
                      }}
                    />
                    {/* FINE SEZIONE MODIFICATA */}

                    <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 4 }}>
                      {language === 'it' ? 'Dettagli' : 'Details'}
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <LocationIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="body1">
                            <strong>{language === 'it' ? 'Posizione:' : 'Location:'}</strong> {restaurant.location}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <EuroIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="body1">
                            <strong>{language === 'it' ? 'Fascia di Prezzo:' : 'Price Range:'}</strong> {restaurant.price_range}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <PhoneIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="body1">
                            <strong>{language === 'it' ? 'Telefono:' : 'Phone:'}</strong>{' '}
                            <Button
                              variant="text"
                              color="primary"
                              href={`tel:${restaurant.phone}`}
                              sx={{ p: 0, minWidth: 'auto', textTransform: 'none', fontWeight: 'normal' }}
                            >
                              {restaurant.phone}
                            </Button>
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <ClockIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="body1">
                            <strong>{language === 'it' ? 'Orari:' : 'Hours:'}</strong> {restaurant.hours}
                          </Typography>
                        </Box>
                        {restaurant.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <EmailIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="body1">
                              <strong>{language === 'it' ? 'Email:' : 'Email:'}</strong>{' '}
                              <Button
                                variant="text"
                                color="primary"
                                href={`mailto:${restaurant.email}`}
                                sx={{ p: 0, minWidth: 'auto', textTransform: 'none', fontWeight: 'normal' }}
                              >
                                {restaurant.email}
                              </Button>
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        height: '100%'
                      }}
                    >
                      <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" color="primary.main">
                        {language === 'it' ? 'Prenota un Tavolo' : 'Book a Table'}
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      <Typography variant="body2" paragraph>
                        {language === 'it'
                          ? 'Per prenotare un tavolo, contattaci direttamente tramite telefono o email.'
                          : 'To book a table, contact us directly by phone or email.'}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          startIcon={<PhoneIcon />}
                          href={`tel:${restaurant.phone}`}
                        >
                          {language === 'it' ? 'Chiama Ora' : 'Call Now'}
                        </Button>
                        {restaurant.email && (
                          <Button
                            variant="outlined"
                            color="primary"
                            fullWidth
                            startIcon={<EmailIcon />}
                            href={`mailto:${restaurant.email}?subject=${encodeURIComponent(
                              language === 'it'
                                ? `Prenotazione - ${restaurant.translations[language].name}`
                                : `Reservation - ${restaurant.translations[language].name}`
                            )}`}
                          >
                            {language === 'it' ? 'Invia Email' : 'Send Email'}
                          </Button>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </TabPanel>

              {restaurant.images && restaurant.images.length > 0 && (
                <TabPanel value={tabValue} index={1}>
                  <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
                    {language === 'it' ? 'Galleria Fotografica' : 'Photo Gallery'}
                  </Typography>
                  <Grid container spacing={2}>
                    {restaurant.images.map((image, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Paper
                          elevation={2}
                          sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            height: 200,
                            transition: 'transform 0.3s',
                            '&:hover': {
                              transform: 'scale(1.02)',
                              cursor: 'pointer'
                            }
                          }}
                          onClick={() => setCurrentImageIndex(index)} // Potresti voler aprire un lightbox qui
                        >
                          <img
                            src={image}
                            alt={`${restaurant.translations[language].name} - ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </TabPanel>
              )}

              <TabPanel value={tabValue} index={restaurant.images && restaurant.images.length > 0 ? 2 : 1}>
                <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
                  {language === 'it' ? 'Posizione' : 'Location'}
                </Typography>
                <Paper
                  elevation={2}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    height: 400,
                    mb: 3
                  }}
                >
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    // Nota: La URL per l'iframe di Google Maps dovrebbe essere del tipo:
                    // https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=Encoded+Address+Or+Place+ID
                    // Se restaurant.location è solo un indirizzo, potresti usare:
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(restaurant.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    allowFullScreen
                    aria-hidden="false"
                    tabIndex={0}
                  />
                </Paper>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<MapIcon />}
                  component="a"
                  // URL per aprire Google Maps in una nuova scheda
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {language === 'it' ? 'Apri in Google Maps' : 'Open in Google Maps'}
                </Button>
              </TabPanel>
            </Box>
          </Paper>
        </Container>
      </Box>
      <Footer />
    </>
  );
}