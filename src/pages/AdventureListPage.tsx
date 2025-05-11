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
  CardMedia,
  CardActions,
  Chip,
  CircularProgress,
  Divider,
  useTheme,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  Schedule as ClockIcon,
  People as UsersIcon,
  Euro as EuroIcon,
  LocationOn as MapPinIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface Adventure {
  id: string;
  title: string;
  description: string;
  image_url: string;
  duration: string;
  price: number;
  max_participants: number;
  location: string;
  adventure_type: string;
  subcategory?: string;
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

interface Content {
  id: string;
  section: string;
  title: string;
  description: string;
  image_url: string;
  section_group: string;
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

const ADVENTURE_TYPES = {
  horse: {
    title: { it: 'Gite a cavallo', en: 'Horseback Riding' },
    description: {
      it: 'Esplora i sentieri più suggestivi della Calabria a cavallo',
      en: 'Explore the most scenic trails of Calabria on horseback'
    }
  },
  rafting: {
    title: { it: 'Rafting sull\'Aspromonte', en: 'Rafting in Aspromonte' },
    description: {
      it: 'Avventure mozzafiato tra le rapide dell\'Aspromonte',
      en: 'Breathtaking adventures through the rapids of Aspromonte'
    }
  },
  quad: {
    title: { it: 'Escursioni in Quad', en: 'Quad Excursions' },
    description: {
      it: 'Percorsi emozionanti attraverso paesaggi spettacolari',
      en: 'Exciting routes through spectacular landscapes'
    }
  },
  flight: {
    title: { it: 'In Volo', en: 'Flying Experience' },
    description: {
      it: 'Scopri la Calabria dall\'alto con i nostri tour panoramici',
      en: 'Discover Calabria from above with our panoramic tours'
    }
  },
  diving: {
    title: { it: 'Immersioni', en: 'Scuba Diving' },
    description: {
      it: 'Esplora i fondali marini della Costa degli Dei',
      en: 'Explore the seabed of the Coast of the Gods'
    }
  },
  boat: {
    title: { it: 'Tour in Barca', en: 'Boat Tours' },
    description: {
      it: 'Naviga lungo la costa calabrese scoprendo calette nascoste',
      en: 'Sail along the Calabrian coast discovering hidden coves'
    }
  },
  water: {
    title: { it: 'Giochi d\'acqua', en: 'Water Activities' },
    description: {
      it: 'Divertimento assicurato con le nostre attività acquatiche',
      en: 'Guaranteed fun with our water activities'
    }
  },
  trekking: {
    title: { it: 'Trekking e Natura', en: 'Trekking & Nature' },
    description: {
      it: 'Esplora sentieri secolari tra boschi e montagne',
      en: 'Explore ancient trails through woods and mountains'
    }
  }
};

type AdventureType = keyof typeof ADVENTURE_TYPES;

const isValidAdventureType = (type: string | undefined): type is AdventureType => {
  return type !== undefined && type in ADVENTURE_TYPES;
};

export default function AdventureListPage() {
  const { type } = useParams<{ type: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const theme = useTheme();
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [trekkingContent, setTrekkingContent] = useState<Content | null>(null);

  useEffect(() => {
    if (!isValidAdventureType(type)) {
      navigate('/');
      return;
    }
    loadAdventures();
    if (type === 'trekking') {
      loadTrekkingContent();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, navigate]);

  const loadAdventures = async () => {
    if (!isValidAdventureType(type)) return;

    try {
      const { data, error } = await supabase
        .from('adventures')
        .select('*')
        .eq('adventure_type', type)
        .order('created_at');

      if (error) throw error;

      if (data) {
        const uniqueSubcategories = [...new Set(data.filter(adv => adv.subcategory).map(adv => adv.subcategory as string))];
        setSubcategories(uniqueSubcategories);
      }

      setAdventures(data || []);
    } catch (err) {
      console.error('Error loading adventures:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTrekkingContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('section', 'experience-trekking')
        .single();

      if (error) {
        console.error('Error loading trekking content:', error);
        return;
      }

      setTrekkingContent(data);
    } catch (err) {
      console.error('Error loading trekking content:', err);
    }
  };

  const handleSubcategoryChange = (_event: React.SyntheticEvent, newValue: string | null) => {
    setSelectedSubcategory(newValue);
  };

  const filteredAdventures = selectedSubcategory
    ? adventures.filter(adv => adv.subcategory === selectedSubcategory)
    : adventures;

  if (!isValidAdventureType(type)) {
    return null;
  }

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
              to="/"
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2 }}
            >
              {language === 'it' ? 'Torna alla Home' : 'Back to Home'}
            </Button>
          </Box>

          <Box sx={{ mb: 6, textAlign: 'center' }}> {/* Centered the Box */}
            <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom sx={{ color: 'text.primary', textAlign: 'center' }}>
              {ADVENTURE_TYPES[type].title[language]}
            </Typography>
            {type === 'trekking' && trekkingContent ? (
              <Typography
                variant="h6"
                component="div"
                sx={{ maxWidth: 'md', opacity: 0.9, color: 'text.secondary', textAlign: 'center', margin: '0 auto' }} // Centered text and used margin auto for block element centering
                dangerouslySetInnerHTML={{ __html: trekkingContent.translations[language]?.description || trekkingContent.description }}
              />
            ) : (
              <Typography variant="h6" sx={{ maxWidth: 'md', opacity: 0.9, color: 'text.secondary', textAlign: 'center', margin: '0 auto' }}> {/* Centered text and used margin auto */}
                {ADVENTURE_TYPES[type].description[language]}
              </Typography>
            )}
          </Box>

          {subcategories.length > 0 && (
            <Box sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={selectedSubcategory}
                onChange={handleSubcategoryChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
              >
                <Tab label={language === 'it' ? 'Tutti' : 'All'} value={null} />
                {subcategories.map((subcat) => (
                  <Tab
                    key={subcat}
                    label={subcat}
                    value={subcat}
                  />
                ))}
              </Tabs>
            </Box>
          )}

          <Grid container spacing={4}>
            {filteredAdventures.map((adventure) => (
              <Grid item xs={12} sm={6} md={4} key={adventure.id}>
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
                  <CardMedia
                    component="img"
                    height="200"
                    image={adventure.image_url}
                    alt={adventure.translations[language].title}
                    sx={{
                      transition: 'transform 0.6s',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="h5" component="h2" fontWeight="bold" sx={{ mr: 2 }}>
                        {adventure.translations[language].title}
                      </Typography>
                      {adventure.subcategory && (
                        <Chip
                          label={adventure.subcategory}
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, height: 80, overflow: 'hidden' }} component="div">
                      <div dangerouslySetInnerHTML={{ __html: adventure.translations[language].description }} />
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ClockIcon fontSize="small" color="primary" />
                          <Typography variant="body2">
                            {adventure.duration}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EuroIcon fontSize="small" color="primary" />
                          <Typography variant="body2">
                            {adventure.price}€ {language === 'it' ? 'p.p.' : 'p.p.'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <UsersIcon fontSize="small" color="primary" />
                          <Typography variant="body2">
                            Max {adventure.max_participants}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MapPinIcon fontSize="small" color="primary" />
                          <Typography variant="body2" noWrap>
                            {adventure.location}
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
                      to={`/adventure/detail/${adventure.id}`}
                      fullWidth
                    >
                      {language === 'it' ? 'Scopri di più' : 'Learn more'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {filteredAdventures.length === 0 && (
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
                  ? 'Nessuna avventura disponibile al momento.'
                  : 'No adventures available at the moment.'}
              </Typography>
            </Paper>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
}