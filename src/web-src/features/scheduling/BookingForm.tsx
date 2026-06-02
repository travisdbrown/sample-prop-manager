import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Button, IconButton, List, ListItemButton, ListItemText, Paper, CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import apiClient from '../../services/apiClient';
import { generateSchedulingSuggestion } from '../../services/ai/aiService';
import SchedulingAiSuggestionCard from './SchedulingAiSuggestionCard';
import type { ProviderOption } from './types';

export interface BookAppointmentFormData {
  patientId: string;
  patientName: string;
  providerId: string;
  appointmentType: string;
  durationMinutes: number;
  premedRequired: boolean;
  appointmentNote: string | null;
  namePronunciation: string | null;
}

interface PatientSearchResult {
  entityId: string;
  firstName: string;
  lastName: string;
  // Clinical flags included in search results so booking can stamp them onto the
  // new appointment without a second round-trip to GET /api/patients/{id}.
  premedRequired: boolean;
  appointmentNote: string | null;
  namePronunciation: string | null;
  // Scheduling preferences (AC#5) — displayed as guidance, not sent in booking payload
  preferredDayOfWeek: string;
  preferredEarliestTime: string | null;
  preferredLatestTime: string | null;
  preferredArriveEarlyMinutes: number;
}

const toTimeDisplay = (t: string | null | undefined): string => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};

interface BookingFormProps {
  slotStart: Date;
  preselectedPatientId: string | null;
  preselectedProviderId?: string;
  providerOptions: ProviderOption[];
  providersLoading?: boolean;
  onSubmit: (data: BookAppointmentFormData) => Promise<void>;
  onCancel: () => void;
  onProviderChange?: (providerId: string) => void;
}

export default function BookingForm({ slotStart, preselectedProviderId, providerOptions, providersLoading = false, onSubmit, onCancel, onProviderChange }: BookingFormProps) {
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<PatientSearchResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);
  const [appointmentType, setAppointmentType] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');
  const [providerId, setProviderId] = useState(preselectedProviderId ?? '');
  const [submitting, setSubmitting] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // AI scheduling suggestion state
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDismissed, setAiDismissed] = useState(false);

  // Trigger AI suggestion when patient + appointmentType are both selected (AC1, AC4)
  useEffect(() => {
    if (!navigator.onLine) return;
    if (!selectedPatient || !appointmentType) return;
    if (aiDismissed) return;

    let cancelled = false;
    setAiLoading(true);
    setAiSuggestion(null);

    generateSchedulingSuggestion(selectedPatient.entityId, appointmentType)
      .then(result => {
        if (!cancelled) setAiSuggestion(result.content);
      })
      .catch(() => {
        if (!cancelled) setAiSuggestion(null);
      })
      .finally(() => {
        if (!cancelled) setAiLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedPatient?.entityId, appointmentType, aiDismissed]);

  // F-14: cancel any pending debounce timer on unmount to avoid a fire-and-forget
  // API call after the component is gone (consistent with the cancelled-flag pattern elsewhere).
  useEffect(() => {
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, []);

  // Auto-select the first provider and hold the slot when no provider was preselected
  // (week view doesn't have provider columns — the form must initiate the reservation)
  const onProviderChangeRef = useRef(onProviderChange);
  useEffect(() => { onProviderChangeRef.current = onProviderChange; }, [onProviderChange]);

  useEffect(() => {
    if (preselectedProviderId || providersLoading || providerOptions.length === 0 || providerId) return;
    const first = providerOptions[0].id;
    setProviderId(first);
    onProviderChangeRef.current?.(first);
  }, [providerOptions, providersLoading, preselectedProviderId, providerId]);

  const handlePatientSelect = useCallback((patient: PatientSearchResult) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSelectedPatient(patient);
    setPatientResults([]);
    setPatientSearch('');
  }, []);

  const handlePatientSearchChange = useCallback((value: string) => {
    setPatientSearch(value);
    setSelectedPatient(null);
    setAiSuggestion(null);
    setAiDismissed(false);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (value.trim().length < 2) { setPatientResults([]); return; }
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.get<PatientSearchResult[]>(
          `/api/patients?searchTerm=${encodeURIComponent(value.trim())}&pageSize=20&pageIndex=0`
        );
        setPatientResults(res.data);
      } catch { setPatientResults([]); }
    }, 300);
  }, []);

  const canSubmit = !!selectedPatient && !!appointmentType && durationMinutes !== '' && !!providerId && !providersLoading;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedPatient) return;
    setSubmitting(true);
    try {
      await onSubmit({
        patientId: selectedPatient.entityId,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        providerId,
        appointmentType,
        durationMinutes: Number(durationMinutes),
        premedRequired: selectedPatient.premedRequired ?? false,
        appointmentNote: selectedPatient.appointmentNote ?? null,
        namePronunciation: selectedPatient.namePronunciation ?? null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>New Appointment</Typography>
        <IconButton size="small" onClick={onCancel} aria-label="Cancel booking"><CloseIcon /></IconButton>
      </Box>

      {/* Slot info (read-only) */}
      <Box sx={{ px: 2, py: 1, bgcolor: 'warning.50', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">Slot</Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {slotStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          {' · '}
          {slotStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </Typography>
        <Typography variant="caption" sx={{ color: 'warning.main' }}>● Held for you</Typography>
      </Box>

      {/* Form fields */}
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'auto' }}>
        {/* Patient search autocomplete */}
        <Box>
          <TextField
            label="Patient"
            size="small"
            fullWidth
            required
            value={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : patientSearch}
            onChange={e => {
              if (selectedPatient) setSelectedPatient(null);
              handlePatientSearchChange(e.target.value);
            }}
            placeholder="Search by name…"
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          />
          {patientResults.length > 0 && !selectedPatient && (
            <Paper elevation={3} sx={{ mt: 0.5, maxHeight: 160, overflow: 'auto', zIndex: 10, position: 'relative' }}>
              <List dense disablePadding>
                {patientResults.map(p => (
                  <ListItemButton
                    key={p.entityId}
                    onClick={() => handlePatientSelect(p)}
                    sx={{ minHeight: 56 }}
                  >
                    <ListItemText primary={`${p.firstName} ${p.lastName}`} />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          )}
        </Box>

        {/* Scheduling preferences guidance — shown when a patient is selected (AC#5) */}
        {selectedPatient && (
          <Box sx={{ bgcolor: 'info.50', border: 1, borderColor: 'info.200', borderRadius: 1, px: 1.5, py: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'info.dark', display: 'block', mb: 0.5 }}>
              Patient Scheduling Preferences
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.25 }}>
              {([
                ['Preferred day', selectedPatient.preferredDayOfWeek || 'Any'],
                ['Earliest', toTimeDisplay(selectedPatient.preferredEarliestTime)],
                ['Latest', toTimeDisplay(selectedPatient.preferredLatestTime)],
                ['Arrive early', `${selectedPatient.preferredArriveEarlyMinutes ?? 0} min`],
              ] as [string, string][]).map(([label, value]) => (
                <Typography key={label} variant="caption" color="text.secondary">
                  {label}: <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>{value}</Box>
                </Typography>
              ))}
            </Box>
          </Box>
        )}

        {/* Appointment type */}
        <FormControl size="medium" fullWidth required>
          <InputLabel>Appointment Type</InputLabel>
          <Select
            value={appointmentType}
            label="Appointment Type"
            onChange={e => {
              setAppointmentType(e.target.value);
              setAiSuggestion(null);
              setAiDismissed(false);
            }}
          >
            {['Cleaning', 'Filling', 'Crown', 'Extraction', 'Consultation', 'Other'].map(t => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* AI scheduling suggestion card — shown when patient + type are both selected (AC1, AC2, AC3, AC4, AC5) */}
        {(aiLoading || aiSuggestion) && !aiDismissed && (
          <SchedulingAiSuggestionCard
            content={aiSuggestion ?? ''}
            loading={aiLoading}
            onApply={() => {
              if (durationMinutes === '') setDurationMinutes(30);
              setAiSuggestion(null);
            }}
            onDismiss={() => {
              setAiSuggestion(null);
              setAiDismissed(true);
            }}
          />
        )}

        {/* Duration */}
        <FormControl size="medium" fullWidth required>
          <InputLabel>Duration</InputLabel>
          <Select value={durationMinutes} label="Duration" onChange={e => setDurationMinutes(Number(e.target.value))}>
            {[15, 30, 45, 60, 90, 120].map(d => (
              <MenuItem key={d} value={d}>{d} min</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Provider */}
        <FormControl size="medium" fullWidth required>
          <InputLabel>Provider</InputLabel>
          <Select value={providerId} label="Provider" onChange={e => { setProviderId(e.target.value); onProviderChange?.(e.target.value); }}>
            {providerOptions.map(p => (
              <MenuItem key={p.id} value={p.id}>
                {p.email} ({p.roles.join(', ')})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Action buttons */}
      <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
        <Button variant="outlined" size="medium" fullWidth onClick={onCancel} disabled={submitting}
          sx={{ minHeight: 44 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          size="medium"
          fullWidth
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          sx={{ minHeight: 44 }}
        >
          {submitting ? <CircularProgress size={18} color="inherit" /> : 'Book Appointment'}
        </Button>
      </Box>
    </Box>
  );
}
