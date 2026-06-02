import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Alert, Snackbar, Stack, Skeleton, Chip,
} from '@mui/material';
import type * as signalR from '@microsoft/signalr';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import { buildSchedulingHub } from '../../signalr/schedulingHub';

// ── Types ──────────────────────────────────────────────────────────────────

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

interface PatientDetailResponse {
  entityId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email?: string;
  phone?: string;
  allergies?: string;
  medicalConditions?: string;
  currentMedications?: string;
  medicalNotes?: string;
  alerts?: Array<{
    type: string;
    title: string;
    isActive: boolean;
    createdAt: string;
  }>;
}

interface PatientAppointment extends AppointmentResponse {
  patientDetails?: PatientDetailResponse;
}

// ── DentistDashboard ───────────────────────────────────────────────────────

export default function DentistDashboard() {
  const navigate = useNavigate();
  useAuth(); // Ensure user is authenticated

  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [patientDetails, setPatientDetails] = useState<Map<string, PatientDetailResponse>>(new Map());
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'error' | 'success' }>({
    open: false, message: '', severity: 'error',
  });

  const today = new Date().toISOString().slice(0, 10);
  const hubRef = useRef<signalR.HubConnection | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await apiClient.get<AppointmentResponse[]>('/api/scheduling/appointments', {
        params: { startDate: today, endDate: today },
      });
      setAppointments(res.data);
      return res.data;
    } catch {
      setSnackbar({ open: true, message: "Failed to load today's schedule", severity: 'error' });
      return [];
    }
  }, [today]);

  const fetchPatientDetails = useCallback(async (appointmentList: AppointmentResponse[]) => {
    // Fetch all patient details in parallel to avoid N+1 queries
    try {
      const patientIds = [...new Set(appointmentList.map(a => a.patientId))]; // Remove duplicates

      if (patientIds.length === 0) {
        setLoading(false);
        return;
      }

      const detailPromises = patientIds.map((patientId) =>
        apiClient.get<PatientDetailResponse>(`/api/patients/${patientId}`).catch(() => null)
      );

      const responses = await Promise.all(detailPromises);
      const detailMap = new Map<string, PatientDetailResponse>();

      responses.forEach((res) => {
        if (res?.data) {
          detailMap.set(res.data.entityId, res.data);
        }
      });

      setPatientDetails(detailMap);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load patient details', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      const appts = await fetchAppointments();
      await fetchPatientDetails(appts);
    };
    loadData();
  }, [fetchAppointments, fetchPatientDetails]);

  // SignalR real-time updates
  useEffect(() => {
    const hub = buildSchedulingHub(import.meta.env.VITE_API_BASE_URL ?? '');
    hubRef.current = hub;

    hub.on('appointmentUpdated', () => {
      const reloadData = async () => {
        const appts = await fetchAppointments();
        await fetchPatientDetails(appts);
      };
      reloadData();
    });

    hub.start().catch((err) => {
      console.warn('SignalR connection failed (backend may not be running):', err);
    });

    return () => {
      hub.stop().catch(() => {});
      hubRef.current = null;
    };
  }, [fetchAppointments, fetchPatientDetails]);

  const handleViewChart = (patientId: string) => {
    navigate(`/patients/${patientId}/chart`);
  };

  const handleViewNotes = (patientId: string) => {
    // TODO: Implement notes view or navigate to notes page
    navigate(`/patients/${patientId}/chart`);
  };

  const handleReschedule = () => {
    navigate('/scheduling');
  };

  // Get alert flags for a patient
  const getAlertFlags = (patientId: string) => {
    const details = patientDetails.get(patientId);
    if (!details) return [];

    const flags: string[] = [];

    if (details.allergies?.trim()) {
      flags.push(`Allergies: ${details.allergies}`);
    }

    if (details.medicalConditions?.trim()) {
      flags.push(`Conditions: ${details.medicalConditions}`);
    }

    if (details.alerts && details.alerts.some(a => a.isActive)) {
      const activeAlerts = details.alerts.filter(a => a.isActive);
      flags.push(...activeAlerts.map(a => a.title));
    }

    return flags;
  };

  // Sort appointments by time
  const sortedAppointments = [...appointments].sort((a, b) =>
    new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime()
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        My Patients Today
      </Typography>

      {loading ? (
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={120} />
          <Skeleton variant="rectangular" height={120} />
          <Skeleton variant="rectangular" height={120} />
        </Stack>
      ) : sortedAppointments.length === 0 ? (
        <Alert severity="info">No patients scheduled for today.</Alert>
      ) : (
        <Stack spacing={2}>
          {sortedAppointments.map((appt) => {
            const alertFlags = getAlertFlags(appt.patientId);
            const statusColor = appt.status === 'Confirmed' ? 'primary.lighter' : 'success.lighter';

            return (
              <Box
                key={appt.entityId}
                sx={{
                  p: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  backgroundColor: statusColor,
                }}
              >
                {/* Patient Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {appt.patientName || `Patient #${appt.patientId.slice(-4)}`}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                      {new Date(appt.slotStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      {' '}
                      •
                      {' '}
                      {appt.appointmentType}
                    </Typography>
                  </Box>
                  <Chip
                    label={appt.status === 'Confirmed' ? '🟢 Confirmed' : '🔵 Checked In'}
                    size="small"
                    color={appt.status === 'Confirmed' ? 'warning' : 'success'}
                    variant="filled"
                  />
                </Box>

                {/* Alert Flags */}
                {alertFlags.length > 0 && (
                  <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#fff3e0', borderRadius: 0.5 }}>
                    {alertFlags.map((flag, idx) => (
                      <Typography key={idx} variant="caption" sx={{ display: 'block', color: '#e65100', fontWeight: 500, mb: idx < alertFlags.length - 1 ? 0.5 : 0 }}>
                        ⚠️
                        {' '}
                        {flag}
                      </Typography>
                    ))}
                  </Box>
                )}

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Box
                    component="button"
                    onClick={() => handleViewChart(appt.patientId)}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      border: '1px solid',
                      borderColor: 'primary.main',
                      backgroundColor: 'primary.main',
                      color: 'white',
                      borderRadius: 0.5,
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      '&:hover': { backgroundColor: 'primary.dark' },
                    }}
                  >
                    View Chart
                  </Box>
                  <Box
                    component="button"
                    onClick={() => handleViewNotes(appt.patientId)}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      border: '1px solid',
                      borderColor: 'primary.main',
                      backgroundColor: 'white',
                      color: 'primary.main',
                      borderRadius: 0.5,
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      '&:hover': { backgroundColor: 'primary.lighter' },
                    }}
                  >
                    View Notes
                  </Box>
                  {appt.status === 'Confirmed' && (
                    <Box
                      component="button"
                      onClick={() => handleReschedule()}
                      sx={{
                        px: 1.5,
                        py: 0.75,
                        border: '1px solid',
                        borderColor: 'text.disabled',
                        backgroundColor: 'white',
                        color: 'text.secondary',
                        borderRadius: 0.5,
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        '&:hover': { backgroundColor: 'action.hover' },
                      }}
                    >
                      Reschedule
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}

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
