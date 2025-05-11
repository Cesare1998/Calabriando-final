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
  Tabs,
  Tab
} from '@mui/material';
import { 
  Add as PlusIcon, 
  Edit as EditIcon, 
  Delete as TrashIcon, 
  Save as SaveIcon, 
  Close as XIcon, 
  Logout as LogOutIcon,
  YouTube as YouTubeIcon,
  Visibility as EyeIcon,
  VisibilityOff as EyeOffIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { it } from 'date-fns/locale';
import { format } from 'date-fns';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, ContentState, convertToRaw, convertFromHTML } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

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
  location?: string;
}

const CATEGORIES: Record<Tour['category'], string> = {
  city: 'Tour in Città',
  region: 'Tour in Calabria',
  unique: 'Esperienze Uniche'
};

const EMPTY_TOUR: Tour = {
  id: '',
  title: '',
  description: '',
  image_url: '',
  duration: '',
  price: 0,
  max_participants: 1,
  available_dates: [],
  category: 'city',
  translations: {
    it: { title: '', description: '' },
    en: { title: '', description: '' }
  },
  youtube_video_id: '',
  show_video: false
};

export default function AdminDashboard_tour() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [tours, setTours] = useState<Tour[]>([]);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Tour['category']>('city');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<[string, string]>(['09:00', '17:00']);
  const [isUploading, setIsUploading] = useState(false);
  const [youtubeIdInput, setYoutubeIdInput] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editorStateIT, setEditorStateIT] = useState(EditorState.createEmpty());
  const [editorStateEN, setEditorStateEN] = useState(EditorState.createEmpty());
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    checkAuth();
    loadTours();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
    }
  };

  const loadTours = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTours(data || []);
    } catch (err: any) {
      console.error('Error loading tours:', err);
      alert(`Errore nel caricamento dei tour: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editingTour) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${editingTour.category}-${Date.now()}.${fileExt}`;
    const storagePath = `tours/${fileName}`;

    setIsUploading(true);
    try {
      if (!isAdding && editingTour.image_url) {
        try {
          const oldImagePath = editingTour.image_url.substring(editingTour.image_url.indexOf('/tours/'));
          if (oldImagePath && oldImagePath.length > 1) {
            await supabase.storage.from('images').remove([oldImagePath.substring(1)]);
          }
        } catch (deleteError) {
          console.warn("Could not delete previous image:", deleteError);
        }
      }

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

      setEditingTour({
        ...editingTour,
        image_url: publicUrl
      });

    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(`Errore durante il caricamento dell'immagine: ${error.message || 'Riprova.'}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const handleAddNew = (category: Tour['category']) => {
    setSelectedDate(null);
    setSelectedTime(['09:00', '17:00']);
    setEditingTour({ ...EMPTY_TOUR, category });
    setEditorStateIT(EditorState.createEmpty());
    setEditorStateEN(EditorState.createEmpty());
    setIsAdding(true);
    setYoutubeIdInput('');
    setOpenDialog(true);
    setActiveTab(0);
  };

  const handleEdit = (tour: Tour) => {
    setSelectedDate(null);
    setSelectedTime(['09:00', '17:00']);
    setEditingTour({
      ...tour,
      translations: {
        it: { ...tour.translations?.it },
        en: { ...tour.translations?.en }
      },
      available_dates: Array.isArray(tour.available_dates) ? [...tour.available_dates] : [],
      youtube_video_id: tour.youtube_video_id || '',
      show_video: tour.show_video || false
    });

    // Initialize editor states with content
    const contentBlocksIT = convertFromHTML(tour.translations?.it?.description || tour.description || '');
    const contentStateIT = ContentState.createFromBlockArray(
      contentBlocksIT.contentBlocks,
      contentBlocksIT.entityMap
    );
    setEditorStateIT(EditorState.createWithContent(contentStateIT));

    const contentBlocksEN = convertFromHTML(tour.translations?.en?.description || '');
    const contentStateEN = ContentState.createFromBlockArray(
      contentBlocksEN.contentBlocks,
      contentBlocksEN.entityMap
    );
    setEditorStateEN(EditorState.createWithContent(contentStateEN));

    setIsAdding(false);
    setYoutubeIdInput(tour.youtube_video_id || '');
    setOpenDialog(true);
    setActiveTab(0);
  };

  const handleDelete = async (id: string, imageUrl?: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo tour? L\'azione è irreversibile.')) return;

    try {
      if (imageUrl) {
        try {
          const imagePath = imageUrl.substring(imageUrl.indexOf('/tours/'));
          if (imagePath && imagePath.length > 1) {
            await supabase.storage.from('images').remove([imagePath.substring(1)]);
          }
        } catch (storageError) {
          console.warn("Could not delete image from storage:", storageError);
        }
      }

      const { error } = await supabase
        .from('tours')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTours(tours.filter(tour => tour.id !== id));
      alert('Tour eliminato con successo.');
    } catch (err: any) {
      console.error('Error deleting tour:', err);
      alert(`Errore durante l'eliminazione del tour: ${err.message}`);
    }
  };

  const handleAddDate = () => {
    if (!editingTour || !selectedDate) {
      alert('Per favore, seleziona una data valida.');
      return;
    }
    if (!selectedTime[0] || !selectedTime[1]) {
      alert('Per favore, inserisci orario di inizio e fine.');
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    if (editingTour.available_dates.some(d => d.date === dateStr)) {
      alert('Questa data è già stata aggiunta.');
      return;
    }

    const newDate = {
      date: dateStr,
      time: selectedTime
    };

    setEditingTour({
      ...editingTour,
      available_dates: [...editingTour.available_dates, newDate]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    });

    setSelectedDate(null);
  };

  const handleRemoveDate = (dateToRemove: string) => {
    if (!editingTour) return;

    setEditingTour({
      ...editingTour,
      available_dates: editingTour.available_dates.filter(d => d.date !== dateToRemove)
    });
  };

  const handleToggleVideoVisibility = () => {
    if (!editingTour) return;
    
    setEditingTour({
      ...editingTour,
      show_video: !editingTour.show_video
    });
  };

  const handleYoutubeIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYoutubeIdInput(e.target.value);
  };

  const handleYoutubeIdKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && editingTour) {
      e.preventDefault();
      setEditingTour({
        ...editingTour,
        youtube_video_id: youtubeIdInput
      });
    }
  };

  const handleYoutubeIdBlur = () => {
    if (editingTour && youtubeIdInput !== editingTour.youtube_video_id) {
      setEditingTour({
        ...editingTour,
        youtube_video_id: youtubeIdInput
      });
    }
  };

  const onEditorStateChangeIT = (editorState: EditorState) => {
    setEditorStateIT(editorState);
  };

  const onEditorStateChangeEN = (editorState: EditorState) => {
    setEditorStateEN(editorState);
  };

  const handleSave = async () => {
    if (!editingTour) return;

    if (!editingTour.translations?.it?.title || !editingTour.translations?.en?.title) {
      alert('Per favore, inserisci il titolo del tour in Italiano e Inglese.');
      return;
    }
    if (!editingTour.image_url) {
      alert('Per favore, carica un\'immagine per il tour.');
      return;
    }
    if (editingTour.price < 0) {
      alert('Il prezzo non può essere negativo.');
      return;
    }
    if (editingTour.max_participants <= 0) {
      alert('Il numero massimo di partecipanti deve essere almeno 1.');
      return;
    }
    if (editingTour.available_dates.length === 0) {
      if(!confirm('Non hai aggiunto date disponibili. Vuoi salvare comunque?')) {
        return;
      }
    }
     
    if (editingTour.youtube_video_id) {
      if (!/^[a-zA-Z0-9_-]{11}$/.test(editingTour.youtube_video_id)) {
        if (!confirm('L\'ID del video YouTube non sembra valido. Vuoi salvare comunque?')) {
          return;
        }
      }
    }

    try {
      // Convert editor state to HTML
      const descriptionIT = draftToHtml(convertToRaw(editorStateIT.getCurrentContent()));
      const descriptionEN = draftToHtml(convertToRaw(editorStateEN.getCurrentContent()));

      const tourData: Omit<Tour, 'id' | 'created_at'> = {
        title: editingTour.translations.it.title,
        description: descriptionIT,
        image_url: editingTour.image_url,
        duration: editingTour.duration,
        price: editingTour.price,
        max_participants: editingTour.max_participants,
        available_dates: editingTour.available_dates,
        category: editingTour.category,
        translations: {
          it: {
            title: editingTour.translations.it.title || '',
            description: descriptionIT
          },
          en: {
            title: editingTour.translations.en.title || '',
            description: descriptionEN
          }
        },
        youtube_video_id: editingTour.youtube_video_id || null,
        show_video: editingTour.show_video || false,
        location: editingTour.location
      };

      if (isAdding) {
        const { data, error } = await supabase
          .from('tours')
          .insert([tourData])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setTours([data, ...tours]);
          alert('Tour aggiunto con successo!');
        }
      } else {
        const { error } = await supabase
          .from('tours')
          .update(tourData)
          .eq('id', editingTour.id);

        if (error) throw error;
        setTours(tours.map(t => (t.id === editingTour.id ? { ...t, ...tourData, id: editingTour.id } : t)));
        alert('Tour aggiornato con successo!');
      }

      setOpenDialog(false);
      setEditingTour(null);
      setIsAdding(false);
    } catch (err: any) {
      console.error('Error saving tour:', err);
      alert(`Errore durante il salvataggio del tour: ${err.message}`);
    }
  };

  const handleCancel = () => {
    setOpenDialog(false);
    setEditingTour(null);
    setIsAdding(false);
    setSelectedDate(null);
    setSelectedTime(['09:00', '17:00']);
    setYoutubeIdInput('');
  };

  const filteredTours = tours.filter(tour => tour.category === selectedCategory);

  if (loading && tours.length === 0) {
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
                Gestione Tour
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
        {/* Category Tabs */}
        <Paper sx={{ mb: 4, borderRadius: 2 }}>
          <Tabs
            value={selectedCategory}
            onChange={(_e, value) => setSelectedCategory(value)}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            {(Object.entries(CATEGORIES) as [Tour['category'], string][]).map(([key, label]) => (
              <Tab key={key} label={label} value={key} />
            ))}
          </Tabs>
          
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlusIcon />}
              onClick={() => handleAddNew(selectedCategory)}
            >
              Aggiungi Tour ({CATEGORIES[selectedCategory]})
            </Button>
          </Box>
        </Paper>

        {/* Tours List */}
        <Grid container spacing={3}>
          {filteredTours.map((tour) => (
            <Grid item xs={12} md={6} key={tour.id}>
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
                    image={tour.image_url || '/images/placeholder.jpg'}
                    alt={tour.translations.it.title}
                  />
                  {tour.youtube_video_id && (
                    <Chip
                      icon={<YouTubeIcon />}
                      label={tour.show_video ? "Video visibile" : "Video nascosto"}
                      color={tour.show_video ? "success" : "default"}
                      size="small"
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    />
                  )}
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {tour.translations.it.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 60, overflow: 'hidden' }}>
                    <div dangerouslySetInnerHTML={{ __html: tour.translations.it.description.substring(0, 120) + (tour.translations.it.description.length > 120 ? '...' : '') }} />
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Durata:</strong> {tour.duration}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Prezzo:</strong> €{tour.price}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Max Pax:</strong> {tour.max_participants}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Date:</strong> {tour.available_dates?.length || 0}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEdit(tour)}
                  >
                    Modifica
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<TrashIcon />}
                    onClick={() => handleDelete(tour.id, tour.image_url)}
                  >
                    Elimina
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredTours.length === 0 && !loading && (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nessun tour trovato in questa categoria.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlusIcon />}
              onClick={() => handleAddNew(selectedCategory)}
              sx={{ mt: 2 }}
            >
              Aggiungi il primo tour
            </Button>
          </Paper>
        )}

        {/* Edit/Add Dialog */}
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
              {isAdding ? `Nuovo Tour - ${CATEGORIES[editingTour?.category || 'city']}` : 'Modifica Tour'}
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
            {editingTour && (
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Tab label="Informazioni di Base" />
                  <Tab label="Contenuto Italiano" />
                  <Tab label="Contenuto Inglese" />
                  <Tab label="Video YouTube" />
                  <Tab label="Date Disponibili" />
                </Tabs>

                {activeTab === 0 && (
                  <Grid container spacing={3}>
                    {/* Image Upload */}
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          Immagine Copertina
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
                          {editingTour.image_url && (
                            <Box sx={{ mt: 2 }}>
                              <img
                                src={editingTour.image_url}
                                alt="Anteprima Tour"
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

                    {/* Tour Details */}
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          Dettagli Tour
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Durata (es. 3 ore)"
                              fullWidth
                              value={editingTour.duration}
                              onChange={(e) => setEditingTour({ ...editingTour, duration: e.target.value })}
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Prezzo (€)"
                              type="number"
                              fullWidth
                              required
                              value={editingTour.price}
                              onChange={(e) => setEditingTour({ 
                                ...editingTour, 
                                price: Number(e.target.value) < 0 ? 0 : Number(e.target.value) 
                              })}
                              margin="normal"
                              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Max Partecipanti"
                              type="number"
                              fullWidth
                              required
                              value={editingTour.max_participants}
                              onChange={(e) => setEditingTour({ 
                                ...editingTour, 
                                max_participants: Number(e.target.value) < 1 ? 1 : Math.floor(Number(e.target.value)) 
                              })}
                              margin="normal"
                              InputProps={{ inputProps: { min: 1, step: 1 } }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              label="Posizione / Luogo"
                              fullWidth
                              value={editingTour.location || ''}
                              onChange={(e) => setEditingTour({ 
                                ...editingTour, 
                                location: e.target.value
                              })}
                              margin="normal"
                              placeholder="Es. Tropea, Calabria"
                            />
                          </Grid>
                        </Grid>
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
                        value={editingTour.translations.it.title}
                        onChange={(e) => setEditingTour({
                          ...editingTour,
                          translations: {
                            ...editingTour.translations,
                            it: { ...editingTour.translations.it, title: e.target.value }
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
                        value={editingTour.translations.en.title}
                        onChange={(e) => setEditingTour({
                          ...editingTour,
                          translations: {
                            ...editingTour.translations,
                            en: { ...editingTour.translations.en, title: e.target.value }
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <YouTubeIcon color="error" />
                        <Typography variant="subtitle1" fontWeight="bold">
                          Video YouTube
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TextField
                          label="ID Video YouTube"
                          placeholder="Es. dQw4w9WgXcQ"
                          fullWidth
                          value={youtubeIdInput}
                          onChange={handleYoutubeIdChange}
                          onKeyDown={handleYoutubeIdKeyDown}
                          onBlur={handleYoutubeIdBlur}
                          helperText="Inserisci solo l'ID del video (es. dQw4w9WgXcQ da https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
                          margin="normal"
                        />
                        <IconButton
                          onClick={handleToggleVideoVisibility}
                          color={editingTour.show_video ? "success" : "default"}
                          sx={{ mt: 2 }}
                        >
                          {editingTour.show_video ? <EyeIcon /> : <EyeOffIcon />}
                        </IconButton>
                      </Box>
                      
                      {editingTour.youtube_video_id && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            Anteprima:
                          </Typography>
                          <Box sx={{ 
                            position: 'relative',
                            paddingTop: '56.25%', // 16:9 aspect ratio
                            borderRadius: 1,
                            overflow: 'hidden'
                          }}>
                            <iframe
                              src={`https://www.youtube.com/embed/${editingTour.youtube_video_id}`}
                              title="YouTube video preview"
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
                          </Box>
                          <Typography variant="body2" color={editingTour.show_video ? "success.main" : "text.secondary"} sx={{ mt: 1 }}>
                            {editingTour.show_video ? 'Video visibile sul sito' : 'Video nascosto sul sito'}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                )}

                {activeTab === 4 && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Date e Orari Disponibili
                      </Typography>
                      <Grid container spacing={2} alignItems="flex-end">
                        <Grid item xs={12} md={4}>
                          <DatePicker
                            label="Seleziona Data"
                            value={selectedDate}
                            onChange={(date) => setSelectedDate(date)}
                            disablePast
                            slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
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
                            disabled={!selectedDate}
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
                        {editingTour.available_dates.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Nessuna data specificata.
                          </Typography>
                        ) : (
                          <Grid container spacing={1}>
                            {editingTour.available_dates.map(({ date, time }) => (
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
              {isUploading ? 'Caricamento...' : 'Salva Tour'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}