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
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  Restaurant as RestaurantIcon,
  Museum as MuseumIcon,
  Hiking as HikingIcon
} from '@mui/icons-material';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, ContentState, convertToRaw, convertFromHTML } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

interface Suggestion {
  id: string;
  section: string;
  title: string;
  description: string;
  image_url: string;
  section_group: string;
  display_order: number;
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

export default function AdminDashboard_suggestions() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editorStateIT, setEditorStateIT] = useState(EditorState.createEmpty());
  const [editorStateEN, setEditorStateEN] = useState(EditorState.createEmpty());
  const [activeTab, setActiveTab] = useState(0);
  const [expandedGroup, setExpandedGroup] = useState<string | null>('experiences');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedGroup(isExpanded ? panel : null);
  };

  useEffect(() => {
    checkAuth();
    loadSuggestions();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
    }
  };

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .in('section', ['experience-trekking', 'experience-food', 'experience-culture'])
        .order('display_order');

      if (error) throw error;
      
      const processedData = (data || []).map(item => ({
        ...item,
        translations: {
          it: { 
            title: item.translations?.it?.title || item.title || '',
            description: item.translations?.it?.description || item.description || ''
          },
          en: { 
            title: item.translations?.en?.title || '',
            description: item.translations?.en?.description || ''
          }
        }
      }));
      
      setSuggestions(processedData);
    } catch (err) {
      console.error('Error loading suggestions:', err);
      alert('Errore nel caricamento dei suggerimenti.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const handleAddNew = () => {
    const newSuggestion = {
      id: '',
      section: '',
      title: '',
      description: '',
      image_url: '',
      section_group: 'experiences',
      display_order: suggestions.length > 0 ? Math.max(...suggestions.map(s => s.display_order || 0)) + 10 : 100,
      translations: {
        it: { title: '', description: '' },
        en: { title: '', description: '' }
      }
    };
    
    setEditingSuggestion(newSuggestion);
    setEditorStateIT(EditorState.createEmpty());
    setEditorStateEN(EditorState.createEmpty());
    setIsAdding(true);
    setOpenDialog(true);
    setActiveTab(0);
  };

  const handleEdit = (suggestion: Suggestion) => {
    // Initialize editor states with content
    const contentBlocksIT = convertFromHTML(suggestion.translations?.it?.description || suggestion.description || '');
    const contentStateIT = ContentState.createFromBlockArray(
      contentBlocksIT.contentBlocks,
      contentBlocksIT.entityMap
    );
    setEditorStateIT(EditorState.createWithContent(contentStateIT));

    const contentBlocksEN = convertFromHTML(suggestion.translations?.en?.description || '');
    const contentStateEN = ContentState.createFromBlockArray(
      contentBlocksEN.contentBlocks,
      contentBlocksEN.entityMap
    );
    setEditorStateEN(EditorState.createWithContent(contentStateEN));

    setEditingSuggestion(suggestion);
    setIsAdding(false);
    setOpenDialog(true);
    setActiveTab(0);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo suggerimento?')) return;

    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSuggestions(suggestions.filter(s => s.id !== id));
      alert('Suggerimento eliminato con successo.');
    } catch (err) {
      console.error('Error deleting suggestion:', err);
      alert('Errore durante l\'eliminazione del suggerimento.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editingSuggestion) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `suggestions/${Date.now()}.${fileExt}`;

    setIsUploading(true);
    try {
      // Delete old image if it exists and is stored in Supabase
      if (!isAdding && editingSuggestion.image_url && editingSuggestion.image_url.includes(import.meta.env.VITE_SUPABASE_URL)) {
        try {
          const oldImagePath = editingSuggestion.image_url.split('/storage/v1/object/public/')[1];
          if (oldImagePath) {
            await supabase.storage.from('images').remove([oldImagePath]);
          }
        } catch (deleteError) {
          console.warn("Could not delete previous image:", deleteError);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error("Could not get public URL for uploaded image.");
      }

      setEditingSuggestion({
        ...editingSuggestion,
        image_url: urlData.publicUrl
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Errore durante il caricamento dell\'immagine. Riprova.');
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

  const handleSave = async () => {
    if (!editingSuggestion) return;

    // Validation
    if (!editingSuggestion.translations?.it?.title || !editingSuggestion.translations?.en?.title) {
      alert('Per favore, inserisci il titolo in Italiano e Inglese.');
      return;
    }
    if (!editingSuggestion.image_url) {
      alert('Per favore, carica un\'immagine per il suggerimento.');
      return;
    }
    if (!editingSuggestion.section) {
      alert('Per favore, seleziona una sezione.');
      return;
    }

    try {
      // Convert editor state to HTML
      const descriptionIT = draftToHtml(convertToRaw(editorStateIT.getCurrentContent()));
      const descriptionEN = draftToHtml(convertToRaw(editorStateEN.getCurrentContent()));

      const suggestionData = {
        section: editingSuggestion.section,
        title: editingSuggestion.translations.it.title,
        description: descriptionIT,
        image_url: editingSuggestion.image_url,
        section_group: 'experiences',
        display_order: editingSuggestion.display_order,
        translations: {
          it: {
            title: editingSuggestion.translations.it.title,
            description: descriptionIT
          },
          en: {
            title: editingSuggestion.translations.en.title,
            description: descriptionEN
          }
        }
      };

      if (isAdding) {
        const { data, error } = await supabase
          .from('content')
          .insert([suggestionData])
          .select();

        if (error) throw error;
        if (data) {
          setSuggestions([...suggestions, data[0]]);
          alert('Suggerimento aggiunto con successo!');
        }
      } else {
        const { error } = await supabase
          .from('content')
          .update(suggestionData)
          .eq('id', editingSuggestion.id);

        if (error) throw error;
        setSuggestions(suggestions.map(s => s.id === editingSuggestion.id ? { ...s, ...suggestionData, id: editingSuggestion.id } : s));
        alert('Suggerimento aggiornato con successo!');
      }

      setOpenDialog(false);
      setEditingSuggestion(null);
      setIsAdding(false);
    } catch (err) {
      console.error('Error saving suggestion:', err);
      alert('Errore durante il salvataggio del suggerimento.');
    }
  };

  const handleCancel = () => {
    setOpenDialog(false);
    setEditingSuggestion(null);
    setIsAdding(false);
  };

  const getSectionIcon = (section: string) => {
    if (section.includes('trekking')) return <HikingIcon />;
    if (section.includes('food')) return <RestaurantIcon />;
    if (section.includes('culture')) return <MuseumIcon />;
    return null;
  };

  const getSectionName = (section: string) => {
    if (section === 'experience-trekking') return 'Trekking e Natura';
    if (section === 'experience-food') return 'Gastronomia';
    if (section === 'experience-culture') return 'Arte e Cultura';
    return section;
  };

  if (loading && suggestions.length === 0) {
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
                Gestione I Nostri Suggerimenti
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
        {/* Add New Button */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlusIcon />}
            onClick={handleAddNew}
          >
            Aggiungi Nuovo Suggerimento
          </Button>
        </Box>

        {/* Suggestions List */}
        <Accordion 
          expanded={expandedGroup === 'experiences'} 
          onChange={handleAccordionChange('experiences')}
          sx={{ 
            mb: 2, 
            borderRadius: 2, 
            overflow: 'hidden',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              '& .MuiAccordionSummary-expandIconWrapper': {
                color: 'white'
              }
            }}
          >
            <Typography variant="h6">I Nostri Suggerimenti</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <Box sx={{ p: 2 }}>
              <Grid container spacing={3}>
                {suggestions.map((suggestion) => (
                  <Grid item xs={12} md={6} key={suggestion.id}>
                    <Card sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[6]
                      }
                    }}>
                      <Box sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          height="200"
                          image={suggestion.image_url || '/images/placeholder.jpg'}
                          alt={suggestion.translations.it.title}
                        />
                        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                          <Chip
                            icon={getSectionIcon(suggestion.section)}
                            label={getSectionName(suggestion.section)}
                            color="primary"
                            sx={{ color: 'white', fontWeight: 'medium' }}
                          />
                        </Box>
                      </Box>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h2" gutterBottom>
                          {suggestion.translations.it.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} component="div">
                          <div dangerouslySetInnerHTML={{ __html: suggestion.translations.it.description.substring(0, 150) + (suggestion.translations.it.description.length > 150 ? '...' : '') }} />
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            ID: {suggestion.id.substring(0, 8)}...
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Ordine: {suggestion.display_order}
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEdit(suggestion)}
                        >
                          Modifica
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<TrashIcon />}
                          onClick={() => handleDelete(suggestion.id)}
                        >
                          Elimina
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {suggestions.length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Nessun suggerimento disponibile.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlusIcon />}
                    onClick={handleAddNew}
                    sx={{ mt: 2 }}
                  >
                    Aggiungi il primo suggerimento
                  </Button>
                </Paper>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

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
              {isAdding ? 'Nuovo Suggerimento' : 'Modifica Suggerimento'}
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
            {editingSuggestion && (
              <>
                <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Tab label="Informazioni di Base" />
                  <Tab label="Contenuto Italiano" />
                  <Tab label="Contenuto Inglese" />
                </Tabs>

                {activeTab === 0 && (
                  <Grid container spacing={3}>
                    {/* Section Type */}
                    <Grid item xs={12}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel id="section-select-label">Tipo di Suggerimento *</InputLabel>
                        <Select
                          labelId="section-select-label"
                          value={editingSuggestion.section}
                          label="Tipo di Suggerimento *"
                          onChange={(e) => setEditingSuggestion({
                            ...editingSuggestion,
                            section: e.target.value
                          })}
                          required
                        >
                          <MenuItem value="experience-trekking">Trekking e Natura</MenuItem>
                          <MenuItem value="experience-food">Gastronomia</MenuItem>
                          <MenuItem value="experience-culture">Arte e Cultura</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Display Order */}
                    <Grid item xs={12}>
                      <TextField
                        label="Ordine di Visualizzazione"
                        type="number"
                        fullWidth
                        value={editingSuggestion.display_order}
                        onChange={(e) => setEditingSuggestion({
                          ...editingSuggestion,
                          display_order: parseInt(e.target.value)
                        })}
                        margin="normal"
                        helperText="Numeri più bassi vengono mostrati prima"
                      />
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
                          {editingSuggestion.image_url && (
                            <Box sx={{ mt: 2 }}>
                              <img
                                src={editingSuggestion.image_url}
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
                        value={editingSuggestion.translations.it.title}
                        onChange={(e) => setEditingSuggestion({
                          ...editingSuggestion,
                          translations: {
                            ...editingSuggestion.translations,
                            it: { ...editingSuggestion.translations.it, title: e.target.value }
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
                            textAlign: {
                              options: ['left', 'center', 'right', 'justify'],
                            },
                            colorPicker: {},
                            link: {
                              options: ['link', 'unlink'],
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
                        value={editingSuggestion.translations.en.title}
                        onChange={(e) => setEditingSuggestion({
                          ...editingSuggestion,
                          translations: {
                            ...editingSuggestion.translations,
                            en: { ...editingSuggestion.translations.en, title: e.target.value }
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
                            textAlign: {
                              options: ['left', 'center', 'right', 'justify'],
                            },
                            colorPicker: {},
                            link: {
                              options: ['link', 'unlink'],
                            },
                          }}
                        />
                      </Paper>
                    </Grid>
                  </Grid>
                )}
              </>
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
              {isUploading ? 'Caricamento...' : 'Salva Suggerimento'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}