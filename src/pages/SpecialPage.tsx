import React, { useState, useEffect } from 'react';
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
  Link as MuiLink
} from '@mui/material';
import { 
  LocationOn as LocationIcon, 
  AccessTime as ClockIcon, 
  Event as EventIcon, 
  Group as GroupIcon,
  ArrowBack as ArrowBackIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface SpecialEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  max_participants: number;
  image_url: string;
  event_url: string;
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

export default function SpecialPage() {
  const { language, t } = useLanguage();
  const theme = useTheme();
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('special_events')
        .select('*')
        .order('date');

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error loading special events:', err);
      setError(language === 'it' 
        ? 'Errore nel caricamento degli eventi speciali. Riprova più tardi.' 
        : 'Error loading special events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
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
              {language === 'it' ? 'Eventi Speciali' : 'Special Events'}
            </Typography>
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
                onClick={() => loadEvents()}
                sx={{ mt: 2 }}
              >
                {language === 'it' ? 'Riprova' : 'Try Again'}
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={4}>
              {events.map((event) => (
                <Grid item xs={12} md={6} key={event.id}>
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
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={event.image_url || 'https://via.placeholder.com/400x200?text=No+Image'}
                        alt={event.translations[language].title}
                      />
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          top: 16, 
                          right: 16, 
                          zIndex: 1 
                        }}
                      >
                        <Chip 
                          label={event.date} 
                          color="primary"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>
                    </Box>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                        {event.translations[language].title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {event.translations[language].description}
                      </Typography>
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LocationIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {event.location}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <ClockIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {event.time}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <EventIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {event.date}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <GroupIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {language === 'it' 
                                ? `Max ${event.max_participants} partecipanti` 
                                : `Max ${event.max_participants} participants`}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                    <Divider />
                    <CardActions sx={{ p: 2, justifyContent: 'flex-end' }}>
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => navigate(`/special/${event.id}`)}
                      >
                        {language === 'it' ? 'Maggiori informazioni' : 'More information'}
                      </Button>
                      {event.event_url && (
                        <Button 
                          variant="outlined" 
                          color="secondary"
                          href={event.event_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          endIcon={<OpenInNewIcon />}
                        >
                          {language === 'it' ? 'Visita sito' : 'Visit website'}
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
              
              {events.length === 0 && !loading && !error && (
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
                        ? 'Nessun evento speciale disponibile al momento.' 
                        : 'No special events available at the moment.'}
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