import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Container,
  useScrollTrigger,
  Slide,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  InputBase,
  alpha,
  styled,
  useTheme
} from '@mui/material';
import {
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  YouTube as YouTubeIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Translate as TranslateIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Map as MapIcon,
  Bed as BedIcon,
  Restaurant as RestaurantIcon,
  Museum as MuseumIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius * 3,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(0.5),
  width: '150px',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      minWidth: '12ch',
      '&:focus': {
        minWidth: '20ch',
      },
    },
  },
}));

interface HideOnScrollProps {
  children: React.ReactElement;
}

function HideOnScroll(props: HideOnScrollProps) {
  const { children } = props;
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

export default function Header() {
  const { language, t, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [showTeamLink, setShowTeamLink] = useState(true);

  const theme = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('id')
          .eq('visible_in_header', true)
          .limit(1);

        if (error) {
          console.error('Error fetching team members:', error);
          return;
        }
        setShowTeamLink(data && data.length > 0);
      } catch (err) {
        console.error('Error checking team visibility:', err);
      }
    };
    fetchTeamMembers();
  }, []);

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      if(drawerOpen) setDrawerOpen(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'it' ? 'en' : 'it');
  };

  const navItems = [
    { name: language === 'it' ? 'Tour ed esperienze' : 'Tours & experiences', path: '/tours', icon: <MapIcon /> },
    { name: t('nav.bb'), path: '/bb', icon: <BedIcon /> },
    { name: t('nav.restaurants'), path: '/restaurants', icon: <RestaurantIcon /> },
    { name: t('nav.culture'), path: '/culture', icon: <MuseumIcon /> },
  ];

  if (showTeamLink) {
    navItems.push({ name: t('nav.team'), path: '/team', icon: <PeopleIcon /> });
  }

  const drawer = (
    <Box sx={{ width: 280 }} role="presentation">
      {/* MODIFICA 3: Centratura titolo "Menù" nel Drawer */}
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, position: 'relative' }}>
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 'bold',
            color: 'text.primary',
            textAlign: 'center', // Centra il testo
            flexGrow: 1,        // Fa occupare al titolo tutto lo spazio orizzontale disponibile
          }}
        >
          {language === 'it' ? 'Menù' : 'Menu'}
        </Typography>
        <IconButton
          onClick={toggleDrawer(false)}
          aria-label="close drawer"
          sx={{
            position: 'absolute', // Posiziona l'icona in modo assoluto rispetto al Box genitore
            right: theme.spacing(1.5), // Distanza dal bordo destro
            top: theme.spacing(1.5),   // Distanza dal bordo superiore
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <Box sx={{ p:2 }}>
        <form onSubmit={handleSearch}>
            <Search sx={{
                width: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.08)'
                }
            }}>
                <SearchIconWrapper>
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                </SearchIconWrapper>
                <StyledInputBase
                    placeholder={language === 'it' ? 'Cerca nel sito...' : 'Search site...'}
                    inputProps={{ 'aria-label': 'search in drawer' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ color: 'text.primary' }}
                />
            </Search>
        </form>
      </Box>
      <List onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
        <ListItem button component={Link} to="/">
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary={language === 'it' ? 'Home' : 'Home'} />
        </ListItem>
        {navItems.map((item) => (
          <ListItem button key={item.path} component={Link} to={item.path}>
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.name} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<TranslateIcon />}
          onClick={() => {
            toggleLanguage();
          }}
          sx={{ mb: 2 }}
        >
          {language === 'it' ? 'Switch to English' : 'Passa all\'italiano'}
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
          <IconButton color="primary" component="a" href="https://www.instagram.com/calabriando/" target="_blank">
            <InstagramIcon />
          </IconButton>
          <IconButton color="primary" component="a" href="https://facebook.com" target="_blank"> {/* Inserisci URL corretto */}
            <FacebookIcon />
          </IconButton>
          <IconButton color="primary" component="a" href="https://youtube.com" target="_blank"> {/* Inserisci URL corretto */}
            <YouTubeIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      <HideOnScroll>
        <AppBar
          position="fixed"
          elevation={scrolled ? 4 : 0}
          sx={{
            transition: 'background-color 0.3s, box-shadow 0.3s, backdrop-filter 0.3s',
            bgcolor: scrolled ? 'background.paper' : 'transparent',
            backdropFilter: scrolled ? 'none' : 'blur(8px)',
            background: scrolled
              ? (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.85) : theme.palette.background.paper
              : 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
            color: scrolled ? 'text.primary' : 'common.white',
          }}
        >
          <Container maxWidth={false} sx={{ px: {xs: 1, sm: 2, md: 3} }}>
            <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                  <Box
                    component="img"
                    src={scrolled || (theme.palette.mode === 'dark' && !scrolled) ? '/calabriando-black.png' : '/calabriando-white.png'}
                    alt="Calabriando"
                    sx={{ height: {xs: 32, sm: 40}, mr: 0.5 }}
                  />
                  {/* MODIFICA 1: Colore "Calabriando" - Mantenuto 'inherit' per adattabilità */}
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      color: scrolled ? 'black' : 'white', // Eredita da AppBar (bianco o text.primary in base allo scroll)
                      fontSize: { xs: '1.1rem', sm: '1.25rem'}
                    }}
                  >
                    Calabriando
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 1, justifyContent: 'center' }}>
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    component={Link}
                    to={item.path}
                    sx={{
                      mx: 1,
                      color: 'inherit',
                      '&:hover': {
                        color: 'primary.main',
                        backgroundColor: scrolled
                          ? alpha(theme.palette.primary.main, 0.08)
                          : alpha(theme.palette.common.white, 0.15)
                      }
                    }}
                  >
                    {item.name}
                  </Button>
                ))}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <form onSubmit={handleSearch}>
                  {/* MODIFICA 2: Nascondere barra di ricerca nell'header su mobile */}
                  <Search sx={{
                    display: { xs: 'none', md: 'flex' }, // Nascondi su xs, sm; mostra da md
                    backgroundColor: scrolled
                      ? alpha(theme.palette.text.primary, 0.05)
                      : alpha(theme.palette.common.white, 0.15),
                    '&:hover': {
                      backgroundColor: scrolled
                        ? alpha(theme.palette.text.primary, 0.1)
                        : alpha(theme.palette.common.white, 0.25)
                    }
                  }}>
                    <SearchIconWrapper>
                      <SearchIcon sx={{ color: 'inherit' }} />
                    </SearchIconWrapper>
                    <StyledInputBase
                      placeholder={language === 'it' ? 'Cerca...' : 'Search...'}
                      inputProps={{ 'aria-label': 'search' }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      sx={{ color: 'inherit' }}
                    />
                  </Search>
                </form>

                <Box sx={{ display: { xs: 'none', lg: 'flex' }, gap: {lg: 0.5}, alignItems: 'center', mx: 1 }}>
                  <IconButton
                    size="small"
                    component="a"
                    href="https://www.instagram.com/calabriando/"
                    target="_blank"
                    sx={{ color: 'inherit' }}
                  >
                    <InstagramIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    component="a"
                    href="https://facebook.com" // Inserisci URL corretto
                    target="_blank"
                    sx={{ color: 'inherit' }}
                  >
                    <FacebookIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    component="a"
                    href="https://youtube.com" // Inserisci URL corretto
                    target="_blank"
                    sx={{ color: 'inherit' }}
                  >
                    <YouTubeIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Button
                  startIcon={<TranslateIcon />}
                  onClick={toggleLanguage}
                  sx={{
                    minWidth: 'auto',
                    color: 'inherit',
                    display: { xs: 'none', sm: 'flex' },
                    p: {sm: '6px 8px', md: '6px 16px'},
                  }}
                >
                  {language.toUpperCase()}
                </Button>

                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="end"
                  onClick={toggleDrawer(true)}
                  sx={{
                    display: { md: 'none' },
                  }}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </HideOnScroll>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        PaperProps={{ sx: { backgroundColor: 'background.default' } }}
      >
        {drawer}
      </Drawer>
    </>
  );
}