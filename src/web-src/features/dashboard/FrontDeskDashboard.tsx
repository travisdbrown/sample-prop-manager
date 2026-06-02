import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Alert, Snackbar, Stack,
  Grid, Skeleton,
} from '@mui/material';
import type * as signalR from '@microsoft/signalr';
import TodayIcon from '@mui/icons-material/Today';
import PeopleIcon from '@mui/icons-material/People';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import { buildSchedulingHub } from '../../signalr/schedulingHub';
import KpiCard from '../../components/dashboard/KpiCard';
import AppointmentCard from '../../components/dashboard/AppointmentCard';
import ProviderStatusPanel from '../../components/dashboard/ProviderStatusPanel';

// ── Types ──────────────────────────────────────────────────────────────────

interface DashboardSummaryResponse {
  appointmentsToday: number;
  patientsWaiting: number;
  openSlotsToday: number;
}

interface AppointmentResponse {
  entityId: string;
  patientId: string;
  patientName: string;
  providerId: string;
  appointmentType: string;
  status: string;
  slotStart: string;
  slotEnd: string;
}

interface ProviderSummaryResponse {
  entityId: string;
  email: string;
  role: string;
}

interface ProviderStatus {
  providerId: string;
  providerName: string;
  status: 'available' | 'busy' | 'break';
  currentPatient?: string;
  nextAppointment?: {
    time: string;
    patientName: string;
  };
  minutesRemaining?: number;
}


// ── FrontDeskDashboard ─────────────────────────────────────────────────────

export default function FrontDeskDashboard() {
  const navigate = useNavigate();
  useAuth(); // Ensure user is authenticated

  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [providerMap, setProviderMap] = useState<Record<string, string>>({});
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [apptLoading, setApptLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'error' | 'success' }>({
    open: false, message: '', severity: 'error',
  });

  const today = new Date().toISOString().slice(0, 10);
  const hubRef = useRef<signalR.HubConnection | null>(null);

  // Separate appointments by status for display
  const waitingAppointments = appointments.filter(a => a.status === 'Confirmed');
  const checkedInAppointments = appointments.filter(a => a.status === 'CheckedIn');

  const fetchSummary = useCallback(async () => {
    try {
      const res = await apiClient.get<DashboardSummaryResponse>('/api/scheduling/dashboard/summary');
      setSummary(res.data);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load dashboard summary', severity: 'error' });
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await apiClient.get<AppointmentResponse[]>('/api/scheduling/appointments', {
        params: { startDate: today, endDate: today },
      });
      setAppointments(res.data);
    } catch {
      setSnackbar({ open: true, message: "Failed to load today's schedule", severity: 'error' });
    } finally {
      setApptLoading(false);
    }
  }, [today]);

  // Initial data load
  useEffect(() => {
    void (async () => {
      await fetchSummary();
      await fetchAppointments();

      apiClient
        .get<ProviderSummaryResponse[]>('/api/identity/providers')
        .then((res) => {
          const map: Record<string, string> = {};
          res.data.forEach((p) => { map[p.entityId] = p.email; });
          setProviderMap(map);
        })
        .catch(() => {});
    })();
  }, [fetchSummary, fetchAppointments]);

  // SignalR real-time updates
  useEffect(() => {
    const hub = buildSchedulingHub(import.meta.env.VITE_API_BASE_URL ?? '');
    hubRef.current = hub;

    hub.on('appointmentUpdated', () => {
      fetchAppointments();
      fetchSummary();
    });

    hub.start().catch((err) => {
      console.warn('SignalR connection failed (backend may not be running):', err);
    });

    return () => {
      hub.stop().catch(() => {});
      hubRef.current = null;
    };
  }, [fetchAppointments, fetchSummary]);

  const handleCheckIn = async (appointmentId: string) => {
    try {
      const res = await apiClient.post<AppointmentResponse>(
        `/api/scheduling/appointments/${appointmentId}/check-in`
      );
      setAppointments((prev) => prev.map((a) => (a.entityId === appointmentId ? res.data : a)));
      fetchSummary();
      setSnackbar({ open: true, message: '✓ Patient checked in', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to check in patient', severity: 'error' });
    }
  };

  const handleReschedule = () => {
    // TODO: Implement reschedule modal or navigate to scheduling page
    navigate('/scheduling');
  };

  // Compute provider statuses based on current appointments
  useEffect(() => {
    const statusMap = new Map<string, ProviderStatus>();

    // Initialize all providers as available
    Object.entries(providerMap).forEach(([providerId, providerEmail]) => {
      statusMap.set(providerId, {
        providerId,
        providerName: providerEmail,
        status: 'available',
      });
    });

    // Update status for providers with checked-in appointments
    const checkedIn = appointments.filter(a => a.status === 'CheckedIn');
    checkedIn.forEach((appt) => {
      const current = statusMap.get(appt.providerId);
      if (current) {
        current.status = 'busy';
        current.currentPatient = appt.patientName || `Patient #${appt.patientId.slice(-4)}`;
      }
    });

    // Find next appointment for each provider
    appointments.forEach((appt) => {
      const current = statusMap.get(appt.providerId);
      if (current && !current.nextAppointment && appt.status === 'Confirmed') {
        current.nextAppointment = {
          time: new Date(appt.slotStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          patientName: appt.patientName || `Patient #${appt.patientId.slice(-4)}`,
        };
      }
    });

    setProviderStatuses(Array.from(statusMap.values()));
  }, [appointments, providerMap]);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Check-In Queue
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <KpiCard
            title="Appointments Today"
            value={summary?.appointmentsToday ?? '—'}
            icon={<TodayIcon />}
            loading={summaryLoading}
            onClick={() => navigate('/scheduling')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <KpiCard
            title="Patients Waiting"
            value={summary?.patientsWaiting ?? '—'}
            icon={<PeopleIcon />}
            loading={summaryLoading}
            color={(summary?.patientsWaiting ?? 0) > 0 ? 'warning' : 'primary'}
            onClick={() => navigate('/scheduling')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <KpiCard
            title="Open Slots Today"
            value={summary?.openSlotsToday ?? '—'}
            icon={<EventAvailableIcon />}
            loading={summaryLoading}
            onClick={() => navigate('/scheduling')}
          />
        </Grid>
      </Grid>

      {/* Checked In and Waiting Sections - Side by side on large viewports */}
      <Grid container spacing={3}>
        {/* Checked In Section - Left column */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'success.main' }}>
            CHECKED IN ({checkedInAppointments.length})
          </Typography>

          {checkedInAppointments.length === 0 ? (
            <Alert severity="info">No patients checked in yet.</Alert>
          ) : (
            <Stack spacing={1.5}>
              {checkedInAppointments.map((appt) => (
                <AppointmentCard
                  key={appt.entityId}
                  appointment={appt}
                  providerMap={providerMap}
                  onCheckIn={handleCheckIn}
                  onReschedule={() => handleReschedule()}
                />
              ))}
            </Stack>
          )}
        </Grid>

        {/* Waiting to Check In Section - Right column */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'warning.main' }}>
            WAITING TO CHECK IN ({waitingAppointments.length})
          </Typography>

          {apptLoading ? (
            <Stack spacing={1.5}>
              <Skeleton variant="rectangular" height={80} />
              <Skeleton variant="rectangular" height={80} />
            </Stack>
          ) : waitingAppointments.length === 0 ? (
            <Alert severity="info">No patients waiting to check in.</Alert>
          ) : (
            <Stack spacing={1.5}>
              {waitingAppointments.map((appt) => (
                <AppointmentCard
                  key={appt.entityId}
                  appointment={appt}
                  providerMap={providerMap}
                  onCheckIn={handleCheckIn}
                  onReschedule={() => handleReschedule()}
                />
              ))}
            </Stack>
          )}
        </Grid>
      </Grid>

      {/* Provider Status Panel */}
      <Box sx={{ mt: 4 }}>
        <ProviderStatusPanel providers={providerStatuses} loading={apptLoading} />
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
