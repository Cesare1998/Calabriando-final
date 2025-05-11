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
  Divider,
  useTheme,
  Paper,
  Link as MuiLink,
  InputAdornment,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  CardActions,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormLabel,
  IconButton
  
} from '@mui/material';
import { 
  Email as EmailIcon, 
  Phone as PhoneIcon, 
  GitHub as GitHubIcon, 
  LinkedIn as LinkedInIcon,
  ArrowBack as ArrowBackIcon,
  Add as PlusIcon, 
  Edit as EditIcon, 
  Delete as TrashIcon, 
  Save as SaveIcon, 
  Close as XIcon, 
  Logout as LogOutIcon,
  Image as ImageIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, ContentState, convertToRaw, convertFromHTML } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: {
    it: string;
    en: string;
  };
  image_url: string;
  social?: {
    email?: string;
    phone?: string;
    github?: string;
    linkedin?: string;
  };
  visible_in_header?: boolean;
  created_at?: string;
  updated_at?: string;
}

const EMPTY_TEAM_MEMBER: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  role: '',
  bio: {
    it: '',
    en: ''
  },
  image_url: '',
  social: {},
  visible_in_header: true
};

export default function AdminDashboard_team() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editorStateIT, setEditorStateIT] = useState(EditorState.createEmpty());
  const [editorStateEN, setEditorStateEN] = useState(EditorState.createEmpty());
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    checkAuth();
    loadTeamMembers();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
    }
  };

  const loadTeamMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') { // Table doesn't exist
          await createTeamTable();
          setTeamMembers([]);
        } else {
          throw error;
        }
      } else {
        setTeamMembers(data || []);
      }
    } catch (err) {
      console.error('Error loading team members:', err);
      alert('Errore nel caricamento dei membri del team.');
    } finally {
      setLoading(false);
    }
  };

  const createTeamTable = async () => {
    try {
      // Create the team_members table
      const { error: createError } = await supabase.rpc('create_team_members_table');
      
      if (createError) throw createError;
      
      console.log('Team members table created successfully');
      
      // Add sample team members
      const sampleMembers = [
        {
          name: 'Cosimo',
          role: 'Web Developer',
          bio: {
            it: 'Sviluppatore web con esperienza nella creazione di siti web e applicazioni. Appassionato di tecnologia e innovazione, ha contribuito allo sviluppo della piattaforma Calabriando.',
            en: 'Web developer with experience in creating websites and applications. Passionate about technology and innovation, he contributed to the development of the Calabriando platform.'
          },
          image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
          social: {
            email: 'cosimo@calabriando.it',
            github: 'https://github.com',
            linkedin: 'https://linkedin.com'
          },
          visible_in_header: true
        },
        {
          name: 'Antonio Bilardi',
          role: 'CEO e Fondatore Calabriando',
          bio: {
            it: 'Fondatore e visionario dietro Calabriando. Con la sua passione per la Calabria e il turismo sostenibile, ha creato un esperienza unica per i visitatori che desiderano scoprire le meraviglie di questa regione.',
            en: 'Founder and visionary behind Calabriando. With his passion for Calabria and sustainable tourism, he created a unique experience for visitors who want to discover the wonders of this region.'
          },
          image_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
          social: {
            email: 'antonio@calabriando.it',
            phone: '+39 123 456 7890',
            linkedin: 'https://linkedin.com'
          },
          visible_in_header: true
        },
        {
          name: 'Alessandro Caridi',
          role: 'Tesoriere e Amministratore',
          bio: {
            it: 'Responsabile della gestione finanziaria e amministrativa di Calabriando. Con la sua esperienza nel settore economico, garantisce la solidità e la crescita sostenibile dell\'azienda.',
            en: 'Responsible for the financial and administrative management of Calabriando. With his experience in the economic sector, he ensures the solidity and sustainable growth of the company.'
          },
          image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80',
          social: {
            email: 'alessandro@calabriando.it',
            phone: '+39 098 765 4321'
          },
          visible_in_header: true
        }
      ];
      
      const { error: insertError } = await supabase
        .from('team_members')
        .insert(sampleMembers);
        
      if (insertError) throw insertError;
      
      console.log('Sample team members added successfully');
      
    } catch (err) {
      console.error('Error creating team members table:', err);
      alert('Errore nella creazione della tabella dei membri del team.');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const handleAddNew = () => {
    setEditingMember({
      ...EMPTY_TEAM_MEMBER,
      id: '',
      created_at: undefined,
      updated_at: undefined
    });
    setEditorStateIT(EditorState.createEmpty());
    setEditorStateEN(EditorState.createEmpty());
    setIsAdding(true);
    setOpenDialog(true);
    setActiveTab(0);
  };

  const handleEdit = (member: TeamMember) => {
    // Initialize editor states with content
    const contentBlocksIT = convertFromHTML(member.bio.it || '');
    const contentStateIT = ContentState.createFromBlockArray(
      contentBlocksIT.contentBlocks,
      contentBlocksIT.entityMap
    );
    setEditorStateIT(EditorState.createWithContent(contentStateIT));

    const contentBlocksEN = convertFromHTML(member.bio.en || '');
    const contentStateEN = ContentState.createFromBlockArray(
      contentBlocksEN.contentBlocks,
      contentBlocksEN.entityMap
    );
    setEditorStateEN(EditorState.createWithContent(contentStateEN));

    setEditingMember({
      ...member,
      bio: { ...member.bio },
      social: { ...member.social },
      visible_in_header: member.visible_in_header !== false // default to true if undefined
    });
    setIsAdding(false);
    setOpenDialog(true);
    setActiveTab(0);
  };

  const handleDelete = async (id: string, imageUrl?: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo membro del team?')) return;

    try {
      // Delete image from storage if it exists and is stored in Supabase
      if (imageUrl && imageUrl.includes(import.meta.env.VITE_SUPABASE_URL)) {
        try {
          const imagePath = imageUrl.split('/storage/v1/object/public/')[1];
          if (imagePath) {
            await supabase.storage.from('images').remove([imagePath]);
          }
        } catch (storageError) {
          console.warn("Could not delete image from storage:", storageError);
        }
      }

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTeamMembers(teamMembers.filter(member => member.id !== id));
      alert('Membro del team eliminato con successo.');
    } catch (err) {
      console.error('Error deleting team member:', err);
      alert('Errore durante l\'eliminazione del membro del team.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editingMember) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `team/${editingMember.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${fileExt}`;

    setIsUploading(true);
    try {
      // Delete old image if it exists and is stored in Supabase
      if (!isAdding && editingMember.image_url && editingMember.image_url.includes(import.meta.env.VITE_SUPABASE_URL)) {
        try {
          const oldImagePath = editingMember.image_url.split('/storage/v1/object/public/')[1];
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

      setEditingMember({
        ...editingMember,
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

  const handleToggleVisibility = async (member: TeamMember) => {
    try {
      const updatedVisibility = !member.visible_in_header;
      
      const { error } = await supabase
        .from('team_members')
        .update({ visible_in_header: updatedVisibility })
        .eq('id', member.id);

      if (error) throw error;
      
      // Update local state
      setTeamMembers(teamMembers.map(m => 
        m.id === member.id ? { ...m, visible_in_header: updatedVisibility } : m
      ));
      
    } catch (err) {
      console.error('Error updating visibility:', err);
      alert('Errore durante l\'aggiornamento della visibilità.');
    }
  };

  const handleSave = async () => {
    if (!editingMember) return;

    // Validation
    if (!editingMember.name) {
      alert('Il nome è obbligatorio.');
      return;
    }
    if (!editingMember.role) {
      alert('Il ruolo è obbligatorio.');
      return;
    }
    if (!editingMember.image_url) {
      alert('L\'immagine è obbligatoria.');
      return;
    }

    try {
      // Convert editor state to HTML
      const bioIT = draftToHtml(convertToRaw(editorStateIT.getCurrentContent()));
      const bioEN = draftToHtml(convertToRaw(editorStateEN.getCurrentContent()));

      const memberData = {
        name: editingMember.name,
        role: editingMember.role,
        bio: {
          it: bioIT,
          en: bioEN
        },
        image_url: editingMember.image_url,
        social: editingMember.social,
        visible_in_header: editingMember.visible_in_header
      };

      if (isAdding) {
        const { data, error } = await supabase
          .from('team_members')
          .insert([memberData])
          .select();

        if (error) throw error;
        if (data) setTeamMembers([...teamMembers, data[0]]);
        alert('Membro del team aggiunto con successo!');
      } else {
        const { error } = await supabase
          .from('team_members')
          .update(memberData)
          .eq('id', editingMember.id);

        if (error) throw error;
        setTeamMembers(teamMembers.map(m => m.id === editingMember.id ? { ...m, ...memberData } : m));
        alert('Membro del team aggiornato con successo!');
      }

      setOpenDialog(false);
      setEditingMember(null);
      setIsAdding(false);
    } catch (err) {
      console.error('Error saving team member:', err);
      alert('Errore durante il salvataggio del membro del team.');
    }
  };

  const handleCancel = () => {
    setOpenDialog(false);
    setEditingMember(null);
    setIsAdding(false);
  };

  if (loading) {
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
                Gestione Team Calabriando
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<PlusIcon />}
                onClick={handleAddNew}
              >
                Aggiungi Membro
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
        {/* Team Members List */}
        <Grid container spacing={3}>
          {teamMembers.map((member, index) => (
            <Grid item xs={12} key={member.id}>
              <Card 
                elevation={3} 
                sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', md: index % 2 === 0 ? 'row' : 'row-reverse' },
                  borderRadius: 4,
                  overflow: 'hidden',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[10]
                  }
                }}
              >
                <CardMedia
                  component="img"
                  sx={{ 
                    width: { xs: '100%', md: 300 },
                    height: { xs: 300, md: 'auto' },
                    objectFit: 'cover'
                  }}
                  image={member.image_url}
                  alt={member.name}
                />
                <CardContent sx={{ flex: '1 1 auto', p: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
                      {member.name}
                    </Typography>
                    <Chip 
                      icon={member.visible_in_header ? <VisibilityIcon /> : <VisibilityOffIcon />}
                      label={member.visible_in_header ? "Visibile" : "Nascosto"}
                      color={member.visible_in_header ? "success" : "default"}
                      onClick={() => handleToggleVisibility(member)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </Box>
                  <Typography variant="h6" color="primary.main" gutterBottom>
                    {member.role}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary" component="div">
                    <div dangerouslySetInnerHTML={{ __html: member.bio.it }} />
                  </Typography>
                  
                  {member.social && Object.keys(member.social).length > 0 && (
                    <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {member.social.email && (
                        <Chip
                          icon={<EmailIcon />}
                          label={member.social.email}
                          variant="outlined"
                          color="primary"
                          size="small"
                        />
                      )}
                      {member.social.phone && (
                        <Chip
                          icon={<PhoneIcon />}
                          label={member.social.phone}
                          variant="outlined"
                          color="primary"
                          size="small"
                        />
                      )}
                      {member.social.github && (
                        <Chip
                          icon={<GitHubIcon />}
                          label="GitHub"
                          variant="outlined"
                          color="primary"
                          size="small"
                        />
                      )}
                      {member.social.linkedin && (
                        <Chip
                          icon={<LinkedInIcon />}
                          label="LinkedIn"
                          variant="outlined"
                          color="primary"
                          size="small"
                        />
                      )}
                    </Box>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEdit(member)}
                  >
                    Modifica
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<TrashIcon />}
                    onClick={() => handleDelete(member.id, member.image_url)}
                  >
                    Elimina
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {teamMembers.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nessun membro del team disponibile.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlusIcon />}
              onClick={handleAddNew}
              sx={{ mt: 2 }}
            >
              Aggiungi il primo membro
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
              {isAdding ? 'Nuovo Membro del Team' : 'Modifica Membro del Team'}
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
            {editingMember && (
              <>
                <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Tab label="Informazioni di Base" />
                  <Tab label="Biografia Italiano" />
                  <Tab label="Biografia Inglese" />
                  <Tab label="Contatti Social" />
                </Tabs>

                {activeTab === 0 && (
                  <Grid container spacing={3}>
                    {/* Basic Info */}
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          Informazioni di Base
                        </Typography>
                        <TextField
                          label="Nome *"
                          fullWidth
                          required
                          value={editingMember.name}
                          onChange={(e) => setEditingMember({
                            ...editingMember,
                            name: e.target.value
                          })}
                          margin="normal"
                        />
                        <TextField
                          label="Ruolo *"
                          fullWidth
                          required
                          value={editingMember.role}
                          onChange={(e) => setEditingMember({
                            ...editingMember,
                            role: e.target.value
                          })}
                          margin="normal"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={editingMember.visible_in_header !== false}
                              onChange={(e) => setEditingMember({
                                ...editingMember,
                                visible_in_header: e.target.checked
                              })}
                              color="primary"
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {editingMember.visible_in_header !== false ? <VisibilityIcon color="success" /> : <VisibilityOffIcon />}
                              <Typography variant="body2">
                                {editingMember.visible_in_header !== false ? 'Visibile in Header/Footer' : 'Nascosto in Header/Footer'}
                              </Typography>
                            </Box>
                          }
                          sx={{ mt: 2 }}
                        />
                      </Paper>
                    </Grid>

                    {/* Image Upload */}
                    <Grid item xs={12} md={6}>
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
                              startIcon={<ImageIcon />}
                            >
                              {isUploading ? 'Caricamento...' : 'Carica immagine'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                hidden
                              />
                            </Button>
                            {isUploading && <CircularProgress size={24} />}
                          </Box>
                          {editingMember.image_url && (
                            <Box sx={{ mt: 2 }}>
                              <img
                                src={editingMember.image_url}
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
                    {/* Italian Bio */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Biografia (IT) *
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
                    {/* English Bio */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Biography (EN) *
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
                  <Grid container spacing={3}>
                    {/* Social Links */}
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          Contatti Social
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Email"
                              fullWidth
                              type="email"
                              value={editingMember.social?.email || ''}
                              onChange={(e) => setEditingMember({
                                ...editingMember,
                                social: {
                                  ...editingMember.social,
                                  email: e.target.value
                                }
                              })}
                              margin="normal"
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <EmailIcon />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Telefono"
                              fullWidth
                              type="tel"
                              value={editingMember.social?.phone || ''}
                              onChange={(e) => setEditingMember({
                                ...editingMember,
                                social: {
                                  ...editingMember.social,
                                  phone: e.target.value
                                }
                              })}
                              margin="normal"
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <PhoneIcon />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="GitHub URL"
                              fullWidth
                              type="url"
                              value={editingMember.social?.github || ''}
                              onChange={(e) => setEditingMember({
                                ...editingMember,
                                social: {
                                  ...editingMember.social,
                                  github: e.target.value
                                }
                              })}
                              margin="normal"
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <GitHubIcon />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="LinkedIn URL"
                              fullWidth
                              type="url"
                              value={editingMember.social?.linkedin || ''}
                              onChange={(e) => setEditingMember({
                                ...editingMember,
                                social: {
                                  ...editingMember.social,
                                  linkedin: e.target.value
                                }
                              })}
                              margin="normal"
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <LinkedInIcon />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                        </Grid>
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
              {isUploading ? 'Caricamento...' : 'Salva'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}