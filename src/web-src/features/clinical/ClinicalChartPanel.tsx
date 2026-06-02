import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress,
  IconButton, Paper, Snackbar, TextField,
  ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types/auth';
import { getDentalChart, createChart, updateToothCondition, setChartNumber } from '../../services/clinical/clinicalService';
import DentalChart from './DentalChart';
import TreatmentNotesPanel from './TreatmentNotesPanel';
import HygieneNotesPanel from './HygieneNotesPanel';
import type { DentalChartData, ToothCondition } from './types';

const CONDITIONS: { value: ToothCondition; label: string; color: string; border?: string }[] = [
  { value: 'healthy', label: 'Healthy', color: '#FFFFFF', border: '1px solid #BDBDBD' },
  { value: 'crown',   label: 'Crown',   color: '#00897B' },
  { value: 'decay',   label: 'Decay',   color: '#E53935' },
  { value: 'filling', label: 'Filling', color: '#43A047' },
  { value: 'missing', label: 'Missing', color: '#9E9E9E' },
];

type ChartState = DentalChartData | 'not-found' | null;
type ChartView = 'medical' | 'cosmetic';

const isChartLoaded = (s: ChartState): s is DentalChartData =>
  s !== null && typeof s !== 'string';

interface Props {
  patientId: string;
  patientName?: string;
}

export default function ClinicalChartPanel({ patientId, patientName }: Props) {
  const { user } = useAuth();
  const [chartState, setChartState] = useState<ChartState>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [updateError, setUpdateError] = useState(false);
  const [beginLoading, setBeginLoading] = useState(false);
  const [chartView, setChartView] = useState<ChartView>('medical');
  const chartLoadRef = useRef<string | null>(null);

  const isDentist = user?.roles.includes(Role.Dentist) ?? false;
  const isHygienist = user?.roles.includes(Role.Hygienist) ?? false;

  // Chart number inline edit state
  const [editingChartNumber, setEditingChartNumber] = useState(false);
  const [chartNumberInput, setChartNumberInput] = useState('');
  const [chartNumberSaving, setChartNumberSaving] = useState(false);
  const [chartNumberError, setChartNumberError] = useState<string | null>(null);

  const handleChartNumberEditOpen = () => {
    const current = isChartLoaded(chartState) ? (chartState.chartNumber ?? '') : '';
    setChartNumberInput(current);
    setChartNumberError(null);
    setEditingChartNumber(true);
  };

  const handleChartNumberSave = async () => {
    setChartNumberSaving(true);
    setChartNumberError(null);
    try {
      const result = await setChartNumber(patientId, chartNumberInput.trim() || null);
      setChartState(prev =>
        prev !== null && prev !== 'not-found'
          ? { ...(prev as DentalChartData), chartNumber: result.chartNumber }
          : prev,
      );
      setEditingChartNumber(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? 'Failed to save chart number.';
      setChartNumberError(msg);
    } finally {
      setChartNumberSaving(false);
    }
  };

  const handleChartNumberCancel = () => {
    setEditingChartNumber(false);
    setChartNumberError(null);
  };

  const fetchChart = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getDentalChart(patientId);
      setChartState(data ?? 'not-found');
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (chartLoadRef.current !== patientId) {
      chartLoadRef.current = patientId;
      fetchChart();
    }
  }, [patientId, fetchChart]);

  const handleBeginCharting = async () => {
    setBeginLoading(true);
    try {
      const newChart = await createChart(patientId);
      setChartState(newChart);
    } catch {
      setError(true);
    } finally {
      setBeginLoading(false);
    }
  };

  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(prev => prev === toothNumber ? null : toothNumber);
  };

  const handleConditionSelect = async (condition: ToothCondition) => {
    if (!selectedTooth || !isChartLoaded(chartState)) return;

    const toothNumber = selectedTooth;
    const originalCondition =
      chartState.teeth.find(t => t.toothNumber === toothNumber)?.condition ?? 'healthy';

    setChartState(prev => {
      if (!isChartLoaded(prev)) return prev;
      return { ...prev, teeth: prev.teeth.map(t => t.toothNumber === toothNumber ? { ...t, condition } : t) };
    });

    try {
      await updateToothCondition(patientId, toothNumber, condition);
    } catch {
      setChartState(prev => {
        if (!isChartLoaded(prev)) return prev;
        return { ...prev, teeth: prev.teeth.map(t => t.toothNumber === toothNumber ? { ...t, condition: originalCondition } : t) };
      });
      setUpdateError(true);
    }
  };

  const currentTeeth = isChartLoaded(chartState) ? chartState.teeth : [];
  const selectedCondition = currentTeeth.find(t => t.toothNumber === selectedTooth)?.condition ?? null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={<Button size="small" onClick={fetchChart}>Retry</Button>}>
        Unable to load chart data. Please try again.
      </Alert>
    );
  }

  if (chartState === 'not-found') {
    return (
      <Box>
        <DentalChart teeth={[]} readonly />
        <Alert severity="info" sx={{ mt: 2 }}>No chart data recorded yet.</Alert>
        {isDentist && (
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={handleBeginCharting}
            disabled={beginLoading}
          >
            {beginLoading ? 'Creating Chart…' : 'Begin Charting'}
          </Button>
        )}
      </Box>
    );
  }

  const chart = chartState as DentalChartData;

  return (
    <>
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' } }}>

        {/* ── LEFT: Dental chart ──────────────────────────────────────────────── */}
        <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: 380 } }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <ToggleButtonGroup
              value={chartView}
              exclusive
              onChange={(_, v) => { if (v) setChartView(v); }}
              size="small"
              sx={{ mb: 2, '& .MuiToggleButton-root': { px: 2.5, textTransform: 'none', fontWeight: 600 } }}
            >
              <ToggleButton value="medical">Medical</ToggleButton>
              <ToggleButton value="cosmetic">Cosmetic</ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <DentalChart
                teeth={chart.teeth}
                view={chartView}
                selectedTooth={selectedTooth}
                onToothClick={isDentist ? handleToothClick : undefined}
              />
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2, justifyContent: 'center' }}>
              {CONDITIONS.map(c => (
                <Box key={c.value} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{
                    width: 12, height: 12, borderRadius: '50%',
                    bgcolor: c.color,
                    border: c.border ?? '1px solid transparent',
                    opacity: c.value === 'missing' ? 0.5 : 1,
                    flexShrink: 0,
                  }} />
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                    {c.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* ── RIGHT: Context panel ────────────────────────────────────────────── */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Chart number */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Chart #</Typography>
                {editingChartNumber ? (
                  <TextField
                    value={chartNumberInput}
                    onChange={e => setChartNumberInput(e.target.value)}
                    size="small"
                    slotProps={{ htmlInput: { maxLength: 50 } }}
                    error={!!chartNumberError}
                    helperText={chartNumberError ?? undefined}
                    disabled={chartNumberSaving}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleChartNumberSave();
                      if (e.key === 'Escape') handleChartNumberCancel();
                    }}
                    autoFocus
                    sx={{ mt: 0.5 }}
                  />
                ) : (
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {chart.chartNumber ?? '—'}
                  </Typography>
                )}
              </Box>
              {isDentist && (
                editingChartNumber ? (
                  <Box sx={{ display: 'flex', gap: 0.5, alignSelf: 'flex-start', mt: 0.5 }}>
                    <Tooltip title="Save">
                      <span>
                        <IconButton size="small" onClick={handleChartNumberSave} disabled={chartNumberSaving} color="primary">
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Cancel">
                      <IconButton size="small" onClick={handleChartNumberCancel} disabled={chartNumberSaving}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ) : (
                  <Tooltip title="Edit chart number">
                    <IconButton size="small" onClick={handleChartNumberEditOpen} aria-label="Edit chart number">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              )}
            </Box>
          </Paper>

          {/* Tooth detail panel — shown when a tooth is selected */}
          {selectedTooth !== null && (
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: 'primary.main' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Tooth {selectedTooth}
                </Typography>
                {selectedCondition && selectedCondition !== 'healthy' && (
                  <Chip
                    label={selectedCondition}
                    size="small"
                    sx={{
                      bgcolor: CONDITIONS.find(c => c.value === selectedCondition)?.color,
                      color: '#fff',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      fontSize: 11,
                    }}
                  />
                )}
              </Box>

              {isDentist ? (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Set condition
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {CONDITIONS.map(c => (
                      <Button
                        key={c.value}
                        variant={selectedCondition === c.value ? 'contained' : 'outlined'}
                        size="medium"
                        onClick={() => handleConditionSelect(c.value)}
                        startIcon={
                          <Box sx={{
                            width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                            bgcolor: c.color,
                            border: c.border ?? 'none',
                          }} />
                        }
                        sx={{ justifyContent: 'flex-start', textTransform: 'capitalize', fontSize: 13, minHeight: 44 }}
                      >
                        {c.label}
                      </Button>
                    ))}
                  </Box>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                  Condition: {selectedCondition ?? 'healthy'}
                </Typography>
              )}
            </Paper>
          )}

          {/* Notes */}
          {isDentist && (
            <TreatmentNotesPanel patientId={patientId} patientName={patientName} />
          )}
          {isHygienist && <HygieneNotesPanel patientId={patientId} />}
        </Box>
      </Box>

      <Snackbar open={updateError} autoHideDuration={5000} onClose={() => setUpdateError(false)}>
        <Alert severity="error" onClose={() => setUpdateError(false)}>
          Failed to update tooth condition. Please try again.
        </Alert>
      </Snackbar>
    </>
  );
}
