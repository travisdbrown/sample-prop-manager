import { Suspense, lazy } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/auth';

const loading = (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress color="primary" />
  </Box>
);

const FrontDeskDashboard = lazy(() => import('../features/dashboard/FrontDeskDashboard'));
const DentistDashboard = lazy(() => import('../features/dashboard/DentistDashboard'));
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));

export default function DashboardRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return loading;
  }

  // Route FrontDesk users to their custom dashboard
  if (user?.roles.includes(Role.FrontDesk)) {
    return (
      <Suspense fallback={loading}>
        <FrontDeskDashboard />
      </Suspense>
    );
  }

  // Route Dentist users to their custom dashboard
  if (user?.roles.includes(Role.Dentist)) {
    return (
      <Suspense fallback={loading}>
        <DentistDashboard />
      </Suspense>
    );
  }

  // All other roles use generic dashboard
  return (
    <Suspense fallback={loading}>
      <DashboardPage />
    </Suspense>
  );
}
