import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActions,
  Button, 
  AppBar, 
  Toolbar, 
  useTheme,
  Avatar
} from '@mui/material';
import { 
  Map as MapIcon, 
  Restaurant as UtensilsIcon, 
  Apartment as BuildingIcon, 
  Museum as CameraIcon, 
  Home as HomeIcon, 
  Explore as CompassIcon, 
  People as UsersIcon,
  Logout as LogOutIcon,
  Lightbulb as SuggestionsIcon,
  LocalDining as GastronomyIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const navigationItems = [
    {
      title: 'Contenuti Home',
      icon: HomeIcon,
      path: '/admin/home',
      description: 'Gestisci i contenuti della homepage',
      color: theme.palette.primary.main
    },
    {
      title: 'Tour',
      icon: MapIcon,
      path: '/admin/tours',
      description: 'Gestisci i tour disponibili',
      color: theme.palette.success.main
    },
    {
      title: 'Avventure',
      icon: CompassIcon,
      path: '/admin/adventures',
      description: 'Gestisci le avventure disponibili',
      color: theme.palette.warning.main
    },
    {
      title: 'Eventi Speciali',
      icon: EventIcon,
      path: '/admin/special',
      description: 'Gestisci gli eventi speciali',
      color: theme.palette.error.light
    },
    {
      title: 'I Nostri Suggerimenti',
      icon: SuggestionsIcon,
      path: '/admin/suggestions',
      description: 'Gestisci i suggerimenti per i visitatori',
      color: theme.palette.info.dark
    },
    {
      title: 'Gastronomia',
      icon: GastronomyIcon,
      path: '/admin/gastronomy',
      description: 'Gestisci le categorie gastronomiche',
      color: '#e91e63' // Pink
    },
    {
      title: 'Ristoranti',
      icon: UtensilsIcon,
      path: '/admin/restaurants',
      description: 'Gestisci l\'elenco dei ristoranti',
      color: theme.palette.error.main
    },
    {
      title: 'B&B',
      icon: BuildingIcon,
      path: '/admin/bb',
      description: 'Gestisci l\'elenco dei B&B',
      color: theme.palette.info.main
    },
    {
      title: 'Arte & Cultura',
      icon: CameraIcon,
      path: '/admin/culture',
      description: 'Gestisci i siti culturali',
      color: theme.palette.secondary.main
    },
    {
      title: 'Team Calabriando',
      icon: UsersIcon,
      path: '/admin/team',
      description: 'Gestisci i membri del team',
      color: '#9c27b0' // Purple
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      {/* Header */}
      <AppBar position="static" color="primary" elevation={4}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img 
              src="/calabriando-white.png" 
              alt="Calabriando Logo" 
              style={{ 
                width: 40, 
                height: 40, 
                filter: 'brightness(0) invert(1)'
              }} 
            />
            <Typography variant="h5" component="h1" fontWeight="bold">
              Pannello di Amministrazione
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            onClick={handleSignOut}
            color="inherit"
            startIcon={<LogOutIcon />}
            sx={{ fontWeight: 'medium' }}
          >
            Esci
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" component="h2" fontWeight="bold" color="text.primary" gutterBottom>
          Benvenuto nell'area amministrativa
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 6 }}>
          Seleziona una sezione per gestire i contenuti del sito Calabriando.
        </Typography>

        <Grid container spacing={3}>
          {navigationItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.path}>
              <Card
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  height: '100%',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                    cursor: 'pointer'
                  },
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onClick={() => navigate(item.path)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: item.color,
                      width: 48,
                      height: 48,
                      mr: 2
                    }}
                  >
                    <item.icon />
                  </Avatar>
                  <Typography variant="h6" component="h3" fontWeight="bold">
                    {item.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {item.description}
                </Typography>
                <Box sx={{ mt: 'auto', textAlign: 'right' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ borderRadius: 8 }}
                  >
                    Gestisci
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}