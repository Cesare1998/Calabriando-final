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
  Divider,
  Paper,
  TextField,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  useTheme,
  Tabs,
  Tab,
  useMediaQuery,
  MenuItem,
  Select,
  FormControl,
  InputLabel
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
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Image as ImageIcon,
  YouTube as YouTubeIcon
} from '@mui/icons-material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, ContentState, convertToRaw, convertFromHTML } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

interface Content {
  id: string;
  section: string;
  title: string;
  description: string;
  image_url: string | null;
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

const SECTION_GROUPS = {
  hero: 'Sezione Slide Show',
  main: 'Sezione Principale',
  special: 'Sezione Speciale',
  experiences: 'Sezione Esperienze',
  tours: 'Sezione Tour',
  cta: 'Sezione Motivazionale',
  footer: 'Sezione di Fondo'
};

const getDefaultNewContent = (): Omit<Content, 'id' | 'display_order'> => ({
  section: '',
  title: '',
  description: '',
  image_url: null,
  section_group: 'main',
  translations: {
    it: { title: '', description: '' },
    en: { title: '', description: '' }
  }
});

export default function AdminDashboard_home() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [contents, setContents] = useState<Content[]>([]);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newContentData, setNewContentData] = useState<Omit<Content, 'id' | 'display_order'>>(getDefaultNewContent);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | false>('hero');
  const [editorStateIT, setEditorStateIT] = useState(EditorState.createEmpty());
  const [editorStateEN, setEditorStateEN] = useState(EditorState.createEmpty());
  const [activeTab, setActiveTab] = useState(0);

  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedGroup(isExpanded ? panel : false);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
    }
  };

  const loadContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('display_order');

      if (error) throw error;

      const processedData = (data || []).map(item => ({
        ...item,
        translations: {
          it: {
            title: item.translations?.it?.title ?? item.title ?? '',
            description: item.translations?.it?.description ?? item.description ?? '',
            ...(item.translations?.it || {})
          },
          en: {
            title: item.translations?.en?.title ?? '',
            description: item.translations?.en?.description ?? '',
            ...(item.translations?.en || {})
          }
        }
      }));

      setContents(processedData);
    } catch (err) {
      console.error('Error loading content:', err);
      alert('Errore nel caricamento dei contenuti.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    loadContent();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const handleEdit = (content: Content) => {
    setEditingContent({
      ...content,
      translations: {
        it: {
          title: content.title || '',
          description: content.description || '',
          ...(content.translations?.it || {})
        },
        en: {
          title: content.title || '',
          description: content.description || '',
          ...(content.translations?.en || {})
        }
      }
    });

    // Initialize editor states with content
    const contentBlocksIT = convertFromHTML(content.translations?.it?.description || content.description || '');
    const contentStateIT = ContentState.createFromBlockArray(
      contentBlocksIT.contentBlocks,
      contentBlocksIT.entityMap
    );
    setEditorStateIT(EditorState.createWithContent(contentStateIT));

    const contentBlocksEN = convertFromHTML(content.translations?.en?.description || '');
    const contentStateEN = ContentState.createFromBlockArray(
      contentBlocksEN.contentBlocks,
      contentBlocksEN.entityMap
    );
    setEditorStateEN(EditorState.createWithContent(contentStateEN));

    setIsAddingNew(false);
    setOpenDialog(true);
    setActiveTab(0);
  };

  const handleAddNewClick = () => {
    setEditingContent(null);
    setNewContentData(getDefaultNewContent());
    setEditorStateIT(EditorState.createEmpty());
    setEditorStateEN(EditorState.createEmpty());
    setIsAddingNew(true);
    setOpenDialog(true);
    setActiveTab(0);
  };

  const handleCancelNewContent = () => {
    setOpenDialog(false);
    setIsAddingNew(false);
    setNewContentData(getDefaultNewContent());
  };

  const handleSaveNewContent = async () => {
    if (!newContentData.section || !newContentData.translations.it?.title) {
      alert('Per favore, inserisci almeno la Sezione e il Titolo (IT).');
      return;
    }
    setActionLoading(true);
    try {
      const maxOrder = contents.reduce((max, c) => Math.max(max, c.display_order), -1);
      const nextOrder = maxOrder + 1;

      // Convert editor state to HTML
      const descriptionIT = draftToHtml(convertToRaw(editorStateIT.getCurrentContent()));
      const descriptionEN = draftToHtml(convertToRaw(editorStateEN.getCurrentContent()));

      const dataToInsert = {
        ...newContentData,
        title: newContentData.translations.it?.title || '',
        description: descriptionIT,
        display_order: nextOrder,
        translations: {
          ...newContentData.translations,
          it: {
            ...newContentData.translations.it,
            description: descriptionIT
          },
          en: {
            ...newContentData.translations.en,
            description: descriptionEN
          }
        }
      };

      const { error } = await supabase
        .from('content')
        .insert([dataToInsert]);

      if (error) throw error;

      setOpenDialog(false);
      setIsAddingNew(false);
      setNewContentData(getDefaultNewContent());
      await loadContent();
      alert('Contenuto aggiunto con successo!');

    } catch (err) {
      console.error('Error adding new content:', err);
      alert('Errore durante l\'aggiunta del contenuto.');
    } finally {
      setActionLoading(false);
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!editingContent) return;
    setActionLoading(true);
    try {
      // Convert editor state to HTML
      const descriptionIT = draftToHtml(convertToRaw(editorStateIT.getCurrentContent()));
      const descriptionEN = draftToHtml(convertToRaw(editorStateEN.getCurrentContent()));

      const dataToUpdate = {
        title: editingContent.translations.it?.title || '',
        description: descriptionIT,
        image_url: editingContent.image_url,
        translations: {
          ...editingContent.translations,
          it: {
            ...editingContent.translations.it,
            description: descriptionIT
          },
          en: {
            ...editingContent.translations.en,
            description: descriptionEN
          }
        },
        section: editingContent.section,
        section_group: editingContent.section_group,
      };

      const { error } = await supabase
        .from('content')
        .update(dataToUpdate)
        .eq('id', editingContent.id);

      if (error) throw error;

      setContents(contents.map(c =>
        c.id === editingContent.id ? { ...c, ...editingContent, description: descriptionIT } : c
      ));
      setOpenDialog(false);
      setEditingContent(null);
      await loadContent();
      alert('Contenuto salvato con successo!');

    } catch (err) {
      console.error('Error saving content:', err);
      alert('Errore durante il salvataggio del contenuto.');
    } finally {
      setActionLoading(false);
      setUploadingImage(false);
    }
  };

  const handleCancel = () => {
    setOpenDialog(false);
    setEditingContent(null);
    setIsAddingNew(false);
    setUploadingImage(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, context: 'edit' | 'add') => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    const sectionIdentifier = context === 'edit' 
      ? editingContent?.section 
      : newContentData.section;
      
    if (!sectionIdentifier) {
      alert('Per favore, inserisci prima il nome della Sezione.');
      e.target.value = '';
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${sectionIdentifier.replace(/\s+/g, '_').toLowerCase()}-${Date.now()}.${fileExt}`;

      let oldImageUrl: string | null = null;
      if (context === 'edit' && editingContent?.image_url) {
        oldImageUrl = editingContent.image_url;
      } else if (context === 'add' && newContentData.image_url) {
        oldImageUrl = newContentData.image_url;
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
      const publicUrl = urlData.publicUrl;

      if (context === 'edit' && editingContent) {
        setEditingContent({
          ...editingContent,
          image_url: publicUrl
        });
      } else if (context === 'add') {
        setNewContentData({
          ...newContentData,
          image_url: publicUrl
        });
      }

      if (oldImageUrl) {
        const oldFileName = oldImageUrl.substring(oldImageUrl.lastIndexOf('/') + 1);
        if (oldFileName) {
          console.log("Attempting to delete old image:", oldFileName);
          const { error: deleteError } = await supabase.storage
            .from('images')
            .remove([oldFileName]);
          if (deleteError) {
            console.error("Error deleting old image:", deleteError);
          }
        }
      }

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Errore durante il caricamento dell\'immagine. Riprova.');
      e.target.value = '';
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = async (contentToDelete: Content) => {
    if (!window.confirm(`Sei sicuro di voler eliminare la sezione "${contentToDelete.section}"? Questa azione è irreversibile.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const { error: dbError } = await supabase
        .from('content')
        .delete()
        .eq('id', contentToDelete.id);

      if (dbError) throw dbError;

      if (contentToDelete.image_url) {
        try {
          const fileName = contentToDelete.image_url.substring(contentToDelete.image_url.lastIndexOf('/') + 1);
          if (fileName) {
            const { error: storageError } = await supabase.storage
              .from('images')
              .remove([fileName]);

            if (storageError) {
              console.warn(`Record deleted, but failed to delete image ${fileName}:`, storageError.message);
              alert(`Contenuto eliminato, ma si è verificato un errore nell'eliminazione dell'immagine associata: ${storageError.message}`);
            }
          }
        } catch (storageErr) {
          console.warn(`Record deleted, but failed processing image URL ${contentToDelete.image_url} for deletion:`, storageErr);
          alert(`Contenuto eliminato, ma si è verificato un errore nell'eliminazione dell'immagine associata.`);
        }
      }

      setContents(prevContents => prevContents.filter(c => c.id !== contentToDelete.id));
      alert('Contenuto eliminato con successo.');

    } catch (err) {
      console.error('Error deleting content:', err);
      alert('Errore durante l\'eliminazione del contenuto.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMove = async (contentId: string, direction: 'up' | 'down') => {
    const currentIndex = contents.findIndex(c => c.id === contentId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= contents.length) {
      console.warn("Cannot move item out of bounds.");
      return;
    }

    const itemToMove = contents[currentIndex];
    const itemToSwapWith = contents[targetIndex];

    if (itemToMove.section_group !== itemToSwapWith.section_group) {
      console.warn("Cannot reorder items between different section groups this way.");
      alert("Non è possibile spostare elementi tra gruppi di sezioni diversi con questa funzione.");
      return;
    }

    setActionLoading(true);
    try {
      const { error: error1 } = await supabase
        .from('content')
        .update({ display_order: itemToSwapWith.display_order })
        .eq('id', itemToMove.id);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from('content')
        .update({ display_order: itemToMove.display_order })
        .eq('id', itemToSwapWith.id);

      if (error2) {
        console.error("Error on second update, attempting revert...");
        await supabase.from('content').update({ display_order: itemToMove.display_order }).eq('id', itemToMove.id);
        throw error2;
      }

      await loadContent();

    } catch (err) {
      console.error('Error reordering content:', err);
      alert('Errore durante l\'aggiornamento dell\'ordine.');
      await loadContent();
    } finally {
      setActionLoading(false);
    }
  };

  const onEditorStateChangeIT = (editorState: EditorState) => {
    setEditorStateIT(editorState);
  };

  const onEditorStateChangeEN = (editorState: EditorState) => {
    setEditorStateEN(editorState);
  };

  const groupedContents = contents.reduce((groups: { [key: string]: Content[] }, content) => {
    const group = content.section_group || 'main';
    groups[group] = groups[group] || [];
    groups[group].push(content);
    groups[group].sort((a, b) => a.display_order - b.display_order);
    return groups;
  }, {});

  // Update sila-section to special-section if it exists
  useEffect(() => {
    const updateSilaToSpecial = async () => {
      const silaSection = contents.find(c => c.section === 'sila-section');
      if (silaSection) {
        try {
          const { error } = await supabase
            .from('content')
            .update({ 
              section: 'special-section',
              section_group: 'special'
            })
            .eq('id', silaSection.id);
          
          if (error) throw error;
          
          // Reload content after update
          loadContent();
        } catch (err) {
          console.error('Error updating sila-section:', err);
        }
      }
    };
    
    updateSilaToSpecial();
  }, [contents]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', pb: 8 }}>
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
                Gestione Contenuti Home
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<PlusIcon />}
                onClick={handleAddNewClick}
                disabled={isAddingNew || !!editingContent}
              >
                Aggiungi Contenuto
              </Button>
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
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Content Sections */}
        <Box sx={{ mb: 4 }}>
          {Object.entries(SECTION_GROUPS).map(([group, title]) => (
            groupedContents[group] && (
              <Accordion 
                key={group} 
                expanded={expandedGroup === group} 
                onChange={handleAccordionChange(group)}
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
                  <Typography variant="h6">{title}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={3}>
                      {groupedContents[group].map((content, index) => (
                        <Grid item xs={12} key={content.id}>
                          <Card sx={{ 
                            borderRadius: 2,
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 6
                            }
                          }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box>
                                  <Typography variant="h6" component="h3">
                                    {content.section}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    ID: {content.id} | Ordine: {content.display_order}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                    onClick={() => handleMove(content.id, 'up')}
                                    disabled={index === 0 || actionLoading}
                                    sx={{ bgcolor: 'grey.100' }}
                                  >
                                    <ArrowUpIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                    onClick={() => handleMove(content.id, 'down')}
                                    disabled={index === (groupedContents[group]?.length ?? 0) - 1 || actionLoading}
                                    sx={{ bgcolor: 'grey.100' }}
                                  >
                                    <ArrowDownIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                    onClick={() => handleEdit(content)}
                                    sx={{ bgcolor: 'grey.100' }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => handleDelete(content)}
                                    sx={{ bgcolor: 'grey.100' }}
                                  >
                                    <TrashIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                              
                              <Grid container spacing={3}>
                                {content.image_url && (
                                  <Grid item xs={12} sm={4}>
                                    <img
                                      src={content.image_url}
                                      alt={content.translations.it?.title || content.title}
                                      style={{ 
                                        width: '100%', 
                                        height: '150px', 
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        border: '1px solid #eee'
                                      }}
                                    />
                                  </Grid>
                                )}
                                <Grid item xs={12} sm={content.image_url ? 8 : 12}>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                      <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                                        <Typography variant="subtitle2" color="primary" gutterBottom>
                                          Italiano
                                        </Typography>
                                        <Typography variant="body2" gutterBottom>
                                          <strong>Titolo:</strong> {content.translations.it?.title || content.title || '(non impostato)'}
                                        </Typography>
                                        <Typography variant="body2">
                                          <strong>Descrizione:</strong> 
                                          <div dangerouslySetInnerHTML={{ __html: content.translations.it?.description || content.description || '(non impostato)' }} />
                                        </Typography>
                                      </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                                        <Typography variant="subtitle2" color="primary" gutterBottom>
                                          English
                                        </Typography>
                                        <Typography variant="body2" gutterBottom>
                                          <strong>Title:</strong> {content.translations.en?.title || '(not set)'}
                                        </Typography>
                                        <Typography variant="body2">
                                          <strong>Description:</strong>
                                          <div dangerouslySetInnerHTML={{ __html: content.translations.en?.description || '(not set)' }} />
                                        </Typography>
                                      </Paper>
                                    </Grid>
                                  </Grid>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </AccordionDetails>
              </Accordion>
            )
          ))}
        </Box>

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
              {isAddingNew ? 'Aggiungi Nuovo Contenuto' : 'Modifica Contenuto'}
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
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Informazioni di Base" />
              <Tab label="Contenuto Italiano" />
              <Tab label="Contenuto Inglese" />
            </Tabs>

            {activeTab === 0 && (
              <Grid container spacing={3}>
                {/* Section Name Input */}
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Nome Sezione *"
                    fullWidth
                    required
                    value={isAddingNew ? newContentData.section : (editingContent?.section || '')}
                    onChange={(e) => {
                      if (isAddingNew) {
                        setNewContentData({
                          ...newContentData,
                          section: e.target.value
                        });
                      } else if (editingContent) {
                        setEditingContent({
                          ...editingContent,
                          section: e.target.value
                        });
                      }
                    }}
                    placeholder="Es: Hero Banner 1"
                    margin="normal"
                  />
                </Grid>

                {/* Section Group Selector */}
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    label="Gruppo Sezione *"
                    fullWidth
                    required
                    value={isAddingNew ? (newContentData.section_group || 'main') : (editingContent?.section_group || 'main')}
                    onChange={(e) => {
                      if (isAddingNew) {
                        setNewContentData({
                          ...newContentData,
                          section_group: e.target.value
                        });
                      } else if (editingContent) {
                        setEditingContent({
                          ...editingContent,
                          section_group: e.target.value
                        });
                      }
                    }}
                    margin="normal"
                  >
                    {Object.entries(SECTION_GROUPS).map(([key, title]) => (
                      <MenuItem key={key} value={key}>{title}</MenuItem>
                    ))}
                  </TextField>
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
                          disabled={uploadingImage}
                          startIcon={<ImageIcon />}
                        >
                          {uploadingImage ? 'Caricamento...' : 'Carica immagine'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, isAddingNew ? 'add' : 'edit')}
                            hidden
                          />
                        </Button>
                        {uploadingImage && <CircularProgress size={24} />}
                      </Box>
                      {(isAddingNew ? newContentData.image_url : editingContent?.image_url) && (
                        <Box sx={{ mt: 2 }}>
                          <img
                            src={isAddingNew ? newContentData.image_url! : editingContent?.image_url!}
                            alt="Preview"
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
                    label="Titolo (IT) *"
                    fullWidth
                    required
                    value={isAddingNew 
                      ? (newContentData.translations?.it?.title || '') 
                      : (editingContent?.translations?.it?.title || '')}
                    onChange={(e) => {
                      if (isAddingNew) {
                        setNewContentData({
                          ...newContentData,
                          translations: {
                            ...newContentData.translations,
                            it: { 
                              ...newContentData.translations.it!,
                              title: e.target.value 
                            }
                          }
                        });
                      } else if (editingContent) {
                        setEditingContent({
                          ...editingContent,
                          translations: {
                            ...editingContent.translations,
                            it: { 
                              ...editingContent.translations.it!,
                              title: e.target.value 
                            }
                          }
                        });
                      }
                    }}
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
                    value={isAddingNew 
                      ? (newContentData.translations?.en?.title || '') 
                      : (editingContent?.translations?.en?.title || '')}
                    onChange={(e) => {
                      if (isAddingNew) {
                        setNewContentData({
                          ...newContentData,
                          translations: {
                            ...newContentData.translations,
                            en: { 
                              ...newContentData.translations.en!,
                              title: e.target.value 
                            }
                          }
                        });
                      } else if (editingContent) {
                        setEditingContent({
                          ...editingContent,
                          translations: {
                            ...editingContent.translations,
                            en: { 
                              ...editingContent.translations.en!,
                              title: e.target.value 
                            }
                          }
                        });
                      }
                    }}
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
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
            <Button onClick={handleCancel} color="inherit" startIcon={<XIcon />}>
              Annulla
            </Button>
            <Button 
              onClick={isAddingNew ? handleSaveNewContent : handleSave} 
              variant="contained" 
              color="primary" 
              startIcon={<SaveIcon />}
              disabled={actionLoading || uploadingImage || 
                (isAddingNew ? 
                  !newContentData.section || !newContentData.translations?.it?.title : 
                  !editingContent?.section || !editingContent?.translations?.it?.title)}
            >
              {actionLoading ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Loading overlay for actions */}
        {actionLoading && (
          <Box sx={{ 
            position: 'fixed', 
            inset: 0, 
            bgcolor: 'rgba(0,0,0,0.5)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 9999 
          }}>
            <Paper sx={{ p: 3, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} />
              <Typography>Operazione in corso...</Typography>
            </Paper>
          </Box>
        )}
      </Container>
    </Box>
  );
}