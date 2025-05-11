import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  // Card, // Card non sembra essere usato direttamente qui, potrebbe essere rimosso se non serve altrove
  // CardContent, // Come sopra
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Paper,
  useTheme,
  CircularProgress,
  // Chip, // Come sopra
  Avatar
} from '@mui/material';
import {
  Schedule as ClockIcon,
  People as UsersIcon,
  Euro as EuroIcon,
  LocationOn as MapPinIcon,
  ArrowBack as ArrowBackIcon,
  CalendarMonth as CalendarIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { it } from 'date-fns/locale';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // Assicurati di aver importato jspdf-autotable se usi doc.autoTable
import QRCode from 'qrcode';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BookingConfirmationModal from '../components/BookingConfirmationModal'; // Assicurati che questo componente esista e sia corretto
import ScrollToTop from '../components/ScrollToTop';

interface Adventure {
  id: string;
  title: string;
  description: string; // Questa conterrà l'HTML
  image_url: string;
  duration: string;
  price: number;
  max_participants: number;
  available_dates: Array<{
    date: string;
    time: [string, string];
  }>;
  location: string;
  adventure_type: string;
  translations: {
    it: {
      title: string;
      description: string; // Questa conterrà l'HTML in italiano
    };
    en: {
      title: string;
      description: string; // Questa conterrà l'HTML in inglese
    };
  };
}

interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  date: Date | null;
  participants: number;
}

export default function AdventureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const theme = useTheme();

  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingId, setBookingId] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    email: '',
    phone: '',
    date: null,
    participants: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAdventure();
  }, [id]); // Ricarica se l'ID cambia

  const loadAdventure = async () => {
    if (!id) {
      setLoading(false); // Ferma il caricamento se non c'è ID
      console.error("Adventure ID is missing");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('adventures') // Assicurati che il nome tabella sia corretto
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
         // Se l'errore è "JSON object requested, multiple (or no) rows returned", l'ID potrebbe non esistere
         if (error.code === 'PGRST116') {
            console.error(`Adventure with ID ${id} not found.`);
            setAdventure(null); // Imposta adventure a null esplicitamente
         } else {
            throw error; // Lancia altri errori Supabase
         }
      } else {
       setAdventure(data);
      }

    } catch (err: any) { // Tipizza l'errore se possibile
      console.error('Error loading adventure:', err);
      setAdventure(null); // Imposta a null in caso di errore generico
    } finally {
      setLoading(false);
    }
  };

  const generateBookingId = () => {
    const timestamp = Date.now().toString(36);
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return `BK-${timestamp}-${randomSuffix}`.toUpperCase(); // Opzionale: maiuscolo
  };

  const generatePDF = async (bookingData: any) => {
    // Verifica che i dati necessari esistano
    if (!adventure || !bookingData) {
       console.error("Cannot generate PDF: Missing adventure or booking data.");
       return null; // Ritorna null o lancia errore
    }

    const doc = new jsPDF();

    // Skip logo for now to avoid image loading issues
    doc.setFontSize(20);
    doc.text('Calabriando Adventure Booking', 20, 20);

    doc.setFontSize(12);
    doc.text('Booking Details:', 20, 40);

    // Gestione sicura dei dati opzionali o mancanti
    const details = [
      ['Adventure', adventure?.translations?.[language]?.title ?? 'N/A'],
      ['Date', bookingData.booking_date ? format(new Date(bookingData.booking_date), 'dd/MM/yyyy') : 'N/A'],
      ['Time', bookingData.booking_time && Array.isArray(bookingData.booking_time) ? `${bookingData.booking_time[0]} - ${bookingData.booking_time[1]}` : 'N/A'],
      ['Participants', bookingData.participants?.toString() ?? 'N/A'],
      ['Total Price', bookingData.total_price ? `€${bookingData.total_price}` : 'N/A'],
      ['Booking Reference', bookingData.id ?? 'N/A'],
      ['Customer Name', bookingData.user_name ?? 'N/A'],
      ['Customer Email', bookingData.user_email ?? 'N/A'],
      ['Customer Phone', bookingData.user_phone ?? 'N/A']
    ];

    // Assicurati che autoTable sia disponibile (import 'jspdf-autotable';)
    if ((doc as any).autoTable) {
      (doc as any).autoTable({
        startY: 50,
        head: [['Item', 'Detail']],
        body: details,
        theme: 'striped',
        headStyles: { fillColor: [0, 87, 183] } // Usa i colori del tuo tema se preferisci
      });
    } else {
      console.warn('jsPDF autoTable plugin is not available. Skipping table generation.');
      // Potresti generare il testo manualmente qui come fallback
      let yPos = 50;
      details.forEach(row => {
          doc.text(`${row[0]}: ${row[1]}`, 20, yPos);
          yPos += 7; // Spaziatura
      });
    }

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 100; // Posizione dopo la tabella

    try {
      // Generate QR code
      const qrContent = JSON.stringify({
        bookingId: bookingData.id,
        adventureId: adventure?.id,
        date: bookingData.booking_date,
        time: bookingData.booking_time,
        participants: bookingData.participants
      });
      const qrData = await QRCode.toDataURL(qrContent);

      // Add QR code
      const qrSize = 50; // Dimensione QR
      const qrX = (doc.internal.pageSize.getWidth() - qrSize) / 2; // Centra QR
      const qrY = finalY + 15; // Posiziona sotto la tabella
      doc.addImage(qrData, 'PNG', qrX, qrY, qrSize, qrSize);
      doc.setFontSize(10);
      doc.text('Scan to verify booking', qrX, qrY + qrSize + 5, { align: 'center' });
    } catch (error) {
      console.error('Error generating QR code:', error);
      // Continue without QR code if there's an error
    }

    return doc;
  };

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Aggiungere validazione più robusta qui se necessario (es. regex per email/telefono)
    if (!adventure || !formData.date || !formData.name || !formData.email || !formData.phone || isSubmitting) {
        alert(language === 'it' ? 'Per favore, compila tutti i campi richiesti.' : 'Please fill in all required fields.');
        return;
    }

    setIsSubmitting(true); // Muovi qui per indicare inizio submit

    try {
      const dateStr = format(formData.date, 'yyyy-MM-dd');
      const timeRange = adventure.available_dates?.find(d => d.date === dateStr)?.time; // Usa optional chaining

      if (!timeRange) {
        // Questo non dovrebbe succedere se DatePicker è configurato correttamente, ma è una sicurezza
        alert(language === 'it' ? 'Orario non trovato per la data selezionata.' : 'Time not found for the selected date.');
        setIsSubmitting(false); // Resetta lo stato
        return;
      }

      const newBookingId = generateBookingId(); // Genera ID qui
      const totalAmount = adventure.price * formData.participants;

      const bookingData = {
        id: newBookingId, // Usa il nuovo ID
        adventure_id: adventure.id,
        user_email: formData.email,
        user_name: formData.name,
        user_phone: formData.phone,
        booking_date: dateStr,
        booking_time: timeRange, // Assicurati che questo sia un array [string, string] o il tipo atteso dal DB
        participants: formData.participants,
        total_price: totalAmount,
        payment_method: 'cash', // Assicurati che questi valori siano corretti per il tuo DB
        payment_status: 'pending' // Assicurati che questi valori siano corretti per il tuo DB
      };

      // Inserisci nella tabella corretta
      const { data: insertedBooking, error: bookingError } = await supabase
        .from('adventure_bookings') // Usa il nome corretto della tabella prenotazioni avventure
        .insert([bookingData])
        .select() // Richiedi i dati inseriti (utile per il PDF/Email)
        .single(); // Aspettati una sola riga inserita

      if (bookingError) throw bookingError; // Lancia errore Supabase

      // Procedi solo se l'inserimento ha avuto successo e abbiamo i dati
      if (insertedBooking) {
          let generatedPdfUrl = ''; // Variabile locale per URL PDF
          try {
            // Generate PDF con i dati restituiti da Supabase (insertedBooking)
            const pdf = await generatePDF(insertedBooking);
            if (pdf) {
                const pdfBlob = pdf.output('blob');
                generatedPdfUrl = URL.createObjectURL(pdfBlob);
                setPdfUrl(generatedPdfUrl); // Aggiorna lo stato per la modal
            }
          } catch (pdfError) {
            console.error('Error generating PDF:', pdfError);
            // Continua anche senza PDF
          }

          // Invia email di conferma (potrebbe usare 'insertedBooking' per dettagli)
          try {
            // Converti il blob del PDF in base64 se necessario per l'invio
            let pdfBase64 = '';
             if (generatedPdfUrl) {
                const response = await fetch(generatedPdfUrl);
                const blob = await response.blob();
                const reader = new FileReader();
                await new Promise<void>((resolve, reject) => {
                    reader.onloadend = () => {
                        pdfBase64 = (reader.result as string).split(',')[1]; // Estrae solo la parte base64
                        resolve();
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            }

            await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-booking-email`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, // Assicurati sia la chiave corretta
                },
                body: JSON.stringify({
                  bookingId: insertedBooking.id, // Usa l'ID confermato
                  type: 'adventure', // Specifica il tipo
                  email: insertedBooking.user_email, // Usa l'email confermata
                  pdfBase64: pdfBase64 || undefined, // Invia base64 se presente
                  pdfFileName: `Prenotazione_${insertedBooking.id}.pdf`
                }),
              }
            );
             // Gestisci la risposta dell'email se necessario (es. !emailResponse.ok)

          } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
             // Non bloccare l'utente se l'email fallisce, ma registra l'errore
          }

          setBookingId(insertedBooking.id); // Imposta l'ID per la modal
          setShowConfirmation(true); // Mostra la modal di successo
       } else {
           // Caso strano in cui non c'è errore ma non ci sono dati inseriti
           throw new Error("Booking data could not be confirmed after insertion.");
       }

    } catch (err: any) { // Tipizza l'errore
      console.error('Error processing booking:', err);
      // Mostra un messaggio di errore più specifico se possibile
      let errorMessage = language === 'it' ? 'Errore durante la prenotazione. Riprova.' : 'Error during booking. Please try again.';
      if (err.message) {
          errorMessage += ` (${err.message})`; // Aggiunge il messaggio di errore specifico
      }
      alert(errorMessage);
    } finally {
      setIsSubmitting(false); // Assicurati che venga eseguito sempre
    }
  };


  const getTimeDisplay = () => {
    if (!adventure?.available_dates || !formData.date) return '';
    const dateStr = format(formData.date, 'yyyy-MM-dd');
    const dateData = adventure.available_dates.find(d => d.date === dateStr);
    if (!dateData) return '';
    // Assicurati che dateData.time sia un array con due elementi
    if (Array.isArray(dateData.time) && dateData.time.length >= 2) {
      return ` - ${dateData.time[0]}-${dateData.time[1]}`;
    }
    return ''; // Ritorna stringa vuota se il formato non è corretto
  };

  // ---------- Render del Componente ----------

  if (loading) {
    return (
      <>
        <Header />
        <Box sx={{ pt: 12, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={60} />
        </Box>
        <Footer />
      </>
    );
  }

  if (!adventure) {
    return (
      <>
        <Header />
        <Box sx={{ pt: 12, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 2 }}>
          <Paper elevation={3} sx={{ p: 4, maxWidth: 500 }}>
            <Typography variant="h5" color="error" gutterBottom>
              {language === 'it' ? 'Avventura non trovata' : 'Adventure not found'}
            </Typography>
             <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {language === 'it' ? 'L\'avventura che stai cercando non esiste o è stata rimossa.' : 'The adventure you are looking for does not exist or has been removed.'}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/" // O alla pagina delle avventure
              startIcon={<ArrowBackIcon />}
            >
              {language === 'it' ? 'Torna alla Home' : 'Back to Home'}
            </Button>
          </Paper>
        </Box>
        <Footer />
      </>
    );
  }

  // Render principale della pagina
  return (
    <>
      <Header />
      <ScrollToTop />
      <Box sx={{ pt: {xs: 8, md: 12}, minHeight: '100vh', bgcolor: 'background.default' }}> {/* Aumenta padding top su schermi medi+ */}
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Button
              component={Link}
              // Link alla categoria specifica se adventure_type è affidabile
              to={adventure.adventure_type ? `/adventure/${adventure.adventure_type}` : '/'}
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2 }}
            >
              {language === 'it' ? 'Torna alle Avventure' : 'Back to Adventures'}
            </Button>
          </Box>

          <Paper
            elevation={4}
            sx={{
              borderRadius: 4,
              overflow: 'hidden', // Mantiene l'overflow nascosto per l'immagine
              mb: 6
            }}
          >
            {/* Sezione Immagine e Titolo */}
            <Box sx={{ position: 'relative', height: { xs: 250, sm: 350, md: 450 } }}> {/* Altezza immagine responsive */}
              <Box
                component="img"
                src={adventure.image_url || '/placeholder-image.jpg'} // Fallback image
                alt={adventure.translations[language]?.title ?? 'Adventure Image'}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block' // Evita spazio extra sotto l'immagine
                }}
              />
              {/* Overlay scuro per leggibilità testo */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)'
                }}
              />
              {/* Testo sopra l'immagine */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: { xs: 2, sm: 3, md: 4 }, // Padding responsive
                  color: 'white'
                }}
              >
                <Typography
                  variant="h3"
                  component="h1"
                  fontWeight="bold"
                  gutterBottom
                  sx={{ fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem'} }} // Font size responsive
                >
                  {adventure.translations[language]?.title ?? 'N/A'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MapPinIcon fontSize="small" />
                  <Typography variant="h6" component="p" sx={{ fontSize: { xs: '1rem', sm: '1.125rem'} }}>
                    {adventure.location}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Contenuto sotto l'immagine */}
            <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}> {/* Padding responsive */}
              <Grid container spacing={{ xs: 3, md: 4 }}> {/* Spacing responsive */}

                {/* Colonna Sinistra: Descrizione e Dettagli */}
                <Grid item xs={12} md={8}>
                  <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
                    {language === 'it' ? 'Descrizione dell\'Avventura' : 'Adventure Description'}
                  </Typography>

                   {/* === SEZIONE DESCRIZIONE HTML === */}
                  <Box
                    component="div"
                    sx={{
                      ...theme.typography.body1,
                      lineHeight: 1.6, // Migliora leggibilità
                      color: theme.palette.text.primary,
                      mb: 4, // Spazio dopo la descrizione
                      '& p': { mb: 1.5 }, // Spazio tra paragrafi
                      '& p:last-of-type': { mb: 0 },
                      '& a': {
                          color: 'primary.main',
                          textDecoration: 'underline',
                          '&:hover': { color: 'primary.dark' },
                      },
                      '& ul, & ol': { pl: 3, mb: 1.5 },
                      '& li': { mb: 0.5 },
                      '& strong, & b': { fontWeight: theme.typography.fontWeightBold },
                      '& em, & i': { fontStyle: 'italic' },
                    }}
                    dangerouslySetInnerHTML={{ __html: adventure.translations[language]?.description ?? '' }}
                  />
                  {/* === FINE SEZIONE DESCRIZIONE HTML === */}


                  {/* Icone Info Avventura */}
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    {[
                        { Icon: ClockIcon, label: language === 'it' ? 'Durata' : 'Duration', value: `${adventure.duration}${getTimeDisplay()}` },
                        { Icon: UsersIcon, label: language === 'it' ? 'Max Partecipanti' : 'Max Participants', value: adventure.max_participants },
                        { Icon: EuroIcon, label: language === 'it' ? 'Prezzo' : 'Price', value: `${adventure.price}€ ${language === 'it' ? 'a persona' : 'per person'}` }
                    ].map((item, index) => (
                         <Grid item xs={12} sm={4} key={index}>
                            <Paper
                              elevation={1} // Meno elevazione per un look più pulito
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                bgcolor: 'grey.50' // Sfondo leggermente diverso
                              }}
                            >
                              <item.Icon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {item.label}
                              </Typography>
                              <Typography variant="h6" fontWeight="medium" component="p"> {/* Usa P per semantica */}
                                {item.value}
                              </Typography>
                            </Paper>
                        </Grid>
                    ))}
                  </Grid>

                  {/* Sezione Date Disponibili (se necessario mostrarle qui) */}
                  {/* ... potresti aggiungere la visualizzazione delle date qui se non vuoi che siano solo nel date picker ... */}

                </Grid>

                {/* Colonna Destra: Box Prenotazione */}
                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      position: 'sticky',
                      top: { xs: 20, md: 100 }, // Sticky top responsive
                      zIndex: 1 // Assicura che stia sopra altri elementi durante lo scroll
                    }}
                  >
                    <Typography variant="h5" component="h3" gutterBottom fontWeight="bold" color="primary.main">
                      {language === 'it' ? 'Prenota l\'Avventura' : 'Book the Adventure'}
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <form onSubmit={handleSubmit}>
                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={language === 'it' ? it : undefined}>
                        <DatePicker
                          label={language === 'it' ? 'Data' : 'Date'}
                          value={formData.date}
                          onChange={(newDate) => setFormData({ ...formData, date: newDate })}
                          disablePast
                          shouldDisableDate={(date) => {
                            if (!adventure) return true;
                            const dateStr = format(date, 'yyyy-MM-dd');
                            return !adventure.available_dates.some(d => d.date === dateStr);
                          }}
                          slotProps={{ textField: { required: true } }}
                          sx={{ width: '100%', mb: 3 }}
                        />
                      </LocalizationProvider>

                      <FormControl fullWidth sx={{ mb: 3 }} required>
                        <InputLabel id="participants-label">
                          {language === 'it' ? 'Partecipanti' : 'Participants'}
                        </InputLabel>
                        <Select
                          labelId="participants-label"
                          value={formData.participants}
                          label={language === 'it' ? 'Partecipanti' : 'Participants'}
                          onChange={(e) => setFormData({ ...formData, participants: Number(e.target.value) })}
                        >
                          {adventure && Array.from({ length: adventure.max_participants }, (_, i) => (
                            <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <TextField
                        label={language === 'it' ? 'Nome Completo' : 'Full Name'}
                        fullWidth
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        sx={{ mb: 3 }}
                      />

                      <TextField
                        label="Email" // Label universale
                        type="email"
                        fullWidth
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        sx={{ mb: 3 }}
                      />

                      <TextField
                        label={language === 'it' ? 'Telefono' : 'Phone'}
                        type="tel"
                        fullWidth
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        sx={{ mb: 4 }}
                      />

                      <Divider sx={{ mb: 3 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="body1" color="text.secondary">
                          {language === 'it' ? 'Totale' : 'Total'}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                          {adventure ? adventure.price * formData.participants : 0}€
                        </Typography>
                      </Box>

                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        fullWidth
                        disabled={!formData.date || isSubmitting || adventure.available_dates.length === 0} // Disabilita se non ci sono date disponibili
                        startIcon={<PaymentIcon />}
                        sx={{ py: 1.5 }}
                      >
                        {isSubmitting ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          language === 'it' ? 'Prenota Ora' : 'Book Now'
                        )}
                      </Button>
                        {adventure.available_dates.length === 0 && (
                             <Typography variant="caption" color="error" display="block" textAlign="center" mt={1}>
                                 {language === 'it' ? 'Nessuna data disponibile per la prenotazione.' : 'No dates available for booking.'}
                             </Typography>
                        )}
                    </form>
                  </Paper>
                </Grid> {/* Fine Grid Item Destro */}
              </Grid> {/* Fine Grid Container Interno */}
            </Box> {/* Fine Box Contenuto Sotto Immagine */}
          </Paper> {/* Fine Paper Principale */}
        </Container>
      </Box>

      {/* Modal di Conferma (assicurati che il componente esista e sia importato correttamente) */}
      <BookingConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        bookingId={bookingId}
        language={language} // Passa la lingua corretta ('it' o 'en')
        pdfUrl={pdfUrl || null} // Passa null se vuoto
      />

      <Footer />
    </>
  );
}