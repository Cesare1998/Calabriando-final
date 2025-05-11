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
  Tabs,
  Tab,
  IconButton
} from '@mui/material';
import { 
  LocationOn as LocationIcon, 
  AccessTime as ClockIcon, 
  Event as CalendarIcon, 
  Museum as LandmarkIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';

interface CulturalSite {
  id: string;
  name: string;
  description: string;
  location: string;
  period: string;
  type: string;
  visiting_hours: string;
  images: string[];
  translations: {
    it: {
      name: string;
      description: string;
      type: string;
      period: string;
    };
    en: {
      name: string;
      description: string;
      type: string;
      period: string;
    };
  };
}

export default function CulturePage() {
  const { language, t } = useLanguage();
  const theme = useTheme();
  const [sites, setSites] = useState<CulturalSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cultural_sites')
        .select('*')
        .order('created_at');

      if (error) throw error;
      
      // Initialize current image index for each site
      const initialImageIndices: Record<string, number> = {};
      (data || []).forEach(site => {
        initialImageIndices[site.id] = 0;
      });
      setCurrentImageIndex(initialImageIndices);
      
      setSites(data || []);
    } catch (err) {
      console.error('Error loading cultural sites:', err);
      setError(language === 'it' 
        ? 'Errore nel caricamento dei siti culturali. Riprova più tardi.' 
        : 'Error loading cultural sites. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextImage = (siteId: string, imagesLength: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [siteId]: (prev[siteId] + 1) % imagesLength
    }));
  };

  const handlePrevImage = (siteId: string, imagesLength: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [siteId]: (prev[siteId] - 1 + imagesLength) % imagesLength
    }));
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Get unique types for tabs
  const siteTypes = [...new Set(sites.map(site => site.translations[language].type))];

  // Filter sites based on active tab
  const filteredSites = activeTab === 0 
    ? sites 
    : sites.filter(site => site.translations[language].type === siteTypes[activeTab - 1]);

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
              {t('culture.title')}
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
                onClick={() => loadSites()}
                sx={{ mt: 2 }}
              >
                {language === 'it' ? 'Riprova' : 'Try Again'}
              </Button>
            </Paper>
          ) : (
            <>
              {siteTypes.length > 1 && (
                <Box sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                  >
                    <Tab label={language === 'it' ? 'Tutti' : 'All'} />
                    {siteTypes.map((type, index) => (
                      <Tab key={index} label={type} />
                    ))}
                  </Tabs>
                </Box>
              )}
              
              <Grid container spacing={4}>
                {filteredSites.map((site) => (
                  <Grid item xs={12} key={site.id} id={site.id}>
                    <Card 
                      elevation={3} 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', md: 'row' },
                        borderRadius: 2,
                        overflow: 'hidden',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[6]
                        }
                      }}
                    >
                      <Box sx={{ position: 'relative', width: { xs: '100%', md: 300 }, height: { xs: 240, md: 'auto' } }}>
                        {site.images && site.images.length > 0 ? (
                          <>
                            <CardMedia
                              component="img"
                              sx={{ 
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              image={site.images[currentImageIndex[site.id] || 0]}
                              alt={site.translations[language].name}
                            />
                            {site.images.length > 1 && (
                              <>
                                <IconButton 
                                  size="small"
                                  onClick={() => handlePrevImage(site.id, site.images.length)}
                                  sx={{ 
                                    position: 'absolute', 
                                    left: 8, 
                                    top: '50%', 
                                    transform: 'translateY(-50%)',
                                    bgcolor: 'rgba(255,255,255,0.7)',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                                  }}
                                >
                                  <ArrowBackIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small"
                                  onClick={() => handleNextImage(site.id, site.images.length)}
                                  sx={{ 
                                    position: 'absolute', 
                                    right: 8, 
                                    top: '50%', 
                                    transform: 'translateY(-50%)',
                                    bgcolor: 'rgba(255,255,255,0.7)',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                                  }}
                                >
                                  <ArrowForwardIcon fontSize="small" />
                                </IconButton>
                                <Box 
                                  sx={{ 
                                    position: 'absolute', 
                                    bottom: 8, 
                                    left: '50%', 
                                    transform: 'translateX(-50%)', 
                                    display: 'flex', 
                                    gap: 0.5 
                                  }}
                                >
                                  {site.images.map((_, idx) => (
                                    <Box 
                                      key={idx}
                                      sx={{ 
                                        width: 8, 
                                        height: 8, 
                                        borderRadius: '50%', 
                                        bgcolor: idx === currentImageIndex[site.id] ? 'primary.main' : 'rgba(255,255,255,0.5)',
                                        transition: 'all 0.3s'
                                      }}
                                    />
                                  ))}
                                </Box>
                              </>
                            )}
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
                              {language === 'it' ? 'Nessuna immagine' : 'No image'}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="h5" component="h2" fontWeight="bold" sx={{ mr: 2 }}>
                              {site.translations[language].name}
                            </Typography>
                            <Chip 
                              label={site.translations[language].type} 
                              color="primary" 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                          <Typography variant="body1" color="text.secondary" paragraph component="div">
                            <div dangerouslySetInnerHTML={{ __html: site.translations[language].description }} />
                          </Typography>
                          <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <LandmarkIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="body2">
                                  <strong>{t('culture.type')}:</strong> {site.translations[language].type}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CalendarIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="body2">
                                  <strong>{t('culture.period')}:</strong> {site.translations[language].period}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <LocationIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="body2">
                                  <strong>{t('culture.location')}:</strong> {site.location}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <ClockIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="body2">
                                  {site.visiting_hours}
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
                            component="a"
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('culture.visit')}
                          </Button>
                        </CardActions>
                      </Box>
                    </Card>
                  </Grid>
                ))}
                
                {filteredSites.length === 0 && !loading && !error && (
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
                          ? 'Nessun sito culturale disponibile al momento.' 
                          : 'No cultural sites available at the moment.'}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
}