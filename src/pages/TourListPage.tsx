import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  CardMedia,
  CardActions,
  Chip,
  CircularProgress,
  Divider,
  useTheme,
  Paper // Paper is still imported but not used for the header section
} from '@mui/material';
import {
  Schedule as ClockIcon,
  People as UsersIcon,
  Euro as EuroIcon,
  CalendarMonth as CalendarIcon,
  ArrowBack as ArrowBackIcon,
  YouTube as YouTubeIcon
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface Tour {
  id: string;
  title: string;
  description: string;
  image_url: string;
  duration: string;
  price: number;
  max_participants: number;
  available_dates: Array<{
    date: string;
    time: [string, string];
  }>;
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
  youtube_video_id?: string;
  show_video?: boolean;
  location?: string;
}

export default function TourListPage() {
  const { category } = useParams<{ category: string }>();
  const { language } = useLanguage(); // Removed 't' as it's not used directly here
  const theme = useTheme();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadTours();
  }, [category]); // category is the correct dependency

  const loadTours = async () => {
    setLoading(true); // Good practice to set loading true at the start of data fetching
    try {
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('category', category)
        .order('created_at');

      if (error) throw error;
      setTours(data || []);
    } catch (err) {
      console.error('Error loading tours:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryTitle = () => {
    switch (category) {
      case 'city':
        return language === 'it' ? 'Tour in Città' : 'City Tours';
      case 'region':
        return language === 'it' ? 'Tour in Calabria' : 'Calabria Tours';
      case 'unique':
        return language === 'it' ? 'Esperienze Uniche' : 'Unique Experiences';
      default:
        return '';
    }
  };

  const getCategoryDescription = () => {
    switch (category) {
      case 'city':
        return language === 'it'
          ? 'Scopri le meravigliose città della Calabria con le nostre guide esperte'
          : 'Discover the wonderful cities of Calabria with our expert guides';
      case 'region':
        return language === 'it'
          ? 'Esplora le bellezze naturali e culturali della regione'
          : 'Explore the natural and cultural beauties of the region';
      case 'unique':
        return language === 'it'
          ? 'Vivi momenti indimenticabili con le nostre esperienze esclusive'
          : 'Live unforgettable moments with our exclusive experiences';
      default:
        return '';
    }
  };

  const getTimeDisplay = (tour: Tour) => {
    if (!tour.available_dates?.length) return '';
    const firstDate = tour.available_dates[0];
    if (!firstDate.time || firstDate.time.length < 2) return ''; // Add check for time array
    return ` - ${firstDate.time[0]}-${firstDate.time[1]}`;
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

  return (
    <>
      <Header />
      <Box sx={{ pt: 12, minHeight: '100vh', bgcolor: 'background.default' }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Button
              component={Link}
              to="/tours" // Assuming this is the correct back path for tour categories
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2 }}
            >
              {language === 'it' ? 'Torna ai Tour' : 'Back to Tours'}
            </Button>
          </Box>

          {/* Removed Paper component, added Box for centering and styling */}
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom sx={{ color: 'text.primary', textAlign: 'center' }}>
              {getCategoryTitle()}
            </Typography>
            <Typography variant="h6" sx={{ maxWidth: 'md', opacity: 0.9, color: 'text.secondary', textAlign: 'center', margin: '0 auto' }}>
              {getCategoryDescription()}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {tours.map((tour) => (
              <Grid item xs={12} sm={6} md={4} key={tour.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    overflow: 'hidden',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[8]
                    }
                  }}
                  elevation={3}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={tour.image_url}
                      alt={tour.translations[language].title}
                      sx={{
                        transition: 'transform 0.6s',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    />
                    {tour.youtube_video_id && tour.show_video && (
                      <Chip
                        icon={<YouTubeIcon />}
                        label={language === 'it' ? 'Video' : 'Video'}
                        color="error"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          fontWeight: 'bold'
                        }}
                      />
                    )}
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                      {tour.translations[language].title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, height: 80, overflow: 'hidden' }} component="div">
                      <div dangerouslySetInnerHTML={{ __html: tour.translations[language].description }} />
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ClockIcon fontSize="small" color="primary" />
                          <Typography variant="body2">
                            {tour.duration}{getTimeDisplay(tour)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EuroIcon fontSize="small" color="primary" />
                          <Typography variant="body2">
                            {tour.price}€ {language === 'it' ? 'p.p.' : 'p.p.'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <UsersIcon fontSize="small" color="primary" />
                          <Typography variant="body2">
                            Max {tour.max_participants}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon fontSize="small" color="primary" />
                          <Typography variant="body2">
                            {tour.available_dates?.length || 0} {language === 'it' ? 'date' : 'dates'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                  <Divider />
                  <CardActions sx={{ p: 2, pt: 1, pb: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      component={Link}
                      to={`/tour/${tour.id}`}
                      fullWidth
                    >
                      {language === 'it' ? 'Scopri di più' : 'Learn more'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {tours.length === 0 && (
            <Paper
              elevation={1}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 2,
                mt: 4 // Added some margin top if no tours are found
              }}
            >
              <Typography variant="h6" color="text.secondary">
                {language === 'it'
                  ? 'Nessun tour disponibile al momento per questa categoria.'
                  : 'No tours available at the moment for this category.'}
              </Typography>
            </Paper>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
}