import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper, 
  Grid, 
  Divider, 
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  CheckCircleOutline as CheckIcon, 
  GetApp as DownloadIcon, 
  Home as HomeIcon 
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface BookingDetails {
  id: string;
  user_name: string;
  user_email: string;
  booking_date: string;
  booking_time: string[];
  participants: number;
  total_price: number;
  payment_status: string;
  tour?: {
    translations: {
      [key: string]: {
        title: string;
      }
    }
  };
  adventure?: {
    translations: {
      [key: string]: {
        title: string;
      }
    }
  };
}

export default function PaymentSuccessPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setLoading(true);
        setError(null);

        const sessionId = searchParams.get('session_id');
        const reference = searchParams.get('reference');
        const type = searchParams.get('type');

        if (!sessionId || !reference || !type) {
          throw new Error(language === 'it' 
            ? 'Parametri di pagamento mancanti o non validi'
            : 'Missing or invalid payment parameters');
        }

        // First, verify the payment with Stripe
        const verifyResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mark-as-paid`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ 
              session_id: sessionId,
              reference,
              type
            }),
          }
        );

        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          throw new Error(errorData.error || 'Payment verification failed');
        }

        const { booking } = await verifyResponse.json();

        if (!booking) {
          throw new Error(language === 'it'
            ? 'Dettagli prenotazione non trovati'
            : 'Booking details not found');
        }

        setBookingDetails(booking);
        
        // Generate PDF receipt
        const pdf = await generatePDF(booking);
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);

      } catch (err) {
        console.error('Error processing payment success:', err);
        setError(
          err instanceof Error 
            ? err.message 
            : language === 'it'
              ? 'Si è verificato un errore durante la verifica del pagamento'
              : 'An error occurred while verifying the payment'
        );
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
    
    // Cleanup function to revoke object URLs
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [searchParams, language]);

  const generatePDF = async (bookingData: BookingDetails) => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(0, 87, 183); // Primary blue color
    doc.text('Calabriando', 20, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(language === 'it' ? 'Ricevuta di Pagamento' : 'Payment Receipt', 20, 30);
    
    // Add booking details
    const itemTitle = bookingData.tour
      ? bookingData.tour.translations[language]?.title
      : bookingData.adventure?.translations[language]?.title;
      
    const details = [
      [language === 'it' ? 'Attività' : 'Activity', itemTitle || ''],
      [language === 'it' ? 'Riferimento' : 'Reference', bookingData.id],
      [language === 'it' ? 'Data' : 'Date', new Date(bookingData.booking_date).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US')],
      [language === 'it' ? 'Orario' : 'Time', `${bookingData.booking_time[0]} - ${bookingData.booking_time[1]}`],
      [language === 'it' ? 'Partecipanti' : 'Participants', bookingData.participants.toString()],
      [language === 'it' ? 'Totale Pagato' : 'Total Paid', `€${bookingData.total_price}`],
      [language === 'it' ? 'Stato Pagamento' : 'Payment Status', language === 'it' ? 'Completato' : 'Completed'],
      [language === 'it' ? 'Cliente' : 'Customer', bookingData.user_name],
      [language === 'it' ? 'Email' : 'Email', bookingData.user_email]
    ];

    (doc as any).autoTable({
      startY: 40,
      head: [[language === 'it' ? 'Dettaglio' : 'Detail', language === 'it' ? 'Valore' : 'Value']],
      body: details,
      theme: 'striped',
      headStyles: { fillColor: [0, 87, 183], textColor: [255, 255, 255] },
      styles: { fontSize: 10 }
    });
    
    // Add footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Calabriando - ${language === 'it' ? 'Pagina' : 'Page'} ${i} ${language === 'it' ? 'di' : 'of'} ${pageCount}`,
        doc.internal.pageSize.width / 2, 
        doc.internal.pageSize.height - 10, 
        { align: 'center' }
      );
    }
    
    return doc;
  };

  const handleDownloadReceipt = () => {
    if (!pdfUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `calabriando-receipt-${bookingDetails?.id || 'payment'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Header />
      <Box 
        sx={{ 
          pt: 12, 
          minHeight: '100vh', 
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <Container maxWidth="md" sx={{ py: 8 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
              <CircularProgress size={60} />
            </Box>
          ) : error ? (
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                borderRadius: 2,
                textAlign: 'center',
                bgcolor: 'error.light',
                color: 'error.contrastText'
              }}
            >
              <Typography variant="h5" gutterBottom fontWeight="bold">
                {language === 'it' ? 'Errore' : 'Error'}
              </Typography>
              <Typography variant="body1" paragraph>
                {error}
              </Typography>
              <Typography variant="body2" paragraph sx={{ mb: 4 }}>
                {language === 'it'
                  ? 'Per assistenza, contatta il nostro supporto clienti:'
                  : 'For assistance, please contact our customer support:'}
                <br />
                <Link to="mailto:support@calabriando.it" style={{ color: 'inherit', fontWeight: 'bold' }}>
                  support@calabriando.it
                </Link>
              </Typography>
              <Button
                variant="contained"
                color="primary"
                component={Link}
                to="/"
                startIcon={<HomeIcon />}
              >
                {language === 'it' ? 'Torna alla Home' : 'Back to Home'}
              </Button>
            </Paper>
          ) : (
            <Paper 
              elevation={3} 
              sx={{ 
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              <Box 
                sx={{ 
                  bgcolor: 'success.main', 
                  color: 'white',
                  p: 4,
                  textAlign: 'center'
                }}
              >
                <CheckIcon sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                  {language === 'it' ? 'Pagamento Completato!' : 'Payment Completed!'}
                </Typography>
                <Typography variant="body1">
                  {language === 'it'
                    ? 'La tua prenotazione è stata confermata e il pagamento è stato elaborato con successo.'
                    : 'Your booking has been confirmed and payment has been processed successfully.'}
                </Typography>
              </Box>
              
              <Box sx={{ p: 4 }}>
                {bookingDetails && (
                  <>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      {language === 'it' ? 'Dettagli Prenotazione:' : 'Booking Details:'}
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {language === 'it' ? 'Attività' : 'Activity'}
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {bookingDetails.tour
                              ? bookingDetails.tour.translations[language]?.title
                              : bookingDetails.adventure?.translations[language]?.title}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {language === 'it' ? 'Riferimento' : 'Reference'}
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" sx={{ wordBreak: 'break-all' }}>
                            {bookingDetails.id}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {language === 'it' ? 'Data' : 'Date'}
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {new Date(bookingDetails.booking_date).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {language === 'it' ? 'Orario' : 'Time'}
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {bookingDetails.booking_time[0]} - {bookingDetails.booking_time[1]}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {language === 'it' ? 'Partecipanti' : 'Participants'}
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {bookingDetails.participants}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                          <Typography variant="subtitle2" color="inherit" sx={{ opacity: 0.9 }} gutterBottom>
                            {language === 'it' ? 'Totale Pagato' : 'Total Paid'}
                          </Typography>
                          <Typography variant="h5" fontWeight="bold">
                            €{bookingDetails.total_price}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                    
                    <Divider sx={{ my: 3 }} />
                    
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownloadReceipt}
                        disabled={!pdfUrl}
                        sx={{ py: 1.5 }}
                      >
                        {language === 'it' ? 'Scarica Ricevuta' : 'Download Receipt'}
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        fullWidth
                        size="large"
                        component={Link}
                        to="/"
                        startIcon={<HomeIcon />}
                        sx={{ py: 1.5 }}
                      >
                        {language === 'it' ? 'Torna alla Home' : 'Back to Home'}
                      </Button>
                    </Box>
                  </>
                )}
              </Box>
            </Paper>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
}