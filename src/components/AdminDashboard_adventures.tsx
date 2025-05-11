import React, { useState, useEffect } from 'react';
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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  Add as PlusIcon, 
  Edit as EditIcon, 
  Delete as TrashIcon, 
  Save as SaveIcon, 
  Close as XIcon, 
  Logout as LogOutIcon,
  Visibility as EyeIcon,
  VisibilityOff as EyeOffIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  Hiking as HikingIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { it } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, ContentState, convertToRaw, convertFromHTML } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

// --- Interfaces and Constants ---
interface Adventure {
  id: string;
  title: string;
  description: string;
  image_url: string;
  duration: string;
  price: number;
  max_participants: number;
  location: string;
  adventure_type: 'horse' | 'rafting' | 'quad' | 'flight' | 'diving' | 'boat' | 'water' | 'trekking';
  subcategory?: string;
  parent_id?: string;
  available_dates: Array<{ date: string; time: [string, string]; }>;
  visible_in_home: boolean;
  translations: { it: { title: string; description: string; }; en: { title: string; description: string; }; };
  created_at?: string;
}

interface Content {
  id: string;
  section: string;
  title: string;
  description: string;
  image_url: string;
  section_group: string;
  display_order: number;
  translations: {
    it?: {
      title: string;
      description: string;
    };
    en?: {
      title: string;
      description: string;
    };
  };
}

const ADVENTURE_TYPES: Record<Adventure['adventure_type'], {
    it: string;
    en: string;
    subcategories?: Record<string, { it: string; en: string }>;
}> = {
  horse: { it: 'Gite a cavallo', en: 'Horseback Riding' },
  rafting: { it: 'Rafting', en: 'Rafting' },
  quad: { it: 'Escursioni in Quad', en: 'Quad Excursions' },
  flight: { it: 'In Volo', en: 'Flying Experience' },
  diving: { it: 'Immersioni', en: 'Scuba Diving', subcategories: { wreck: { it: 'Relitti', en: 'Wreck Diving' }, reef: { it: 'Barriera Corallina', en: 'Reef Diving' }, night: { it: 'Notturna', en: 'Night Diving' } } },
  boat: { it: 'Tour in Barca', en: 'Boat Tours', subcategories: { caves: { it: 'Grotte Marine', en: 'Sea Caves' }, sunset: { it: 'Tramonto', en: 'Sunset Tour' }, fishing: { it: 'Pesca', en: 'Fishing' } } },
  water: { it: 'Giochi d\'acqua', en: 'Water Activities', subcategories: { snorkeling: { it: 'Snorkeling', en: 'Snorkeling' }, kayak: { it: 'Kayak', en: 'Kayaking' }, sup: { it: 'SUP', en: 'Stand Up Paddle' } } },
  trekking: { it: 'Trekking e Natura', en: 'Trekking & Nature', subcategories: { mountain: { it: 'Montagna', en: 'Mountain' }, forest: { it: 'Foresta', en: 'Forest' }, coast: { it: 'Costa', en: 'Coast' } } }
};

const EMPTY_ADVENTURE_BASE: Omit<Adventure, 'id' | 'created_at'> = {
  title: '', description: '', image_url: '', duration: '', price: 0, max_participants: 1, location: '', adventure_type: 'horse', available_dates: [], visible_in_home: true, translations: { it: { title: '', description: '' }, en: { title: '', description: '' } },
};

export default function AdminDashboard_adventures() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [editingAdventure, setEditingAdventure] = useState<Adventure | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDateString, setSelectedDateString] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<[string, string]>(['09:00', '17:00']);
  const [isUploading, setIsUploading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<Adventure['adventure_type'] | null>(null);
  const [editorStateIT, setEditorStateIT] = useState(EditorState.createEmpty());
  const [editorStateEN, setEditorStateEN] = useState(EditorState.createEmpty());
  const [activeTab, setActiveTab] = useState(0);
  const [trekkingContent, setTrekkingContent] = useState<Content | null>(null);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [contentEditorStateIT, setContentEditorStateIT] = useState(EditorState.createEmpty());
  const [contentEditorStateEN, setContentEditorStateEN] = useState(EditorState.createEmpty());
  const [openContentDialog, setOpenContentDialog] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>('adventures');

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // --- Effects and Auth ---
  useEffect(() => {
    checkAuth();
    loadAdventures();
    loadTrekkingContent();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate('/admin');
  };

  // --- Data Loading ---
  const loadAdventures = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('adventures').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const processedData = (data || []).map(adv => ({
           ...adv,
           translations: adv.translations || { it: { title: '', description: '' }, en: { title: '', description: '' } },
           available_dates: Array.isArray(adv.available_dates) ? adv.available_dates : [],
           visible_in_home: typeof adv.visible_in_home === 'boolean' ? adv.visible_in_home : true,
      }));
      setAdventures(processedData);
    } catch (err: any) {
      console.error('Error loading adventures:', err);
      alert(`Errore caricamento: ${err.message}`);
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

  // --- Image Handling ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editingAdventure) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${editingAdventure.adventure_type}-${Date.now()}.${fileExt}`;
    const storagePath = `adventures/${fileName}`;
    setIsUploading(true);
    try {
        if (!isAdding && editingAdventure.image_url) {
             try {
                 const urlParts = editingAdventure.image_url.split('/adventures/');
                 if (urlParts.length > 1) await supabase.storage.from('images').remove([`adventures/${urlParts[1]}`]);
             } catch (deleteError) { console.warn("Could not delete previous image:", deleteError); }
        }
        const { error: uploadError } = await supabase.storage.from('images').upload(storagePath, file, { upsert: false, contentType: file.type });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(storagePath);
        if (!urlData?.publicUrl) throw new Error("URL pubblico non trovato.");
        setEditingAdventure({ ...editingAdventure, image_url: urlData.publicUrl });
    } catch (error: any) {
        console.error('Error uploading image:', error);
        alert(`Errore upload: ${error.message || 'Riprova.'}`);
    } finally {
        setIsUploading(false);
        e.target.value = '';
    }
  };

  const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editingContent) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `trekking-${Date.now()}.${fileExt}`;
    const storagePath = `content/${fileName}`;
    setIsUploading(true);
    try {
        if (editingContent.image_url) {
             try {
                 const urlParts = editingContent.image_url.split('/content/');
                 if (urlParts.length > 1) await supabase.storage.from('images').remove([`content/${urlParts[1]}`]);
             } catch (deleteError) { console.warn("Could not delete previous image:", deleteError); }
        }
        const { error: uploadError } = await supabase.storage.from('images').upload(storagePath, file, { upsert: false, contentType: file.type });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(storagePath);
        if (!urlData?.publicUrl) throw new Error("URL pubblico non trovato.");
        setEditingContent({ ...editingContent, image_url: urlData.publicUrl });
    } catch (error: any) {
        console.error('Error uploading image:', error);
        alert(`Errore upload: ${error.message || 'Riprova.'}`);
    } finally {
        setIsUploading(false);
        e.target.value = '';
    }
  };

  const onEditorStateChangeIT = (editorState: EditorState) => {
    setEditorStateIT(editorState);
  };

  const onEditorStateChangeEN = (editorState: EditorState) => {
    setEditorStateEN(editorState);
  };

  const onContentEditorStateChangeIT = (editorState: EditorState) => {
    setContentEditorStateIT(editorState);
  };

  const onContentEditorStateChangeEN = (editorState: EditorState) => {
    setContentEditorStateEN(editorState);
  };

   // --- CRUD Handlers ---
   const handleSignOut = async () => { await supabase.auth.signOut(); navigate('/admin'); };

   const handleAddNew = () => {
     setSelectedDateString(''); 
     setSelectedTime(['09:00', '17:00']);
     setEditingAdventure({ ...EMPTY_ADVENTURE_BASE, id: '', created_at: undefined });
     setEditorStateIT(EditorState.createEmpty());
     setEditorStateEN(EditorState.createEmpty());
     setIsAdding(true);
     setOpenDialog(true);
     setActiveTab(0);
   };

   const handleEdit = (adventure: Adventure) => {
     setSelectedDateString(''); 
     setSelectedTime(['09:00', '17:00']);
     setEditingAdventure({ 
       ...adventure, 
       translations: { 
         it: { ...(adventure.translations?.it || {}) }, 
         en: { ...(adventure.translations?.en || {}) } 
       }, 
       available_dates: [...(adventure.available_dates || [])] 
     });

     // Initialize editor states with content
     const contentBlocksIT = convertFromHTML(adventure.translations?.it?.description || adventure.description || '');
     const contentStateIT = ContentState.createFromBlockArray(
       contentBlocksIT.contentBlocks,
       contentBlocksIT.entityMap
     );
     setEditorStateIT(EditorState.createWithContent(contentStateIT));

     const contentBlocksEN = convertFromHTML(adventure.translations?.en?.description || '');
     const contentStateEN = ContentState.createFromBlockArray(
       contentBlocksEN.contentBlocks,
       contentBlocksEN.entityMap
     );
     setEditorStateEN(EditorState.createWithContent(contentStateEN));

     setIsAdding(false);
     setOpenDialog(true);
     setActiveTab(0);
   };

   const handleDelete = async (id: string, imageUrl?: string) => {
     if (!confirm('Sei sicuro di voler eliminare?')) return;
     try {
         if (imageUrl) {
              try {
                  const urlParts = imageUrl.split('/adventures/');
                  if (urlParts.length > 1) await supabase.storage.from('images').remove([`adventures/${urlParts[1]}`]);
              } catch (storageError) { console.warn("Could not delete storage image:", storageError); }
         }
         const { error } = await supabase.from('adventures').delete().eq('id', id);
         if (error) throw error;
         setAdventures(adventures.filter(a => a.id !== id));
         alert('Eliminato con successo.');
     } catch (err: any) {
         console.error('Error deleting:', err);
         alert(`Errore eliminazione: ${err.message}`);
     }
   };

   const handleAddDate = () => {
     if (!editingAdventure || !selectedDateString) { alert('Seleziona data.'); return; }
     if (!selectedTime[0] || !selectedTime[1]) { alert('Seleziona orari.'); return; }
     const dateStr = selectedDateString;
     if (editingAdventure.available_dates.some(d => d.date === dateStr)) { alert('Data già presente.'); return; }
     const newDate = { date: dateStr, time: selectedTime };
     setEditingAdventure({ 
       ...editingAdventure, 
       available_dates: [...editingAdventure.available_dates, newDate].sort((a, b) => a.date.localeCompare(b.date)) 
     });
     setSelectedDateString('');
   };

   const handleRemoveDate = (dateToRemove: string) => {
     if (!editingAdventure) return;
     setEditingAdventure({ 
       ...editingAdventure, 
       available_dates: editingAdventure.available_dates.filter(d => d.date !== dateToRemove) 
     });
   };

   const handleSave = async () => {
     if (!editingAdventure) return;
     // Validation
     if (!editingAdventure.translations?.it?.title || !editingAdventure.translations?.en?.title) { 
       alert('Titolo IT/EN mancante.'); 
       return; 
     }
     if (!editingAdventure.image_url) { 
       alert('Immagine mancante.'); 
       return; 
     }
     if (!editingAdventure.location) { 
       alert('Posizione mancante.'); 
       return; 
     }
     if (editingAdventure.price < 0) { 
       alert('Prezzo non valido.'); 
       return; 
     }
     if (editingAdventure.max_participants <= 0) { 
       alert('Partecipanti non validi.'); 
       return; 
     }
     const typeConfig = ADVENTURE_TYPES[editingAdventure.adventure_type];
     if (typeConfig.subcategories && !editingAdventure.subcategory) { 
       alert('Sottocategoria mancante.'); 
       return; 
     }

     try {
         // Convert editor state to HTML
         const descriptionIT = draftToHtml(convertToRaw(editorStateIT.getCurrentContent()));
         const descriptionEN = draftToHtml(convertToRaw(editorStateEN.getCurrentContent()));

         const adventureData: Omit<Adventure, 'id' | 'created_at'> = {
             title: editingAdventure.translations.it.title, 
             description: descriptionIT, 
             image_url: editingAdventure.image_url, 
             duration: editingAdventure.duration, 
             price: editingAdventure.price, 
             max_participants: editingAdventure.max_participants, 
             location: editingAdventure.location, 
             adventure_type: editingAdventure.adventure_type, 
             subcategory: typeConfig.subcategories ? editingAdventure.subcategory : undefined, 
             parent_id: editingAdventure.parent_id, 
             available_dates: editingAdventure.available_dates, 
             visible_in_home: editingAdventure.visible_in_home, 
             translations: { 
               it: { 
                 title: editingAdventure.translations.it.title || '', 
                 description: descriptionIT
               }, 
               en: { 
                 title: editingAdventure.translations.en.title || '', 
                 description: descriptionEN
               } 
             }
         };
         if (isAdding) {
             const { data, error } = await supabase.from('adventures').insert([adventureData]).select().single();
             if (error) throw error;
             if (data) setAdventures([data, ...adventures]);
             alert('Aggiunto con successo!');
         } else {
             const { error } = await supabase.from('adventures').update(adventureData).eq('id', editingAdventure.id);
             if (error) throw error;
             setAdventures(adventures.map(a => (a.id === editingAdventure.id ? { ...editingAdventure, ...adventureData } : a)));
             alert('Aggiornato con successo!');
         }
         setOpenDialog(false);
         setEditingAdventure(null); 
         setIsAdding(false); 
         setSelectedDateString(''); 
         setSelectedTime(['09:00', '17:00']);
     } catch (err: any) { 
       console.error('Error saving:', err); 
       alert(`Errore salvataggio: ${err.message}`); 
     }
   };

   const handleCancel = () => { 
     setOpenDialog(false);
     setEditingAdventure(null); 
     setIsAdding(false); 
     setSelectedDateString(''); 
     setSelectedTime(['09:00', '17:00']); 
   };

   const handleEditTrekkingContent = () => {
     if (!trekkingContent) return;

     setEditingContent(trekkingContent);

     // Initialize editor states with content
     const contentBlocksIT = convertFromHTML(trekkingContent.translations?.it?.description || trekkingContent.description || '');
     const contentStateIT = ContentState.createFromBlockArray(
       contentBlocksIT.contentBlocks,
       contentBlocksIT.entityMap
     );
     setContentEditorStateIT(EditorState.createWithContent(contentStateIT));

     const contentBlocksEN = convertFromHTML(trekkingContent.translations?.en?.description || '');
     const contentStateEN = ContentState.createFromBlockArray(
       contentBlocksEN.contentBlocks,
       contentBlocksEN.entityMap
     );
     setContentEditorStateEN(EditorState.createWithContent(contentStateEN));

     setOpenContentDialog(true);
   };

   const handleSaveContent = async () => {
     if (!editingContent) return;

     try {
       // Convert editor state to HTML
       const descriptionIT = draftToHtml(convertToRaw(contentEditorStateIT.getCurrentContent()));
       const descriptionEN = draftToHtml(convertToRaw(contentEditorStateEN.getCurrentContent()));

       const contentData = {
         title: editingContent.translations?.it?.title || editingContent.title,
         description: descriptionIT,
         image_url: editingContent.image_url,
         section_group: 'adventures', // Cambiato da 'experiences' a 'adventures'
         translations: {
           it: {
             title: editingContent.translations?.it?.title || editingContent.title,
             description: descriptionIT
           },
           en: {
             title: editingContent.translations?.en?.title || editingContent.title,
             description: descriptionEN
           }
         }
       };

       const { error } = await supabase
         .from('content')
         .update(contentData)
         .eq('id', editingContent.id);

       if (error) throw error;
       
       // Aggiorna lo stato locale
       setTrekkingContent({
         ...editingContent,
         ...contentData
       });

       alert('Contenuto aggiornato con successo!');
       setOpenContentDialog(false);
       setEditingContent(null);
     } catch (err: any) {
       console.error('Error saving content:', err);
       alert(`Errore salvataggio: ${err.message}`);
     }
   };

   const handleCancelContent = () => {
     setOpenContentDialog(false);
     setEditingContent(null);
   };

   const filteredAdventures = selectedType 
     ? adventures.filter(adv => adv.adventure_type === selectedType)
     : adventures;

   if (loading && adventures.length === 0) { 
     return (
       <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <CircularProgress size={60} />
       </Box>
     );
   }

   return (
     <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
       {/* Header */}
       <Box sx={{ bgcolor: 'primary.main', color: 'white', boxShadow: 3, position: 'sticky', top: 0, zIndex: 10 }}>
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
                 Gestione Avventure
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

         {/* Adventures Section */}
         <Accordion 
           expanded={expandedAccordion === 'adventures'} 
           onChange={handleAccordionChange('adventures')}
           sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}
         >
           <AccordionSummary
             expandIcon={<ExpandMoreIcon />}
             sx={{ bgcolor: 'primary.main', color: 'white' }}
           >
             <Typography variant="h6">Gestione Avventure</Typography>
           </AccordionSummary>
           <AccordionDetails>
             {/* Filter and Add Button */}
             <Paper sx={{ p: 2, mb: 4, borderRadius: 2 }}>
               <Grid container spacing={2} alignItems="center">
                 <Grid item xs={12} md={8}>
                   <FormControl fullWidth>
                     <InputLabel id="adventure-type-label">Filtra per tipo</InputLabel>
                     <Select
                       labelId="adventure-type-label"
                       value={selectedType || ''}
                       label="Filtra per tipo"
                       onChange={(e) => setSelectedType(e.target.value as Adventure['adventure_type'] | null)}
                     >
                       <MenuItem value="">Tutti i tipi</MenuItem>
                       {Object.entries(ADVENTURE_TYPES).map(([key, value]) => (
                         <MenuItem key={key} value={key}>{value.it}</MenuItem>
                       ))}
                     </Select>
                   </FormControl>
                 </Grid>
                 <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                   <Button
                     variant="contained"
                     color="primary"
                     startIcon={<PlusIcon />}
                     onClick={handleAddNew}
                   >
                     Aggiungi Nuova Avventura
                   </Button>
                 </Grid>
               </Grid>
             </Paper>

             {/* Adventures List */}
             <Grid container spacing={3}>
               {filteredAdventures.map((adventure) => (
                 <Grid item xs={12} md={6} key={adventure.id}>
                   <Card sx={{ 
                     height: '100%', 
                     display: 'flex', 
                     flexDirection: 'column',
                     borderRadius: 2,
                     transition: 'transform 0.2s, box-shadow 0.2s',
                     '&:hover': {
                       transform: 'translateY(-4px)',
                       boxShadow: 6
                     }
                   }}>
                     <Box sx={{ position: 'relative' }}>
                       <CardMedia
                         component="img"
                         height="200"
                         image={adventure.image_url || '/images/placeholder.jpg'}
                         alt={adventure.translations.it.title}
                       />
                       <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                         <Chip
                           label={ADVENTURE_TYPES[adventure.adventure_type].it}
                           color="primary"
                           size="small"
                         />
                         {adventure.subcategory && ADVENTURE_TYPES[adventure.adventure_type].subcategories && (
                           <Chip
                             label={ADVENTURE_TYPES[adventure.adventure_type].subcategories![adventure.subcategory].it}
                             color="secondary"
                             size="small"
                           />
                         )}
                       </Box>
                     </Box>
                     <CardContent sx={{ flexGrow: 1 }}>
                       <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                         <Typography variant="h6" component="h2">
                           {adventure.translations.it.title}
                         </Typography>
                         <Chip
                           icon={adventure.visible_in_home ? <EyeIcon /> : <EyeOffIcon />}
                           label={adventure.visible_in_home ? "Visibile" : "Nascosto"}
                           color={adventure.visible_in_home ? "success" : "default"}
                           size="small"
                         />
                       </Box>
                       <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 60, overflow: 'hidden' }} component="div">
                         <div dangerouslySetInnerHTML={{ __html: adventure.translations.it.description.substring(0, 120) + (adventure.translations.it.description.length > 120 ? '...' : '') }} />
                       </Typography>
                       <Grid container spacing={1}>
                         <Grid item xs={6}>
                           <Typography variant="body2">
                             <strong>Durata:</strong> {adventure.duration}
                           </Typography>
                         </Grid>
                         <Grid item xs={6}>
                           <Typography variant="body2">
                             <strong>Prezzo:</strong> €{adventure.price}
                           </Typography>
                         </Grid>
                         <Grid item xs={6}>
                           <Typography variant="body2">
                             <strong>Max Pax:</strong> {adventure.max_participants}
                           </Typography>
                         </Grid>
                         <Grid item xs={6}>
                           <Typography variant="body2">
                             <strong>Luogo:</strong> {adventure.location}
                           </Typography>
                         </Grid>
                       </Grid>
                     </CardContent>
                     <Divider />
                     <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                       <Button
                         size="small"
                         startIcon={<EditIcon />}
                         onClick={() => handleEdit(adventure)}
                       >
                         Modifica
                       </Button>
                       <Button
                         size="small"
                         color="error"
                         startIcon={<TrashIcon />}
                         onClick={() => handleDelete(adventure.id, adventure.image_url)}
                       >
                         Elimina
                       </Button>
                     </CardActions>
                   </Card>
                 </Grid>
               ))}
             </Grid>

             {filteredAdventures.length === 0 && !loading && (
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
                   {selectedType 
                     ? `Nessuna avventura trovata per il tipo "${ADVENTURE_TYPES[selectedType].it}".` 
                     : 'Nessuna avventura trovata.'}
                 </Typography>
                 <Button
                   variant="contained"
                   color="primary"
                   startIcon={<PlusIcon />}
                   onClick={handleAddNew}
                   sx={{ mt: 2 }}
                 >
                   Aggiungi la prima avventura
                 </Button>
               </Paper>
             )}
           </AccordionDetails>
         </Accordion>

         {/* Edit/Add Dialog for Adventures */}
         <Dialog 
           open={openDialog} 
           onClose={handleCancel}
           fullWidth
           maxWidth="md"
           PaperProps={{
             sx: { borderRadius: 2 }
           }}
         >
           <DialogTitle sx={{ 
             bgcolor: 'primary.main', 
             color: 'white',
             display: 'flex',
             justifyContent: 'space-between',
             alignItems: 'center'
           }}>
             <Typography variant="h6">
               {isAdding ? 'Nuova Avventura' : 'Modifica Avventura'}
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
           <DialogContent dividers>
             {editingAdventure && (
               <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                 <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                   <Tab label="Informazioni di Base" />
                   <Tab label="Contenuto Italiano" />
                   <Tab label="Contenuto Inglese" />
                   <Tab label="Date Disponibili" />
                 </Tabs>

                 {activeTab === 0 && (
                   <Grid container spacing={3}>
                     {/* Adventure Type & Subcategory */}
                     <Grid item xs={12}>
                       <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                         <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                           Tipo di Avventura
                         </Typography>
                         <Grid container spacing={2}>
                           <Grid item xs={12} md={6}>
                             <FormControl fullWidth margin="normal">
                               <InputLabel id="adventure-type-select-label">Tipo Avventura *</InputLabel>
                               <Select
                                 labelId="adventure-type-select-label"
                                 value={editingAdventure.adventure_type}
                                 label="Tipo Avventura *"
                                 onChange={(e) => setEditingAdventure({
                                   ...editingAdventure,
                                   adventure_type: e.target.value as Adventure['adventure_type'],
                                   subcategory: undefined
                                 })}
                               >
                                 {Object.entries(ADVENTURE_TYPES).map(([key, labels]) => (
                                   <MenuItem key={key} value={key}>{labels.it}</MenuItem>
                                 ))}
                               </Select>
                             </FormControl>
                           </Grid>
                           {ADVENTURE_TYPES[editingAdventure.adventure_type].subcategories && (
                             <Grid item xs={12} md={6}>
                               <FormControl fullWidth margin="normal">
                                 <InputLabel id="subcategory-select-label">Sottocategoria *</InputLabel>
                                 <Select
                                   labelId="subcategory-select-label"
                                   value={editingAdventure.subcategory || ''}
                                   label="Sottocategoria *"
                                   onChange={(e) => setEditingAdventure({
                                     ...editingAdventure,
                                     subcategory: e.target.value || undefined
                                   })}
                                 >
                                   <MenuItem value="">-- Seleziona --</MenuItem>
                                   {Object.entries(ADVENTURE_TYPES[editingAdventure.adventure_type].subcategories!).map(([key, labels]) => (
                                     <MenuItem key={key} value={key}>{labels.it}</MenuItem>
                                   ))}
                                 </Select>
                               </FormControl>
                             </Grid>
                           )}
                         </Grid>
                       </Paper>
                     </Grid>

                     {/* Image Upload */}
                     <Grid item xs={12}>
                       <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                         <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                           Immagine
                         </Typography>
                         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                             <Button
                               variant="outlined"
                               component="label"
                               disabled={isUploading}
                             >
                               {isUploading ? 'Caricamento...' : 'Carica immagine'}
                               <input
                                 type="file"
                                 accept="image/png, image/jpeg, image/webp"
                                 onChange={handleImageUpload}
                                 hidden
                               />
                             </Button>
                             {isUploading && <CircularProgress size={24} />}
                           </Box>
                           {editingAdventure.image_url && (
                             <Box sx={{ mt: 2 }}>
                               <img
                                 src={editingAdventure.image_url}
                                 alt="Anteprima"
                                 style={{ 
                                   maxHeight: '200px', 
                                   maxWidth: '100%', 
                                   objectFit: 'contain',
                                   borderRadius: '8px',
                                   border: '1px solid #eee'
                                 }}
                               />
                             </Box>
                           )}
                         </Box>
                       </Paper>
                     </Grid>

                     {/* Adventure Details */}
                     <Grid item xs={12}>
                       <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                         <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                           Dettagli Avventura
                         </Typography>
                         <Grid container spacing={2}>
                           <Grid item xs={12} md={3}>
                             <TextField
                               label="Durata"
                               fullWidth
                               value={editingAdventure.duration}
                               onChange={(e) => setEditingAdventure({ ...editingAdventure, duration: e.target.value })}
                               margin="normal"
                               placeholder="Es. 2 ore"
                             />
                           </Grid>
                           <Grid item xs={12} md={3}>
                             <TextField
                               label="Prezzo (€)"
                               type="number"
                               fullWidth
                               required
                               value={editingAdventure.price}
                               onChange={(e) => setEditingAdventure({ 
                                 ...editingAdventure, 
                                 price: Math.max(0, Number(e.target.value)) 
                               })}
                               margin="normal"
                               InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                             />
                           </Grid>
                           <Grid item xs={12} md={3}>
                             <TextField
                               label="Max Partecipanti"
                               type="number"
                               fullWidth
                               required
                               value={editingAdventure.max_participants}
                               onChange={(e) => setEditingAdventure({ 
                                 ...editingAdventure, 
                                 max_participants: Math.max(1, Math.floor(Number(e.target.value))) 
                               })}
                               margin="normal"
                               InputProps={{ inputProps: { min: 1, step: 1 } }}
                             />
                           </Grid>
                           <Grid item xs={12} md={3}>
                             <TextField
                               label="Posizione / Luogo"
                               fullWidth
                               required
                               value={editingAdventure.location}
                               onChange={(e) => setEditingAdventure({ ...editingAdventure, location: e.target.value })}
                               margin="normal"
                               placeholder="Es. Spiaggia di Tropea"
                             />
                           </Grid>
                         </Grid>
                         <FormControlLabel
                           control={
                             <Switch
                               checked={editingAdventure.visible_in_home}
                               onChange={(e) => setEditingAdventure({ 
                                 ...editingAdventure, 
                                 visible_in_home: e.target.checked 
                               })}
                               color="primary"
                             />
                           }
                           label={
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                               {editingAdventure.visible_in_home ? <EyeIcon color="success" /> : <EyeOffIcon />}
                               <Typography variant="body2">
                                 {editingAdventure.visible_in_home ? 'Visibile nella Home Page' : 'Nascosto nella Home Page'}
                               </Typography>
                             </Box>
                           }
                           sx={{ mt: 2 }}
                         />
                       </Paper>
                     </Grid>
                   </Grid>
                 )}

                 {activeTab === 1 && (
                   <Grid container spacing={3}>
                     {/* Italian Title */}
                     <Grid item xs={12}>
                       <TextField
                         label="Titolo (IT)"
                         fullWidth
                         required
                         value={editingAdventure.translations.it.title}
                         onChange={(e) => setEditingAdventure({
                           ...editingAdventure,
                           translations: {
                             ...editingAdventure.translations,
                             it: { ...editingAdventure.translations.it, title: e.target.value }
                           }
                         })}
                         margin="normal"
                       />
                     </Grid>

                     {/* Italian Description with WYSIWYG Editor */}
                     <Grid item xs={12}>
                       <Typography variant="subtitle1" gutterBottom>
                         Descrizione (IT)
                       </Typography>
                       <Paper sx={{ p: 1, border: '1px solid #ddd', borderRadius: 1, mb: 2 }}>
                         <Editor
                           editorState={editorStateIT}
                           onEditorStateChange={onEditorStateChangeIT}
                           wrapperClassName="wrapper-class"
                           editorClassName="editor-class"
                           toolbarClassName="toolbar-class"
                           toolbar={{
                             options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'colorPicker', 'link', 'history'],
                             inline: {
                               options: ['bold', 'italic', 'underline', 'strikethrough'],
                             },
                             blockType: {
                               options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Blockquote'],
                             },
                             list: {
                               options: ['unordered', 'ordered'],
                             },
                           }}
                         />
                       </Paper>
                     </Grid>
                   </Grid>
                 )}

                 {activeTab === 2 && (
                   <Grid container spacing={3}>
                     {/* English Title */}
                     <Grid item xs={12}>
                       <TextField
                         label="Title (EN)"
                         fullWidth
                         required
                         value={editingAdventure.translations.en.title}
                         onChange={(e) => setEditingAdventure({
                           ...editingAdventure,
                           translations: {
                             ...editingAdventure.translations,
                             en: { ...editingAdventure.translations.en, title: e.target.value }
                           }
                         })}
                         margin="normal"
                       />
                     </Grid>

                     {/* English Description with WYSIWYG Editor */}
                     <Grid item xs={12}>
                       <Typography variant="subtitle1" gutterBottom>
                         Description (EN)
                       </Typography>
                       <Paper sx={{ p: 1, border: '1px solid #ddd', borderRadius: 1, mb: 2 }}>
                         <Editor
                           editorState={editorStateEN}
                           onEditorStateChange={onEditorStateChangeEN}
                           wrapperClassName="wrapper-class"
                           editorClassName="editor-class"
                           toolbarClassName="toolbar-class"
                           toolbar={{
                             options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'colorPicker', 'link', 'history'],
                             inline: {
                               options: ['bold', 'italic', 'underline', 'strikethrough'],
                             },
                             blockType: {
                               options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Blockquote'],
                             },
                             list: {
                               options: ['unordered', 'ordered'],
                             },
                           }}
                         />
                       </Paper>
                     </Grid>
                   </Grid>
                 )}

                 {activeTab === 3 && (
                   <Grid item xs={12}>
                     <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                       <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                         Date e Orari Disponibili
                       </Typography>
                       <Grid container spacing={2} alignItems="flex-end">
                         <Grid item xs={12} md={4}>
                           <TextField
                             label="Data"
                             type="date"
                             fullWidth
                             value={selectedDateString}
                             onChange={(e) => setSelectedDateString(e.target.value)}
                             InputLabelProps={{ shrink: true }}
                             margin="normal"
                             inputProps={{ min: new Date().toISOString().split('T')[0] }}
                           />
                         </Grid>
                         <Grid item xs={12} md={3}>
                           <TextField
                             label="Ora Inizio"
                             type="time"
                             fullWidth
                             value={selectedTime[0]}
                             onChange={(e) => setSelectedTime([e.target.value, selectedTime[1]])}
                             margin="normal"
                             InputLabelProps={{ shrink: true }}
                           />
                         </Grid>
                         <Grid item xs={12} md={3}>
                           <TextField
                             label="Ora Fine"
                             type="time"
                             fullWidth
                             value={selectedTime[1]}
                             onChange={(e) => setSelectedTime([selectedTime[0], e.target.value])}
                             margin="normal"
                             InputLabelProps={{ shrink: true }}
                           />
                         </Grid>
                         <Grid item xs={12} md={2}>
                           <Button
                             variant="contained"
                             color="primary"
                             onClick={handleAddDate}
                             disabled={!selectedDateString}
                             fullWidth
                           >
                             Aggiungi
                           </Button>
                         </Grid>
                       </Grid>

                       <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 2, maxHeight: '200px', overflow: 'auto' }}>
                         <Typography variant="subtitle2" gutterBottom>
                           Date Aggiunte:
                         </Typography>
                         {editingAdventure.available_dates.length === 0 ? (
                           <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                             Nessuna data specificata.
                           </Typography>
                         ) : (
                           <Grid container spacing={1}>
                             {editingAdventure.available_dates.map(({ date, time }) => (
                               <Grid item xs={12} sm={6} md={4} key={date}>
                                 <Chip
                                   label={`${format(new Date(`${date}T00:00:00`), 'dd/MM/yyyy')} (${time[0]}-${time[1]})`}
                                   onDelete={() => handleRemoveDate(date)}
                                   sx={{ width: '100%' }}
                                 />
                               </Grid>
                             ))}
                           </Grid>
                         )}
                       </Box>
                     </Paper>
                   </Grid>
                 )}
               </LocalizationProvider>
             )}
           </DialogContent>
           <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
             <Button onClick={handleCancel} color="inherit" startIcon={<XIcon />}>
               Annulla
             </Button>
             <Button 
               onClick={handleSave} 
               variant="contained" 
               color="primary" 
               startIcon={<SaveIcon />}
               disabled={isUploading}
             >
               {isUploading ? 'Caricamento...' : 'Salva Avventura'}
             </Button>
           </DialogActions>
         </Dialog>

         {/* Edit Dialog for Trekking Content */}
         <Dialog 
           open={openContentDialog} 
           onClose={handleCancelContent}
           fullWidth
           maxWidth="md"
           PaperProps={{
             sx: { borderRadius: 2 }
           }}
         >
           <DialogTitle sx={{ 
             bgcolor: 'success.main', 
             color: 'white',
             display: 'flex',
             justifyContent: 'space-between',
             alignItems: 'center'
           }}>
             <Typography variant="h6">
               Modifica Sezione Trekking e Natura
             </Typography>
             <IconButton 
               edge="end" 
               color="inherit" 
               onClick={handleCancelContent}
               aria-label="close"
             >
               <XIcon />
             </IconButton>
           </DialogTitle>
           <DialogContent dividers>
             {editingContent && (
               <Grid container spacing={3}>
                 {/* Image Upload */}
                 <Grid item xs={12}>
                   <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                     <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                       Immagine
                     </Typography>
                     <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                         <Button
                           variant="outlined"
                           component="label"
                           disabled={isUploading}
                         >
                           {isUploading ? 'Caricamento...' : 'Carica immagine'}
                           <input
                             type="file"
                             accept="image/png, image/jpeg, image/webp"
                             onChange={handleContentImageUpload}
                             hidden
                           />
                         </Button>
                         {isUploading && <CircularProgress size={24} />}
                       </Box>
                       {editingContent.image_url && (
                         <Box sx={{ mt: 2 }}>
                           <img
                             src={editingContent.image_url}
                             alt="Anteprima"
                             style={{ 
                               maxHeight: '200px', 
                               maxWidth: '100%', 
                               objectFit: 'contain',
                               borderRadius: '8px',
                               border: '1px solid #eee'
                             }}
                           />
                         </Box>
                       )}
                     </Box>
                   </Paper>
                 </Grid>

                 {/* Italian Content */}
                 <Grid item xs={12}>
                   <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                     <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                       Contenuto Italiano
                     </Typography>
                     <TextField
                       label="Titolo (IT)"
                       fullWidth
                       required
                       value={editingContent.translations?.it?.title || editingContent.title}
                       onChange={(e) => setEditingContent({
                         ...editingContent,
                         translations: {
                           ...editingContent.translations,
                           it: { 
                             ...editingContent.translations?.it,
                             title: e.target.value 
                           }
                         }
                       })}
                       margin="normal"
                     />
                     <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                       Descrizione (IT)
                     </Typography>
                     <Paper sx={{ p: 1, border: '1px solid #ddd', borderRadius: 1, mb: 2 }}>
                       <Editor
                         editorState={contentEditorStateIT}
                         onEditorStateChange={onContentEditorStateChangeIT}
                         wrapperClassName="wrapper-class"
                         editorClassName="editor-class"
                         toolbarClassName="toolbar-class"
                         toolbar={{
                           options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'colorPicker', 'link', 'history'],
                           inline: {
                             options: ['bold', 'italic', 'underline', 'strikethrough'],
                           },
                           blockType: {
                             options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Blockquote'],
                           },
                           list: {
                             options: ['unordered', 'ordered'],
                           },
                         }}
                       />
                     </Paper>
                   </Paper>
                 </Grid>

                 {/* English Content */}
                 <Grid item xs={12}>
                   <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                     <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                       Contenuto Inglese
                     </Typography>
                     <TextField
                       label="Title (EN)"
                       fullWidth
                       required
                       value={editingContent.translations?.en?.title || editingContent.title}
                       onChange={(e) => setEditingContent({
                         ...editingContent,
                         translations: {
                           ...editingContent.translations,
                           en: { 
                             ...editingContent.translations?.en,
                             title: e.target.value 
                           }
                         }
                       })}
                       margin="normal"
                     />
                     <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                       Description (EN)
                     </Typography>
                     <Paper sx={{ p: 1, border: '1px solid #ddd', borderRadius: 1, mb: 2 }}>
                       <Editor
                         editorState={contentEditorStateEN}
                         onEditorStateChange={onContentEditorStateChangeEN}
                         wrapperClassName="wrapper-class"
                         editorClassName="editor-class"
                         toolbarClassName="toolbar-class"
                         toolbar={{
                           options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'colorPicker', 'link', 'history'],
                           inline: {
                             options: ['bold', 'italic', 'underline', 'strikethrough'],
                           },
                           blockType: {
                             options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Blockquote'],
                           },
                           list: {
                             options: ['unordered', 'ordered'],
                           },
                         }}
                       />
                     </Paper>
                   </Paper>
                 </Grid>
               </Grid>
             )}
           </DialogContent>
           <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
             <Button onClick={handleCancelContent} color="inherit" startIcon={<XIcon />}>
               Annulla
             </Button>
             <Button 
               onClick={handleSaveContent} 
               variant="contained" 
               color="primary" 
               startIcon={<SaveIcon />}
               disabled={isUploading}
             >
               {isUploading ? 'Caricamento...' : 'Salva Contenuto'}
             </Button>
           </DialogActions>
         </Dialog>
       </Container>
     </Box>
   );
}