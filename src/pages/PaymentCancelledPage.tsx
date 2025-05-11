import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper,
  useTheme
} from '@mui/material';
import { 
  CancelOutlined as XCircleIcon, 
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function PaymentCancelledPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const theme = useTheme();

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
          <Paper 
            elevation={3} 
            sx={{ 
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Box 
              sx={{ 
                bgcolor: 'error.main', 
                color: 'white',
                p: 4,
                textAlign: 'center'
              }}
            >
              <XCircleIcon sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                {language === 'it' ? 'Pagamento Annullato' : 'Payment Cancelled'}
              </Typography>
              <Typography variant="body1">
                {language === 'it'
                  ? 'Il processo di pagamento è stato interrotto o annullato.'
                  : 'The payment process was interrupted or cancelled.'}
              </Typography>
            </Box>
            
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" paragraph sx={{ mb: 4 }}>
                {language === 'it'
                  ? 'La tua prenotazione è ancora in sospeso e può essere completata in un secondo momento. Se hai riscontrato problemi durante il pagamento, puoi riprovare o contattarci per assistenza.'
                  : 'Your booking is still pending and can be completed at a later time. If you encountered issues during payment, you can try again or contact us for assistance.'}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate(-1)}
                  sx={{ px: 3, py: 1.5 }}
                >
                  {language === 'it' ? 'Torna alla Prenotazione' : 'Back to Booking'}
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  component={Link}
                  to="/"
                  startIcon={<HomeIcon />}
                  sx={{ px: 3, py: 1.5 }}
                >
                  {language === 'it' ? 'Torna alla Home' : 'Back to Home'}
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
                {language === 'it'
                  ? 'Per assistenza, contattaci a:'
                  : 'For assistance, contact us at:'}
                <br />
                <Link to="mailto:info@calabriando.it" style={{ color: theme.palette.primary.main }}>
                  info@calabriando.it
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
      <Footer />
    </>
  );
}