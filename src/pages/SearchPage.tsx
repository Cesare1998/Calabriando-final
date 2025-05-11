import React, { useEffect, useState } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // Assicurati che il percorso sia corretto
import { useLanguage } from '../contexts/LanguageContext'; // Assicurati che il percorso sia corretto
import Header from '../components/Header'; // Assicurati che il percorso sia corretto
import Footer from '../components/Footer';   // Assicurati che il percorso sia corretto

import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  CircularProgress,
  useTheme,
  Paper,
  Button
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

interface SearchResult {
  id: string;
  name?: string;
  title?: string;
  description: string;
  type?: string;
  adventure_type?: string;
  section?: string;
  category?: string;
  table_name: string;
  translations?: {
    [key: string]: {
      title: string;
      description: string;
    }
  };
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();
  const theme = useTheme();

  useEffect(() => {
    async function performSearch() {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const tableConfigs = [
          {
            table: 'content',
            columns: 'id, title, description, section, translations',
            searchColumns: ['title', 'description'],
          },
          {
            table: 'adventures',
            columns: 'id, title, description, adventure_type, translations',
            searchColumns: ['title', 'description'],
          },
          {
            table: 'tours',
            columns: 'id, title, description, category, translations',
            searchColumns: ['title', 'description'],
          },
          {
            table: 'cultural_sites',
            columns: 'id, name, description, type, translations',
            searchColumns: ['name', 'description'],
          },
          {
            table: 'restaurants',
            columns: 'id, name, description, translations',
            searchColumns: ['name', 'description'],
          },
          {
            table: 'bb',
            columns: 'id, name, description, translations',
            searchColumns: ['name', 'description'],
          }
        ];

        const searchPromises = tableConfigs.map(async (config) => {
          const searchConditions = config.searchColumns
            .map(column => `${column}.ilike.%${query.trim()}%`)
            .join(',');

          const { data, error } = await supabase
            .from(config.table)
            .select(config.columns)
            .or(searchConditions)
            .limit(5);

          if (error) {
            console.error(`Error searching ${config.table}:`, error);
            return [];
          }
          
          return data?.map(item => {
            const currentLangTranslations = item.translations?.[language];
            const defaultTitle = item.title || item.name || '';
            const defaultDescription = item.description || '';

            return {
              ...item,
              title: currentLangTranslations?.title || defaultTitle,
              description: currentLangTranslations?.description || defaultDescription,
              table_name: config.table
            };
          }) || [];
        });

        const resultsArrays = await Promise.all(searchPromises);
        setResults(resultsArrays.flat().filter(item => item.title || item.description));
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query, language]);

  function getItemLink(item: SearchResult): string {
    switch (item.table_name) {
      case 'content':
        if (item.section === 'experience-food') return '/gastronomy';
        if (item.section === 'experience-culture') return '/culture';
        if (item.section?.startsWith('tour-')) {
          return `/tours/${item.section.substring(5)}`;
        }
        return '/';

      case 'adventures':
        if (item.id) {
            return `/adventures/item/${item.id}`; // Es. /adventures/item/123
        }
        if (item.adventure_type) {
            return `/adventures/${item.adventure_type}`;
        }
        return '/adventures';

      case 'tours':
        if (item.id) {
            return `/tour/${item.id}`; // CORRETTO: /tour/:id
        }
        return '/tours'; // O '/tour' se la pagina principale dei tour è singolare

      case 'cultural_sites':
        return `/culture#site-${item.id}`;

      case 'restaurants':
        return `/restaurants#restaurant-${item.id}`;

      case 'bb':
        return `/bb#bb-${item.id}`;

      default:
        console.warn(`Unknown table_name for link generation: ${item.table_name}`);
        return '#';
    }
  }

  const getTableName = (tableName: string): string => {
    const tableDisplayNames: { [key:string]: { [lang: string]: string } } = {
      content: { it: 'Contenuto', en: 'Content' },
      adventures: { it: 'Avventure', en: 'Adventures' },
      tours: { it: 'Tour', en: 'Tours' },
      cultural_sites: { it: 'Siti Culturali', en: 'Cultural Sites' },
      restaurants: { it: 'Ristoranti', en: 'Restaurants' },
      bb: { it: 'B&B', en: 'B&Bs' }
    };
    return tableDisplayNames[tableName]?.[language] || tableName;
  };

  return (
    <>
      <Header />
      <Box sx={{ pt: {xs: 10, md: 12}, pb: 6, minHeight: 'calc(100vh - 128px)', bgcolor: theme.palette.grey[100] }}>
        <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
          <Button
            component={RouterLink}
            to="/"
            variant="outlined"
            color="info"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: {xs: 2, md: 4}, textTransform: 'none', borderColor: theme.palette.info.main }}
          >
            {language === 'it' ? 'Torna alla Home' : 'Back to Home'}
          </Button>

          <Typography 
            variant="h4" 
            component="h1" 
            fontWeight="700" 
            color="text.primary" 
            sx={{ 
              mb: {xs: 3, md: 5}, 
              fontSize: { xs: '1.6rem', sm: '2rem', md: '2.2rem' } 
            }}
          >
            {query ? (language === 'it' ? `Risultati per "${query}"` : `Results for "${query}"`)
                   : (language === 'it' ? 'Pagina di Ricerca' : 'Search Page')}
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
              <CircularProgress size={50} />
            </Box>
          ) : results.length > 0 && query ? (
            <Grid container spacing={3}>
              {results.map((result) => (
                <Grid item xs={12} sm={6} md={4} key={`${result.table_name}-${result.id}`}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: theme.shadows[6],
                      }
                    }}
                    elevation={1}
                  >
                    <CardActionArea component={RouterLink} to={getItemLink(result)} sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%'}}>
                      <CardContent sx={{ flexGrow: 1, width: '100%', p: 2.5 }}>
                        <Typography variant="h6" component="h2" fontWeight="bold" gutterBottom sx={{fontSize: '1.1rem'}}>
                          {result.title}
                        </Typography>
                        <Box
                          component="div"
                          sx={{
                            typography: 'body2',
                            color: 'text.secondary',
                            mb: 1.5,
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            minHeight: '4.5em',
                            '& p': {
                              marginBlockStart: '0.5em',
                              marginBlockEnd: '0.5em',
                            },
                            '& p:first-of-type': {
                                marginBlockStart: 0,
                            },
                            '& p:last-of-type': {
                                marginBlockEnd: 0,
                            }
                          }}
                          dangerouslySetInnerHTML={{ __html: result.description || '' }}
                        />
                        <Chip
                          label={getTableName(result.table_name)}
                          size="small"
                          color="secondary"
                          sx={{ fontWeight: 500, mt: 'auto' }}
                        />
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : query ? (
            <Paper elevation={0} sx={{ textAlign: 'center', py: 6, bgcolor: 'transparent' }}>
              <Typography variant="h6" color="text.secondary">
                {language === 'it'
                  ? `Nessun risultato trovato per "${query}".`
                  : `No results found for "${query}".`}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {language === 'it' ? "Prova a modificare i termini della tua ricerca." : "Try modifying your search terms."}
              </Typography>
            </Paper>
          ) : null }
        </Container>
      </Box>
      <Footer />
    </>
  );
}