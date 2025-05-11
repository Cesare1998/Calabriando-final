import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import App from './App';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminDashboard_tour from './components/AdminDashboard_tour';
import AdminDashboard_content from './components/AdminDashboard_content';
import AdminDashboard_home from './components/AdminDashboard_home';
import AdminDashboard_adventures from './components/AdminDashboard_adventures';
import AdminDashboard_team from './components/AdminDashboard_team';
import AdminDashboard_suggestions from './components/AdminDashboard_suggestions';
import AdminDashboard_gastronomy from './components/AdminDashboard_gastronomy';
import AdminDashboard_special from './components/AdminDashboard_special';
import BBPage from './pages/BBPage';
import RestaurantsPage from './pages/RestaurantsPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import CulturePage from './pages/CulturePage';
import SpecialPage from './pages/SpecialPage';
import SpecialPageDetail from './pages/SpecialPageDetail';
import GastronomyPage from './pages/GastronomyPage';
import ToursPage from './pages/ToursPage';
import TourListPage from './pages/TourListPage';
import TourDetailPage from './pages/TourDetailPage';
import AdventureListPage from './pages/AdventureListPage';
import AdventureDetailPage from './pages/AdventureDetailPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelledPage from './pages/PaymentCancelledPage';
import SearchPage from './pages/SearchPage';
import TeamPage from './pages/TeamPage';
import SpecialBookingConfirmPage from './pages/SpecialBookingConfirmPage';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    loader: async () => {
      // Preload data here if needed
      return null;
    },
  },
  {
    path: '/admin',
    element: <AdminLogin />,
  },
  {
    path: '/admin/dashboard',
    element: <AdminDashboard />,
  },
  {
    path: '/admin/tours',
    element: <AdminDashboard_tour />,
  },
  {
    path: '/admin/adventures',
    element: <AdminDashboard_adventures />,
  },
  {
    path: '/admin/suggestions',
    element: <AdminDashboard_suggestions />,
  },
  {
    path: '/admin/gastronomy',
    element: <AdminDashboard_gastronomy />,
  },
  {
    path: '/admin/special',
    element: <AdminDashboard_special />,
  },
  {
    path: '/admin/bb',
    element: <AdminDashboard_content />,
  },
  {
    path: '/admin/restaurants',
    element: <AdminDashboard_content />,
  },
  {
    path: '/admin/culture',
    element: <AdminDashboard_content />,
  },
  {
    path: '/admin/home',
    element: <AdminDashboard_home />,
  },
  {
    path: '/admin/team',
    element: <AdminDashboard_team />,
  },
  {
    path: '/bb',
    element: <BBPage />,
  },
  {
    path: '/restaurants',
    element: <RestaurantsPage />,
  },
  {
    path: '/restaurant/:id',
    element: <RestaurantDetailPage />,
  },
  {
    path: '/food',
    element: <Navigate to="/restaurants" replace />,
  },
  {
    path: '/culture',
    element: <CulturePage />,
  },
  {
    path: '/special',
    element: <SpecialPage />,
  },
  {
    path: '/special/:id',
    element: <SpecialPageDetail />,
  },
  {
    path: '/gastronomy',
    element: <GastronomyPage />,
  },
  {
    path: '/tours',
    element: <ToursPage />,
  },
  {
    path: '/tours/:category',
    element: <TourListPage />,
  },
  {
    path: '/tour/:id',
    element: <TourDetailPage />,
  },
  {
    path: '/adventure/:type',
    element: <AdventureListPage />,
  },
  {
    path: '/adventure/detail/:id',
    element: <AdventureDetailPage />,
  },
  {
    path: '/payment-success',
    element: <PaymentSuccessPage />,
  },
  {
    path: '/payment-cancelled',
    element: <PaymentCancelledPage />,
  },
  {
    path: '/search',
    element: <SearchPage />,
  },
  {
    path: '/team',
    element: <TeamPage />,
  },
  {
    path: '/special/confirm/:bookingId',
    element: <SpecialBookingConfirmPage />,
  }
]);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>
);