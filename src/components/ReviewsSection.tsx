import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Rating,
  IconButton,
  Grid,
  Paper,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  FormatQuote as FormatQuoteIcon
} from '@mui/icons-material';
import SectionTitle from './SectionTitle';

interface Review {
  id: string;
  username: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ReviewsSection() {
  const { language } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newReview, setNewReview] = useState({
    username: '',
    rating: 5,
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    if (reviews.length > 0) {
      const timer = setInterval(() => {
        nextReview();
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [reviews.length, currentIndex]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Error loading reviews:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('reviews')
        .insert([{
          username: newReview.username,
          rating: newReview.rating,
          comment: newReview.comment
        }]);

      if (error) throw error;

      setNewReview({ username: '', rating: 5, comment: '' });
      setShowForm(false);
      loadReviews();
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVisibleReviews = () => {
    if (reviews.length === 0) return [];
    if (reviews.length <= 3) return reviews;

    // For horizontal scrolling, return 3 consecutive reviews
    const startIndex = currentIndex;
    const endIndex = (currentIndex + 2) % reviews.length;
    
    if (startIndex <= endIndex) {
      return reviews.slice(startIndex, endIndex + 1);
    } else {
      return [...reviews.slice(startIndex), ...reviews.slice(0, endIndex + 1)];
    }
  };

  const nextReview = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const visibleReviews = getVisibleReviews();

  return (
    <Box sx={{ py: 10, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <SectionTitle
          title={language === 'it' ? 'Cosa Dicono i Nostri Ospiti' : 'What Our Guests Say'}
          subtitle={language === 'it' 
            ? 'Scopri le esperienze dei viaggiatori che hanno esplorato la Calabria con noi'
            : 'Discover the experiences of travelers who explored Calabria with us'}
        />

        {reviews.length > 0 && (
          <Box sx={{ position: 'relative', mb: 8, mx: 'auto', maxWidth: 'lg' }}>
            <Grid container spacing={3} justifyContent="center">
              {visibleReviews.map((review, index) => (
                <Grid 
                  item 
                  xs={12} 
                  md={4} 
                  key={review.id}
                  sx={{
                    transition: 'all 0.5s ease',
                    transform: {
                      xs: 'none',
                      md: 'scale(0.95)'
                    },
                    '&:hover': {
                      transform: 'scale(1)'
                    }
                  }}
                >
                  <Card 
                    elevation={4} 
                    sx={{ 
                      height: '100%',
                      borderRadius: 4,
                      position: 'relative',
                      overflow: 'visible',
                    }}
                  >
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                      <Box sx={{ position: 'relative', mb: 2 }}>
                        <FormatQuoteIcon 
                          sx={{ 
                            position: 'absolute', 
                            top: -20, 
                            left: -5, 
                            fontSize: 40, 
                            color: theme.palette.primary.main,
                            opacity: 0.2,
                            transform: 'rotate(180deg)'
                          }} 
                        />
                        <Rating value={review.rating} readOnly precision={0.5} sx={{ mb: 2 }} />
                      </Box>
                      
                      <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic', mb: 3 }}>
                        "{review.comment}"
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: theme.palette.primary.main,
                            width: 40,
                            height: 40,
                            mr: 1
                          }}
                        >
                          {review.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {review.username}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {reviews.length > 3 && (
              <>
                <IconButton
                  onClick={prevReview}
                  sx={{
                    position: 'absolute',
                    left: { xs: 'calc(50% - 60px)', md: -20 },
                    top: { xs: 'auto', md: '50%' },
                    bottom: { xs: -60, md: 'auto' },
                    transform: { xs: 'none', md: 'translateY(-50%)' },
                    bgcolor: 'background.paper',
                    boxShadow: theme.shadows[2],
                    '&:hover': {
                      bgcolor: 'background.paper',
                    }
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
                
                <IconButton
                  onClick={nextReview}
                  sx={{
                    position: 'absolute',
                    right: { xs: 'calc(50% - 60px)', md: -20 },
                    top: { xs: 'auto', md: '50%' },
                    bottom: { xs: -60, md: 'auto' },
                    transform: { xs: 'none', md: 'translateY(-50%)' },
                    bgcolor: 'background.paper',
                    boxShadow: theme.shadows[2],
                    '&:hover': {
                      bgcolor: 'background.paper',
                    }
                  }}
                >
                  <ArrowForwardIcon />
                </IconButton>
              </>
            )}
          </Box>
        )}

        {!showForm ? (
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => setShowForm(true)}
              sx={{ px: 4, py: 1.5, borderRadius: 8 }}
            >
              {language === 'it' ? 'Lascia una Recensione' : 'Leave a Review'}
            </Button>
          </Box>
        ) : (
          <Paper 
            elevation={3} 
            sx={{ 
              maxWidth: 'sm', 
              mx: 'auto', 
              p: 4, 
              borderRadius: 4 
            }}
          >
            <Typography variant="h5" component="h3" gutterBottom align="center" color="primary">
              {language === 'it' ? 'La tua opinione è importante' : 'Your opinion matters'}
            </Typography>
            
            <form onSubmit={handleSubmit}>
              <TextField
                label={language === 'it' ? 'Nome Utente' : 'Username'}
                fullWidth
                required
                margin="normal"
                value={newReview.username}
                onChange={(e) => setNewReview({ ...newReview, username: e.target.value })}
                inputProps={{ maxLength: 50 }}
              />
              
              <Box sx={{ my: 2 }}>
                <Typography component="legend" gutterBottom>
                  {language === 'it' ? 'Valutazione' : 'Rating'}
                </Typography>
                <Rating
                  name="rating"
                  value={newReview.rating}
                  onChange={(_, newValue) => {
                    if (newValue !== null) {
                      setNewReview({ ...newReview, rating: newValue });
                    }
                  }}
                  size="large"
                  precision={0.5}
                />
              </Box>
              
              <TextField
                label={language === 'it' ? 'Commento' : 'Comment'}
                fullWidth
                required
                multiline
                rows={3}
                margin="normal"
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                inputProps={{ maxLength: 200 }}
                helperText={`${200 - newReview.comment.length} ${language === 'it' ? 'caratteri rimanenti' : 'characters remaining'}`}
              />
              
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowForm(false)}
                  fullWidth
                >
                  {language === 'it' ? 'Annulla' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                      {language === 'it' ? 'Invio...' : 'Submitting...'}
                    </>
                  ) : (
                    language === 'it' ? 'Invia' : 'Submit'
                  )}
                </Button>
              </Box>
            </form>
          </Paper>
        )}
      </Container>
    </Box>
  );
}