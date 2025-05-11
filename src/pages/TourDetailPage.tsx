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
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Paper,
  useTheme,
  CircularProgress,
  Chip,
  Avatar
} from '@mui/material';
import { 
  Schedule as ClockIcon, 
  People as UsersIcon, 
  Euro as EuroIcon, 
  LocationOn as MapPinIcon,
  ArrowBack as ArrowBackIcon,
  YouTube as YouTubeIcon,
  CalendarMonth as CalendarIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { it } from 'date-fns/locale';
import { format } from 'date-fns';
import { loadStripe } from '@stripe/stripe-js';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

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
  location: string;
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
}

interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  date: Date | null;
  participants: number;
}

export default function TourDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    email: '',
    phone: '',
    date: null,
    participants: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTour();
  }, [id]);

  const loadTour = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setTour(data);
    } catch (err) {
      console.error('Error loading tour:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateBookingId = () => {
    const timestamp = Date.now().toString(36);
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return `BK-${timestamp}-${randomSuffix}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tour || !formData.date || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const dateStr = format(formData.date, 'yyyy-MM-dd');
      const timeRange = tour.available_dates.find(d => d.date === dateStr)?.time;

      if (!timeRange) return;

      const bookingId = generateBookingId();
      const totalAmount = tour.price * formData.participants;

      // Create booking first
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          id: bookingId,
          tour_id: tour.id,
          user_email: formData.email,
          user_name: formData.name,
          user_phone: formData.phone,
          booking_date: dateStr,
          booking_time: timeRange,
          participants: formData.participants,
          total_price: totalAmount,
          payment_method: 'card',
          payment_status: 'pending'
        }])
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Initialize Stripe
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Failed to initialize Stripe');

      // Create Stripe checkout session
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          amount: totalAmount,
          reference: bookingId,
          type: 'tour',
          tourId: tour.id,
          successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&reference=${bookingId}&type=tour`,
          cancelUrl: `${window.location.origin}/payment-cancelled`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment initialization failed');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId
      });

      if (redirectError) throw redirectError;

    } catch (err) {
      console.error('Error processing booking:', err);
      alert(language === 'it'
        ? 'Errore durante la prenotazione. Riprova.'
        : 'Error during booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimeDisplay = () => {
    if (!tour?.available_dates || !formData.date) return '';
    
    const dateStr = format(formData.date, 'yyyy-MM-dd');
    const dateData = tour.available_dates.find(d => d.date === dateStr);
    
    if (!dateData) return '';
    return ` - ${dateData.time[0]}-${dateData.time[1]}`;
  };

  if (loading) {
    return (
      <>
        <Header />
        <Box sx={{ pt: 8, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={60} />
        </Box>
        <Footer />
      </>
    );
  }

  if (!tour) {
    return (
      <>
        <Header />
        <Box sx={{ pt: 8, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
            <Typography variant="h5" color="error" gutterBottom>
              {language === 'it' ? 'Tour non trovato' : 'Tour not found'}
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              component={Link}
              to="/tours"
              sx={{ mt: 2 }}
            >
              {language === 'it' ? 'Torna ai Tour' : 'Back to Tours'}
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
        <Container maxWidth="lg" sx={{ py: 10}}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Button 
              component={Link} 
              to={`/tours/${tour.category}`}
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2 }}
            >
              {language === 'it' ? 'Torna ai Tour' : 'Back to Tours'}
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
            <Box sx={{ position: 'relative', height: { xs: 300, md: 400 }, width: '100%' }}>
              <Box
                component="img"
                src={tour.image_url}
                alt={tour.translations[language].title}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  background: '#f5f5f5'
                }}
              />
              <Box 
                sx={{ 
                  position: 'absolute', 
                  inset: 0, 
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.4), transparent)'
                }}
              />
              <Box 
                sx={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  p: { xs: 3, md: 6 }
                }}
              >
                <Typography 
                  variant="h3" 
                  component="h1" 
                  color="white" 
                  fontWeight="bold" 
                  gutterBottom
                >
                  {tour.translations[language].title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MapPinIcon sx={{ color: 'white' }} />
                  <Typography variant="h6" color="white">
                    {tour.location}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ p: { xs: 3, md: 6 } }}>
              <Grid container spacing={6}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
                    {language === 'it' ? 'Descrizione del Tour' : 'Tour Description'}
                  </Typography>
                  <div
                    style={{ marginBottom: 24 }}
                    dangerouslySetInnerHTML={{ __html: tour.translations[language].description }}
                  />

                  {/* YouTube Video Section */}
                  {tour.youtube_video_id && tour.show_video && (
                    <Box sx={{ mb: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <YouTubeIcon color="error" />
                        <Typography variant="h5" component="h3" fontWeight="medium">
                          {language === 'it' ? 'Video del Tour' : 'Tour Video'}
                        </Typography>
                      </Box>
                      <Paper 
                        elevation={2} 
                        sx={{ 
                          borderRadius: 2, 
                          overflow: 'hidden',
                          position: 'relative',
                          paddingTop: '56.25%' // 16:9 aspect ratio
                        }}
                      >
                        <iframe
                          src={`https://www.youtube.com/embed/${tour.youtube_video_id}`}
                          title={tour.translations[language].title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: 0
                          }}
                        />
                      </Paper>
                    </Box>
                  )}

                  <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid item xs={12} sm={4}>
                      <Paper 
                        elevation={2} 
                        sx={{ 
                          p: 3, 
                          borderRadius: 3,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center'
                        }}
                      >
                        <ClockIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {language === 'it' ? 'Durata' : 'Duration'}
                        </Typography>
                        <Typography variant="h6" fontWeight="medium">
                          {tour.duration}{getTimeDisplay()}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper 
                        elevation={2} 
                        sx={{ 
                          p: 3, 
                          borderRadius: 3,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center'
                        }}
                      >
                        <UsersIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {language === 'it' ? 'Max Partecipanti' : 'Max Participants'}
                        </Typography>
                        <Typography variant="h6" fontWeight="medium">
                          {tour.max_participants}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper 
                        elevation={2} 
                        sx={{ 
                          p: 3, 
                          borderRadius: 3,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center'
                        }}
                      >
                        <EuroIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {language === 'it' ? 'Prezzo' : 'Price'}
                        </Typography>
                        <Typography variant="h6" fontWeight="medium">
                          {tour.price}€ {language === 'it' ? 'a persona' : 'per person'}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Available Dates Section */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                      {language === 'it' ? 'Date Disponibili' : 'Available Dates'}
                    </Typography>
                    <Grid container spacing={2}>
                      {tour.available_dates.map((dateInfo) => {
                        const date = new Date(dateInfo.date);
                        return (
                          <Grid item xs={12} sm={6} md={4} key={dateInfo.date}>
                            <Paper
                              elevation={1}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2
                              }}
                            >
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <CalendarIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="body1" fontWeight="medium">
                                  {date.toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                  })}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {dateInfo.time[0]} - {dateInfo.time[1]}
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                        );
                      })}
                      {tour.available_dates.length === 0 && (
                        <Grid item xs={12}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 3,
                              borderRadius: 2,
                              bgcolor: 'grey.100',
                              textAlign: 'center'
                            }}
                          >
                            <Typography color="text.secondary">
                              {language === 'it'
                                ? 'Nessuna data disponibile al momento. Contattaci per informazioni.'
                                : 'No dates available at the moment. Contact us for information.'}
                            </Typography>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      position: 'sticky',
                      top: 100
                    }}
                  >
                    <Typography variant="h5" component="h3" gutterBottom fontWeight="bold" color="primary.main">
                      {language === 'it' ? 'Prenota il Tour' : 'Book the Tour'}
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    
                    <form onSubmit={handleSubmit}>
                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={language === 'it' ? it : undefined}>
                        <DatePicker
                          label={language === 'it' ? 'Data' : 'Date'}
                          value={formData.date}
                          onChange={(newDate) => setFormData({ ...formData, date: newDate })}
                          disablePast
                          shouldDisableDate={(date) => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            return !tour.available_dates.some(d => d.date === dateStr);
                          }}
                          sx={{ width: '100%', mb: 3 }}
                        />
                      </LocalizationProvider>

                      <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel id="participants-label">
                          {language === 'it' ? 'Partecipanti' : 'Participants'}
                        </InputLabel>
                        <Select
                          labelId="participants-label"
                          value={formData.participants}
                          label={language === 'it' ? 'Partecipanti' : 'Participants'}
                          onChange={(e) => setFormData({ ...formData, participants: Number(e.target.value) })}
                        >
                          {Array.from({ length: tour.max_participants }, (_, i) => (
                            <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <TextField
                        label={language === 'it' ? 'Nome' : 'Name'}
                        fullWidth
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        sx={{ mb: 3 }}
                      />

                      <TextField
                        label={language === 'it' ? 'Email' : 'Email'}
                        type="email"
                        fullWidth
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        sx={{ mb: 3 }}
                      />

                      <TextField
                        label={language === 'it' ? 'Telefono' : 'Phone'}
                        type="tel"
                        fullWidth
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        sx={{ mb: 4 }}
                      />

                      <Divider sx={{ mb: 3 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="body1" color="text.secondary">
                          {language === 'it' ? 'Totale' : 'Total'}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                          {tour.price * formData.participants}€
                        </Typography>
                      </Box>

                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        fullWidth
                        disabled={!formData.date || isSubmitting}
                        startIcon={<PaymentIcon />}
                        sx={{ py: 1.5 }}
                      >
                        {isSubmitting ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          language === 'it' ? 'Prenota Ora' : 'Book Now'
                        )}
                      </Button>
                    </form>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Container>
      </Box>
      <Footer />
    </>
  );
}