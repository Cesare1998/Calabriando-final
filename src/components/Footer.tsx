import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Instagram as InstagramIcon, 
  Facebook as FacebookIcon, 
  YouTube as YouTubeIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';

export default function Footer() {
  const { language, t } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentYear = new Date().getFullYear();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [showTeamLink, setShowTeamLink] = useState(true);

  useEffect(() => {
    // Fetch team members to check if any are visible
    const fetchTeamMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('visible_in_header', true);
          
        if (error) {
          console.error('Error fetching team members:', error);
          return;
        }
        
        setTeamMembers(data || []);
        setShowTeamLink(data && data.length > 0);
      } catch (err) {
        console.error('Error checking team visibility:', err);
      }
    };
    
    fetchTeamMembers();
  }, []);

  // Struttura dati per i link di navigazione del footer
  const footerNavLinks = [
    { textIt: 'Home', textEn: 'Home', to: '/' },
    { textIt: 'Tour ed esperienze', textEn: 'Tours & experiences', to: '/tours' },
    { textIt: t('nav.bb'), textEn: t('nav.bb'), to: '/bb' },
    { textIt: t('nav.restaurants'), textEn: t('nav.restaurants'), to: '/restaurants' },
    { textIt: t('nav.culture'), textEn: t('nav.culture'), to: '/culture' },
  ];
  
  // Add team link only if there are visible team members
  if (showTeamLink) {
    footerNavLinks.push({ textIt: t('nav.team'), textEn: t('nav.team'), to: '/team' });
  }

  // Struttura dati per i dettagli di contatto
  const contactDetails = [
    { icon: <LocationIcon fontSize="small" />, textIt: t('footer.location'), textEn: t('footer.location'), href: null },
    { icon: <TimeIcon fontSize="small" />, textIt: t('footer.openHours'), textEn: t('footer.openHours'), href: null },
    { icon: <PhoneIcon fontSize="small" />, textIt: '+39 123 456 7890', textEn: '+39 123 456 7890', href: 'tel:+391234567890' },
    { icon: <EmailIcon fontSize="small" />, textIt: 'info@calabriando.it', textEn: 'info@calabriando.it', href: 'mailto:info@calabriando.it' },
  ];

  return (
    <Box sx={{ bgcolor: 'primary.dark', color: 'white', pt: { xs: 6, md: 8 }, pb: { xs: 4, md: 6 } }}>
      <Container maxWidth={false} sx={{ maxWidth: '1920px', mx: 'auto', px: { xs: 2, sm:3, md: 12, lg: 4 } }}>
        <Grid container spacing={isMobile ? 5 : 4}>
          {/* Colonna 1: Logo, Descrizione e Social */}
          <Grid item xs={12} md={4} sx={{ textAlign: isMobile ? 'center' : 'left' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2,
                justifyContent: isMobile ? 'center' : 'flex-start'
              }}
            >
              <img
                src="/calabriando-white.png"
                alt={t('logoAlt')}
                style={{ width: 48, height: 48, marginRight: 12 }}
              />
              <Typography variant="h5" component="div" fontWeight="bold">
                Calabriando
              </Typography>
            </Box>
            <Typography variant="body2" color="white" sx={{ opacity: 0.7, mb: 3, lineHeight: 1.6, px: isMobile ? 1 : 0 }} component="div">
              <div dangerouslySetInnerHTML={{ __html: language === 'it'
                ? 'La tua guida per scoprire le meraviglie della Calabria. Offriamo tour ed esperienze autentiche per farti vivere la vera essenza di questa terra straordinaria.'
                : 'Your guide to discovering the wonders of Calabria. We offer authentic tours and experiences to help you experience the true essence of this extraordinary land.' }} />
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <IconButton
                component="a"
                href="https://www.instagram.com/calabriando/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('social.instagram')}
                sx={{ color: 'white', '&:hover': { color: theme.palette.secondary.main } }}
              >
                <InstagramIcon />
              </IconButton>
              <IconButton
                component="a"
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('social.facebook')}
                sx={{ color: 'white', '&:hover': { color: theme.palette.secondary.main } }}
              >
                <FacebookIcon />
              </IconButton>
              <IconButton
                component="a"
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('social.youtube')}
                sx={{ color: 'white', '&:hover': { color: theme.palette.secondary.main } }}
              >
                <YouTubeIcon />
              </IconButton>
            </Box>
          </Grid>

          {/* Colonna 2: Link di Navigazione */}
          <Grid
            item
            xs={12}
            md={4}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 'medium', mb: 1.5 }}
            >
              {language === 'it' ? 'Esplora' : 'Explore'}
            </Typography>
            <List dense disablePadding>
              {footerNavLinks.map((link) => (
                <ListItem
                  key={link.to}
                  disableGutters
                  component={Link}
                  to={link.to}
                  sx={{
                    color: 'white',
                    opacity: 0.7,
                    textDecoration: 'none',
                    '&:hover': { opacity: 1 },
                    justifyContent: 'center',
                    py: 0.5,
                    width: 'fit-content',
                    mx: 'auto'
                  }}
                >
                  <ListItemText
                    primary={language === 'it' ? link.textIt : link.textEn}
                    primaryTypographyProps={{ textAlign: 'center' }}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>

          {/* Colonna 3: Informazioni di Contatto */}
          <Grid
            item
            xs={12}
            md={4}
            sx={{
              display: 'flex',
              justifyContent: isMobile ? 'center' : 'flex-end',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMobile ? 'center' : 'center',
                textAlign: isMobile ? 'center' : 'center',
                width: isMobile ? 'auto' : undefined
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: 'medium', mb: 1.5 }}
              >
                {t('footer.contact')}
              </Typography>
              <List dense disablePadding sx={{ width: 'fit-content' }}>
                {contactDetails.map((item, index) => (
                  <ListItem
                    key={index}
                    disableGutters
                    sx={{
                      color: 'white',
                      opacity: 0.7,
                      textDecoration: 'none',
                      '&:hover': item.href ? { opacity: 1 } : {},
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isMobile ? 'center' : 'center',
                      py: 0.5,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'white', mr: 0.5 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={language === 'it' ? item.textIt : item.textEn}
                      primaryTypographyProps={{ 
                        fontSize: '0.875rem',
                        textAlign: isMobile ? 'center' : (item.href && item.href.startsWith('tel:')) || (item.href && item.href.startsWith('mailto:')) ? 'left' : 'center',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Grid>
        </Grid>
        <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        
        <Typography variant="body2" align="center" color="white" sx={{ opacity: 0.5 }}>
          © {currentYear} Calabriando. {language === 'it' ? 'Tutti i diritti riservati.' : 'All rights reserved.'}
        </Typography>
      </Container>
    </Box>
  );
}