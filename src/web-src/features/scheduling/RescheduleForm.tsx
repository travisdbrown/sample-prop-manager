import { useState } from 'react';
import {
  Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem,
  Button, IconButton, CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

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

interface RescheduleFormProps {
  appointment: AppointmentResponse;
  onSubmit: (newSlotStart: Date, durationMinutes: number) => Promise<void>;
  onCancel: () => void;
}

export default function RescheduleForm({ appointment, onSubmit, onCancel }: RescheduleFormProps) {
  const initialDuration = Math.min(120, Math.max(15,
    Math.round(
      (new Date(appointment.slotEnd).getTime() - new Date(appointment.slotStart).getTime()) / 60000
    )
  ));

  const [newDate, setNewDate] = useState<string>(() =>
    new Date(appointment.slotStart).toLocaleDateString('en-CA')
  );
  const [newTime, setNewTime] = useState<string>(() => {
    const d = new Date(appointment.slotStart);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [durationMinutes, setDurationMinutes] = useState<number>(initialDuration);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !!newDate && !!newTime;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const newSlotStart = new Date(`${newDate}T${newTime}:00`);
    setSubmitting(true);
    try {
      await onSubmit(newSlotStart, durationMinutes);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Reschedule Appointment</Typography>
        <IconButton size="small" onClick={onCancel} aria-label="Cancel reschedule">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Current appointment info — read-only reference */}
      <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">Current slot</Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {new Date(appointment.slotStart).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
          })}
          {' · '}
          {new Date(appointment.slotStart).toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit',
          })}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {appointment.appointmentType}
        </Typography>
      </Box>

      {/* Form fields */}
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'auto' }}>
        <TextField
          label="New Date"
          type="date"
          size="small"
          fullWidth
          required
          value={newDate}
          onChange={e => setNewDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="New Time"
          type="time"
          size="small"
          fullWidth
          required
          value={newTime}
          onChange={e => setNewTime(e.target.value)}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 900 } }}
        />
        {/* Duration: 15–120 only — backend validates max 120 for reschedule */}
        <FormControl size="small" fullWidth required>
          <InputLabel>Duration</InputLabel>
          <Select
            value={durationMinutes}
            label="Duration"
            onChange={e => setDurationMinutes(Number(e.target.value))}
          >
            {[15, 30, 45, 60, 90, 120].map(d => (
              <MenuItem key={d} value={d}>{d} min</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Action buttons */}
      <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
        <Button variant="outlined" size="small" fullWidth onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          fullWidth
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? <CircularProgress size={18} color="inherit" /> : 'Confirm Reschedule'}
        </Button>
      </Box>
    </Box>
  );
}
