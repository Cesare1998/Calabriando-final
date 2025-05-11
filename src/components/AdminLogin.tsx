import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Avatar, 
  Alert, 
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  LockOutlined as LockIcon, 
  HomeOutlined as HomeIcon 
} from '@mui/icons-material';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Normalize the email input
      let normalizedEmail = email.trim().toLowerCase();
      
      // If it's just the username part, append the domain
      if (!normalizedEmail.includes('@')) {
        normalizedEmail = `${normalizedEmail}@calabriando.it`;
      }
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          throw new Error('Credenziali non valide. Verifica username e password.');
        }
        throw signInError;
      }

      if (data?.user) {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Errore durante l\'accesso. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'grey.100',
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative'
      }}
    >
      <Link
        to="/"
        style={{ 
          position: 'absolute', 
          top: 24, 
          left: 24, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8,
          textDecoration: 'none',
          color: 'white',
          zIndex: 1
        }}
      >
        <HomeIcon />
        <span>Torna al sito</span>
      </Link>

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper 
          elevation={6} 
          sx={{ 
            p: 4, 
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            bgcolor: 'rgba(255, 255, 255, 0.9)'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
              <LockIcon fontSize="large" />
            </Avatar>
            <Typography component="h1" variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
              Accesso Amministratore
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Username o Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Inserisci "calabriando_team" o l'email completa "calabriando_team@calabriando.it"
              </Typography>
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="outlined"
                sx={{ mb: 3 }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ 
                  py: 1.5, 
                  fontSize: '1rem',
                  position: 'relative'
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Accedi'
                )}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}