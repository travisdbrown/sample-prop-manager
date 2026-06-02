import { useState, useEffect, useCallback } from 'react';
import {
  Grid, Chip, Button, Alert, Snackbar, Stack, Box, Typography, Skeleton,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import TodayIcon from '@mui/icons-material/Today';
import PeopleIcon from '@mui/icons-material/People';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import NewPatientDialog from '../patients/NewPatientDialog';
import KpiCard from '../../components/dashboard/KpiCard';
import { Role } from '../../types/auth';

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

// ── Helpers ────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const STATUS_CHIP: Record<string, { color: 'default' | 'primary' | 'warning' | 'success' | 'error'; label: string }> = {
  Scheduled: { color: 'default',  label: 'Scheduled' },
  Confirmed: { color: 'primary',  label: 'Confirmed' },
  CheckedIn: { color: 'warning',  label: 'Checked In' },
  Completed: { color: 'success',  label: 'Completed' },
  Cancelled: { color: 'error',    label: 'Cancelled' },
};

// ── DashboardPage ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [providerMap, setProviderMap] = useState<Record<string, string>>({});
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [apptLoading, setApptLoading] = useState(true);
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'error' | 'success' }>({
    open: false, message: '', severity: 'error',
  });

  const today = new Date().toISOString().slice(0, 10);
  const isFrontDeskOrOM = user?.roles.some(r => r === Role.FrontDesk || r === Role.OfficeManager) ?? false;

  const fetchSummary = useCallback(async (signal?: AbortSignal) => {
    setSummaryLoading(true);
    try {
      const res = await apiClient.get<DashboardSummaryResponse>('/api/scheduling/dashboard/summary', {
        params: { date: today },
        signal,
      });
      setSummary(res.data);
    } catch (err) {
      if ((err as { name?: string }).name === 'CanceledError') return;
      setSnackbar({ open: true, message: 'Failed to load dashboard summary', severity: 'error' });
    } finally {
      setSummaryLoading(false);
    }
  }, [today]);

  useEffect(() => {
    const controller = new AbortController();

    fetchSummary(controller.signal);

    apiClient
      .get<AppointmentResponse[]>('/api/scheduling/appointments', {
        params: { startDate: today, endDate: today },
        signal: controller.signal,
      })
      .then((res) => setAppointments(res.data))
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === 'CanceledError') return;
        setSnackbar({ open: true, message: "Failed to load today's schedule", severity: 'error' });
      })
      .finally(() => setApptLoading(false));

    apiClient
      .get<ProviderSummaryResponse[]>('/api/identity/providers', {
        signal: controller.signal,
      })
      .then((res) => {
        const map: Record<string, string> = {};
        res.data.forEach((p) => { map[p.entityId] = p.email; });
        setProviderMap(map);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [fetchSummary, today]);

  const handleCheckIn = async (appointmentId: string) => {
    try {
      const res = await apiClient.post<AppointmentResponse>(
        `/api/scheduling/appointments/${appointmentId}/check-in`
      );
      setAppointments((prev) => prev.map((a) => (a.entityId === appointmentId ? res.data : a)));
      void fetchSummary();
    } catch {
      setSnackbar({ open: true, message: 'Failed to check in patient', severity: 'error' });
    }
  };

  const columns: GridColDef<AppointmentResponse>[] = [
    {
      field: 'slotStart',
      headerName: 'Time',
      width: 100,
      valueFormatter: (value: string) => formatTime(value),
    },
    {
      field: 'patientName',
      headerName: 'Patient',
      flex: 1,
      valueGetter: (_value: unknown, row: AppointmentResponse) =>
        row.patientName || `Patient #${row.patientId.slice(-4)}`,
    },
    {
      field: 'appointmentType',
      headerName: 'Type',
      width: 130,
    },
    {
      field: 'providerId',
      headerName: 'Provider',
      width: 180,
      valueGetter: (_value: unknown, row: AppointmentResponse) =>
        providerMap[row.providerId] ?? row.providerId,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: ({ value }) => {
        const chip = STATUS_CHIP[value as string] ?? { color: 'default' as const, label: value as string };
        return <Chip size="small" color={chip.color} label={chip.label} />;
      },
    },
    {
      field: 'actions',
      headerName: '',
      width: 110,
      sortable: false,
      renderCell: ({ row }) =>
        row.status === 'Confirmed' ? (
          <Button
            size="small"
            variant="outlined"
            color="warning"
            onClick={(e) => { e.stopPropagation(); void handleCheckIn(row.entityId); }}
          >
            Check In
          </Button>
        ) : null,
    },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        {getGreeting()}
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <KpiCard
            title="Appointments Today"
            value={summary?.appointmentsToday ?? '—'}
            icon={<TodayIcon />}
            loading={summaryLoading}
            onClick={() => navigate('/scheduling')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <KpiCard
            title="Patients Waiting"
            value={summary?.patientsWaiting ?? '—'}
            icon={<PeopleIcon />}
            loading={summaryLoading}
            color={(summary?.patientsWaiting ?? 0) > 0 ? 'warning' : 'primary'}
            onClick={() => navigate('/scheduling')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <KpiCard
            title="Open Slots Today"
            value={summary?.openSlotsToday ?? '—'}
            icon={<EventAvailableIcon />}
            loading={summaryLoading}
            onClick={() => navigate('/scheduling')}
          />
        </Grid>
      </Grid>

      {/* Today's Schedule */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Today's Schedule —{' '}
          {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </Typography>

        {apptLoading ? (
          <Skeleton variant="rectangular" height={200} />
        ) : appointments.length === 0 ? (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>No appointments scheduled for today.</Alert>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate('/scheduling')}>
              + Add Appointment
            </Button>
          </Box>
        ) : (
          <>
            <Typography
              id="schedule-table-caption"
              sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
            >
              Today's appointments
            </Typography>
            <DataGrid
              rows={appointments}
              columns={columns}
              getRowId={(row) => row.entityId}
              onRowClick={() => navigate('/scheduling')}
              initialState={{ sorting: { sortModel: [{ field: 'slotStart', sort: 'asc' }] } }}
              disableRowSelectionOnClick
              hideFooter
              sx={{ cursor: 'pointer' }}
              aria-labelledby="schedule-table-caption"
            />
          </>
        )}
      </Box>

      {/* Quick Actions — FrontDesk + OfficeManager only */}
      {isFrontDeskOrOM && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Quick Actions</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setNewPatientOpen(true)}>
              + New Patient
            </Button>
            <Button
              variant="outlined"
              startIcon={<CalendarMonthIcon />}
              onClick={() => navigate('/scheduling')}
            >
              View Full Schedule
            </Button>
          </Stack>
        </Box>
      )}

      <NewPatientDialog
        open={newPatientOpen}
        onClose={() => setNewPatientOpen(false)}
        onSuccess={(newPatient) => {
          setNewPatientOpen(false);
          navigate(`/patients/${newPatient.entityId}`);
        }}
      />

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
