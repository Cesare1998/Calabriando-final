import React from 'react';
import { Box, Typography, Divider, useTheme } from '@mui/material';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  color?: string;
  divider?: boolean;
}

export default function SectionTitle({ 
  title, 
  subtitle, 
  align = 'center',
  color = 'inherit',
  divider = true
}: SectionTitleProps) {
  const theme = useTheme();
  
  return (
    <Box 
      sx={{ 
        mb: 6, 
        textAlign: align,
        maxWidth: align === 'center' ? '800px' : 'none',
        mx: align === 'center' ? 'auto' : 0
      }}
    >
      <Typography 
        variant="h3" 
        component="h2" 
        gutterBottom
        color={color}
        sx={{ 
          fontWeight: 700,
          position: 'relative',
          display: 'inline-block',
          pb: divider ? 1 : 0
        }}
      >
        {title}
        {divider && (
          <Box 
            sx={{ 
              position: 'absolute',
              bottom: 0,
              left: align === 'center' ? '50%' : 0,
              transform: align === 'center' ? 'translateX(-50%)' : 'none',
              width: align === 'center' ? '80px' : '40%',
              height: '4px',
              bgcolor: 'primary.main',
              borderRadius: '2px'
            }} 
          />
        )}
      </Typography>
      
      {subtitle && (
        <Typography 
          variant="subtitle1" 
          color={color === 'inherit' ? 'text.secondary' : color}
          sx={{ 
            maxWidth: '800px',
            mx: align === 'center' ? 'auto' : 0,
            opacity: color === 'white' ? 0.9 : 1
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}