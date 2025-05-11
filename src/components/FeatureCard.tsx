import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Box,
  CardActions,
  alpha,
  useTheme
} from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';

interface FeatureCardProps {
  title: string;
  description: string;
  image: string;
  link: string;
  icon?: React.ReactNode;
  elevation?: number;
}

export default function FeatureCard({
  title,
  description,
  image,
  link,
  icon,
  elevation = 2
}: FeatureCardProps) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: theme.shadows[elevation + 2],
          '& .MuiCardMedia-root': {
            transform: 'scale(1.05)'
          },
          '& .card-overlay': {
            // Non modificare l'opacità o impostala al valore originale
            opacity: 0.5 // Mantiene l'opacità originale dell'overlay
          }
        }
      }}
      elevation={elevation}
    >
      <Box sx={{ position: 'relative', pt: '56.25%' /* 16:9 aspect ratio */ }}>
        <CardMedia
          component="img"
          image={image}
          alt={title}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            background: '#f5f5f5',
            transition: 'transform 0.6s ease-in-out',
          }}
        />
        <Box
          className="card-overlay"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            //background: `linear-gradient(to bottom, ${alpha(theme.palette.primary.dark, 0.5)}, ${alpha(theme.palette.primary.dark, 0.6)})`,
            opacity: 0.5,
            transition: 'opacity 0.3s' // La transizione rimane anche se l'opacità di destinazione è la stessa
          }}
        />
        {icon && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 48,
              height: 48,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'white',
              color: 'primary.main',
              boxShadow: theme.shadows[2]
            }}
          >
            {icon}
          </Box>
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1, zIndex: 1 }}>
        <Typography
          gutterBottom
          variant="h5"
          component="h3"
          sx={{ fontWeight: 600 }}
        >
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          component={RouterLink}
          to={link}
          endIcon={<ArrowForwardIcon />}
          sx={{ ml: 'auto' }}
        >
          Scopri di più
        </Button>
      </CardActions>
    </Card>
  );
}