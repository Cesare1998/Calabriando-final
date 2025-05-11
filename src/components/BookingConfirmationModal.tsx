// src/components/BookingConfirmationModal.tsx
import React from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Chip,
  Divider,
  Avatar // Import Avatar per l'icona cerchiata
} from '@mui/material';
import {
  CheckCircleOutline as CheckCircleIcon, // Icona di successo MUI
  Close as CloseIcon,
  Download as DownloadIcon,
  Home as HomeIcon // Icona Home MUI
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom'; // Importa Link se vuoi usarlo per il pulsante Home

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  language: 'it' | 'en'; // Già definito correttamente
  pdfUrl: string; // Manteniamo la definizione come stringa
}

// Stile per centrare la modal e renderla responsive
const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 450, md: 500 },
  bgcolor: 'background.paper',
  borderRadius: 3, // Mantiene i bordi arrotondati
  boxShadow: 24,
  p: 0, // Padding gestito internamente per permettere la barra colorata
  overflow: 'hidden' // Nasconde l'overflow della barra colorata
};

export default function BookingConfirmationModal({
  isOpen,
  onClose,
  bookingId,
  language,
  pdfUrl
}: BookingConfirmationModalProps) {
  const navigate = useNavigate(); // Hook per la navigazione

  if (!isOpen) return null;

  const handleDownload = () => {
    // Verifica che pdfUrl non sia vuoto prima di tentare il download
    if (!pdfUrl) {
      console.warn("PDF URL is empty, cannot download.");
      // Potresti mostrare un messaggio all'utente qui
      return;
    }
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Prenotazione_${bookingId}.pdf`; // Nome file coerente
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="booking-confirmation-title"
      aria-describedby="booking-confirmation-description"
    >
      <Paper sx={modalStyle}>
         {/* Barra colorata in alto (simula il gradiente con il colore primario) */}
         <Box sx={{ height: '8px', background: (theme) => theme.palette.primary.main }} />

         {/* Contenuto della Modal con padding */}
         <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, textAlign: 'center' }}>
            {/* Pulsante di chiusura */}
            <IconButton
                aria-label={language === 'it' ? 'Chiudi' : 'Close'}
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 12, // Appena sotto la barra colorata
                    color: (theme) => theme.palette.grey[500],
                }}
            >
                <CloseIcon />
            </IconButton>

            {/* Icona di successo cerchiata */}
            <Avatar sx={{ bgcolor: 'success.light', width: 64, height: 64, margin: '0 auto 1.5rem auto' }}>
                <CheckCircleIcon sx={{ color: 'success.dark', fontSize: 40 }} />
            </Avatar>

            {/* Titolo */}
            <Typography id="booking-confirmation-title" variant="h5" component="h2" gutterBottom fontWeight="bold">
              {language === 'it' ? 'Prenotazione Confermata!' : 'Booking Confirmed!'}
            </Typography>

            {/* Descrizione */}
            <Typography id="booking-confirmation-description" variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {language === 'it'
                ? 'La tua prenotazione è stata registrata. Riceverai una email di conferma con i dettagli.'
                : 'Your booking has been registered. You will receive a confirmation email with the details.'}
            </Typography>

            {/* Riferimento Prenotazione (con sfondo leggero) */}
            <Paper elevation={0} sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 2, mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                   {language === 'it' ? 'Riferimento prenotazione:' : 'Booking reference:'}
                </Typography>
                {/* Chip è un'alternativa, o usa Typography come nel tuo codice originale */}
                {/* <Chip label={bookingId} color="primary" sx={{ fontWeight: 'bold', fontSize: '1rem' }} /> */}
                 <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'text.primary' }}>
                   {bookingId}
                 </Typography>
            </Paper>

            {/* Pulsanti Azione */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
               {/* Pulsante Download PDF */}
               <Button
                 variant="contained" // Stile primario
                 color="primary"
                 onClick={handleDownload}
                 disabled={!pdfUrl} // Disabilita se pdfUrl è vuoto
                 fullWidth
                 startIcon={<DownloadIcon />}
                 sx={{ py: 1.2 }} // Padding verticale
               >
                 {language === 'it' ? 'Scarica Ricevuta' : 'Download Receipt'}
               </Button>

               {/* Pulsante Torna alla Home */}
               <Button
                 variant="outlined" // Stile secondario
                 color="secondary" // O 'primary' se preferisci
                 onClick={() => navigate('/')} // Naviga alla home
                 fullWidth
                 startIcon={<HomeIcon />}
                 sx={{ py: 1.2 }} // Padding verticale
               >
                 {language === 'it' ? 'Torna alla Home' : 'Back to Home'}
               </Button>
            </Box>
         </Box>
      </Paper>
    </Modal>
  );
}