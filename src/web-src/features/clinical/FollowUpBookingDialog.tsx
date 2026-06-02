import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem,
  TextField, Box, Typography, CircularProgress, Alert,
} from '@mui/material';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

interface FollowUpBookingDialogProps {
  open: boolean;
  onClose: () => void;
  onBooked: () => void;
  patientId: string;
  patientName: string;
  initialSlotStart: Date;
}

interface ProviderOption {
  id: string;
  email: string;
  role: string;
}

const APPOINTMENT_TYPES = ['Cleaning', 'Filling', 'Crown', 'Extraction', 'Consultation', 'Other'];
const DURATIONS = [15, 30, 45, 60, 90, 120];

export default function FollowUpBookingDialog({
  open,
  onClose,
  onBooked,
  patientId,
  patientName,
  initialSlotStart,
}: FollowUpBookingDialogProps) {
  const { user } = useAuth();

  const [appointmentType, setAppointmentType] = useState('Consultation');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [slotStart, setSlotStart] = useState(initialSlotStart.toISOString().slice(0, 16)); // datetime-local format
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [providerId, setProviderId] = useState(user?.userId ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset slot when dialog opens with new initialSlotStart
  useEffect(() => {
    if (open) {
      setSlotStart(initialSlotStart.toISOString().slice(0, 16));
      setError(null);
    }
  }, [open, initialSlotStart]);

  // Fetch providers on open
  useEffect(() => {
    if (!open) return;
    apiClient.get<{ entityId: string; email: string; role: string }[]>('/api/identity/providers')
      .then(res => {
        setProviders(res.data.map(p => ({ id: p.entityId, email: p.email, role: p.role })));
        // Pre-select current user if they are in the provider list
        const self = res.data.find(p => p.entityId === user?.userId);
        if (self) setProviderId(self.entityId);
        else if (res.data.length > 0) setProviderId(res.data[0].entityId);
      })
      .catch(() => {});
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBook = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post('/api/scheduling/appointments', {
        slotEntityId: null,
        patientId,
        patientName,
        providerId,
        appointmentType,
        durationMinutes,
        slotStart: new Date(slotStart).toISOString(),
      });
      onBooked();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as import('axios').AxiosError<{ title?: string }>;
      const is409 = axiosErr.response?.status === 409;
      setError(is409
        ? 'This slot is also taken. Please choose another time.'
        : 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Book Follow-Up Appointment</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {/* Patient — read-only */}
          <Typography variant="body2" color="text.secondary">
            Patient: <strong>{patientName}</strong>
          </Typography>

          {/* Appointment type */}
          <FormControl size="medium" fullWidth required>
            <InputLabel>Appointment Type</InputLabel>
            <Select
              value={appointmentType}
              label="Appointment Type"
              onChange={e => setAppointmentType(e.target.value)}
            >
              {APPOINTMENT_TYPES.map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Duration */}
          <FormControl size="medium" fullWidth required>
            <InputLabel>Duration</InputLabel>
            <Select
              value={durationMinutes}
              label="Duration"
              onChange={e => setDurationMinutes(Number(e.target.value))}
            >
              {DURATIONS.map(d => (
                <MenuItem key={d} value={d}>{d} min</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Slot date/time — editable */}
          <TextField
            label="Date & Time"
            type="datetime-local"
            size="medium"
            fullWidth
            required
            value={slotStart}
            onChange={e => setSlotStart(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          {/* Provider */}
          <FormControl size="medium" fullWidth required>
            <InputLabel>Provider</InputLabel>
            <Select
              value={providerId}
              label="Provider"
              onChange={e => setProviderId(e.target.value)}
            >
              {providers.map(p => (
                <MenuItem key={p.id} value={p.id}>
                  {p.email} ({p.role})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting} sx={{ minHeight: 44 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleBook}
          disabled={submitting || !slotStart || !providerId}
          sx={{ minHeight: 44 }}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Book Appointment
        </Button>
      </DialogActions>
    </Dialog>
  );
}
