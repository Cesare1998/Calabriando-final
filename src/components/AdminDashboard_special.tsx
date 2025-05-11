import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate
import { format } from 'date-fns';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  CardMedia,
  Tabs,
  Tab,
  // useTheme // Non strettamente necessario qui, ma potresti importarlo se usi theme per stili
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CloudUpload as CloudUploadIcon,
  Close as XIcon,
  Logout as LogOutIcon,      // Icona Esci
  ArrowBack as ArrowBackIcon, // Icona Indietro
  Event as EventIcon,                  // <-- Aggiunto
  AccessTime as AccessTimeIcon,        // <-- Aggiunto
  LocationOn as LocationOnIcon,        // <-- Aggiunto
  Group as GroupIcon,                  // <-- Aggiunto
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';

interface SpecialEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  max_participants: number;
  image_url: string;
  event_url: string;
  additional_details?: string; // Reso opzionale per sicurezza
  translations: {
    it: {
      title: string;
      description: string;
      additional_details?: string; // Reso opzionale
    };
    en: {
      title: string;
      description: string;
      additional_details?: string; // Reso opzionale
    };
  };
}

// Assicurati che EMPTY_FORM_DATA includa tutti i campi, anche quelli opzionali
const EMPTY_FORM_DATA: Partial<SpecialEvent> = {
  title: '',
  description: '',
  location: '',
  date: '',
  time: '',
  max_participants: 0,
  image_url: '',
  event_url: '',
  additional_details: '',
  translations: {
    it: { title: '', description: '', additional_details: '' },
    en: { title: '', description: '', additional_details: '' }
  }
};

export default function AdminDashboardSpecial() {
  const navigate = useNavigate(); // Hook per navigazione
  const { language } = useLanguage();
  // const theme = useTheme(); // Decommenta se necessario
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<SpecialEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<SpecialEvent>>(JSON.parse(JSON.stringify(EMPTY_FORM_DATA)));
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Funzione SignOut (come nell'altro componente)
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  // Funzioni checkAuth e loadEvents (assumendo che checkAuth sia gestito altrove o non necessario qui)
   useEffect(() => {
    // Potresti voler aggiungere checkAuth() qui se necessario
    loadEvents();
  }, []);


  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: dbError } = await supabase
        .from('special_events')
        .select('*')
        .order('date', { ascending: false }); // Ordina per data decrescente (più recenti prima)

      if (dbError) throw dbError;

      // Aggiungi un fallback per translations se dovesse essere null dal DB
      const processedData = (data || []).map(event => ({
        ...event,
        translations: event.translations || { // Fallback
             it: { title: event.title || '', description: event.description || '', additional_details: event.additional_details || '' },
             en: { title: '', description: '', additional_details: '' } // Fallback EN vuoto se non esiste
         }
      }));

      setEvents(processedData);
    } catch (err: any) {
      console.error('Error loading special events:', err);
      setError(language === 'it'
        ? `Errore nel caricamento degli eventi speciali: ${err.message}`
        : `Error loading special events: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event: SpecialEvent) => {
    setEditingEvent(event);
     // Assicurati che formData abbia una struttura translations valida
     const initialFormData = {
        ...event,
        translations: {
          it: {
              title: event.translations?.it?.title ?? event.title ?? '',
              description: event.translations?.it?.description ?? event.description ?? '',
              additional_details: event.translations?.it?.additional_details ?? event.additional_details ?? ''
          },
          en: {
              title: event.translations?.en?.title ?? '',
              description: event.translations?.en?.description ?? '',
              additional_details: event.translations?.en?.additional_details ?? ''
          }
      }
     };
    setFormData(JSON.parse(JSON.stringify(initialFormData))); // Deep copy
    setActiveTab(0);
    setIsDialogOpen(true);
  };

   const handleAdd = () => {
    setEditingEvent(null);
    // Usa una copia pulita di EMPTY_FORM_DATA
    setFormData(JSON.parse(JSON.stringify(EMPTY_FORM_DATA)));
    setActiveTab(0);
    setIsDialogOpen(true);
  };

 const handleDelete = async (id: string) => {
    if (!window.confirm(language === 'it'
      ? 'Sei sicuro di voler eliminare questo evento?'
      : 'Are you sure you want to delete this event?')) {
      return;
    }

    setLoading(true); // Mostra indicatore durante eliminazione
    setError(null);
    try {
      // Optional: Delete associated image from storage first
      const eventToDelete = events.find(e => e.id === id);
      if (eventToDelete?.image_url && eventToDelete.image_url.includes(import.meta.env.VITE_SUPABASE_URL)) { // Verifica sia URL Supabase
          try {
              const imagePath = eventToDelete.image_url.split('/storage/v1/object/public/images/')[1]; // Assumi bucket 'images'
              if (imagePath) {
                  await supabase.storage.from('images').remove([imagePath]);
              }
          } catch(imgDeleteError) {
              console.warn("Could not delete image from storage:", imgDeleteError);
          }
      }

      // Delete the event record
      const { error: dbError } = await supabase
        .from('special_events')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // Update state locally instead of full reload for better UX
      setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
      // await loadEvents(); // Reload events after deletion - Rimosso per aggiornamento locale

    } catch (err: any) {
      console.error('Error deleting event:', err);
      setError(language === 'it'
        ? `Errore nell'eliminazione dell'evento: ${err.message}`
        : `Error deleting event: ${err.message}`);
    } finally {
        setLoading(false);
    }
  };

   const handleSave = async () => {
    // Validation
    if (!formData.translations?.it?.title || !formData.translations?.en?.title) {
        setError(language === 'it' ? 'Il titolo (IT e EN) è obbligatorio.' : 'Title (IT and EN) is required.');
        setActiveTab(1); // Vai alla tab con l'errore
        return;
    }
     if (!formData.location || !formData.date || !formData.time) {
        setError(language === 'it' ? 'Luogo, Data e Ora sono obbligatori.' : 'Location, Date and Time are required.');
        setActiveTab(0); // Vai alla tab con l'errore
        return;
    }
     if (!formData.image_url && !editingEvent?.image_url) { // Controlla se l'immagine manca sia nel form che nell'evento originale (se in modifica)
         setError(language === 'it' ? 'L\'immagine è obbligatoria.' : 'Image is required.');
         setActiveTab(3); // Vai alla tab multimedia
         return;
     }

    setLoading(true);
    setError(null);

    try {
      // Prepara i dati assicurandoti che le traduzioni esistano
      const dataToSave = {
        location: formData.location || '',
        date: formData.date || '',
        time: formData.time || '',
        max_participants: Number(formData.max_participants) || 0,
        image_url: formData.image_url || '',
        event_url: formData.event_url || null, // Invia null se vuoto, se il DB lo permette
        additional_details: formData.additional_details || '', // Assicura sia stringa vuota o il testo
        translations: {
          it: {
            title: formData.translations?.it?.title || '',
            description: formData.translations?.it?.description || '',
            additional_details: formData.translations?.it?.additional_details || ''
          },
          en: {
            title: formData.translations?.en?.title || '',
            description: formData.translations?.en?.description || '',
            additional_details: formData.translations?.en?.additional_details || ''
          }
        }
      };

      if (editingEvent && editingEvent.id) {
        // Update
        const { data, error: updateError } = await supabase
          .from('special_events')
          .update(dataToSave)
          .eq('id', editingEvent.id)
          .select() // Richiedi i dati aggiornati
          .single(); // Aspettati una sola riga

        if (updateError) throw updateError;

         // Aggiorna lo stato locale con i dati restituiti
         if (data) {
            setEvents(prevEvents => prevEvents.map(event => event.id === editingEvent.id ? data : event));
         }

      } else {
        // Insert
        const { data, error: insertError } = await supabase
          .from('special_events')
          .insert([dataToSave])
          .select() // Richiedi i dati inseriti
          .single(); // Aspettati una sola riga

        if (insertError) throw insertError;

        // Aggiungi il nuovo evento allo stato locale
        if (data) {
            setEvents(prevEvents => [data, ...prevEvents]); // Aggiungi in cima alla lista
        }
      }

      setIsDialogOpen(false);
      // Non serve ricaricare tutto se aggiorniamo lo stato localmente
      // await loadEvents();

    } catch (err: any) {
      console.error('Error saving event:', err);
      // Mostra l'errore nel dialog invece che nella pagina principale
      setError(language === 'it'
        ? `Errore nel salvataggio: ${err.message}`
        : `Error saving: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  const handleInputChange = (field: string, value: string | number, lang?: 'it' | 'en') => {
    setFormData(prev => {
        // Crea una copia profonda solo se necessario (per translations)
        const newFormData = { ...prev };

        if (lang) {
            // Assicurati che translations e la lingua specifica esistano
            newFormData.translations = {
                ...(newFormData.translations ?? { it: {}, en: {} }), // Fallback per translations
                [lang]: {
                    ...(newFormData.translations?.[lang] ?? {}), // Fallback per la lingua
                    [field]: value
                }
            };
             // Se stiamo modificando it.title o it.description, aggiorna anche i campi principali (se li usi)
             if (lang === 'it' && (field === 'title' || field === 'description')) {
                 (newFormData as any)[field] = value;
             }

        } else {
            // Assegnazione diretta per campi non tradotti
            (newFormData as any)[field] = value;
        }
        return newFormData;
    });
};


  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // ... (codice handleImageUpload rimane invariato, ma assicurati che funzioni correttamente) ...
     try {
      setUploading(true);
      setError(null);
      const file = event.target.files?.[0];
      if (!file) {
        setUploading(false);
        return;
      }

      // Optional: Remove old image if editing and replacing
      let imagePathToDelete : string | null = null;
       if (editingEvent && formData.image_url && formData.image_url.includes(import.meta.env.VITE_SUPABASE_URL)) {
           try {
               imagePathToDelete = formData.image_url.split('/storage/v1/object/public/images/')[1]; // Assumi bucket 'images'
           } catch (e) { console.error("Error parsing old image path"); }
       }

      const fileExt = file.name.split('.').pop();
      const fileName = `special-events/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`; // Nome più univoco
      const filePath = fileName; // Usiamo direttamente il nome come path nel bucket

      const { error: uploadError } = await supabase.storage
        .from('images') // Assumi bucket 'images'
        .upload(filePath, file, {
          cacheControl: '3600', // Cache per 1 ora
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Elimina la vecchia immagine SOLO DOPO che la nuova è stata caricata con successo
       if (imagePathToDelete) {
           try {
              await supabase.storage.from('images').remove([imagePathToDelete]);
           } catch (deleteError) {
               console.warn("Could not delete previous image:", deleteError);
           }
       }

      // Ottieni l'URL pubblico
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error("Could not get public URL for the uploaded image.");
      }

      setFormData(prev => ({
        ...prev,
        image_url: urlData.publicUrl
      }));

    } catch (error: any) {
      console.error('Error uploading image:', error);
      setError(language === 'it'
        ? `Errore nel caricamento: ${error.message}`
        : `Upload error: ${error.message}`);
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = ''; // Resetta l'input file
      }
    }
  };

  // Stato iniziale del loader
  if (loading && events.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render del componente
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      {/* ================= HEADER ================= */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', boxShadow: 3, position: 'sticky', top: 0, zIndex: 1100 }}> {/* Aumentato zIndex */}
        <Container maxWidth="lg" sx={{ py: 1.5 }}> {/* Ridotto padding y */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="contained"
                color="secondary" // O altro colore se preferisci
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/admin/dashboard')} // Assicurati che il path sia corretto
                size="small" // Bottone più piccolo
              >
                Dashboard
              </Button>
              <Typography variant="h6" component="h1" fontWeight="bold"> {/* Ridotto a h6 */}
                Gestione Eventi Speciali
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<LogOutIcon />}
              onClick={handleSignOut}
              size="small" // Bottone più piccolo
              sx={{ borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Esci
            </Button>
          </Box>
        </Container>
      </Box>
      {/* ================= FINE HEADER ================= */}

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Bottone Aggiungi Nuovo Evento */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
             <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAdd}
            >
                {language === 'it' ? 'Nuovo Evento' : 'New Event'}
            </Button>
        </Box>

        {/* Alert per Errori Globali (fuori dal dialog) */}
        {error && !isDialogOpen && ( // Mostra solo se non è nel dialog
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {/* Indicatore Loading Globale (fuori dal dialog) */}
        {loading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}

        {/* Griglia Eventi */}
        {!loading && events.length === 0 && !error && (
            <Paper sx={{p: 3, textAlign: 'center'}}>
                <Typography variant="h6" color="text.secondary">
                    {language === 'it' ? 'Nessun evento speciale trovato.' : 'No special events found.'}
                </Typography>
            </Paper>
        )}

        {!loading && events.length > 0 && (
            <Grid container spacing={3}>
            {events.map((event) => (
                <Grid item xs={12} md={6} lg={4} key={event.id}> {/* Aggiunto lg={4} per 3 colonne su schermi grandi */}
                <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2, transition: '0.3s', '&:hover': { boxShadow: 6 } }}>
                    {event.image_url && (
                    <CardMedia
                        component="img"
                        height="160" // Leggermente più alta
                        image={event.image_url}
                        alt={event.translations?.[language as keyof SpecialEvent['translations']]?.title ?? 'Immagine Evento'}
                    />
                    )}
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}> {/* Padding bottom ridotto */}
                    <Typography variant="h6" gutterBottom fontWeight="medium"> {/* Medium weight */}
                        {event.translations?.[language as keyof SpecialEvent['translations']]?.title ?? event.title ?? (language === 'it' ? 'Titolo mancante' : 'Missing Title')}
                    </Typography>
                    {/* Descrizione ridotta o rimossa dalla card se troppo lunga */}
                    {/* <Typography variant="body2" color="text.secondary" paragraph sx={{ minHeight: '60px' }}>
                        {event.translations?.[language as keyof SpecialEvent['translations']]?.description?.substring(0, 80) + '...' ?? event.description ?? ''}
                    </Typography> */}
                     <Grid container spacing={1} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                            <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
                                <EventIcon fontSize="inherit" sx={{ color: 'text.secondary' }}/> {event.date ? format(new Date(event.date + 'T00:00:00'), 'dd/MM/yy') : '-'} {/* Formato data breve */}
                            </Typography>
                            <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
                                <AccessTimeIcon fontSize="inherit" sx={{ color: 'text.secondary' }}/> {event.time || '-'}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" display="flex" alignItems="center" gap={0.5} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <LocationOnIcon fontSize="inherit" sx={{ color: 'text.secondary' }}/> {event.location}
                            </Typography>
                             <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
                                 <GroupIcon fontSize="inherit" sx={{ color: 'text.secondary' }}/> Max {event.max_participants}
                            </Typography>
                        </Grid>
                         {event.event_url && (
                           <Grid item xs={12} sx={{textAlign: 'right', pt: 1}}>
                             <Button size="small" href={event.event_url} target="_blank" rel="noopener noreferrer" endIcon={<OpenInNewIcon />}>
                               {language === 'it' ? 'Link' : 'Link'}
                             </Button>
                           </Grid>
                         )}
                      </Grid>
                    </CardContent>
                    <Divider />
                    <CardActions sx={{ justifyContent: 'flex-end', py: 0.5 }}> {/* Padding y ridotto */}
                    <IconButton onClick={() => handleEdit(event)} color="primary" aria-label="edit" size="small">
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(event.id)} color="error" aria-label="delete" size="small">
                        <DeleteIcon fontSize="small"/>
                    </IconButton>
                    </CardActions>
                </Card>
                </Grid>
            ))}
            </Grid>
        )}


        {/* Dialog per Modifica/Aggiunta */}
        <Dialog
          open={isDialogOpen}
          onClose={() => { setIsDialogOpen(false); setError(null); }}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {editingEvent ? 'Modifica Evento Speciale' : 'Nuovo Evento Speciale'}
            <IconButton edge="end" color="inherit" onClick={() => { setIsDialogOpen(false); setError(null); }} aria-label="close">
              <XIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: 'grey.50' }}> {/* Sfondo leggermente diverso */}
             {/* Alert per errori specifici del Dialog */}
            {error && isDialogOpen && (
               <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                   {error}
               </Alert>
            )}
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: '4px 4px 0 0' }}>
              <Tab label={language === 'it' ? 'Dettagli Base' : 'Basic Details'} />
              <Tab label={language === 'it' ? 'Contenuto Italiano' : 'Italian Content'} />
              <Tab label={language === 'it' ? 'Contenuto Inglese' : 'English Content'} />
              <Tab label={language === 'it' ? 'Multimedia' : 'Multimedia'} />
            </Tabs>

            <Box sx={{ pt: 2, pb: 1, bgcolor: 'background.paper', p: 2, borderRadius: '0 0 4px 4px' }}>
              {/* Tab 0: Basic Details */}
              {activeTab === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label={language === 'it' ? 'Luogo *' : 'Location *'} value={formData.location || ''} onChange={(e) => handleInputChange('location', e.target.value)} required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label={language === 'it' ? 'Data *' : 'Date *'} type="date" value={formData.date || ''} onChange={(e) => handleInputChange('date', e.target.value)} InputLabelProps={{ shrink: true }} required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label={language === 'it' ? 'Ora *' : 'Time *'} type="time" value={formData.time || ''} onChange={(e) => handleInputChange('time', e.target.value)} InputLabelProps={{ shrink: true }} required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label={language === 'it' ? 'Max Partecipanti' : 'Max Participants'} type="number" value={formData.max_participants || '0'} onChange={(e) => handleInputChange('max_participants', parseInt(e.target.value, 10) || 0)} InputProps={{ inputProps: { min: 0 } }} />
                  </Grid>
                   <Grid item xs={12}>
                    <TextField fullWidth label={language === 'it' ? 'URL Evento (Link esterno opzionale)' : 'Event URL (Optional external link)'} value={formData.event_url || ''} onChange={(e) => handleInputChange('event_url', e.target.value)} placeholder="https://" type="url" />
                  </Grid>
                </Grid>
              )}

              {/* Tab 1: Italian Content */}
              {activeTab === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label={language === 'it' ? 'Titolo (IT) *' : 'Title (IT) *'} value={formData.translations?.it?.title || ''} onChange={(e) => handleInputChange('title', e.target.value, 'it')} required />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={4} label={language === 'it' ? 'Descrizione (IT)' : 'Description (IT)'} value={formData.translations?.it?.description || ''} onChange={(e) => handleInputChange('description', e.target.value, 'it')} helperText={language === 'it' ? 'Breve descrizione per la card' : 'Short description for the card'}/>
                  </Grid>
                   <Grid item xs={12}>
                     <TextField fullWidth multiline rows={6} label={language === 'it' ? 'Informazioni Aggiuntive (IT)' : 'Additional Details (IT)'} value={formData.translations?.it?.additional_details || ''} onChange={(e) => handleInputChange('additional_details', e.target.value, 'it')} helperText={language === 'it' ? 'Mostrato nella pagina di dettaglio (HTML permesso)' : 'Shown on detail page (HTML allowed)'}/>
                   </Grid>
                </Grid>
              )}

               {/* Tab 2: English Content */}
              {activeTab === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label={language === 'it' ? 'Titolo (EN) *' : 'Title (EN) *'} value={formData.translations?.en?.title || ''} onChange={(e) => handleInputChange('title', e.target.value, 'en')} required />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={4} label={language === 'it' ? 'Descrizione (EN)' : 'Description (EN)'} value={formData.translations?.en?.description || ''} onChange={(e) => handleInputChange('description', e.target.value, 'en')} helperText={language === 'it' ? 'Breve descrizione per la card' : 'Short description for the card'}/>
                  </Grid>
                    <Grid item xs={12}>
                     <TextField fullWidth multiline rows={6} label={language === 'it' ? 'Informazioni Aggiuntive (EN)' : 'Additional Details (EN)'} value={formData.translations?.en?.additional_details || ''} onChange={(e) => handleInputChange('additional_details', e.target.value, 'en')} helperText={language === 'it' ? 'Mostrato nella pagina di dettaglio (HTML permesso)' : 'Shown on detail page (HTML allowed)'}/>
                   </Grid>
                </Grid>
              )}

              {/* Tab 3: Multimedia */}
              {activeTab === 3 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                     <Typography variant="subtitle1" gutterBottom>
                        {language === 'it' ? 'Immagine Evento *' : 'Event Image *'}
                     </Typography>
                     <Box sx={{ mb: 1 }}>
                         <input accept="image/*" style={{ display: 'none' }} id="image-upload-special" type="file" onChange={handleImageUpload} disabled={uploading} />
                         <label htmlFor="image-upload-special">
                             <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />} disabled={uploading} fullWidth>
                                 {uploading ? (language === 'it' ? 'Caricamento...' : 'Uploading...') : (language === 'it' ? 'Carica/Sostituisci Immagine' : 'Upload/Replace Image')}
                             </Button>
                         </label>
                     </Box>
                     {uploading && <CircularProgress size={24} sx={{ display: 'block', margin: 'auto' }} />}
                     {formData.image_url && !uploading && (
                         <Card sx={{ mt: 2, mb: 2, maxWidth: 300, margin: 'auto' }}> {/* Anteprima più piccola */}
                             <CardMedia component="img" height="150" image={formData.image_url} alt="Anteprima" sx={{ objectFit: 'contain' }} />
                         </Card>
                     )}
                     {!formData.image_url && !uploading && (
                         <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={1}>
                              {language === 'it' ? 'Nessuna immagine caricata.' : 'No image uploaded.'}
                         </Typography>
                     )}
                  </Grid>
                </Grid>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider' }}>
            <Button onClick={() => { setIsDialogOpen(false); setError(null); }} startIcon={<CancelIcon />} color="inherit">
              {language === 'it' ? 'Annulla' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} variant="contained" color="primary" startIcon={<SaveIcon />} disabled={uploading || loading}>
              {loading ? (language === 'it' ? 'Salvataggio...' : 'Saving...') : (editingEvent ? (language === 'it' ? 'Salva Modifiche' : 'Save Changes') : (language === 'it' ? 'Crea Evento' : 'Create Event'))}
            </Button>
          </DialogActions>
        </Dialog>

      </Container>
    </Box> // Chiusura Box principale
  );
}