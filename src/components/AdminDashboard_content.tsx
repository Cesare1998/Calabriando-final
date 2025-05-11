import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Paper,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  useTheme,
  Chip
} from '@mui/material';
import {
  Add as PlusIcon,
  Edit as EditIcon,
  Delete as TrashIcon,
  Save as SaveIcon,
  Close as XIcon,
  Logout as LogOutIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, ContentState, convertToRaw, convertFromHTML } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

interface ContentItem {
  id: string;
  name: string;
  description: string;
  location: string;
  images: string[];
  category?: string;
  cuisine?: string;
  translations: {
    it: {
      name: string;
      description: string;
      cuisine?: string;
      [key: string]: string;
    };
    en: {
      name: string;
      description: string;
      cuisine?: string;
      [key: string]: string;
    };
  };
  [key: string]: any;
}

interface SectionConfig {
  table: string;
  title: string;
  additionalFields: {
    name: string;
    label: string;
    type: string;
    translatable?: boolean;
    requiredForDB?: boolean;
  }[];
  categories?: { [key: string]: string };
}

const SECTION_CONFIGS: { [key: string]: SectionConfig } = {
  restaurants: {
    table: 'restaurants',
    title: 'Gestione Ristoranti',
    additionalFields: [
      { name: 'cuisine', label: 'Tipo di Cucina', type: 'text', translatable: true, requiredForDB: true },
      { name: 'price_range', label: 'Fascia di Prezzo', type: 'text' },
      { name: 'phone', label: 'Telefono', type: 'tel' },
      { name: 'hours', label: 'Orari', type: 'text' }
    ],
    categories: {
      pizzerie: 'Pizzerie',
      tipici: 'Ristoranti Tipici',
      pesce: 'Ristoranti di Pesce',
      fast_food: 'Fast Food',
      gelaterie: 'Gelaterie',
      tavole_calde: "Tavole Calde",
      lidi_sul_mare: "Lidi sul Mare",
      divertimento: 'Via del divertimento'
    }
  },
  bb: {
    table: 'bb',
    title: 'Gestione B&B',
    additionalFields: [
      { name: 'price', label: 'Prezzo per Notte', type: 'number' },
      { name: 'phone', label: 'Telefono', type: 'tel' },
      { name: 'email', label: 'Email', type: 'email' }
    ]
  },
  culture: {
    table: 'cultural_sites',
    title: 'Gestione Arte & Cultura',
    additionalFields: [
      { name: 'type', label: 'Tipo', type: 'text', translatable: true },
      { name: 'period', label: 'Periodo', type: 'text', translatable: true },
      { name: 'visiting_hours', label: 'Orari di Visita', type: 'text' }
    ]
  }
};

const EMPTY_ITEM: ContentItem = {
  id: '',
  name: '',
  description: '',
  location: '',
  images: [],
  translations: {
    it: { name: '', description: '', cuisine: '' },
    en: { name: '', description: '', cuisine: '' }
  }
};

const MAX_IMAGES = 5;

export default function AdminDashboard_content() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const section = location.pathname.split('/admin/')[1];
  const config = SECTION_CONFIGS[section];

  const [items, setItems] = useState<ContentItem[]>([]);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editorStateIT, setEditorStateIT] = useState(() => EditorState.createEmpty());
  const [editorStateEN, setEditorStateEN] = useState(() => EditorState.createEmpty());
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    checkAuth();
    if (config) {
        loadItems();
    } else {
        setLoading(false);
    }
  }, [section]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
    }
  };

  const loadItems = async () => {
    if (!config) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(config.table)
        .select('*')
        .order('created_at');

      if (error) throw error;
      const processedData = (data || []).map(dbItem => {
        const itemWithDefaults = { ...EMPTY_ITEM, ...dbItem };
        itemWithDefaults.translations = {
            it: { ...EMPTY_ITEM.translations.it, ...(dbItem.translations?.it || {}) },
            en: { ...EMPTY_ITEM.translations.en, ...(dbItem.translations?.en || {}) }
        };
        return itemWithDefaults;
      });
      setItems(processedData);
    } catch (err) {
      console.error('Error loading items:', err);
      alert('Errore nel caricamento degli elementi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const handleAddNew = () => {
    if (!config) return;
    const newEmptyItem: ContentItem = JSON.parse(JSON.stringify(EMPTY_ITEM));
    newEmptyItem.id = '';

    const initialCategory = selectedCategory || (config.categories ? Object.keys(config.categories)[0] : undefined);
    newEmptyItem.category = initialCategory;

    config.additionalFields.forEach(field => {
      if (field.translatable) {
        newEmptyItem.translations.it[field.name] = '';
        newEmptyItem.translations.en[field.name] = '';
      } else {
        newEmptyItem[field.name] = field.type === 'number' ? null : '';
      }
    });

    if (section === 'restaurants') {
      const cuisineFieldConfig = config.additionalFields.find(f => f.name === 'cuisine');
      if (cuisineFieldConfig) {
        let cuisineValue = '';
        if (initialCategory && config.categories && config.categories[initialCategory]) {
          cuisineValue = config.categories[initialCategory];
        }
        if (cuisineFieldConfig.translatable) {
          newEmptyItem.translations.it.cuisine = cuisineValue;
        }
      }
    }

    setEditingItem(newEmptyItem);
    setEditorStateIT(EditorState.createEmpty());
    setEditorStateEN(EditorState.createEmpty());
    setIsAdding(true);
    setOpenDialog(true);
    setActiveTab(0);
  };

  const handleEdit = (item: ContentItem) => {
    if (!config) return;
    const itemToEdit: ContentItem = JSON.parse(JSON.stringify(item));

    config.additionalFields.forEach(field => {
        if (field.translatable) {
            if (!itemToEdit.translations.it.hasOwnProperty(field.name)) {
                itemToEdit.translations.it[field.name] = '';
            }
            if (!itemToEdit.translations.en.hasOwnProperty(field.name)) {
                itemToEdit.translations.en[field.name] = '';
            }
        } else {
             if (!itemToEdit.hasOwnProperty(field.name)) {
                itemToEdit[field.name] = field.type === 'number' ? null : '';
            }
        }
    });

    const descIT = itemToEdit.translations.it.description || '';
    try {
        const contentBlocksIT = convertFromHTML(descIT);
        const contentStateIT = contentBlocksIT ? ContentState.createFromBlockArray(contentBlocksIT.contentBlocks, contentBlocksIT.entityMap) : ContentState.createFromText('');
        setEditorStateIT(EditorState.createWithContent(contentStateIT));
    } catch (e) { setEditorStateIT(EditorState.createEmpty()); }

    const descEN = itemToEdit.translations.en.description || '';
    try {
        const contentBlocksEN = convertFromHTML(descEN);
        const contentStateEN = contentBlocksEN ? ContentState.createFromBlockArray(contentBlocksEN.contentBlocks, contentBlocksEN.entityMap) : ContentState.createFromText('');
        setEditorStateEN(EditorState.createWithContent(contentStateEN));
    } catch (e) { setEditorStateEN(EditorState.createEmpty()); }

    setEditingItem(itemToEdit);
    setIsAdding(false);
    setOpenDialog(true);
    setActiveTab(0);
  };

  const handleDelete = async (id: string) => {
    if (!config) return;
    if (!confirm('Sei sicuro di voler eliminare questo elemento? L\'azione è irreversibile.')) return;
    try {
      const itemToDelete = items.find(item => item.id === id);
      if (itemToDelete?.images && itemToDelete.images.length > 0) {
        const filePaths = itemToDelete.images.map(url => {
            try {
                const urlObject = new URL(url);
                const pathSegments = urlObject.pathname.split('/');
                const bucketName = 'images';
                const bucketIndex = pathSegments.indexOf(bucketName);
                if (bucketIndex > -1 && bucketIndex + 1 < pathSegments.length) {
                    return pathSegments.slice(bucketIndex + 1).join('/');
                }
                return null;
            } catch (e) {
                console.warn("Could not parse URL for storage path:", url, e);
                return null;
            }
        }).filter(path => path !== null) as string[];

        if (filePaths.length > 0) {
            const { error: deleteError } = await supabase.storage.from('images').remove(filePaths);
            if (deleteError) {
                console.warn('Could not delete some images from storage:', deleteError);
            }
        }
      }

      const { error } = await supabase
        .from(config.table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems(items.filter(item => item.id !== id));
      alert('Elemento eliminato con successo.');
    } catch (err: any) {
      console.error('Error deleting item:', err);
      alert(`Errore durante l'eliminazione: ${err.message || 'Riprova.'}`);
    }
  };

  const onEditorStateChangeIT = (newEditorState: EditorState) => {
    setEditorStateIT(newEditorState);
  };

  const onEditorStateChangeEN = (newEditorState: EditorState) => {
    setEditorStateEN(newEditorState);
  };

  const handleSave = async () => {
    if (!editingItem || !config) return;

    // Validazioni esistenti (nome, categoria se la sezione le ha, ecc.)
    if (!editingItem.translations.it.name || !editingItem.translations.en.name) {
      alert('Per favore, inserisci almeno il nome in Italiano e Inglese.');
      return;
    }
    // La validazione per la categoria deve avvenire solo se la config prevede categorie
    if (config.categories && !editingItem.category) {
        alert('Per favore, seleziona una categoria.');
        return;
    }

    const cuisineFieldConfig = config.additionalFields.find(f => f.name === 'cuisine');
    if (section === 'restaurants' && cuisineFieldConfig?.requiredForDB && (!editingItem.translations.it.cuisine || editingItem.translations.it.cuisine.trim() === '')) {
        alert('Per favore, inserisci il tipo di cucina (italiano), è un campo obbligatorio.');
        return;
    }

    try {
      const descriptionIT = draftToHtml(convertToRaw(editorStateIT.getCurrentContent()));
      const descriptionEN = draftToHtml(convertToRaw(editorStateEN.getCurrentContent()));

      // Definisci l'oggetto base senza category e cuisine inizialmente
      const itemDataBase: {
        name: string;
        description: string;
        location: string;
        images: string[];
        translations: any;
        [key: string]: any; // Per altri campi dinamici
      } = {
        name: editingItem.translations.it.name,
        description: descriptionIT, // Descrizione radice basata sull'italiano se necessario per la tabella
        location: editingItem.location || '',
        images: editingItem.images || [],
        translations: {
          it: {
            ...editingItem.translations.it,
            description: descriptionIT
          },
          en: {
            ...editingItem.translations.en,
            description: descriptionEN
          }
        },
      };

      // Aggiungi 'category' a itemDataBase SOLO SE la sezione corrente ha categorie definite
      if (config.categories) {
        itemDataBase.category = editingItem.category;
      }

      // Aggiungi 'cuisine' a livello radice per la sezione 'restaurants'
      // (come già presente e corretto)
      if (section === 'restaurants') {
        itemDataBase.cuisine = editingItem.translations.it.cuisine || '';
      }

      // Gestione degli additionalFields non traducibili
      // Assicurati di non sovrascrivere 'name', 'description', 'location', 'images', 'category', 'cuisine', 'translations'
      // se sono gestiti esplicitamente sopra o se sono nomi di additionalFields.
      config.additionalFields.forEach(field => {
        if (!field.translatable) {
          // Solo i campi non già esplicitamente gestiti (name, description, etc. a livello radice)
          // e non quelli che sono anche nomi di chiavi radice speciali
          if (!['name', 'description', 'location', 'images', 'category', 'cuisine', 'translations'].includes(field.name)) {
            itemDataBase[field.name] = editingItem[field.name] === '' && field.type === 'number' ? null : editingItem[field.name];
          }
        }
      });
     
      const itemData = itemDataBase as Partial<ContentItem>; // Cast all'interfaccia completa

      // Il resto della logica di insert/update rimane invariato
      if (isAdding) {
        const { id, ...insertData } = itemData; 
       
        const { data, error } = await supabase
          .from(config.table)
          .insert([insertData]) // insertData ora non avrà 'category' per la sezione 'bb'
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const newItem = { ...EMPTY_ITEM, ...data } as ContentItem;
          newItem.translations = {
            it: { ...EMPTY_ITEM.translations.it, ...(data.translations?.it || {}) },
            en: { ...EMPTY_ITEM.translations.en, ...(data.translations?.en || {}) }
          };
          setItems(prevItems => [...prevItems, newItem]);
          alert('Elemento aggiunto con successo!');
        }
      } else { // Modifica
        const { id, ...updateData } = itemData;

        const { error } = await supabase
          .from(config.table)
          .update(updateData) // updateData ora non avrà 'category' per la sezione 'bb'
          .eq('id', editingItem.id);

        if (error) throw error;
       
        const updatedItemInState = {
            ...editingItem, 
            ...updateData,
            id: editingItem.id 
        } as ContentItem;

        setItems(prevItems => prevItems.map(item => (item.id === editingItem.id ? updatedItemInState : item)));
        alert('Elemento aggiornato con successo!');
      }

      setOpenDialog(false);
      setEditingItem(null);
      setIsAdding(false);
    } catch (err: any) {
      console.error('Error saving item:', err);
      alert(`Errore durante il salvataggio: ${err.message || 'Riprova.'}`);
    }
  };

  const handleCancel = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setIsAdding(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editingItem || !config) return;
    if (editingItem.images.length >= MAX_IMAGES) {
      alert(`Puoi caricare al massimo ${MAX_IMAGES} immagini.`);
      return;
    }

    setIsUploading(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const storagePath = `${section}/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(storagePath, file, {
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(storagePath);

      if (!urlData || !urlData.publicUrl) {
        throw new Error("Impossibile ottenere l'URL pubblico dell'immagine.");
      }

      const publicUrl = urlData.publicUrl;

      setEditingItem(prev => prev ? ({
        ...prev,
        images: [...prev.images, publicUrl]
      }) : null);

    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(`Errore durante il caricamento dell'immagine: ${error.message || 'Riprova.'}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

const handleRemoveImage = async (imageToRemoveUrl: string) => {
    if (!editingItem) return;
    if (!confirm('Sei sicuro di voler rimuovere questa immagine? Verrà eliminata anche dallo storage.')) return;

    try {
        const url = new URL(imageToRemoveUrl);
        const pathSegments = url.pathname.split('/');
        const bucketName = 'images';
        const bucketIndex = pathSegments.indexOf(bucketName);

        if (bucketIndex === -1 || bucketIndex + 1 >= pathSegments.length) {
            console.warn("Could not determine image path for deletion from URL:", imageToRemoveUrl);
            alert("Impossibile determinare il percorso dell'immagine per l'eliminazione.");
            return;
        }

        const imagePathInBucket = pathSegments.slice(bucketIndex + 1).join('/');

        if (imagePathInBucket) {
            const { error: deleteError } = await supabase.storage
              .from(bucketName)
              .remove([imagePathInBucket]);

            if (deleteError) {
              console.error('Error deleting image from storage:', deleteError);
              alert("Errore durante l'eliminazione dell'immagine dallo storage. Riprova.");
              return;
            }
        }

        setEditingItem(prev => prev ? ({
          ...prev,
          images: prev.images.filter(img => img !== imageToRemoveUrl)
        }) : null);
        alert('Immagine rimossa con successo.');

    } catch(error: any) {
        console.error('Error removing image:', error);
        alert(`Errore durante la rimozione dell'immagine: ${error.message || 'Riprova.'}`);
    }
};

  const filteredItems = selectedCategory
    ? items.filter(item => item.category === selectedCategory)
    : items;

  if (!config) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Paper sx={{ p: 4, maxWidth: 'sm', textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h5" color="error.main" gutterBottom>
            Sezione non valida
          </Typography>
          <Typography variant="body1" paragraph>
            La sezione richiesta '{section}' non è configurata correttamente.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/dashboard')}
          >
            Torna alla Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  if (loading && items.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      <Box sx={{ bgcolor: 'primary.main', color: 'white', boxShadow: 3, position: 'sticky', top: 0, zIndex: 1020 }}>
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/admin/dashboard')}
              >
                Dashboard
              </Button>
              <Typography variant="h5" component="h1" fontWeight="bold">
                {config.title}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<LogOutIcon />}
              onClick={handleSignOut}
              sx={{ borderColor: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Esci
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {config.categories && (
          <Paper sx={{ p: 2, mb: 4, borderRadius: 2 }}>
            <Tabs
              value={selectedCategory || ''}
              onChange={(_e, value) => setSelectedCategory(value === '' ? null : value)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              <Tab label="Tutti" value={''} />
              {Object.entries(config.categories).map(([key, label]) => (
                <Tab key={key} label={label} value={key} />
              ))}
            </Tabs>
          </Paper>
        )}

        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlusIcon />}
            onClick={handleAddNew}
          >
            Aggiungi Nuovo
          </Button>
        </Box>

        <Grid container spacing={3}>
          {filteredItems.map((item) => (
            <Grid item xs={12} md={6} lg={4} key={item.id}>
              <Card sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[6]
                }
              }}>
                {item.images && item.images.length > 0 && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={item.images[0]}
                    alt={item.translations?.it?.name || item.name}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" component="h2" sx={{ flexGrow: 1, mr: 1 }}>
                      {item.translations?.it?.name || item.name}
                    </Typography>
                    {config.categories && item.category && config.categories[item.category] && (
                      <Chip
                        label={config.categories[item.category]}
                        color="primary"
                        size="small"
                        sx={{ flexShrink: 0 }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxHeight: 100, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                    <div dangerouslySetInnerHTML={{ __html: item.translations?.it?.description || item.description || '' }} />
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        <strong>Posizione:</strong> {item.location || '-'}
                      </Typography>
                    </Grid>
                    {item.cuisine && section === 'restaurants' && (
                        <Grid item xs={12} sm={6}>
                            <Typography variant="caption" display="block" color="text.secondary">
                                <strong>Tipo Cucina:</strong> {item.cuisine}
                            </Typography>
                        </Grid>
                    )}
                    {config.additionalFields.filter(f => f.name !== 'cuisine').map((field) => (
                      <Grid item xs={12} sm={6} key={field.name}>
                        <Typography variant="caption" display="block" color="text.secondary">
                          <strong>{field.label}:</strong>{' '}
                          {field.translatable
                            ? (item.translations?.it?.[field.name] || '-')
                            : (item[field.name] ?? '-')}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'flex-end', p: 2, bgcolor: 'grey.50' }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEdit(item)}
                    color="secondary"
                  >
                    Modifica
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<TrashIcon />}
                    onClick={() => handleDelete(item.id)}
                  >
                    Elimina
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredItems.length === 0 && !loading && (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2, mt: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {selectedCategory
                ? `Nessun elemento trovato nella categoria "${config.categories?.[selectedCategory]}".`
                : 'Nessun elemento trovato. Inizia aggiungendone uno!'}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlusIcon />}
              onClick={handleAddNew}
              sx={{ mt: 2 }}
            >
              Aggiungi il primo elemento
            </Button>
          </Paper>
        )}

        <Dialog
          open={openDialog}
          onClose={handleCancel}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: { borderRadius: 2, maxHeight: '90vh' }
          }}
          sx={{ zIndex: 1300 }}
        >
          <DialogTitle sx={{
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 1.5, px: 2
          }}>
            <Typography variant="h6">
              {isAdding ? `Nuovo Elemento in ${config.title}` : `Modifica Elemento in ${config.title}`}
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleCancel}
              aria-label="close"
            >
              <XIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: { xs: 2, md: 3} }}>
            {editingItem && (
              <>
                {/* BARRA TAB NON PIU' STICKY */}
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  sx={{
                    mb: 3,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper', // Mantenuto per stile base dei Tabs
                  }}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                >
                  <Tab label="Informazioni di Base" />
                  <Tab label="Contenuto Italiano" />
                  <Tab label="Contenuto Inglese" />
                </Tabs>

                {/* Tab Informazioni di Base */}
                {activeTab === 0 && (
                  <Grid container spacing={3}>
                     {config.categories && (
                      <Grid item xs={12}>
                        <FormControl fullWidth margin="normal" required error={!editingItem.category}>
                          <InputLabel id="category-select-label">Categoria</InputLabel>
                          <Select
                            labelId="category-select-label"
                            value={editingItem.category || ''}
                            label="Categoria"
                            onChange={(e) => {
                              const newCategoryKey = e.target.value as string;
                              setEditingItem(prev => {
                                if (!prev) return null;
                                const updatedItem = { ...prev, category: newCategoryKey };

                                if (isAdding && section === 'restaurants' && config && config.categories && config.categories[newCategoryKey]) {
                                  const cuisineFieldConf = config.additionalFields.find(f => f.name === 'cuisine');
                                  if (cuisineFieldConf?.translatable) {
                                    const newCuisineValue = config.categories[newCategoryKey];
                                    updatedItem.translations.it.cuisine = newCuisineValue;
                                  }
                                }
                                return updatedItem;
                              });
                            }}
                          >
                            <MenuItem value="" disabled><em>Seleziona una categoria</em></MenuItem>
                            {Object.entries(config.categories).map(([key, label]) => (
                              <MenuItem key={key} value={key}>{label}</MenuItem>
                            ))}
                          </Select>
                          {!editingItem.category && <Typography variant="caption" color="error">La categoria è obbligatoria.</Typography>}
                        </FormControl>
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <Paper elevation={0} sx={{ p: {xs: 1.5, md: 2}, mb: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary.dark">
                          Dettagli Comuni
                        </Typography>
                        <TextField
                          label="Posizione (es. Indirizzo o Lat,Lon)"
                          fullWidth
                          value={editingItem.location || ''}
                          onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, location: e.target.value }) : null)}
                          margin="normal"
                        />

                        {config.additionalFields.filter(f => !f.translatable && f.name !== 'cuisine').map((field) => (
                          <TextField
                            key={field.name}
                            label={field.label}
                            type={field.type}
                            fullWidth
                            value={editingItem[field.name] ?? ''}
                            onChange={(e) => setEditingItem(prev => prev ? ({
                              ...prev,
                              [field.name]: field.type === 'number'
                                ? (e.target.value === '' ? null : Number(e.target.value))
                                : e.target.value
                            }) : null)}
                            margin="normal"
                            InputLabelProps={field.type === 'number' && (editingItem[field.name] === null || editingItem[field.name] === undefined) ? { shrink: false } : undefined}
                            inputProps={field.type === 'number' ? { step: 'any' } : undefined}
                          />
                        ))}
                      </Paper>
                    </Grid>

                    <Grid item xs={12}>
                      <Paper elevation={0} sx={{ p: {xs: 1.5, md: 2}, mb: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary.dark">
                          Immagini ({editingItem.images.length} / {MAX_IMAGES})
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Button
                              variant="outlined"
                              component="label"
                              disabled={isUploading || editingItem.images.length >= MAX_IMAGES}
                              color="secondary"
                            >
                              {isUploading ? 'Caricamento...' : 'Carica immagine'}
                              <input
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleImageUpload}
                                hidden
                              />
                            </Button>
                            {isUploading && <CircularProgress size={24} color="secondary" />}
                          </Box>
                          {editingItem.images.length >= MAX_IMAGES && !isUploading && (
                            <Typography variant="body2" color="warning.main">
                              Hai raggiunto il numero massimo di immagini.
                            </Typography>
                          )}
                          {editingItem.images.length > 0 ? (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              {editingItem.images.map((url, index) => (
                                <Grid item xs={6} sm={4} md={3} key={`${url}-${index}`}>
                                  <Box sx={{ position: 'relative' }}>
                                    <CardMedia
                                      component="img"
                                      height="120"
                                      image={url}
                                      alt={`Immagine ${index + 1}`}
                                      sx={{ borderRadius: '8px', border: `1px solid ${theme.palette.divider}` }}
                                    />
                                    <IconButton
                                      size="small"
                                      onClick={() => handleRemoveImage(url)}
                                      sx={{
                                        position: 'absolute', top: 4, right: 4,
                                        bgcolor: 'rgba(0,0,0,0.4)', color: 'white',
                                        '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                                      }}
                                      aria-label="Rimuovi immagine"
                                    >
                                      <XIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Grid>
                              ))}
                            </Grid>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                              Nessuna immagine caricata.
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                )}

                {/* Tab Contenuto Italiano */}
                {activeTab === 1 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Nome (IT)"
                        fullWidth required
                        error={!editingItem.translations.it.name}
                        helperText={!editingItem.translations.it.name ? "Il nome in italiano è obbligatorio." : ""}
                        value={editingItem.translations.it.name || ''}
                        onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, translations: { ...prev.translations, it: { ...prev.translations.it, name: e.target.value } } }) : null)}
                        margin="normal"
                      />
                      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'medium' }}>Descrizione (IT)</Typography>
                      <Paper sx={{ p: 1, borderRadius: 1, mb: 2, minHeight: 200, border: `1px solid ${theme.palette.divider}` }}>
                        <Editor
                          editorState={editorStateIT}
                          onEditorStateChange={onEditorStateChangeIT}
                          wrapperClassName="wrapper-class" editorClassName="editor-class" toolbarClassName="toolbar-class"
                          toolbar={{
                            options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'colorPicker', 'link', 'embedded', 'emoji', 'remove', 'history'],
                            inline: { options: ['bold', 'italic', 'underline', 'strikethrough'], },
                            blockType: { options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'Blockquote', 'Code'], },
                            list: { options: ['unordered', 'ordered'], },
                          }}
                        />
                      </Paper>
                      {config.additionalFields.filter(f => f.translatable).map((field) => {
                        const isCuisineField = section === 'restaurants' && field.name === 'cuisine';
                        const isRequired = isCuisineField && field.requiredForDB;
                        const hasError = isRequired && !(editingItem.translations?.it?.[field.name]?.trim());
                        const makeCuisineReadOnly = isAdding && isCuisineField && editingItem.category && config.categories?.[editingItem.category];

                        return (
                            <TextField
                              key={`${field.name}-it`}
                              label={`${field.label} (IT)`}
                              fullWidth
                              required={isRequired}
                              error={hasError}
                              helperText={hasError ? `${field.label} è obbligatorio.` : ""}
                              value={editingItem.translations?.it?.[field.name] || ''}
                              onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, translations: { ...prev.translations, it: { ...prev.translations.it, [field.name]: e.target.value } } }) : null)}
                              margin="normal"
                              InputProps={{
                                readOnly: makeCuisineReadOnly,
                              }}
                            />
                        );
                        })}
                    </Grid>
                  </Grid>
                )}

                {/* Tab Contenuto Inglese */}
                {activeTab === 2 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Name (EN)"
                        fullWidth required
                        error={!editingItem.translations.en.name}
                        helperText={!editingItem.translations.en.name ? "Il nome in inglese è obbligatorio." : ""}
                        value={editingItem.translations.en.name || ''}
                        onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, translations: { ...prev.translations, en: { ...prev.translations.en, name: e.target.value } } }) : null)}
                        margin="normal"
                      />
                      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'medium' }}>Description (EN)</Typography>
                      <Paper sx={{ p: 1, borderRadius: 1, mb: 2, minHeight: 200, border: `1px solid ${theme.palette.divider}` }}>
                        <Editor
                          editorState={editorStateEN}
                          onEditorStateChange={onEditorStateChangeEN}
                          wrapperClassName="wrapper-class" editorClassName="editor-class" toolbarClassName="toolbar-class"
                          toolbar={{
                            options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'colorPicker', 'link', 'embedded', 'emoji', 'remove', 'history'],
                            inline: { options: ['bold', 'italic', 'underline', 'strikethrough'], },
                            blockType: { options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'Blockquote', 'Code'], },
                            list: { options: ['unordered', 'ordered'], },
                          }}
                        />
                      </Paper>
                      {config.additionalFields.filter(f => f.translatable).map((field) => (
                        <TextField
                          key={`${field.name}-en`}
                          label={`${field.label} (EN)`}
                          fullWidth
                          value={editingItem.translations?.en?.[field.name] || ''}
                          onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, translations: { ...prev.translations, en: { ...prev.translations.en, [field.name]: e.target.value } } }) : null)}
                          margin="normal"
                        />
                      ))}
                    </Grid>
                  </Grid>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'space-between', borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button onClick={handleCancel} color="inherit" startIcon={<XIcon />}>Annulla</Button>
            <Button
              onClick={handleSave}
              variant="contained" color="primary" startIcon={<SaveIcon />}
              disabled={
                isUploading || !editingItem ||
                (config.categories && !editingItem.category) ||
                !editingItem.translations.it.name || !editingItem.translations.en.name ||
                (section === 'restaurants' && config.additionalFields.find(f=>f.name==='cuisine')?.requiredForDB && !editingItem.translations.it.cuisine?.trim())
              }
            >
              {isUploading ? 'Caricamento...' : (isAdding ? 'Aggiungi Elemento' : 'Salva Modifiche')}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
      <style jsx global>{`
        .editor-class { min-height: 180px; padding: 0 10px; line-height: 1.5; }
        .toolbar-class { border-radius: 4px 4px 0 0; border-bottom: 1px solid #e0e0e0; margin-bottom: 0; padding: 4px; z-index: 100; }
        .wrapper-class { border: 1px solid #e0e0e0; border-radius: 4px; background-color: #fff; }
        .rdw-option-wrapper, .rdw-dropdown-wrapper { margin: 2px; }
        .rdw-editor-toolbar { padding: 6px 5px 0; }
      `}</style>
    </Box>
  );
}