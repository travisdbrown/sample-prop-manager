import {
  Box, Stack, Typography, Button, CircularProgress, Snackbar, Alert, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTabContext } from '../../contexts/TabContext';
import apiClient from '../../services/apiClient';
import NewPatientDialog from './NewPatientDialog';
import PatientAlertBadge from '../../components/PatientAlertBadge';
import { AVAILABLE_TAGS } from '../../constants/patientTags';

const formatDob = (dob: string) =>
  new Date(dob + 'T00:00:00').toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric',
  });

interface PatientAlertSummary {
  entityId: string;
  alertType: string;
  title: string;
}

interface PatientSummaryResponse {
  entityId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string | null;
  // phone removed in Story 2.6 — managed via Contact & Communication card on Patient Detail
  activeAlerts: PatientAlertSummary[];
  categoryTagIds: string[];
}

export default function PatientsPage() {
  const navigate = useNavigate();
  const { openTab } = useTabContext();
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState<PatientSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false, message: '', severity: 'success' as 'success' | 'error', autoHide: true,
  });
  const [tagFilter, setTagFilter] = useState<string>('');
  const [dismissing, setDismissing] = useState<string | null>(null);
  const [confirmDismiss, setConfirmDismiss] = useState<{ patientId: string; alertId: string; title: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const closeSnackbar = useCallback(() => setSnackbar(s => ({ ...s, open: false })), []);
  const showSuccess = useCallback((msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'success', autoHide: true }), []);
  const showError = useCallback((msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'error', autoHide: false }), []);

  const loadPatients = useCallback(async (term: string, tag?: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: '100', pageIndex: '0' });
      if (term) params.set('searchTerm', term);
      if (tag)  params.set('tag', tag);
      const res = await apiClient.get<PatientSummaryResponse[]>(
        `/api/patients?${params.toString()}`,
        { signal: controller.signal },
      );
      setPatients(res.data);
    } catch (err: unknown) {
      if ((err as { code?: string })?.code !== 'ERR_CANCELED') {
        showError('Failed to load patients.');
      }
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      loadPatients('');
    }
  }, [loadPatients]);

  // Reload when tag filter changes — preserves any active search term (combined AND filter)
  const handleTagFilterChange = (tag: string) => {
    setTagFilter(tag);
    loadPatients(searchTerm, tag || undefined);
  };

  // Open register dialog when ?registerName= param is present
  useEffect(() => {
    const name = searchParams.get('registerName');
    if (name) setRegisterOpen(true);
  }, [searchParams]);

  // Debounce teardown
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleDismissAlert = (patientId: string, alertId: string, title: string) => {
    setConfirmDismiss({ patientId, alertId, title });
  };

  const handleConfirmDismiss = async () => {
    if (!confirmDismiss) return;
    const { patientId, alertId } = confirmDismiss;
    setDismissing(alertId);
    try {
      await apiClient.delete(`/api/patients/${patientId}/alerts/${alertId}`);
      setPatients(prev =>
        prev.map(p =>
          p.entityId === patientId
            ? { ...p, activeAlerts: p.activeAlerts.filter(a => a.entityId !== alertId) }
            : p,
        ),
      );
    } catch {
      showError('Failed to dismiss alert. Please try again.');
    } finally {
      setDismissing(null);
      setConfirmDismiss(null);
    }
  };

  const emptyState = !loading && (
    searchTerm ? (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 2 }}>No patients found for '{searchTerm}'.</Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/patients?registerName=' + encodeURIComponent(searchTerm))}
        >
          Register New Patient named "{searchTerm}"
        </Button>
      </Box>
    ) : tagFilter ? (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 2 }}>No patients with tag '{tagFilter}'.</Typography>
        <Button variant="outlined" onClick={() => handleTagFilterChange('')}>Clear filter</Button>
      </Box>
    ) : (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 2 }}>No patients registered yet.</Typography>
        <Button variant="contained" onClick={() => setRegisterOpen(true)}>Register First Patient</Button>
      </Box>
    )
  );

  return (
    <Stack sx={{ height: '100%' }}>
      {/* Fixed header — title, button, search stay in view */}
      <Stack spacing={2} sx={{ flexShrink: 0, mb: 3 }}>
        <Stack direction="row" sx={{ alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, flex: 1 }}>Patients</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setRegisterOpen(true)}>
            New Patient
          </Button>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search patients…"
            value={searchTerm}
            onChange={e => {
              const term = e.target.value;
              setSearchTerm(term);
              if (debounceRef.current) clearTimeout(debounceRef.current);
              debounceRef.current = setTimeout(() => loadPatients(term, tagFilter || undefined), 300);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: 280 }}
          />

          {/* Tag filter — clears search term when active */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="tag-filter-label">Filter by tag</InputLabel>
            <Select
              labelId="tag-filter-label"
              label="Filter by tag"
              value={tagFilter}
              onChange={e => handleTagFilterChange(e.target.value as string)}
            >
              <MenuItem value="">All patients</MenuItem>
              {AVAILABLE_TAGS.map(tag => (
                <MenuItem key={tag} value={tag}>{tag}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {/* Scrollable table area */}
      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : patients.length === 0 ? emptyState : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Date of Birth</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Tags</TableCell>
                  <TableCell>Alerts</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.map(p => (
                  <TableRow
                    key={p.entityId}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => openTab(`/patients/${p.entityId}`, `${p.firstName} ${p.lastName}`)}
                  >
                    <TableCell>{p.firstName} {p.lastName}</TableCell>
                    <TableCell>{formatDob(p.dateOfBirth)}</TableCell>
                    <TableCell>{p.email ?? '—'}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      {p.categoryTagIds && p.categoryTagIds.length > 0 ? (
                        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                          {p.categoryTagIds.map(tag => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleTagFilterChange(tag)}
                              sx={{ fontSize: '0.7rem', cursor: 'pointer' }}
                            />
                          ))}
                        </Stack>
                      ) : '—'}
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      {p.activeAlerts && p.activeAlerts.length > 0 ? (
                        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                          {p.activeAlerts.map(a => (
                            <PatientAlertBadge
                              key={a.entityId}
                              alert={a}
                              onDismiss={a.alertType !== 'Allergy' ? () => handleDismissAlert(p.entityId, a.entityId, a.title) : undefined}
                            />
                          ))}
                        </Stack>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <NewPatientDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={(newPatient, warning) => {
          setPatients(prev => [{ ...newPatient, activeAlerts: [] as PatientAlertSummary[], categoryTagIds: [] }, ...prev]);
          if (warning) showError(warning);
          else showSuccess('Patient registered successfully.');
          openTab(`/patients/${newPatient.entityId}`, `${newPatient.firstName} ${newPatient.lastName}`);
        }}
        prefilledName={searchParams.get('registerName') ?? undefined}
      />

      <Dialog
        open={!!confirmDismiss}
        onClose={() => setConfirmDismiss(null)}
        maxWidth="xs"
        aria-labelledby="dismiss-alert-dialog-title"
      >
        <DialogTitle id="dismiss-alert-dialog-title">Dismiss Alert</DialogTitle>
        <DialogContent>
          <Typography>Dismiss "{confirmDismiss?.title}"? This action is permanent.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDismiss(null)} disabled={dismissing !== null}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleConfirmDismiss}
            disabled={dismissing !== null}
          >
            {dismissing !== null ? <CircularProgress size={18} color="inherit" /> : 'Dismiss'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHide ? 3000 : null}
        onClose={closeSnackbar}
      >
        <Alert
          severity={snackbar.severity}
          onClose={closeSnackbar}
          sx={snackbar.severity === 'success' ? {
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '& .MuiAlert-icon': { color: 'primary.contrastText' },
          } : undefined}
        >{snackbar.message}</Alert>
      </Snackbar>
    </Stack>
  );
}
