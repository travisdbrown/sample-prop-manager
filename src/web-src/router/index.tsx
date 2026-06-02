import { createBrowserRouter } from 'react-router-dom';
import AppShell from '../layouts/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import RoleGuard from '../components/RoleGuard';
import DashboardRouter from './DashboardRouter';
import { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { Role } from '../types/auth';

const loading = (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress color="primary" />
  </Box>
);

const lazy_route = (module: () => Promise<{ default: React.ComponentType }>) => {
  const Component = lazy(module);
  return (
    <Suspense fallback={loading}>
      <Component />
    </Suspense>
  );
};

// Route stubs — pages are scaffolded as the Epics are reimplemented
const router = createBrowserRouter([
  {
    path: '/login',
    element: lazy_route(() => import('../features/auth/LoginPage')),
  },
  {
    path: '/signup',
    element: lazy_route(() => import('../features/auth/SignupPage')),
  },
  {
    path: '/accept-invite',
    element: lazy_route(() => import('../features/auth/AcceptInvitePage')),
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <DashboardRouter />,
          },
          {
            path: 'patients',
            element: lazy_route(() => import('../features/patients/PatientsPage')),
          },
          {
            path: 'patients/:id',
            element: lazy_route(() => import('../features/patients/PatientDetailPage')),
          },
          {
            path: 'scheduling',
            element: lazy_route(() => import('../features/scheduling/SchedulingPage')),
          },
          // Clinical chart — Dentist + Hygienist only; entry point is the Chart button on PatientDetailPage
          {
            element: <RoleGuard allowedRoles={[Role.Dentist, Role.Hygienist]} />,
            children: [
              {
                path: 'patients/:patientId/chart',
                element: lazy_route(() => import('../features/clinical/ClinicalPage')),
              },
            ],
          },
          // Subscription admin + Audit Log — PracticeOwner only
          {
            element: <RoleGuard allowedRoles={[Role.PracticeOwner]} />,
            children: [
              {
                path: 'admin',
                element: lazy_route(() => import('../features/admin/SubscriptionPage')),
              },
              {
                path: 'admin/audit',
                element: lazy_route(() => import('../features/admin/AuditLogPage')),
              },
            ],
          },
          // User management + Reminder settings — PracticeOwner + OfficeManager (AdminStaff policy)
          {
            element: <RoleGuard allowedRoles={[Role.PracticeOwner, Role.OfficeManager]} />,
            children: [
              {
                path: 'admin/users',
                element: lazy_route(() => import('../features/admin/UserManagementPage')),
              },
              {
                path: 'admin/reminder-settings',
                element: lazy_route(() => import('../features/admin/ReminderSettingsPage')),
              },
            ],
          },
        ],
      },
    ],
  },
]);

export default router;
