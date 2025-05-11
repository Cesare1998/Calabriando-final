import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Box, Container, Typography, Paper, CircularProgress, Button, Divider } from '@mui/material';

interface Booking {
  id: string;
  event_title: string;
  user_name: string;
  user_email: string;
  participants: number;
  booking_date: string;
  booking_time: string;
}

export default function SpecialBookingConfirmPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBooking = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('special_event_bookings')
          .select('*')
          .eq('id', bookingId)
          .single();
        if (error) throw error;
        setBooking(data);
      } catch (err) {
        setError('Prenotazione non trovata o già utilizzata.');
      } finally {
        setLoading(false);
      }
    };
    if (bookingId) loadBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !booking) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {error || 'Prenotazione non trovata'}
          </Typography>
          <Button component={Link} to="/special" variant="contained" sx={{ mt: 2 }}>
            Torna agli Eventi
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
        <Typography variant="h4" color="success.main" fontWeight="bold" gutterBottom>
          Prenotazione Confermata!
        </Typography>
        <Typography variant="h6" gutterBottom>
          {booking.event_title}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body1" gutterBottom>
          <strong>Nome:</strong> {booking.user_name}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Email:</strong> {booking.user_email}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Partecipanti:</strong> {booking.participants}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Data:</strong> {booking.booking_date}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Ora:</strong> {booking.booking_time}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Presenta questa schermata all'organizzatore dell'evento per confermare la tua prenotazione.
        </Typography>
        <Button component={Link} to="/special" variant="outlined" sx={{ mt: 3 }}>
          Torna agli Eventi
        </Button>
      </Paper>
    </Container>
  );
} 