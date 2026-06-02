import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  TextField,
  Select,
  MenuItem,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import axios, { type AxiosError } from 'axios';
import apiClient from '../../services/apiClient';

interface ReminderConfigResponse {
  appointmentType: string;
  isEnabled: boolean;
  sendBeforeHours: number;
  deliveryMethod: string;
}

interface ReminderConfigRow {
  isEnabled: boolean;
  sendBeforeHours: number;
  deliveryMethod: string;
}

const APPOINTMENT_TYPES = ['Cleaning', 'Filling', 'Crown', 'Extraction', 'Consultation', 'Other'];
const DELIVERY_METHODS = ['Email', 'Sms', 'Both'] as const;
const DELIVERY_METHOD_LABELS: Record<string, string> = { Email: 'Email', Sms: 'SMS', Both: 'Both' };

const DEFAULT_ROW: ReminderConfigRow = { isEnabled: false, sendBeforeHours: 24, deliveryMethod: 'Email' };

export default function ReminderSettingsPage() {
  const [configs, setConfigs] = useState<Record<string, ReminderConfigRow>>(
    Object.fromEntries(APPOINTMENT_TYPES.map((t) => [t, { ...DEFAULT_ROW }]))
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [savingRows, setSavingRows] = useState<Set<string>>(new Set());
  // Raw text driving the Hours Before TextField — lets users clear and retype without snapping.
  const [hoursInput, setHoursInput] = useState<Record<string, string>>(
    Object.fromEntries(APPOINTMENT_TYPES.map((t) => [t, String(DEFAULT_ROW.sendBeforeHours)]))
  );
  const [hoursError, setHoursError] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error', autoHide: true });

  useEffect(() => {
    const controller = new AbortController();
    apiClient.get<ReminderConfigResponse[]>('/api/notifications/reminder-configs', { signal: controller.signal })
      .then((res) => {
        const updated: Record<string, ReminderConfigRow> = Object.fromEntries(
          APPOINTMENT_TYPES.map((t) => [t, { ...DEFAULT_ROW }])
        );
        for (const cfg of res.data) {
          updated[cfg.appointmentType] = {
            isEnabled: cfg.isEnabled,
            sendBeforeHours: cfg.sendBeforeHours,
            deliveryMethod: cfg.deliveryMethod,
          };
        }
        setConfigs(updated);
        setHoursInput(Object.fromEntries(APPOINTMENT_TYPES.map((t) => [t, String(updated[t].sendBeforeHours)])));
        setLoadError(false);
      })
      .catch((err) => {
        if (!axios.isCancel(err)) {
          setLoadError(true);
          setSnackbar({ open: true, message: 'Failed to load reminder settings.', severity: 'error', autoHide: false });
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const handleChange = useCallback(
    <K extends keyof ReminderConfigRow>(appointmentType: string, field: K, value: ReminderConfigRow[K]) => {
      setConfigs((prev) => ({
        ...prev,
        [appointmentType]: { ...prev[appointmentType], [field]: value },
      }));
    },
    []
  );

  const validateHours = (raw: string): number | null => {
    const n = parseInt(raw, 10);
    return !isNaN(n) && n >= 1 && n <= 168 ? n : null;
  };

  const handleHoursChange = useCallback((appointmentType: string, raw: string) => {
    setHoursInput((prev) => ({ ...prev, [appointmentType]: raw }));
    // Eagerly clear the error as soon as the value becomes valid while the user is typing
    if (validateHours(raw) !== null) {
      setHoursError((prev) => { const next = { ...prev }; delete next[appointmentType]; return next; });
    }
  }, []);

  const handleHoursBlur = useCallback((appointmentType: string, raw: string) => {
    const n = validateHours(raw);
    if (n === null) {
      setHoursError((prev) => ({ ...prev, [appointmentType]: 'Enter a value between 1 and 168.' }));
    } else {
      setHoursError((prev) => { const next = { ...prev }; delete next[appointmentType]; return next; });
      // Commit the validated number back to configs so the rest of the row stays in sync
      setConfigs((prev) => ({ ...prev, [appointmentType]: { ...prev[appointmentType], sendBeforeHours: n } }));
    }
  }, []);

  const handleSave = useCallback(
    async (appointmentType: string, row: ReminderConfigRow, rawHours: string) => {
      // Validate the hours field before attempting the PUT — catches values typed without blur
      const n = validateHours(rawHours);
      if (n === null) {
        setHoursError((prev) => ({ ...prev, [appointmentType]: 'Enter a value between 1 and 168.' }));
        return;
      }
      setSavingRows((prev) => new Set(prev).add(appointmentType));
      // Merge the validated hours into the row snapshot passed from the call site
      const payload = { ...row, sendBeforeHours: n };
      try {
        await apiClient.put(`/api/notifications/reminder-configs/${encodeURIComponent(appointmentType)}`, {
          isEnabled: payload.isEnabled,
          sendBeforeHours: payload.sendBeforeHours,
          deliveryMethod: payload.deliveryMethod,
        });
        setSnackbar({ open: true, message: `${appointmentType} reminder saved.`, severity: 'success', autoHide: true });
      } catch (err) {
        const detail = (err as AxiosError<{ detail?: string }>).response?.data?.detail;
        setSnackbar({ open: true, message: detail ?? `Failed to save ${appointmentType} reminder.`, severity: 'error', autoHide: false });
      } finally {
        setSavingRows((prev) => { const next = new Set(prev); next.delete(appointmentType); return next; });
      }
    },
    []
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Appointment Reminder Settings
      </Typography>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Settings could not be loaded. The values shown below are defaults, not your saved configuration.
          Saving is disabled until the page reloads successfully.
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Appointment Type</TableCell>
              <TableCell>Enabled</TableCell>
              <TableCell>Hours Before</TableCell>
              <TableCell>Delivery Method</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {APPOINTMENT_TYPES.map((type) => {
              const row = configs[type];
              return (
                <TableRow key={type}>
                  <TableCell>{type}</TableCell>
                  <TableCell>
                    <Switch
                      checked={row.isEnabled}
                      onChange={(e) => handleChange(type, 'isEnabled', e.target.checked)}
                      slotProps={{ input: { 'aria-label': `Enable ${type} reminder` } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={hoursInput[type]}
                      onChange={(e) => handleHoursChange(type, e.target.value)}
                      onBlur={(e) => handleHoursBlur(type, e.target.value)}
                      slotProps={{ htmlInput: { min: 1, max: 168, style: { width: 70 } } }}
                      size="small"
                      error={!!hoursError[type]}
                      helperText={hoursError[type] ?? ' '}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.deliveryMethod}
                      onChange={(e) => handleChange(type, 'deliveryMethod', e.target.value)}
                      size="small"
                    >
                      {DELIVERY_METHODS.map((m) => (
                        <MenuItem key={m} value={m}>{DELIVERY_METHOD_LABELS[m]}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleSave(type, configs[type], hoursInput[type])}
                      disabled={loadError || savingRows.has(type) || !!hoursError[type]}
                    >
                      {savingRows.has(type) ? <CircularProgress size={18} color="inherit" /> : 'Save'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHide ? 3000 : null}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
