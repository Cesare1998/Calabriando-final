import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
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
  Divider,
  useTheme,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  RestaurantOutlined as UtensilsIcon,
  ArrowForward as ChevronRightIcon,
  ArrowBack as ArrowBackIcon,
  MenuBook as RecipeIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';

// --- INTERFACCE ---
interface RecipeItem {
  id: string;
  name: string;
  shortDescription: string;
  recipe: string; // Contenuto HTML
  dishImage?: string;
}

interface DishCategory {
  id: string;
  image?: string;
  translations: {
    it: {
      title: string;
      description?: string;
      dishes: RecipeItem[];
    };
    en: {
      title: string;
      description?: string;
      dishes: RecipeItem[];
    };
  };
  created_at?: string;
  // Potresti aggiungere display_order qui se lo carichi dal DB con l'opzione 1
  // display_order?: number; 
}

// Ordine desiderato dei titoli delle categorie (basato sui titoli italiani)
const desiredCategoryOrder = [
  "Salumi e Formaggi",
  "Primi Piatti",
  "Secondi Piatti",
  "Dessert"
];


export default function GastronomyPage() {
  const { language } = useLanguage();
  const theme = useTheme();
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedRecipe, setSelectedRecipe] = useState<RecipeItem | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);

  const imageModalLayout = {
    widths: { xs: 100, sm: 150, md: 180 },
    padding: theme.spacing(2)
  };

  const loadGastronomyData = async () => {
    console.log("GastronomyPage: Loading data for fixed order...");
    try {
      setLoading(true);
      setError(null);
      // La query rimane ordinata per created_at o come preferisci come fallback,
      // l'ordinamento personalizzato avverrà dopo nel client.
      // Se usi l'opzione DB, qui dovresti avere .order('display_order')
      const { data, error: dbError } = await supabase
        .from('gastronomy_categories')
        .select('id, image, created_at, translations') 
        .order('created_at', { ascending: true }); // Fallback order

      if (dbError) throw dbError;

      let processedData = (data || []).map((category): DishCategory => {
        const itTrans = category.translations?.it;
        const enTrans = category.translations?.en;
        const mapDishes = (dishesArray: any[] = []): RecipeItem[] =>
          Array.isArray(dishesArray) ? dishesArray.map((d: any) => ({
            id: d.id || crypto.randomUUID(),
            name: d.name ?? (language === 'it' ? 'Piatto senza nome' : 'Unnamed Dish'),
            shortDescription: d.shortDescription ?? '',
            recipe: d.recipe ?? '',
            dishImage: d.dishImage
          })) : [];

        return {
          id: category.id,
          image: category.image,
          created_at: category.created_at,
          translations: {
            it: {
              title: itTrans?.title ?? 'Categoria (IT)',
              description: itTrans?.description ?? '',
              dishes: mapDishes(itTrans?.dishes)
            },
            en: {
              title: enTrans?.title ?? 'Category (EN)',
              description: enTrans?.description ?? '',
              dishes: mapDishes(enTrans?.dishes)
            }
          }
        };
      });

      // Applica l'ordinamento personalizzato
      processedData.sort((a, b) => {
        // Usiamo i titoli italiani per l'ordinamento come riferimento
        // Assicurati che questi titoli corrispondano esattamente a quelli in desiredCategoryOrder
        const titleA = a.translations.it.title;
        const titleB = b.translations.it.title;

        // Trova l'indice nell'array dell'ordine desiderato (case-insensitive)
        const indexA = desiredCategoryOrder.findIndex(orderTitle => titleA.toLowerCase() === orderTitle.toLowerCase());
        const indexB = desiredCategoryOrder.findIndex(orderTitle => titleB.toLowerCase() === orderTitle.toLowerCase());

        // Se entrambe le categorie sono nell'elenco dell'ordine desiderato, ordina in base a quello
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        // Se solo A è nell'elenco, A viene prima
        if (indexA !== -1) {
          return -1;
        }
        // Se solo B è nell'elenco, B viene prima
        if (indexB !== -1) {
          return 1;
        }
        // Se nessuna delle due è nell'elenco, mantieni l'ordine relativo (o ordina alfabeticamente)
        // Qui ordiniamo alfabeticamente le categorie non specificate
        return titleA.localeCompare(titleB);
      });

      setCategories(processedData);
    } catch (err: any) {
      console.error('Error loading gastronomy data:', err);
      setError(language === 'it' ? 'Errore nel caricamento dei contenuti gastronomici.' : 'Error loading gastronomic content.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGastronomyData(); 

    const handleFocus = () => {
      loadGastronomyData();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []); 

  const getTranslatedCategory = (category: DishCategory) => {
    return category.translations?.[language as keyof DishCategory['translations']] ?? category.translations.it;
  };

  const handleShowRecipe = (recipe: RecipeItem) => {
    setSelectedRecipe(recipe);
    setIsRecipeModalOpen(true);
  };

  const handleCloseRecipeModal = () => {
    setIsRecipeModalOpen(false);
  };

  return (
    <>
      <Header />
      <ScrollToTop />
      <Box sx={{ pt: {xs: 10, md: 12}, minHeight: '100vh', bgcolor: 'background.default' }}>
        <Container maxWidth="lg" sx={{ py: {xs:4, md:8} }}>
           {/* Blocco Titolo e Descrizione Pagina */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, flexDirection: {xs: 'column', sm: 'row'} }}>
                <Button component={Link} to="/" startIcon={<ArrowBackIcon />} sx={{ mr: {sm: 2}, mb: {xs:2, sm:0}, color: 'text.secondary', alignSelf: {xs: 'flex-start', sm: 'center'} }}>
                    {language === 'it' ? 'Torna alla Home' : 'Back to Home'}
                </Button>
                <Typography variant="h3" component="h1" fontWeight="bold" color="primary" textAlign={{xs: 'center', sm: 'left'}}>
                    {language === 'it' ? 'Gastronomia Calabrese' : 'Calabrian Gastronomy'}
                </Typography>
            </Box>
            <Typography variant="body1" paragraph sx={{ mb: 6, maxWidth: 'md', mx: 'auto', textAlign: 'center', color: 'text.secondary' }}>
                {language === 'it'
                ? 'Scopri i sapori autentici della cucina calabrese, una tradizione millenaria di gusti intensi e ingredienti genuini.'
                : 'Discover the authentic flavors of Calabrian cuisine, a millennial tradition of intense tastes and genuine ingredients.'}
            </Typography>

            {/* Blocco Caricamento / Errore / Categorie Vuote */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={50} /></Box>
            ) : error ? (
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 2 }}>
                <Typography variant="h6">{error}</Typography>
                <Button variant="contained" onClick={loadGastronomyData} sx={{ mt: 2 }}>{language === 'it' ? 'Riprova' : 'Try Again'}</Button>
                </Paper>
            ) : categories.length === 0 ? (
                <Paper elevation={1} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h6" color="text.secondary">
                    {language === 'it' ? 'Nessun contenuto gastronomico disponibile al momento.' : 'No gastronomic content available at the moment.'}
                </Typography>
                </Paper>
            ) : (
                // Mapping delle categorie e dei piatti
                categories.map((category) => { // 'categories' è ora l'array ordinato
                const translatedCategory = getTranslatedCategory(category);
                if (!translatedCategory.dishes || translatedCategory.dishes.length === 0) {
                    return null;
                }
                return (
                    <Box key={category.id} sx={{ mb: 8 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, borderBottom: `2px solid ${theme.palette.primary.main}`, pb: 1 }}>
                        <Typography variant="h4" component="h2" fontWeight="bold" color="primary.dark">
                        {translatedCategory.title}
                        </Typography>
                    </Box>
                    {translatedCategory.description && (
                        <Box component="div" sx={{ mb: 4, color: 'text.secondary', ...theme.typography.body1 }} dangerouslySetInnerHTML={{ __html: translatedCategory.description }}/>
                    )}
                    <Grid container spacing={4}>
                        {translatedCategory.dishes.map((dish) => (
                        <Grid item key={dish.id} xs={12} sm={6} md={4}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: theme.shadows[2],'&:hover': {transform: 'translateY(-5px)',boxShadow: theme.shadows[6],},transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',}}>
                            <CardMedia component="img" height="200" image={dish.dishImage || '/placeholder-dish.jpg'} alt={dish.name} sx={{ objectFit: 'cover' }}/>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography gutterBottom variant="h6" component="h3" fontWeight="medium">{dish.name}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: '3.6em', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                {dish.shortDescription}
                                </Typography>
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'flex-start', p:2, borderTop: `1px solid ${theme.palette.divider}` }}>
                                <Button size="small" variant="contained" color="primary" startIcon={<RecipeIcon />} onClick={() => handleShowRecipe(dish)}>
                                {language === 'it' ? 'Leggi Ricetta' : 'Read Recipe'}
                                </Button>
                            </CardActions>
                            </Card>
                        </Grid>
                        ))}
                    </Grid>
                    </Box>
                );
                })
            )}

          {/* Sezione "Scopri Ristoranti" */}
          <Paper elevation={3} sx={{ mt: 8, p: {xs: 3, md: 6}, borderRadius: 2, bgcolor: theme.palette.primary.main, color: 'white', textAlign: 'center' }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8} sx={{textAlign: {xs: 'center', md: 'left'}}}>
                <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
                  {language === 'it' ? 'Scopri i Migliori Ristoranti' : 'Discover the Best Restaurants'}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, mb: { xs: 3, md: 0 } }}>
                  {language === 'it' ? 'Esplora la nostra selezione dei migliori ristoranti della Calabria' : 'Explore our selection of the best restaurants in Calabria'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
                <Button variant="contained" color="secondary" component={Link} to="/restaurants" endIcon={<ChevronRightIcon />} size="large" sx={{ px: 3, py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}> <UtensilsIcon /> <span>{language === 'it' ? 'Vedi Ristoranti' : 'View Restaurants'}</span> </Box>
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>
      <Footer />

      {/* MODALE PER LA RICETTA */}
      {selectedRecipe && (
        <Dialog
          open={isRecipeModalOpen}
          onClose={handleCloseRecipeModal}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: {
              borderRadius: 2,
              height: '75vh', 
              display: 'flex',
              flexDirection: 'column',
              width: { xs: '95%', sm: '90%', md: '100%' } 
            }
          }}
        >
          <DialogTitle sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', py:1.5, px: {xs: 2, sm: 3}, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" component="span" fontWeight="bold" noWrap>
                {selectedRecipe.name}
              </Typography>
              <IconButton aria-label="close" onClick={handleCloseRecipeModal} sx={{ color: 'primary.contrastText' }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent 
            dividers 
            sx={{
              position: 'relative',
              pt: {xs:2, sm:3}, 
              px: {xs: 2, sm: 3},
              flexGrow: 1, 
              overflowY: 'auto', 
              overflowX: 'hidden', 
            }}
          >
            <Paper elevation={0} sx={{ p: 0, position: 'relative' }}>
              {selectedRecipe.dishImage && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: theme.spacing(0), 
                    right: theme.spacing(0),
                    width: imageModalLayout.widths,
                    aspectRatio: '1 / 1', 
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: theme.shadows[5],
                    zIndex: 1, 
                    display: { xs: 'none', sm: 'block' } 
                  }}
                >
                  <CardMedia
                    component="img"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    image={selectedRecipe.dishImage}
                    alt={selectedRecipe.name}
                  />
                </Box>
              )}
              <Box 
                component="div"
                dangerouslySetInnerHTML={{ __html: selectedRecipe.recipe }}
                sx={{
                  paddingRight: selectedRecipe.dishImage 
                    ? { 
                        xs: 0, 
                        sm: `calc(${typeof imageModalLayout.widths.sm === 'number' ? imageModalLayout.widths.sm : 0}px + ${imageModalLayout.padding * 2}px)` 
                      } 
                    : 0,
                  color: 'text.primary',
                  '& h1,& h2,& h3,& h4,& h5,& h6': { mt: 2.5, mb: 1, color: 'primary.dark', fontWeight: 'medium', lineHeight: 1.3 },
                  '& p': { mb: 1.5, lineHeight: 1.7, color: 'text.secondary', textAlign: 'justify' },
                  '& ul,& ol': { pl: 3, mb: 1.5, color: 'text.secondary', lineHeight: 1.7 },
                  '& li': { mb: 0.5 },
                  '& img': { maxWidth: '100%', height: 'auto', borderRadius: '4px', my: 2, display: 'block', mx: 'auto', boxShadow: theme.shadows[2] },
                  '& a': { color: theme.palette.secondary.main, textDecoration: 'underline', '&:hover': { color: theme.palette.secondary.dark,}},
                  '& blockquote': { borderLeft: `4px solid ${theme.palette.divider}`, pl: 2, ml: 0, my: 2, fontStyle: 'italic', color: theme.palette.text.disabled },
                  '& table': { width: '100%', borderCollapse: 'collapse', my: 2 },
                  '& th,& td': { border: `1px solid ${theme.palette.divider}`, p: 1, textAlign: 'left' },
                  '& th': { bgcolor: 'grey.100', fontWeight: 'bold' }
                }}
              />
            </Paper>
          </DialogContent>
          <DialogActions sx={{ p: 1.5, borderTop: `1px solid ${theme.palette.divider}`, flexShrink: 0 }}>
            <Button onClick={handleCloseRecipeModal} color="primary" variant="outlined">
              {language === 'it' ? 'Chiudi' : 'Close'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}