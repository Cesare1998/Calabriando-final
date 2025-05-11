import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Avatar
} from '@mui/material';
import {
  Add as PlusIcon,
  Edit as EditIcon,
  Delete as TrashIcon,
  Save as SaveIcon,
  Close as XIcon,
  Logout as LogOutIcon,
  ArrowBack as ArrowBackIcon,
  Restaurant as RestaurantIcon,
  Image as CategoryImageIcon,
  AddCircleOutline as AddItemIcon,
  RemoveCircleOutline as RemoveItemIcon,
  PhotoCamera as DishImageIcon,
  // MenuBook as RecipeContentIcon, // Non usata direttamente qui, ma concettualmente presente
  // DragHandle as DragHandleIcon // Non usata
} from '@mui/icons-material';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, ContentState, convertToRaw, convertFromHTML } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

// --- INTERFACCE ---
interface AdminRecipeItem {
  id: string; // UUID
  name: string;
  shortDescription: string;
  recipe: string; // HTML
  dishImage?: string;
}

interface AdminDishCategory {
  id: string; // UUID da Supabase o stringa vuota per nuova
  image?: string; // Immagine principale della CATEGORIA
  // Questi sono per lo stato interno, non necessariamente riflettono le colonne DB se migrate a solo translations
  title?: string; // Titolo fallback, popolato da translations.it.title
  description?: string; // Descrizione fallback HTML, popolata da translations.it.description
  translations: {
    it: {
      title: string;
      description: string; // HTML per descrizione CATEGORIA
      dishes: AdminRecipeItem[];
    };
    en: {
      title: string;
      description: string; // HTML
      dishes: AdminRecipeItem[];
    };
  };
  created_at?: string;
  updated_at?: string;
}

const EMPTY_ADMIN_RECIPE_ITEM_TEMPLATE: AdminRecipeItem = {
  id: '', 
  name: '',
  shortDescription: '',
  recipe: '',
  dishImage: undefined,
};

const EMPTY_ADMIN_CATEGORY_TEMPLATE: Omit<AdminDishCategory, 'id' | 'created_at' | 'updated_at'> = {
  image: '',
  title: '', // Inizializza per coerenza stato
  description: '', // Inizializza per coerenza stato
  translations: {
    it: { title: '', description: '', dishes: [] },
    en: { title: '', description: '', dishes: [] },
  },
};

export default function AdminDashboard_gastronomy() {
  const navigate = useNavigate();
  const theme = useTheme();

  const [categories, setCategories] = useState<AdminDishCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<AdminDishCategory | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isUploadingCategoryImage, setIsUploadingCategoryImage] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [categoryEditorStateIT, setCategoryEditorStateIT] = useState(EditorState.createEmpty());
  const [categoryEditorStateEN, setCategoryEditorStateEN] = useState(EditorState.createEmpty());
  const [activeCategoryTab, setActiveCategoryTab] = useState(0);
  
  const categoryImageInputRef = useRef<HTMLInputElement>(null);

  const [openRecipeDialog, setOpenRecipeDialog] = useState(false);
  const [currentEditingRecipe, setCurrentEditingRecipe] = useState<AdminRecipeItem | null>(null);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [currentRecipeLanguage, setCurrentRecipeLanguage] = useState<'it' | 'en'>('it');
  const [recipeName, setRecipeName] = useState('');
  const [recipeShortDescription, setRecipeShortDescription] = useState('');
  const [recipeImageFile, setRecipeImageFile] = useState<File | null>(null);
  const [recipeImagePreview, setRecipeImagePreview] = useState<string | null>(null);
  const [isUploadingRecipeImage, setIsUploadingRecipeImage] = useState(false);
  const [recipeContentEditorState, setRecipeContentEditorState] = useState(EditorState.createEmpty());
  const recipeImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAuth();
    loadCategories();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate('/admin');
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const { data, error } = await supabase
        .from('gastronomy_categories')
        .select('*') // Seleziona tutto per ottenere anche title/description radice se esistono
        .order('created_at');

      if (error) throw error;

      const loadedCategories = (data || []).map((cat): AdminDishCategory => ({
        id: cat.id,
        image: cat.image,
        // Popola i campi fallback nello stato React dai campi radice del DB se esistono,
        // altrimenti dalle traduzioni IT.
        title: cat.title || cat.translations?.it?.title || '', 
        description: cat.description || cat.translations?.it?.description || '',
        translations: {
          it: {
            title: cat.translations?.it?.title || cat.title || '', // Fallback anche qui
            description: cat.translations?.it?.description || cat.description || '',
            dishes: (cat.translations?.it?.dishes || []).map((d: any): AdminRecipeItem => ({
              id: d.id || crypto.randomUUID(),
              name: d.name || '',
              shortDescription: d.shortDescription || '',
              recipe: d.recipe || '',
              dishImage: d.dishImage,
            })),
          },
          en: {
            title: cat.translations?.en?.title || '',
            description: cat.translations?.en?.description || '',
            dishes: (cat.translations?.en?.dishes || []).map((d: any): AdminRecipeItem => ({
              id: d.id || crypto.randomUUID(),
              name: d.name || '',
              shortDescription: d.shortDescription || '',
              recipe: d.recipe || '',
              dishImage: d.dishImage,
            })),
          },
        },
        created_at: cat.created_at,
        updated_at: cat.updated_at,
      }));
      setCategories(loadedCategories);
    } catch (err) {
      console.error('Error loading gastronomy categories:', err);
      alert('Errore nel caricamento delle categorie gastronomiche.');
    } finally {
      setLoadingCategories(false);
    }
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const handleAddNewCategory = () => {
    setEditingCategory({ ...EMPTY_ADMIN_CATEGORY_TEMPLATE, id: '', title: '', description: '' });
    setCategoryEditorStateIT(EditorState.createEmpty());
    setCategoryEditorStateEN(EditorState.createEmpty());
    setIsAddingCategory(true);
    setOpenCategoryDialog(true);
    setActiveCategoryTab(0);
  };

  const handleEditCategory = (category: AdminDishCategory) => {
    const deepCopiedCategory = JSON.parse(JSON.stringify(category));
    setEditingCategory(deepCopiedCategory);

    const descIT = deepCopiedCategory.translations.it.description || '';
    const contentBlocksIT = convertFromHTML(descIT);
    setCategoryEditorStateIT(EditorState.createWithContent(ContentState.createFromBlockArray(contentBlocksIT.contentBlocks, contentBlocksIT.entityMap)));

    const descEN = deepCopiedCategory.translations.en.description || '';
    const contentBlocksEN = convertFromHTML(descEN);
    setCategoryEditorStateEN(EditorState.createWithContent(ContentState.createFromBlockArray(contentBlocksEN.contentBlocks, contentBlocksEN.entityMap)));
    
    setIsAddingCategory(false);
    setOpenCategoryDialog(true);
    setActiveCategoryTab(0);
  };

  const handleDeleteCategory = async (categoryId: string, categoryData?: AdminDishCategory) => {
    if (!confirm('Sei sicuro di voler eliminare questa categoria e tutti i suoi piatti? L\'azione è irreversibile.')) return;
    try {
      const imageToDelete = categoryData?.image;
      if (imageToDelete && imageToDelete.includes(import.meta.env.VITE_SUPABASE_URL)) {
        const imagePath = imageToDelete.split('/storage/v1/object/public/')[1];
        if (imagePath) await supabase.storage.from('images').remove([imagePath]);
      }
      
      const categoryDefinition = categoryData || categories.find(c => c.id === categoryId);
      if(categoryDefinition) {
        const dishImagePaths: string[] = [];
        (['it', 'en'] as const).forEach(lang => {
            categoryDefinition.translations[lang].dishes.forEach(d => {
            if(d.dishImage && d.dishImage.includes(import.meta.env.VITE_SUPABASE_URL)) {
                const path = d.dishImage.split('/storage/v1/object/public/')[1];
                if(path && !dishImagePaths.includes(path)) dishImagePaths.push(path);
            }
          });
        });
        if(dishImagePaths.length > 0) {
            await supabase.storage.from('images').remove(dishImagePaths);
        }
      }

      const { error } = await supabase.from('gastronomy_categories').delete().eq('id', categoryId);
      if (error) throw error;
      setCategories(categories.filter(c => c.id !== categoryId));
      alert('Categoria eliminata con successo.');
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Errore durante l\'eliminazione della categoria.');
    }
  };

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editingCategory) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `gastronomy/${Date.now()}_${fileExt}`;
    setIsUploadingCategoryImage(true);
    try {
      if (editingCategory.image && editingCategory.image.includes(import.meta.env.VITE_SUPABASE_URL)) {
        const oldPath = editingCategory.image.split('/storage/v1/object/public/')[1];
        if(oldPath) await supabase.storage.from('images').remove([oldPath]);
      }
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
      if (!urlData?.publicUrl) throw new Error("URL immagine non ottenuto.");
      setEditingCategory({ ...editingCategory, image: urlData.publicUrl });
    } catch (error) {
      console.error('Error uploading category image:', error);
      alert('Errore caricamento immagine categoria.');
    } finally {
      setIsUploadingCategoryImage(false);
      if(categoryImageInputRef.current) categoryImageInputRef.current.value = '';
    }
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    if (!editingCategory.translations.it.title || !editingCategory.translations.en.title) {
      alert('Titolo IT e EN (nelle traduzioni) sono obbligatori per la categoria.');
      return;
    }
    if (!editingCategory.translations.it.title) { // Controllo specifico per il titolo principale
        alert('Il titolo principale (basato sulla traduzione Italiana) è obbligatorio.');
        return;
    }

    const descriptionIT_html = draftToHtml(convertToRaw(categoryEditorStateIT.getCurrentContent()));
    const descriptionEN_html = draftToHtml(convertToRaw(categoryEditorStateEN.getCurrentContent()));

    // Oggetto da inviare a Supabase - DEVE corrispondere alle colonne della tabella DB
    const categoryDataForSupabase = {
      title: editingCategory.translations.it.title, // Titolo a livello radice (dal titolo IT)
      description: descriptionIT_html,             // Descrizione a livello radice (dalla descrizione IT)
      image: editingCategory.image,
      translations: {
        it: {
          title: editingCategory.translations.it.title,
          description: descriptionIT_html,
          dishes: editingCategory.translations.it.dishes.map(d => ({...d})), // Clona i piatti
        },
        en: {
          title: editingCategory.translations.en.title,
          description: descriptionEN_html,
          dishes: editingCategory.translations.en.dishes.map(d => ({...d})), // Clona i piatti
        },
      },
    };
    
    try {
      let savedData: AdminDishCategory | null = null;
      if (isAddingCategory) {
        const { data, error } = await supabase.from('gastronomy_categories').insert([categoryDataForSupabase]).select().single();
        if (error) throw error;
        savedData = data as AdminDishCategory;
        if (savedData) setCategories([...categories, savedData]);
        alert('Categoria aggiunta!');
      } else {
        if (!editingCategory.id) {
            alert("ID categoria mancante per l'aggiornamento."); return;
        }
        const { data, error } = await supabase.from('gastronomy_categories').update(categoryDataForSupabase).eq('id', editingCategory.id).select().single();
        if (error) throw error;
        savedData = data as AdminDishCategory;
        if (savedData) setCategories(categories.map(c => (c.id === editingCategory.id ? savedData! : c)));
        alert('Categoria aggiornata!');
      }
      setOpenCategoryDialog(false);
      setEditingCategory(null);
    } catch (err: any) {
      console.error('Error saving category:', err);
      alert(`Errore salvataggio categoria: ${err.message}`);
    }
  };
  
  const handleCancelCategoryDialog = () => {
    setOpenCategoryDialog(false);
    setEditingCategory(null);
  };

  const handleOpenAddRecipeDialog = (lang: 'it' | 'en') => {
    setCurrentRecipeLanguage(lang);
    setCurrentEditingRecipe({ ...EMPTY_ADMIN_RECIPE_ITEM_TEMPLATE, id: crypto.randomUUID() });
    setIsAddingRecipe(true);
    setRecipeName('');
    setRecipeShortDescription('');
    setRecipeImageFile(null);
    setRecipeImagePreview(null);
    setRecipeContentEditorState(EditorState.createEmpty());
    setOpenRecipeDialog(true);
  };

  const handleOpenEditRecipeDialog = (recipe: AdminRecipeItem, lang: 'it' | 'en') => {
    setCurrentRecipeLanguage(lang);
    setCurrentEditingRecipe(JSON.parse(JSON.stringify(recipe)));
    setIsAddingRecipe(false);
    setRecipeName(recipe.name);
    setRecipeShortDescription(recipe.shortDescription);
    setRecipeImageFile(null);
    setRecipeImagePreview(recipe.dishImage || null);
    const contentBlocks = convertFromHTML(recipe.recipe || '');
    setRecipeContentEditorState(EditorState.createWithContent(ContentState.createFromBlockArray(contentBlocks.contentBlocks, contentBlocks.entityMap)));
    setOpenRecipeDialog(true);
  };
  
  const handleRecipeImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setRecipeImageFile(file);
    setRecipeImagePreview(URL.createObjectURL(file));
    if (recipeImageInputRef.current) recipeImageInputRef.current.value = '';
  };

  const uploadRecipeImageToSupabase = async (file: File, existingImageUrl?: string): Promise<string | undefined> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `gastronomy_dishes/${Date.now()}_${currentEditingRecipe?.id || 'new'}.${fileExt}`;
    setIsUploadingRecipeImage(true);
    try {
      if (existingImageUrl && existingImageUrl.includes(import.meta.env.VITE_SUPABASE_URL)) {
        const oldPath = existingImageUrl.split('/storage/v1/object/public/')[1];
        if(oldPath) await supabase.storage.from('images').remove([oldPath]);
      }
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
      return urlData?.publicUrl;
    } catch (error) {
      console.error('Error uploading recipe image:', error);
      alert('Errore caricamento immagine piatto.');
      return undefined;
    } finally {
      setIsUploadingRecipeImage(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!editingCategory || !currentEditingRecipe || !recipeName.trim()) {
      alert("Nome della ricetta è obbligatorio."); return;
    }
    let finalRecipeImageUrl = currentEditingRecipe.dishImage;
    if (recipeImageFile) {
      const newUrl = await uploadRecipeImageToSupabase(recipeImageFile, currentEditingRecipe.dishImage);
      if (newUrl) finalRecipeImageUrl = newUrl;
      else if (recipeImageFile) {
        alert("Upload immagine piatto fallito. Il piatto sarà salvato con l'immagine precedente (se esistente) o senza immagine.");
      }
    }

    const updatedRecipe: AdminRecipeItem = {
      ...currentEditingRecipe,
      name: recipeName.trim(),
      shortDescription: recipeShortDescription.trim(),
      dishImage: finalRecipeImageUrl,
      recipe: draftToHtml(convertToRaw(recipeContentEditorState.getCurrentContent())),
    };

    setEditingCategory(prevCategory => {
      if (!prevCategory) return null;
      const langDishes = [...(prevCategory.translations[currentRecipeLanguage].dishes || [])];
      const recipeIndex = langDishes.findIndex(d => d.id === updatedRecipe.id);
      if (recipeIndex > -1) langDishes[recipeIndex] = updatedRecipe;
      else langDishes.push(updatedRecipe);
      return {
        ...prevCategory,
        translations: {
          ...prevCategory.translations,
          [currentRecipeLanguage]: { ...prevCategory.translations[currentRecipeLanguage], dishes: langDishes },
        },
      };
    });
    setOpenRecipeDialog(false);
  };

  const handleRemoveRecipe = async (recipeId: string, lang: 'it' | 'en') => {
    if (!editingCategory || !confirm(`Sei sicuro di voler eliminare questo piatto dalla categoria (${lang.toUpperCase()})?`)) return;
    const recipeToRemove = editingCategory.translations[lang].dishes.find(d => d.id === recipeId);
    try {
        if (recipeToRemove?.dishImage && recipeToRemove.dishImage.includes(import.meta.env.VITE_SUPABASE_URL)) {
            const imagePath = recipeToRemove.dishImage.split('/storage/v1/object/public/')[1];
            if (imagePath) await supabase.storage.from('images').remove([imagePath]);
        }
    } catch (imgErr) {
        console.warn("Errore eliminazione immagine piatto associata:", imgErr);
        alert("Attenzione: il piatto è stato rimosso, ma potrebbe esserci stato un problema nell'eliminare la sua immagine dallo storage.");
    }
    setEditingCategory(prev => {
      if (!prev) return null;
      const updatedDishes = (prev.translations[lang].dishes || []).filter(d => d.id !== recipeId);
      return { ...prev, translations: { ...prev.translations, [lang]: { ...prev.translations[lang], dishes: updatedDishes }}};
    });
  };
  
  const handleCancelRecipeDialog = () => {
    setOpenRecipeDialog(false);
    setCurrentEditingRecipe(null);
    setRecipeImageFile(null);
    setRecipeImagePreview(null);
  };

  if (loadingCategories) {
    return <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress size={60} /></Box>;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      <Box sx={{ bgcolor: 'primary.main', color: 'white', boxShadow: 3, position: 'sticky', top: 0, zIndex: 1100 }}>
        <Container maxWidth="xl" sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button variant="contained" color="secondary" startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/dashboard')}>Dashboard</Button>
              <Typography variant="h5" component="h1" fontWeight="bold">Gestione Gastronomia</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" color="secondary" startIcon={<PlusIcon />} onClick={handleAddNewCategory}>Aggiungi Categoria</Button>
              <Button variant="outlined" color="inherit" startIcon={<LogOutIcon />} onClick={handleSignOut} sx={{ borderColor: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>Esci</Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid item xs={12} md={6} lg={4} key={category.id}>
              <Card elevation={2} sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2 }}>
                <CardMedia component="img" height="200" image={category.image || '/placeholder-category.jpg'} alt={`Immagine ${category.title || category.translations.it.title}`} sx={{ objectFit: 'cover' }} />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" fontWeight="bold" gutterBottom> {category.title || category.translations.it.title} </Typography>
                  <Box component="div" variant="body2" color="text.secondary" sx={{ mb: 1, maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis', '& p': {margin:0} }} dangerouslySetInnerHTML={{ __html: (category.description || category.translations.it.description || "").substring(0,100) + "..." }} />
                  <Chip label={`IT: ${category.translations.it.dishes?.length || 0} piatti`} size="small" sx={{mr:0.5, mb:0.5}}/>
                  <Chip label={`EN: ${category.translations.en.dishes?.length || 0} piatti`} size="small" sx={{mb:0.5}}/>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'space-between', p:2 }}>
                  <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleEditCategory(category)}>Modifica</Button>
                  <Button size="small" color="error" variant="outlined" startIcon={<TrashIcon />} onClick={() => handleDeleteCategory(category.id, category)}>Elimina</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        {categories.length === 0 && !loadingCategories && (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2, mt: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>Nessuna categoria gastronomica.</Typography>
            <Button variant="contained" startIcon={<PlusIcon />} onClick={handleAddNewCategory} sx={{ mt: 2 }}>Aggiungi la prima categoria</Button>
          </Paper>
        )}
      </Container>

      <Dialog open={openCategoryDialog} onClose={handleCancelCategoryDialog} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{isAddingCategory ? 'Nuova Categoria Gastronomica' : 'Modifica Categoria'}</Typography>
          <IconButton edge="end" color="inherit" onClick={handleCancelCategoryDialog}><XIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {editingCategory && (
            <>
              <Tabs value={activeCategoryTab} onChange={(_e, val) => setActiveCategoryTab(val)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
                <Tab label="Info Categoria" />
                <Tab label="Contenuto IT" icon={<Chip size="small" label={`${editingCategory.translations.it.dishes?.length || 0} piatti`} sx={{ml:1}}/>} iconPosition="end" />
                <Tab label="Contenuto EN" icon={<Chip size="small" label={`${editingCategory.translations.en.dishes?.length || 0} piatti`} sx={{ml:1}}/>} iconPosition="end"/>
              </Tabs>
              {activeCategoryTab === 0 && ( /* Info Categoria */ <Grid container spacing={3} sx={{pt:2}}> <Grid item xs={12} md={4}> <Typography variant="subtitle1" fontWeight="medium" gutterBottom>Immagine Categoria</Typography> <Button variant="outlined" component="label" fullWidth startIcon={<CategoryImageIcon />} disabled={isUploadingCategoryImage}> {isUploadingCategoryImage ? 'Caricamento...' : (editingCategory.image ? 'Cambia Immagine' : 'Carica Immagine')} <input type="file" accept="image/*" hidden onChange={handleCategoryImageUpload} ref={categoryImageInputRef} /> </Button> {isUploadingCategoryImage && <CircularProgress size={24} sx={{ml:1, mt:1}}/>} {editingCategory.image && <Box component="img" src={editingCategory.image} alt="Preview Categoria" sx={{ width: '100%', maxHeight: 200, objectFit: 'contain', mt: 2, borderRadius: 1, border: `1px solid ${theme.palette.divider}`}}/>} </Grid> <Grid item xs={12} md={8}> <Typography sx={{fontSize: '0.9rem', color: 'text.secondary', mt: {md: 4.5}}}> L'immagine della categoria (es. "Primi Piatti", "Dessert") verrà mostrata nella lista principale delle categorie. </Typography> </Grid> </Grid> )}
              {activeCategoryTab === 1 && ( /* Contenuto IT */ <Box sx={{pt:2}}> <TextField label="Titolo Categoria (IT)" fullWidth required value={editingCategory.translations.it.title} onChange={(e) => setEditingCategory({...editingCategory, translations: {...editingCategory.translations, it: {...editingCategory.translations.it, title: e.target.value}}})} margin="normal" /> <Typography variant="subtitle1" gutterBottom sx={{mt:1, mb:1}}>Descrizione Categoria (IT)</Typography> <Paper sx={{ p: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, minHeight: 150, mb:3 }}> <Editor editorState={categoryEditorStateIT} onEditorStateChange={setCategoryEditorStateIT} wrapperClassName="wrapper-class" editorClassName="editor-class" toolbarClassName="toolbar-class" /> </Paper> <Paper sx={{ p: 2, borderRadius: 2, mt: 2, bgcolor: 'grey.50' }}> <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb:1}}> <Typography variant="h6" fontWeight="medium">Piatti (IT)</Typography> <Button variant="contained" size="small" color="secondary" startIcon={<AddItemIcon />} onClick={() => handleOpenAddRecipeDialog('it')}>Aggiungi Piatto</Button> </Box> <List dense> {editingCategory.translations.it.dishes?.map((dish) => ( <ListItem key={dish.id} divider sx={{bgcolor: 'background.paper', mb:0.5, borderRadius:1}}> <ListItemIcon sx={{mr:1, minWidth:'auto'}}> {dish.dishImage ? <Avatar src={dish.dishImage} variant="rounded"><RestaurantIcon/></Avatar> : <Avatar variant="rounded"><RestaurantIcon/></Avatar>} </ListItemIcon> <ListItemText primary={dish.name} secondary={(dish.shortDescription||'').substring(0,70) + "..."} /> <ListItemSecondaryAction> <IconButton edge="end" size="small" onClick={() => handleOpenEditRecipeDialog(dish, 'it')}><EditIcon fontSize="small"/></IconButton> <IconButton edge="end" size="small" onClick={() => handleRemoveRecipe(dish.id, 'it')} color="error"><TrashIcon fontSize="small"/></IconButton> </ListItemSecondaryAction> </ListItem> ))} </List> {editingCategory.translations.it.dishes?.length === 0 && <Typography sx={{textAlign:'center', py:2, color:'text.secondary'}}>Nessun piatto aggiunto per Italiano.</Typography>} </Paper> </Box> )}
              {activeCategoryTab === 2 && ( /* Contenuto EN */ <Box sx={{pt:2}}> <TextField label="Category Title (EN)" fullWidth required value={editingCategory.translations.en.title} onChange={(e) => setEditingCategory({...editingCategory, translations: {...editingCategory.translations, en: {...editingCategory.translations.en, title: e.target.value}}})} margin="normal" /> <Typography variant="subtitle1" gutterBottom sx={{mt:1, mb:1}}>Category Description (EN)</Typography> <Paper sx={{ p: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, minHeight: 150, mb:3 }}> <Editor editorState={categoryEditorStateEN} onEditorStateChange={setCategoryEditorStateEN} wrapperClassName="wrapper-class" editorClassName="editor-class" toolbarClassName="toolbar-class" /> </Paper> <Paper sx={{ p: 2, borderRadius: 2, mt: 2, bgcolor: 'grey.50' }}> <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb:1}}> <Typography variant="h6" fontWeight="medium">Dishes (EN)</Typography> <Button variant="contained" size="small" color="secondary" startIcon={<AddItemIcon />} onClick={() => handleOpenAddRecipeDialog('en')}>Add Dish</Button> </Box> <List dense> {editingCategory.translations.en.dishes?.map((dish) => ( <ListItem key={dish.id} divider sx={{bgcolor: 'background.paper', mb:0.5, borderRadius:1}}> <ListItemIcon sx={{mr:1, minWidth:'auto'}}> {dish.dishImage ? <Avatar src={dish.dishImage} variant="rounded"><RestaurantIcon/></Avatar> : <Avatar variant="rounded"><RestaurantIcon/></Avatar>} </ListItemIcon> <ListItemText primary={dish.name} secondary={(dish.shortDescription||'').substring(0,70) + "..."} /> <ListItemSecondaryAction> <IconButton edge="end" size="small" onClick={() => handleOpenEditRecipeDialog(dish, 'en')}><EditIcon fontSize="small"/></IconButton> <IconButton edge="end" size="small" onClick={() => handleRemoveRecipe(dish.id, 'en')} color="error"><TrashIcon fontSize="small"/></IconButton> </ListItemSecondaryAction> </ListItem> ))} </List> {editingCategory.translations.en.dishes?.length === 0 && <Typography sx={{textAlign:'center', py:2, color:'text.secondary'}}>No dishes added for English.</Typography>} </Paper> </Box> )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between', borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button onClick={handleCancelCategoryDialog} color="inherit" startIcon={<XIcon />}>Annulla</Button>
          <Button onClick={handleSaveCategory} variant="contained" color="primary" startIcon={<SaveIcon />} disabled={isUploadingCategoryImage || !editingCategory?.translations.it.title || !editingCategory?.translations.en.title}>
            {isAddingCategory ? 'Salva Nuova Categoria' : 'Salva Modifiche Categoria'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openRecipeDialog} onClose={handleCancelRecipeDialog} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <Typography variant="h6">{isAddingRecipe ? 'Nuovo Piatto/Ricetta' : 'Modifica Piatto/Ricetta'} ({currentRecipeLanguage.toUpperCase()})</Typography>
             <IconButton edge="end" color="inherit" onClick={handleCancelRecipeDialog}><XIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
            {currentEditingRecipe && (
            <Grid container spacing={3} sx={{pt:1}}>
                <Grid item xs={12} sm={7}> <TextField label="Nome Piatto" fullWidth value={recipeName} onChange={(e) => setRecipeName(e.target.value)} margin="dense" required /> </Grid>
                <Grid item xs={12} sm={5} sx={{display:'flex', alignItems:'center'}}> <Button variant="outlined" component="label" fullWidth startIcon={<DishImageIcon />} sx={{mt: {xs:0, sm: 0.5}, height: {sm: 52}}} disabled={isUploadingRecipeImage}> {isUploadingRecipeImage ? "Caricamento..." : (recipeImagePreview ? "Cambia Foto Piatto" : "Foto Piatto")} <input type="file" accept="image/*" hidden onChange={handleRecipeImageFileChange} ref={recipeImageInputRef} /> </Button> {isUploadingRecipeImage && <CircularProgress size={24} sx={{ml:1}}/>} </Grid>
                {recipeImagePreview && ( <Grid item xs={12} sx={{textAlign:'center', mt: -1}}> <Box component="img" src={recipeImagePreview} alt="Anteprima piatto" sx={{maxHeight: 180, maxWidth: '80%', borderRadius: 1, border: `1px solid ${theme.palette.divider}`}}/> </Grid> )}
                <Grid item xs={12}> <TextField label="Breve Descrizione (per card anteprima)" fullWidth multiline rows={2} value={recipeShortDescription} onChange={(e) => setRecipeShortDescription(e.target.value)} margin="dense" helperText="Max 150 caratteri circa"/> </Grid>
                <Grid item xs={12}> <Typography variant="subtitle1" gutterBottom sx={{mt:1, mb:0.5}}>Ricetta Completa / Preparazione</Typography> <Paper sx={{ p: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, minHeight: 250 }}> <Editor editorState={recipeContentEditorState} onEditorStateChange={setRecipeContentEditorState} wrapperClassName="wrapper-class" editorClassName="editor-class" toolbarClassName="toolbar-class" /> </Paper> </Grid>
            </Grid>
            )}
        </DialogContent>
        <DialogActions sx={{p:2, borderTop: `1px solid ${theme.palette.divider}`}}>
            <Button onClick={handleCancelRecipeDialog} color="inherit" startIcon={<XIcon/>}>Annulla</Button>
            <Button onClick={handleSaveRecipe} variant="contained" color="secondary" startIcon={<SaveIcon/>} disabled={isUploadingRecipeImage || !recipeName.trim()}> Salva Piatto </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}