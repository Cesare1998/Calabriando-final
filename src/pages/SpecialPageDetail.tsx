import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Aggiunto Link
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  CircularProgress,
  // Card, // Non usato
  // CardMedia, // Non usato
  // Chip, // Non usato nel render principale, ma usato nella modal
  Link as MuiLink, // Rinomino per evitare conflitti con react-router-dom Link
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Avatar // Importato per le icone nei dettagli
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  Group as GroupIcon,
  // Link as LinkIcon // Non usato
  Payment as PaymentIcon // Aggiunto per il pulsante di prenotazione
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale'; // Importa locale italiano per date-fns
import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // Assicurati sia installato e importato
import QRCode from 'qrcode';
import Header from '../components/Header'; // Assicurati che il percorso sia corretto
import Footer from '../components/Footer'; // Assicurati che il percorso sia corretto
import BookingConfirmationModal from '../components/BookingConfirmationModal'; // Importa la modal!

interface SpecialEvent {
  id: string;
  // title: string; // Probabilmente non serve se c'è translations
  // description: string; // Probabilmente non serve se c'è translations
  location: string;
  date: string; // Data di default se non ci sono available_dates
  time: string; // Ora di default se non ci sono available_dates
  max_participants: number;
  image_url: string;
  event_url?: string; // reso opzionale
  // additional_details?: string; // Probabilmente non serve se c'è translations
  translations: {
    it: {
      title: string;
      description: string;
      additional_details?: string; // reso opzionale
    };
    en: {
      title: string;
      description: string;
      additional_details?: string; // reso opzionale
    };
  };
  // Questo campo permette date/orari multipli, se presente sovrascrive date/time di default
  available_dates?: Array<{
    date: string; // Formato 'YYYY-MM-DD'
    time: [string, string]; // Array con ora inizio e ora fine, es. ['09:00', '11:00']
  }>;
}

interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  participants: number;
}

export default function SpecialPageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage(); // Assumiamo ritorni 'it' o 'en'
  const [event, setEvent] = useState<SpecialEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    email: '',
    phone: '',
    participants: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // Stato per la modale
  const [selectedDate, setSelectedDate] = useState<string>(""); // Stato per la data selezionata dal dropdown
  const [currentBookingId, setCurrentBookingId] = useState<string>(''); // Stato per l'ID della prenotazione corrente
  const [pdfUrl, setPdfUrl] = useState<string | null>(null); // Stato per l'URL del PDF generato

  useEffect(() => {
    const loadEvent = async () => {
      if (!id) {
        setError(language === 'it' ? 'ID evento mancante.' : 'Event ID missing.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null); // Resetta errore precedente
        const { data, error: dbError } = await supabase
          .from('special_events') // Usa il nome corretto della tabella
          .select('*')
          .eq('id', id)
          .single();

        if (dbError) {
           if (dbError.code === 'PGRST116') { // Codice errore Supabase per "no rows returned"
               setError(language === 'it' ? 'Evento non trovato.' : 'Event not found.');
               setEvent(null);
           } else {
              throw dbError; // Lancia altri errori
           }
        } else {
          setEvent(data);
          // Pre-seleziona la prima data disponibile, se esiste, altrimenti la data dell'evento
          if (data.available_dates && data.available_dates.length > 0) {
             setSelectedDate(data.available_dates[0].date);
          } else if (data.date) {
             setSelectedDate(data.date); // Usa la data singola dell'evento
          }
        }
      } catch (err: any) {
        console.error('Error loading event:', err);
        setError(language === 'it'
          ? `Errore nel caricamento dell'evento: ${err.message}`
          : `Error loading event: ${err.message}`);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id, language]); // Aggiungi language alle dipendenze se i messaggi d'errore dipendono da essa

  const generateBookingId = () => {
    const timestamp = Date.now().toString(36);
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return `SPE-${timestamp}-${randomSuffix}`.toUpperCase(); // Prefisso SPE per Special Event
  };

  const generatePDF = async (bookingData: any, eventData: SpecialEvent) => {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Calabriando - Evento Speciale', 20, 20);
      doc.setFontSize(12);
      doc.text('Dettagli Prenotazione:', 20, 40);

      const selectedLang = language as keyof SpecialEvent['translations'];

      const details = [
          ['Evento', eventData.translations[selectedLang]?.title ?? 'N/D'],
          ['Data', bookingData.booking_date ? format(new Date(bookingData.booking_date + 'T00:00:00'), 'dd/MM/yyyy') : 'N/D'], // Aggiunge T00:00:00 per evitare problemi di timezone con date-fns
          ['Ora', bookingData.booking_time ?? 'N/D'],
          ['Partecipanti', bookingData.participants?.toString() ?? 'N/D'],
          ['Nome', bookingData.user_name ?? 'N/D'],
          ['Email', bookingData.user_email ?? 'N/D'],
          ['Telefono', bookingData.user_phone ?? 'N/D'],
          ['Riferimento', bookingData.id ?? 'N/D']
      ];

      if ((doc as any).autoTable) {
          (doc as any).autoTable({
              startY: 50,
              head: [['Campo', 'Valore']],
              body: details,
              theme: 'striped',
              headStyles: { fillColor: [0, 87, 183] } // Blu primario
          });
      } else {
          console.warn("jspdf-autotable non trovato, tabella non generata nel PDF.");
          // Fallback testo semplice
          let y = 50;
          details.forEach(row => {
              doc.text(`${row[0]}: ${row[1]}`, 20, y);
              y += 7;
          });
      }

      const finalY = (doc as any).lastAutoTable?.finalY || 100;

      try {
          const qrContent = JSON.stringify({
              bookingId: bookingData.id,
              eventId: eventData.id,
              // Aggiungi altri dati utili nel QR se necessario
              // url: `${window.location.origin}/special/confirm/${bookingData.id}` // Esempio URL conferma
          });
          const qrData = await QRCode.toDataURL(qrContent);
          const qrSize = 50;
          const qrX = (doc.internal.pageSize.getWidth() - qrSize) / 2;
          const qrY = finalY + 15;
          doc.addImage(qrData, 'PNG', qrX, qrY, qrSize, qrSize);
          doc.setFontSize(10);
          doc.text('QR Code Prenotazione', qrX + qrSize / 2, qrY + qrSize + 5, { align: 'center' });
      } catch (error) {
          console.error('Errore generazione QR code:', error);
      }
      return doc;
  };


  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validazione aggiuntiva
    if (!event || !selectedDate || !formData.name || !formData.email || !formData.phone) {
      alert(language === 'it' ? 'Per favore compila tutti i campi richiesti e seleziona una data.' : 'Please fill all required fields and select a date.');
      return;
    }
    setIsSubmitting(true);
    setError(null); // Resetta errori precedenti
    let newBookingId = ''; // Variabile per tenere traccia dell'ID

    try {
      let bookingDate = selectedDate; // Usa la data selezionata
      let bookingTime = event.time; // Default time

      // Se ci sono date disponibili, trova l'orario corretto per la data selezionata
      if (event.available_dates && event.available_dates.length > 0) {
        const selectedDateData = event.available_dates.find(d => d.date === selectedDate);
        if (selectedDateData) {
          // Assicurati che time sia un array con due elementi
          if (Array.isArray(selectedDateData.time) && selectedDateData.time.length >= 2) {
             bookingTime = selectedDateData.time.join(' - ');
          } else {
              console.warn(`Formato orario non valido per la data ${selectedDate}:`, selectedDateData.time);
              // Usa l'orario di default dell'evento o gestisci l'errore
              bookingTime = event.time || 'N/D';
          }
        } else {
           // Se la data selezionata non è in available_dates (non dovrebbe succedere con il dropdown corretto)
           console.error(`Dati non trovati per la data selezionata ${selectedDate}`);
           throw new Error(language === 'it' ? 'Data selezionata non valida.' : 'Selected date is not valid.');
        }
      } else {
          // Se non ci sono available_dates, usa date e time principali dell'evento
          bookingDate = event.date;
          bookingTime = event.time;
      }

      newBookingId = generateBookingId(); // Genera ID prenotazione
      const bookingData = {
        id: newBookingId,
        event_id: event.id,
        event_title: event.translations[language as keyof SpecialEvent['translations']].title, // Denormalizzato
        user_name: formData.name,
        user_email: formData.email,
        user_phone: formData.phone,
        participants: formData.participants,
        booking_date: bookingDate,
        booking_time: bookingTime,
        // created_at è gestito da DEFAULT now() nel DB, non serve inviarlo
      };

      // Inserisci prenotazione nel DB
      const { data: insertedBooking, error: bookingError } = await supabase
        .from('special_event_bookings') // Usa il nome tabella corretto
        .insert([bookingData])
        .select() // Richiedi i dati inseriti
        .single();

      if (bookingError) throw bookingError;

      // ----- Successo Inserimento -----

      setCurrentBookingId(newBookingId); // Salva l'ID nello stato per la modal

       // Genera PDF e ottieni URL locale
       let localPdfUrl: string | null = null;
       if(insertedBooking){
           try {
             const pdf = await generatePDF(insertedBooking, event); // Passa anche i dati dell'evento
             if (pdf) {
                const pdfBlob = pdf.output('blob');
                localPdfUrl = URL.createObjectURL(pdfBlob);
                setPdfUrl(localPdfUrl); // Aggiorna stato per la modal
             }
           } catch (pdfError) {
             console.error('Errore generazione PDF:', pdfError);
             // Non bloccare, ma registra
           }
        }

      // Invio email (asincrono, non blocca l'UI)
      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-booking-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, // Usa la chiave corretta
          },
          body: JSON.stringify({
            bookingId: newBookingId, // ID della prenotazione
            type: 'special_event', // Tipo di prenotazione
            email: formData.email, // Email del cliente
            // Invia l'URL del PDF o il base64 se la tua funzione lo gestisce
            // pdfUrl: localPdfUrl, // Potrebbe non funzionare direttamente
             pdfFileName: `Prenotazione_Evento_${newBookingId}.pdf`
            // Se invii base64:
            // pdfBase64: pdfBase64, // Calcolato come nell'altro componente se necessario
          }),
        }
      ).then(response => {
          if (!response.ok) console.error("Errore invio email di conferma");
      }).catch(emailError => {
          console.error('Errore fetch invio email:', emailError);
      });

      setShowConfirmationModal(true); // Mostra la modale di successo

    } catch (err: any) {
      console.error('Errore durante la prenotazione:', err);
      setError(language === 'it' ? `Errore durante la prenotazione: ${err.message}. Riprova.` : `Error during booking: ${err.message}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----- Render del Componente -----

  if (loading) {
    return ( // Aggiunto Header/Footer anche al loading state
       <>
         <Header />
         <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
           <CircularProgress />
         </Box>
         <Footer />
       </>
    );
  }

  if (error || !event) {
    return ( // Aggiunto Header/Footer anche all'error state
       <>
         <Header />
         <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
           <Paper sx={{ p: 4, display: 'inline-block' }}>
             <Typography variant="h5" color="error" gutterBottom>
               {error || (language === 'it' ? 'Evento non trovato' : 'Event not found')}
             </Typography>
             <Button
               variant="contained"
               startIcon={<ArrowBackIcon />}
               onClick={() => navigate('/special')} // Torna alla lista eventi speciali
               sx={{ mt: 2 }}
             >
               {language === 'it' ? 'Torna agli Eventi Speciali' : 'Back to Special Events'}
             </Button>
           </Paper>
         </Container>
         <Footer />
       </>
    );
  }

  // Visualizzazione dei dettagli dell'evento e form di prenotazione
  const currentLang = language as keyof SpecialEvent['translations'];
  const displayDate = event.available_dates && event.available_dates.length > 0 && selectedDate ? format(new Date(selectedDate + 'T00:00:00'), 'PPP', { locale: language === 'it' ? it : undefined }) : format(new Date(event.date + 'T00:00:00'), 'PPP', { locale: language === 'it' ? it : undefined });
  const displayTime = event.available_dates && event.available_dates.length > 0 && selectedDate ? (event.available_dates.find(d => d.date === selectedDate)?.time.join(' - ') || event.time) : event.time;

  return (
   <>
    <Header />
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', pt: { xs: 8, md: 10 } }}> {/* Aggiunto pt */}
      {/* Immagine Header */}
      <Box sx={{ position: 'relative', height: { xs: '30vh', sm: '40vh' }, minHeight: 250, maxHeight: 400 }}>
        <Box
          component="img"
          src={event.image_url || '/placeholder.jpg'}
          alt={event.translations[currentLang]?.title ?? 'Immagine Evento'}
          sx={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover'
          }}
        />
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.4)' }}/>
        <Container maxWidth="lg" sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', py: 2, color: 'white' }}>
           <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/special')} // Bottone per tornare indietro
              sx={{
                alignSelf: 'flex-start', // Allinea in alto a sx
                color: 'white', borderColor: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
           >
              {language === 'it' ? 'Torna agli Eventi' : 'Back to Events'}
           </Button>
           <Box sx={{ pb: { xs: 2, md: 4 } }}> {/* Padding inferiore per il titolo */}
              <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '2rem', sm: '2.8rem', md: '3.2rem'} }}>
                  {event.translations[currentLang]?.title ?? 'Evento Speciale'}
              </Typography>
              {/* Potresti aggiungere location o data qui se vuoi */}
           </Box>
        </Container>
      </Box>

      {/* Contenuto principale */}
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}> {/* Padding y responsive */}
        <Grid container spacing={{ xs: 3, md: 5 }}> {/* Spacing responsive */}

          {/* Colonna Sinistra: Dettagli Evento */}
          <Grid item xs={12} md={7} lg={8}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, mb: 4 }}>
              <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                {language === 'it' ? 'Dettagli Evento' : 'Event Details'}
              </Typography>
              <Divider sx={{ mb: 3 }}/>

              {/* Descrizione (rende HTML se necessario) */}
               <Box
                  component="div"
                  sx={{
                      mb: 4, // Spazio dopo la descrizione
                      ...{/* Stili per HTML interno come nell'esempio precedente */},
                      lineHeight: 1.7, // Interlinea per leggibilità
                      '& p': { mb: 1.5 },
                      '& p:last-of-type': { mb: 0 },
                      '& a': { color: 'primary.main' },
                  }}
                  dangerouslySetInnerHTML={{ __html: event.translations[currentLang]?.description ?? '' }}
               />

              {/* Griglia icone dettagli */}
              <Grid container spacing={2} sx={{ mb: event.translations[currentLang]?.additional_details ? 4 : 0 }}>
                 {[
                     { Icon: LocationIcon, label: language === 'it' ? 'Luogo' : 'Location', value: event.location },
                     { Icon: EventIcon, label: language === 'it' ? 'Data Selezionata' : 'Selected Date', value: displayDate },
                     { Icon: TimeIcon, label: language === 'it' ? 'Orario' : 'Time', value: displayTime },
                     { Icon: GroupIcon, label: language === 'it' ? 'Max Partecipanti' : 'Max Participants', value: event.max_participants.toString() }
                 ].map((item, idx) => (
                    <Grid item xs={12} sm={6} key={idx}>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                           <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark' }}>
                              <item.Icon fontSize="small" />
                           </Avatar>
                           <Box>
                              <Typography variant="body2" color="text.secondary" sx={{lineHeight: 1.2}}>{item.label}</Typography>
                              <Typography variant="body1" fontWeight="medium" sx={{lineHeight: 1.3}}>{item.value}</Typography>
                           </Box>
                       </Box>
                    </Grid>
                 ))}
              </Grid>

              {/* Informazioni Aggiuntive */}
              {event.translations[currentLang]?.additional_details && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom fontWeight="medium">
                    {language === 'it' ? 'Informazioni Aggiuntive' : 'Additional Information'}
                  </Typography>
                  {/* Usa Box con dangerouslySetInnerHTML se anche queste info possono contenere HTML */}
                  <Box component="div" sx={{ '& p:last-of-type': { mb: 0 }}} dangerouslySetInnerHTML={{ __html: event.translations[currentLang]?.additional_details ?? '' }} />
                  {/* <Typography variant="body1" paragraph>
                    {event.translations[currentLang]?.additional_details}
                  </Typography> */}
                </>
              )}

               {/* Link Evento Esterno (se presente) */}
               {event.event_url && (
                   <>
                       <Divider sx={{ my: 3 }} />
                       <Button
                           variant="outlined"
                           startIcon={<LinkIcon />}
                           href={event.event_url}
                           target="_blank"
                           rel="noopener noreferrer"
                       >
                           {language === 'it' ? 'Visita Link Evento' : 'Visit Event Link'}
                       </Button>
                   </>
               )}

            </Paper>
          </Grid>

          {/* Colonna Destra: Box Prenotazione */}
          <Grid item xs={12} md={5} lg={4}>
            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, position: 'sticky', top: 100, zIndex: 1 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold" color="primary.main">
                {language === 'it' ? 'Prenota questo evento' : 'Book this event'}
              </Typography>
              <Divider sx={{ mb: 3 }} />

               {/* === FORM PRENOTAZIONE (NON VIENE PIÙ NASCOSTO) === */}
               <form onSubmit={handleBooking}>
                 <TextField
                    label={language === 'it' ? 'Nome Completo' : 'Full Name'}
                    fullWidth
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    sx={{ mb: 2 }}
                 />
                 <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    sx={{ mb: 2 }}
                 />
                 <TextField
                    label={language === 'it' ? 'Telefono' : 'Phone'}
                    type="tel"
                    fullWidth
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    sx={{ mb: 2 }}
                 />
                 <FormControl fullWidth sx={{ mb: 2 }} required>
                    <InputLabel id="participants-label-special">{language === 'it' ? 'Partecipanti' : 'Participants'}</InputLabel>
                    <Select
                       labelId="participants-label-special"
                       value={formData.participants}
                       label={language === 'it' ? 'Partecipanti' : 'Participants'}
                       onChange={e => setFormData({ ...formData, participants: Number(e.target.value) })}
                    >
                       {event.max_participants > 0 && Array.from({ length: event.max_participants }, (_, i) => (
                          <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
                       ))}
                    </Select>
                 </FormControl>

                  {/* Selettore Data (se ci sono date multiple) */}
                 {(event.available_dates && event.available_dates.length > 0) ? (
                     <FormControl fullWidth sx={{ mb: 3 }} required>
                       <InputLabel id="date-select-label">{language === 'it' ? 'Seleziona Data' : 'Select Date'}</InputLabel>
                       <Select
                          labelId="date-select-label"
                          value={selectedDate}
                          label={language === 'it' ? 'Seleziona Data' : 'Select Date'}
                          onChange={e => setSelectedDate(e.target.value)}
                       >
                          {event.available_dates.map((d) => (
                             <MenuItem key={d.date} value={d.date}>
                                {format(new Date(d.date + 'T00:00:00'), 'PPP', { locale: language === 'it' ? it : undefined })} {`(${d.time[0]} - ${d.time[1]})`}
                             </MenuItem>
                          ))}
                       </Select>
                     </FormControl>
                 ) : (
                    // Mostra la data singola se non ci sono date multiple
                    <TextField
                        label={language === 'it' ? 'Data Evento' : 'Event Date'}
                        value={format(new Date(event.date + 'T00:00:00'), 'PPP', { locale: language === 'it' ? it : undefined })}
                        fullWidth
                        disabled // Non modificabile se è una data singola
                        sx={{ mb: 3 }}
                    />
                 )}

                 <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    disabled={isSubmitting || (!selectedDate && !(event.available_dates && event.available_dates.length > 0))} // Disabilita se non c'è data selezionata (in caso di date multiple)
                    startIcon={<PaymentIcon />}
                    sx={{ py: 1.5 }}
                 >
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (language === 'it' ? 'Prenota ora' : 'Book now')}
                 </Button>
                  {error && ( // Mostra errore di prenotazione qui se presente
                     <Typography color="error" variant="caption" display="block" mt={1} textAlign="center">
                        {error}
                     </Typography>
                  )}
               </form>
               {/* === FINE FORM PRENOTAZIONE === */}

            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>

     {/* MODAL DI CONFERMA (usiamo quella generica) */}
     <BookingConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)} // Chiude la modal
        bookingId={currentBookingId} // Passa l'ID salvato nello stato
        language={language as 'it' | 'en'} // Assicura il tipo corretto
        pdfUrl={pdfUrl} // Passa l'URL del PDF
     />

    <Footer />
   </>
  );
}