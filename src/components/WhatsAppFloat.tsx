import React from 'react';
import { Fab, Tooltip, useTheme } from '@mui/material';
import { WhatsApp as WhatsAppIcon } from '@mui/icons-material';

interface WhatsAppFloatProps {
  phoneNumber: string;
  message?: string;
}

export default function WhatsAppFloat({ phoneNumber, message = '' }: WhatsAppFloatProps) {
  const theme = useTheme();
  
  const handleClick = () => {
    // Remove any non-numeric characters from phone number
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${cleanNumber}${message ? `?text=${encodedMessage}` : ''}`;
    window.open(url, '_blank');
  };

  return (
    <Tooltip title="Contattaci su WhatsApp" placement="left">
      <Fab
        color="secondary"
        aria-label="WhatsApp"
        onClick={handleClick}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: '#25D366',
          '&:hover': {
            bgcolor: '#128C7E'
          },
          zIndex: theme.zIndex.snackbar + 1
        }}
      >
        <WhatsAppIcon />
      </Fab>
    </Tooltip>
  );
}