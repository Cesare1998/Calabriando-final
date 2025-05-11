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
  CircularProgress,
  Divider,
  useTheme,
  Paper,
  IconButton
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Euro as EuroIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Bed as BedIcon // Icona per il titolo B&B
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';

interface BB {
  id: string;
  name: string;
  description: string;
  location: string;
  price: number;
  phone: string;
  email: string;
  images: string[];
  translations: {
    it: {
      name: string;
      description: string;
    };
    en: {
      name: string;
      description: string;
    };
  };
}

export default function BBPage() {
  const { language, t } = useLanguage();
  const theme = useTheme();
  const [bbs, setBBs] = useState<BB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndexes, setCurrentImageIndexes] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadBBs();
  }, []);

  useEffect(() => {
    if (bbs.length > 0) {
      const initialIndexes: { [key: string]: number } = {};
      bbs.forEach(bb => {
        initialIndexes[bb.id] = 0;
      });
      setCurrentImageIndexes(initialIndexes);
    }
  }, [bbs]);

  const loadBBs = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: dbError } = await supabase
        .from('bb')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      setBBs(data || []);
    } catch (err) {
      console.error('Error loading B&Bs:', err);
      setError(language === 'it'
        ? 'Errore nel caricamento dei B&B. Riprova più tardi.'
        : 'Error loading B&Bs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextImage = (bbId: string) => {
    const bb = bbs.find(b => b.id === bbId);
    if (!bb || !bb.images || bb.images.length < 2) return;
    setCurrentImageIndexes(prevIndexes => ({
      ...prevIndexes,
      [bbId]: ((prevIndexes[bbId] || 0) + 1) % bb.images.length,
    }));
  };

  const handlePrevImage = (bbId: string) => {
    const bb = bbs.find(b => b.id === bbId);
    if (!bb || !bb.images || bb.images.length < 2) return;
    setCurrentImageIndexes(prevIndexes => ({
      ...prevIndexes,
      [bbId]: ((prevIndexes[bbId] || 0) - 1 + bb.images.length) % bb.images.length,
    }));
  };

  return (
    <>
      <Header />
      <ScrollToTop />
      <Box sx={{ pt: 8, pb: 6, minHeight: 'calc(100vh - 64px)', bgcolor: theme.palette.grey[100] }}>
        <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}> {/* MaxWidth md per le card */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 4, md: 6 } }}>
            <Button
              component={Link}
              to="/"
              variant="outlined"
              color="info" // COLORE BLU (INFO)
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2, textTransform: 'none', borderColor: theme.palette.info.main }} // Bordo blu
            >
              {language === 'it' ? 'Torna alla Home' : 'Back to Home'}
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h3" component="h1" fontWeight="700" color="black" sx={{ fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' } }}>
                {t('bb.title')}
              </Typography>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress color="info" size={50} /> {/* Progress BLU (INFO) */}
            </Box>
          ) : error ? (
            <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 2, bgcolor: 'error.lighter', border: `1px solid ${theme.palette.error.light}` }}>
              <Typography variant="h6" color="error.dark" gutterBottom>
                {error}
              </Typography>
              <Button variant="contained" color="error" onClick={loadBBs} sx={{ mt: 2 }}>
                {language === 'it' ? 'Riprova' : 'Try Again'}
              </Button>
            </Paper>
          ) : bbs.length === 0 ? (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, textAlign: 'center', borderRadius: 2, bgcolor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="h6" color="text.secondary">
                  {language === 'it'
                    ? 'Nessun B&B disponibile al momento.'
                    : 'No B&Bs available at the moment.'}
                </Typography>
              </Paper>
            </Grid>
          ) : (
            <Grid container spacing={4}>
              {bbs.map((bb) => {
                const currentIndex = currentImageIndexes[bb.id] || 0;
                const hasMultipleImages = bb.images && bb.images.length > 1;

                return (
                  <Grid item xs={12} key={bb.id}>
                    <Card
                      elevation={3}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column', // Sempre a colonna
                        borderRadius: '12px',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-5px)', // Rimosso scale per evitare problemi di sfocatura
                          boxShadow: theme.shadows[10],
                        },
                      }}
                    >
                      {/* Slideshow Orizzontale in cima */}
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%', // Occupa tutta la larghezza della card
                          height: { xs: 220, sm: 280, md: 300 }, // Altezza definita per lo slideshow
                          bgcolor: theme.palette.grey[300],
                          // Non più borderRadius specifici per xs/md qui, la card esterna lo gestisce
                          // ma l'overflow hidden è importante per CardMedia
                          overflow: 'hidden',
                        }}
                      >
                        {bb.images && bb.images.length > 0 ? (
                          <>
                            <CardMedia
                              component="img"
                              src={bb.images[currentIndex]}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                                transition: 'opacity 0.5s ease-in-out',
                                opacity: 1,
                              }}
                              alt={`${bb.translations[language].name} - Immagine ${currentIndex + 1}`}
                            />
                            {hasMultipleImages && (
                              <>
                                <IconButton
                                  aria-label={language === 'it' ? "Immagine precedente" : "Previous image"}
                                  onClick={(e) => { e.stopPropagation(); handlePrevImage(bb.id); }}
                                  size="medium"
                                  sx={{
                                    position: 'absolute', left: theme.spacing(1.5), top: '50%',
                                    transform: 'translateY(-50%)', bgcolor: 'rgba(0, 0, 0, 0.55)',
                                    color: 'white', '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.75)' }, zIndex: 2,
                                  }}
                                >
                                  <ArrowBackIcon />
                                </IconButton>
                                <IconButton
                                  aria-label={language === 'it' ? "Immagine successiva" : "Next image"}
                                  onClick={(e) => { e.stopPropagation(); handleNextImage(bb.id); }}
                                  size="medium"
                                  sx={{
                                    position: 'absolute', right: theme.spacing(1.5), top: '50%',
                                    transform: 'translateY(-50%)', bgcolor: 'rgba(0, 0, 0, 0.55)',
                                    color: 'white', '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.75)' }, zIndex: 2,
                                  }}
                                >
                                  <ArrowForwardIcon />
                                </IconButton>
                                <Box
                                  sx={{
                                    position: 'absolute', bottom: theme.spacing(1.5), left: '50%',
                                    transform: 'translateX(-50%)', display: 'flex', gap: '8px',
                                    padding: '6px 8px', backgroundColor: 'rgba(0, 0, 0, 0.45)',
                                    borderRadius: '12px', zIndex: 2,
                                  }}
                                >
                                  {bb.images.map((_, index) => (
                                    <Box
                                      key={index}
                                      component="span"
                                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndexes(prev => ({ ...prev, [bb.id]: index })); }}
                                      sx={{
                                        width: 10, height: 10, borderRadius: '50%',
                                        bgcolor: index === currentIndex ? theme.palette.info.main : 'rgba(255, 255, 255, 0.9)', // Pallino attivo BLU (INFO)
                                        border: index === currentIndex ? `2px solid ${theme.palette.info.contrastText}` : 'none',
                                        cursor: 'pointer', transition: 'all 0.3s ease',
                                        '&:hover': { transform: 'scale(1.2)' }
                                      }}
                                    />
                                  ))}
                                </Box>
                              </>
                            )}
                          </>
                        ) : (
                          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              {language === 'it' ? 'Nessuna immagine' : 'No image'}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Contenuto Testuale sotto lo slideshow */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, p: { xs: 2, md: 2.5 } }}>
                        <CardContent sx={{ flexGrow: 1, p: 0, mb: 1.5 }}>
                          <Typography variant="h5" component="h2" fontWeight="600" color="text.primary" gutterBottom> {/* Nome B&B colore testo primario */}
                            {bb.translations[language].name}
                          </Typography>
                          <Box
                            className="bb-description" // La classe è ancora utile se vuoi stili CSS esterni
                            sx={{
                              mb: 2,
                              color: theme.palette.text.secondary,
                              fontSize: '0.9rem',
                              '& p': { margin: 0, mb: 0.5 },
                              '& ul, & ol': { pl: 2.5, my: 0.5 },
                              '& li': { mb: 0.25 }
                            }}
                          >
                            <div dangerouslySetInnerHTML={{ __html: bb.translations[language].description }} />
                          </Box>
                          <Grid container spacing={1.5}>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <LocationIcon color="info" sx={{ mr: 1, fontSize: '1.2rem' }} /> {/* ICONA BLU (INFO) */}
                                <Typography variant="body2" color="text.primary">
                                  {bb.location}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <EuroIcon color="info" sx={{ mr: 1, fontSize: '1.2rem' }} /> {/* ICONA BLU (INFO) */}
                                <Typography variant="body1" fontWeight="500" color="text.primary">
                                  €{bb.price} <Typography component="span" variant="caption" color="text.secondary">/ {t('bb.perNight')}</Typography>
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <PhoneIcon color="info" sx={{ mr: 1, fontSize: '1.2rem' }} /> {/* ICONA BLU (INFO) */}
                                <Typography variant="body2">
                                  <a href={`tel:${bb.phone}`} style={{ color: theme.palette.info.main, textDecoration: 'none', fontWeight: 500 }}>
                                    {bb.phone}
                                  </a>
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <EmailIcon color="info" sx={{ mr: 1, fontSize: '1.2rem' }} /> {/* ICONA BLU (INFO) */}
                                <Typography variant="body2">
                                  <a href={`mailto:${bb.email}`} style={{ color: theme.palette.info.main, textDecoration: 'none', fontWeight: 500 }}>
                                    {bb.email}
                                  </a>
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                        <CardActions sx={{ pt: 1, pb: 0, px: 0, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Button
                            variant="contained"
                            color="info" // BOTTONE BLU (INFO)
                            size="large"
                            fullWidth={{ xs: true, sm: false }}
                            href={`mailto:${bb.email}?subject=${encodeURIComponent(`${t('bb.infoRequestSubject')} - ${bb.translations[language].name}`)}`}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 'bold',
                              borderRadius: '8px',
                              boxShadow: theme.shadows[3],
                              '&:hover': { boxShadow: theme.shadows[5] }
                            }}
                          >
                            {t('bb.book')}
                          </Button>
                        </CardActions>
                      </Box>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
}