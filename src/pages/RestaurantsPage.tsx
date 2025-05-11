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
  CircularProgress,
  Divider,
  useTheme,
  Paper,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { 
  LocationOn as LocationIcon, 
  Euro as EuroIcon, 
  Phone as PhoneIcon, 
  AccessTime as ClockIcon, 
  Restaurant as RestaurantIcon,
  ArrowBack as ArrowBackIcon
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

const CATEGORIES: Record<string, { it: string; en: string }> = {
  pizzerie: { it: 'Pizzerie', en: 'Pizzerias' },
  tipici: { it: 'Ristoranti Tipici', en: 'Traditional Restaurants' },
  pesce: { it: 'Ristoranti di Pesce', en: 'Seafood Restaurants' },
  fast_food: { it: 'Fast Food', en: 'Fast Food' },
  gelaterie: { it: 'Gelaterie', en: 'Ice Cream Shops' },
  lidi_sul_mare: { it: 'Lidi sul Mare', en: 'Beaches on the sea' },
  tavole_calde: { it: 'Tavole Calde', en: 'Hot Tables' },
  divertimento: { it: 'Via del divertimento', en: 'Entertainment District' }
};

export default function RestaurantsPage() {
  const { language, t } = useLanguage();
  const theme = useTheme();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({});

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at');

      if (error) throw error;
      
      // Initialize current image index for each restaurant
      const initialImageIndices: Record<string, number> = {};
      (data || []).forEach(restaurant => {
        initialImageIndices[restaurant.id] = 0;
      });
      setCurrentImageIndex(initialImageIndices);
      
      setRestaurants(data || []);
    } catch (err) {
      console.error('Error loading restaurants:', err);
      setError(language === 'it' 
        ? 'Errore nel caricamento dei ristoranti. Riprova più tardi.' 
        : 'Error loading restaurants. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (_event: React.MouseEvent<HTMLElement>, newCategory: string | null) => {
    setSelectedCategory(newCategory);
  };

  const filteredRestaurants = selectedCategory
    ? restaurants.filter(r => r.category === selectedCategory)
    : restaurants;

  return (
    <>
      <Header />
      <ScrollToTop />
      <Box sx={{ pt: 8, minHeight: '100vh', bgcolor: 'background.default' }}>
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 6 }}>
            <Button 
              component={Link} 
              to="/" 
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2 }}
            >
              {language === 'it' ? 'Torna alla Home' : 'Back to Home'}
            </Button>
            <Typography variant="h3" component="h1" fontWeight="bold">
              {t('restaurants.title')}
            </Typography>
          </Box>
          
          {/* Category Filter */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={selectedCategory}
              exclusive
              onChange={handleCategoryChange}
              aria-label="restaurant categories"
              sx={{ 
                flexWrap: 'wrap',
                '& .MuiToggleButtonGroup-grouped': {
                  m: 0.5,
                  borderRadius: '16px !important',
                  border: `1px solid ${theme.palette.divider} !important`,
                  '&.Mui-selected': {
                    borderColor: `${theme.palette.primary.main} !important`
                  }
                }
              }}
            >
              <ToggleButton value={null} aria-label="all">
                {language === 'it' ? 'Tutti' : 'All'}
              </ToggleButton>
              {Object.entries(CATEGORIES).map(([key, labels]) => (
                <ToggleButton key={key} value={key} aria-label={labels[language]}>
                  {labels[language]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
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
                onClick={() => loadRestaurants()}
                sx={{ mt: 2 }}
              >
                {language === 'it' ? 'Riprova' : 'Try Again'}
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={4}>
              {filteredRestaurants.map((restaurant) => (
                <Grid item xs={12} md={6} key={restaurant.id}>
                  <Card 
                    elevation={3} 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      overflow: 'hidden',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[6]
                      }
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={restaurant.images && restaurant.images.length > 0 
                        ? restaurant.images[0] 
                        : 'https://via.placeholder.com/400x200?text=No+Image'}
                      alt={restaurant.translations[language].name}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="h5" component="h2" fontWeight="bold" sx={{ mr: 2 }}>
                          {restaurant.translations[language].name}
                        </Typography>
                        <Chip 
                          label={CATEGORIES[restaurant.category]?.[language] || restaurant.category} 
                          color="primary" 
                          size="small" 
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" component="div">
                        <div dangerouslySetInnerHTML={{ __html: restaurant.translations[language].description }} />
                      </Typography>
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <RestaurantIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {restaurant.translations[language].cuisine}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LocationIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {restaurant.location}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <EuroIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {restaurant.price_range}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <ClockIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {restaurant.hours}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                    <Divider />
                    <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
                      <Button 
                        variant="text" 
                        color="primary"
                        component={Link}
                        to={`/restaurant/${restaurant.id}`}
                      >
                        {language === 'it' ? 'Dettagli' : 'Details'}
                      </Button>
                      <Button 
                        variant="contained" 
                        color="primary"
                        component="a"
                        href={`tel:${restaurant.phone}`}
                      >
                        {t('restaurants.reserve')}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
              
              {filteredRestaurants.length === 0 && !loading && !error && (
                <Grid item xs={12}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 4, 
                      textAlign: 'center', 
                      borderRadius: 2 
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      {language === 'it' 
                        ? 'Nessun ristorante disponibile in questa categoria.' 
                        : 'No restaurants available in this category.'}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
}