import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Divider,
  useTheme,
  Paper,
  Link as MuiLink,
  IconButton
} from '@mui/material';
import { 
  Email as EmailIcon, 
  Phone as PhoneIcon, 
  GitHub as GitHubIcon, 
  LinkedIn as LinkedInIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: {
    it: string;
    en: string;
  };
  image_url: string;
  social?: {
    email?: string;
    phone?: string;
    github?: string;
    linkedin?: string;
  };
}

export default function TeamPage() {
  const { language } = useLanguage();
  const theme = useTheme();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .order('created_at');
        
        if (error) throw error;
        
        setTeamMembers(data || []);
      } catch (err) {
        console.error('Error loading team members:', err);
        setError(language === 'it' 
          ? 'Errore nel caricamento dei membri del team. Riprova più tardi.' 
          : 'Error loading team members. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadTeamMembers();
  }, [language]);

  return (
    <>
      <Header />
      <Box sx={{ pt: 8, minHeight: '100vh', bgcolor: 'background.default' }}>
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 6 }}>
            <Button 
              component={Link} 
              to="/" 
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2 }}
            >
              {language === 'it' ? 'Torna alla Home' : 'Back to Home'}
            </Button>
            <Typography variant="h3" component="h1" fontWeight="bold">
              {language === 'it' ? 'Il Nostro Team' : 'Our Team'}
            </Typography>
          </Box>
          
          <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 6, maxWidth: 'md' }}>
            {language === 'it' 
              ? 'Conosci le persone che rendono possibile Calabriando. Un team appassionato dedicato a farti scoprire le meraviglie della Calabria.'
              : 'Meet the people who make Calabriando possible. A passionate team dedicated to helping you discover the wonders of Calabria.'}
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </Box>
          ) : error ? (
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                textAlign: 'center', 
                borderRadius: 2,
                bgcolor: 'error.light',
                color: 'error.contrastText'
              }}
            >
              <Typography variant="h6" gutterBottom>
                {error}
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => window.location.reload()}
                sx={{ mt: 2 }}
              >
                {language === 'it' ? 'Riprova' : 'Try Again'}
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={6}>
              {teamMembers.map((member, index) => (
                <Grid item xs={12} key={member.id}>
                  <Card 
                    elevation={3} 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', md: index % 2 === 0 ? 'row' : 'row-reverse' },
                      borderRadius: 4,
                      overflow: 'hidden',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[10]
                      }
                    }}
                  >
                    <CardMedia
                      component="img"
                      sx={{ 
                        width: { xs: '100%', md: 300 },
                        height: { xs: 300, md: 'auto' },
                        objectFit: 'cover'
                      }}
                      image={member.image_url}
                      alt={member.name}
                    />
                    <CardContent sx={{ flex: '1 1 auto', p: 4 }}>
                      <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
                        {member.name}
                      </Typography>
                      <Typography variant="h6" color="primary.main" gutterBottom>
                        {member.role}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary" component="div">
                        <div dangerouslySetInnerHTML={{ __html: member.bio[language] }} />
                      </Typography>
                      
                      {member.social && Object.keys(member.social).length > 0 && (
                        <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                          {member.social.email && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<EmailIcon />}
                              href={`mailto:${member.social.email}`}
                            >
                              {member.social.email}
                            </Button>
                          )}
                          
                          {member.social.phone && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<PhoneIcon />}
                              href={`tel:${member.social.phone}`}
                            >
                              {member.social.phone}
                            </Button>
                          )}
                          
                          {member.social.github && (
                            <IconButton
                              color="primary"
                              component={MuiLink}
                              href={member.social.github}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <GitHubIcon />
                            </IconButton>
                          )}
                          
                          {member.social.linkedin && (
                            <IconButton
                              color="primary"
                              component={MuiLink}
                              href={member.social.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <LinkedInIcon />
                            </IconButton>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              
              {teamMembers.length === 0 && !loading && !error && (
                <Grid item xs={12}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 4, 
                      textAlign: 'center', 
                      borderRadius: 2 
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      {language === 'it' 
                        ? 'Nessun membro del team disponibile al momento.' 
                        : 'No team members available at the moment.'}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
          
          {/* Call to Action */}
          <Paper 
            elevation={3} 
            sx={{ 
              mt: 8, 
              p: 6, 
              borderRadius: 4, 
              textAlign: 'center',
              background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
              color: 'white'
            }}
          >
            <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
              {language === 'it' ? 'Unisciti a Noi' : 'Join Us'}
            </Typography>
            <Typography variant="body1" paragraph sx={{ maxWidth: 'md', mx: 'auto', mb: 4 }}>
              {language === 'it'
                ? 'Sei appassionato della Calabria e vuoi far parte del nostro team? Contattaci per scoprire le opportunità disponibili.'
                : 'Are you passionate about Calabria and want to be part of our team? Contact us to discover available opportunities.'}
            </Typography>
            <Button 
              variant="contained" 
              color="secondary" 
              size="large"
              href="mailto:info@calabriando.it"
              sx={{ px: 4, py: 1.5 }}
            >
              {language === 'it' ? 'Contattaci' : 'Contact Us'}
            </Button>
          </Paper>
        </Container>
      </Box>
      <Footer />
    </>
  );
}