import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/') return null;

  return (
    <button
      onClick={() => navigate('/')}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg text-black hover:bg-gray-100 transition"
      aria-label="Home"
    >
      <Home className="w-5 h-5" />
    </button>
  );
}