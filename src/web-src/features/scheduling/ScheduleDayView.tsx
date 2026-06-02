import { Fragment, useMemo, useState } from 'react';
import {
  Box, Typography, IconButton, Button, Skeleton, Tooltip, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { amber } from '@mui/material/colors';
import type { ProviderOption } from './types';

// ─── Layout constants — match WeekCalendarGrid ────────────────────────────────
const HOUR_START = 7;
const HOUR_END = 19;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 32;
const HEADER_HEIGHT = 56;
const TIME_COL_WIDTH = 52;
const MIN_COL_WIDTH = 140;
const TOTAL_SLOTS = ((HOUR_END - HOUR_START) * 60) / SLOT_MINUTES;

// ─── Types ────────────────────────────────────────────────────────────────────
interface AppointmentResponse {
  entityId: string;
  patientId: string;
  patientName: string;
  providerId: string;
  appointmentType: string;
  status: string;
  slotStart: string;
  slotEnd: string;
  appointmentNote?: string | null;
  premedRequired?: boolean;
  namePronunciation?: string | null;
}

type SlotLockState = 'soft' | 'hard';

interface ScheduleDayViewProps {
  appointments?: AppointmentResponse[];
  providers?: ProviderOption[];
  isLoading?: boolean;
  selectedAppointmentId?: string | null;
  currentDate?: Date;
  slotLocks?: Map<string, { state: SlotLockState; heldByName: string }>;
  onDateChange?: (date: Date) => void;
  onAppointmentClick?: (appointmentId: string, patientId: string) => void;
  onEmptySlotClick?: (slotStart: Date, providerId?: string) => void;
  onReschedule?: (appointmentId: string, newStart: Date, newEnd: Date, providerId: string) => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (hour: number, minute: number): string =>
  `${hour % 12 || 12}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;

const addDays = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

// Returns top-offset (px) and height (px) of an appointment within the grid
const getSlotStyle = (slotStart: string, slotEnd: string) => {
  const start = new Date(slotStart);
  const end = new Date(slotEnd);
  const startMins = start.getHours() * 60 + start.getMinutes() - HOUR_START * 60;
  const durationMins = (end.getTime() - start.getTime()) / 60000;
  const top = (startMins / SLOT_MINUTES) * SLOT_HEIGHT;
  const height = Math.max((durationMins / SLOT_MINUTES) * SLOT_HEIGHT, SLOT_HEIGHT);
  return { top, height };
};

// Consistent provider colour palette
const PROVIDER_COLORS = [
  '#1976D2', '#D32F2F', '#388E3C', '#F57C00',
  '#7B1FA2', '#0097A7', '#C62828', '#5E35B1',
];
const getProviderColor = (idx: number) => PROVIDER_COLORS[idx % PROVIDER_COLORS.length];

// Status colour for appointment card border
const getStatusBorderColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed':  return '#388E3C';
    case 'confirmed':  return '#0277BD';
    case 'cancelled':  return '#9E9E9E';
    default:           return 'transparent';
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
const toSlotKey = (providerId: string, d: Date): string =>
  `${providerId}~${d.toISOString().replace(/[-:T]/g, '').slice(0, 12)}`;

export default function ScheduleDayView({
  appointments: externalAppointments,
  providers: externalProviders,
  isLoading,
  selectedAppointmentId,
  currentDate: externalDate,
  slotLocks,
  onDateChange,
  onAppointmentClick,
  onEmptySlotClick,
  onReschedule,
}: ScheduleDayViewProps) {
  const appointments = externalAppointments ?? [];
  const providers    = externalProviders    ?? [];

  // Use controlled date when parent provides it; fall back to internal state
  const [internalDate, setInternalDate] = useState<Date>(new Date());
  const currentDate = externalDate ?? internalDate;

  const setCurrentDate = (d: Date) => {
    setInternalDate(d);
    onDateChange?.(d);
  };
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [rescheduleDialog, setRescheduleDialog] = useState<{
    appointmentId: string; label: string; newStart: Date; newEnd: Date; providerId: string;
  } | null>(null);

  // ── Derive the visible provider columns ──────────────────────────────────
  const visibleProviders = useMemo(() => {
    if (selectedProviderId) return providers.filter(p => p.id === selectedProviderId);
    return providers;
  }, [providers, selectedProviderId]);

  // ── Filter appointments to the selected day ───────────────────────────────
  const dayAppointments = useMemo(() => {
    const target = new Date(currentDate);
    target.setHours(0, 0, 0, 0);
    return appointments.filter(a => {
      const d = new Date(a.slotStart);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === target.getTime();
    });
  }, [appointments, currentDate]);

  // ── Group appointments by providerId ─────────────────────────────────────
  const appointmentsByProvider = useMemo(() => {
    const map = new Map<string, AppointmentResponse[]>();
    for (const appt of dayAppointments) {
      if (!map.has(appt.providerId)) map.set(appt.providerId, []);
      map.get(appt.providerId)!.push(appt);
    }
    return map;
  }, [dayAppointments]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const handlePrev  = () => setCurrentDate(addDays(currentDate, -1));
  const handleNext  = () => setCurrentDate(addDays(currentDate, +1));
  const handleToday = () => setCurrentDate(new Date());

  const isToday = currentDate.toDateString() === new Date().toDateString();
  const containerHeight = HEADER_HEIGHT + TOTAL_SLOTS * SLOT_HEIGHT;


  const handleConfirmReschedule = async () => {
    if (!rescheduleDialog || !onReschedule) return;
    await onReschedule(
      rescheduleDialog.appointmentId,
      rescheduleDialog.newStart,
      rescheduleDialog.newEnd,
      rescheduleDialog.providerId,
    );
    setRescheduleDialog(null);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Toolbar ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1, p: 1,
        borderBottom: 1, borderColor: 'divider', flexShrink: 0, flexWrap: 'wrap',
      }}>
        {/* Prev / date picker / Next / Today */}
        <IconButton size="small" onClick={handlePrev} aria-label="Previous day">
          <ChevronLeftIcon />
        </IconButton>

        <DatePicker
          value={currentDate}
          onChange={(v) => { if (v) setCurrentDate(v as Date); }}
          slotProps={{ textField: { size: 'small', variant: 'outlined' as const, sx: { width: 148 } } }}
        />

        <IconButton size="small" onClick={handleNext} aria-label="Next day">
          <ChevronRightIcon />
        </IconButton>

        <Button
          size="small"
          variant={isToday ? 'contained' : 'outlined'}
          onClick={handleToday}
          sx={{ minWidth: 60 }}
        >
          Today
        </Button>

        {/* Provider filter */}
        <Select
          size="small"
          displayEmpty
          value={selectedProviderId ?? ''}
          onChange={e => setSelectedProviderId(e.target.value || null)}
          sx={{ minWidth: 160 }}
          aria-label="Filter by provider"
        >
          <MenuItem value="">All Dentists</MenuItem>
          {providers.map(p => (
            <MenuItem key={p.id} value={p.id}>{p.email}</MenuItem>
          ))}
        </Select>
      </Box>

      {/* ── Loading skeleton ── */}
      {isLoading && (
        <Box sx={{ p: 2, flex: 1 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={SLOT_HEIGHT} sx={{ mb: 0.5, borderRadius: 1 }} />
          ))}
        </Box>
      )}

      {/* ── Grid ── */}
      {!isLoading && (
        <Box sx={{ flex: 1, overflow: 'auto' }}>

          {/* Empty state */}
          {dayAppointments.length === 0 && (
            <Box sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', gap: 2, p: 4,
            }}>
              <Typography variant="body1" color="text.secondary" align="center">
                No appointments scheduled for{' '}
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.
              </Typography>
              <Button
                variant="contained"
                onClick={() => onEmptySlotClick?.(currentDate)}
              >
                Book First Appointment
              </Button>
            </Box>
          )}

          {/* Calendar grid — time column + one column per provider */}
          {dayAppointments.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                // Time gutter + one column per visible provider
                gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${Math.max(visibleProviders.length, 1)}, minmax(${MIN_COL_WIDTH}px, 1fr))`,
                position: 'relative',
                height: containerHeight,
                minWidth: TIME_COL_WIDTH + Math.max(visibleProviders.length, 1) * MIN_COL_WIDTH,
              }}
            >
              {/* ── Provider header row ── */}
              {/* Empty top-left corner */}
              <Box sx={{
                height: HEADER_HEIGHT, borderBottom: 1, borderColor: 'divider',
                position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 2,
              }} />

              {visibleProviders.map((provider, colIdx) => (
                <Box
                  key={provider.id}
                  sx={{
                    height: HEADER_HEIGHT,
                    borderBottom: 1, borderLeft: 1, borderColor: 'divider',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 2,
                    px: 1,
                  }}
                  role="columnheader"
                  aria-label={`Provider: ${provider.email}`}
                >
                  {/* Provider colour dot */}
                  <Box sx={{
                    width: 10, height: 10, borderRadius: '50%', mb: 0.5,
                    bgcolor: getProviderColor(colIdx),
                  }} />
                  <Typography variant="caption" noWrap sx={{ maxWidth: '100%', textAlign: 'center', fontWeight: 600 }}>
                    {provider.email?.split('@')[0]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.6rem' }}>
                    {provider.roles}
                  </Typography>
                </Box>
              ))}

              {/* ── Time slot rows ── */}
              {Array.from({ length: TOTAL_SLOTS }, (_, slotIdx) => {
                const totalMins = HOUR_START * 60 + slotIdx * SLOT_MINUTES;
                const hour   = Math.floor(totalMins / 60);
                const minute = totalMins % 60;
                const showLabel = minute === 0;

                return (
                  <Fragment key={`row-${slotIdx}`}>
                    {/* Time gutter label */}
                    <Box sx={{
                      height: SLOT_HEIGHT,
                      display: 'flex', alignItems: 'flex-start',
                      pr: 1, pt: 0.25,
                      borderBottom: minute === 30 ? '1px dashed' : '1px solid',
                      borderColor: 'divider',
                    }}>
                      {showLabel && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1.2 }}>
                          {formatTime(hour, 0)}
                        </Typography>
                      )}
                    </Box>

                    {/* Provider cells */}
                    {visibleProviders.map(provider => {
                      const slotDateTime = new Date(currentDate);
                      slotDateTime.setHours(hour, minute, 0, 0);

                      const cellKey = `cell-${slotIdx}-${provider.id}`;
                      const slotKey = toSlotKey(provider.id, slotDateTime);
                      const lock = slotLocks?.get(slotKey);
                      const cellBox = (
                        <Box
                          sx={{
                            height: SLOT_HEIGHT,
                            borderBottom: minute === 30 ? '1px dashed' : '1px solid',
                            borderLeft: '1px solid',
                            borderColor: 'divider',
                            cursor: lock ? 'not-allowed' : 'pointer',
                            bgcolor: lock ? amber[50] : undefined,
                            display: 'flex',
                            alignItems: 'center',
                            pl: 0.5,
                            '&:hover': lock
                              ? { bgcolor: amber[100] }
                              : { bgcolor: 'primary.light', opacity: 0.35 },
                          }}
                          aria-label={lock ? `${formatTime(hour, minute)} — ${provider.email}, held by ${lock.heldByName}` : `${formatTime(hour, minute)} — ${provider.email}, available`}
                          onClick={() => { if (!lock) onEmptySlotClick?.(slotDateTime, provider.id); }}
                        >
                          {lock && <LockOutlinedIcon sx={{ fontSize: 12, color: amber[700], opacity: 0.8 }} />}
                        </Box>
                      );
                      return lock
                        ? <Tooltip key={cellKey} title={`Held by ${lock.heldByName}`} placement="right">{cellBox}</Tooltip>
                        : <Fragment key={cellKey}>{cellBox}</Fragment>;
                    })}
                  </Fragment>
                );
              })}

              {/* ── Appointment overlays — one per provider column ── */}
              {visibleProviders.map((provider, colIdx) => {
                const providerAppts = appointmentsByProvider.get(provider.id) ?? [];
                const providerColor = getProviderColor(colIdx);

                return (
                  <Fragment key={`appts-${provider.id}`}>
                    {providerAppts.map(appt => {
                      const { top, height } = getSlotStyle(appt.slotStart, appt.slotEnd);
                      const isSelected   = appt.entityId === selectedAppointmentId;
                      const displayName  = appt.patientName || appt.appointmentType;
                      const statusBorder = getStatusBorderColor(appt.status);

                      // Build tooltip text — include pronunciation and premed flag when present
                      const tooltipLines: string[] = [
                        `${displayName}${appt.namePronunciation ? ` (${appt.namePronunciation})` : ''} · ${appt.appointmentType} · ${appt.status}`,
                      ];
                      if (appt.premedRequired) tooltipLines.push('⚠ Premedication required');
                      if (appt.appointmentNote) tooltipLines.push(`Note: ${appt.appointmentNote}`);

                      return (
                        <Tooltip
                          key={appt.entityId}
                          title={tooltipLines.join('\n')}
                          placement="right"
                          slotProps={{ tooltip: { sx: { whiteSpace: 'pre-line' } } }}
                        >
                          <Box
                            onClick={() => onAppointmentClick?.(appt.entityId, appt.patientId)}
                            sx={{
                              position: 'absolute',
                              // Vertical position
                              top: HEADER_HEIGHT + top,
                              height: height - 2,
                              // Horizontal: fill the grid column
                              left: `calc(${TIME_COL_WIDTH}px + ${colIdx} * ((100% - ${TIME_COL_WIDTH}px) / ${Math.max(visibleProviders.length, 1)}) + 2px)`,
                              width: `calc((100% - ${TIME_COL_WIDTH}px) / ${Math.max(visibleProviders.length, 1)} - 4px)`,
                              bgcolor: isSelected ? `${providerColor}E0` : providerColor,
                              border: `2px solid ${isSelected ? '#000' : statusBorder || providerColor}`,
                              borderRadius: 0.5,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              zIndex: 1,
                              px: 0.75,
                              py: 0.25,
                              boxShadow: isSelected ? 3 : 1,
                              outline: isSelected ? `2px solid ${providerColor}` : 'none',
                              outlineOffset: 1,
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={`Patient: ${displayName}${appt.premedRequired ? ', premedication required' : ''}, ${new Date(appt.slotStart).toLocaleTimeString()} to ${new Date(appt.slotEnd).toLocaleTimeString()}, ${appt.appointmentType}, ${appt.status}`}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onAppointmentClick?.(appt.entityId, appt.patientId);
                              }
                            }}
                          >
                            {/* Row 1: patient name + premedication icon */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, overflow: 'hidden' }}>
                              {appt.premedRequired && (
                                <WarningAmberIcon
                                  sx={{ fontSize: '0.75rem', color: amber[300], flexShrink: 0 }}
                                  aria-label="Premedication required"
                                />
                              )}
                              <Typography variant="caption" sx={{
                                display: 'block', fontWeight: 600, color: 'white',
                                lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis', fontSize: '0.68rem',
                              }}>
                                {displayName}
                                {appt.namePronunciation && (
                                  <Box component="span" sx={{ fontWeight: 400, opacity: 0.85, ml: 0.5 }}>
                                    ({appt.namePronunciation})
                                  </Box>
                                )}
                              </Typography>
                            </Box>

                            {/* Row 2: appointment type */}
                            <Typography variant="caption" sx={{
                              display: 'block', color: 'rgba(255,255,255,0.85)',
                              fontSize: '0.63rem', overflow: 'hidden', whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                            }}>
                              {appt.appointmentType}
                            </Typography>

                            {/* Row 3: appointment note (only visible when card is tall enough) */}
                            {appt.appointmentNote && (
                              <Typography variant="caption" sx={{
                                display: 'block', color: 'rgba(255,255,255,0.75)',
                                fontSize: '0.6rem', overflow: 'hidden', whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis', fontStyle: 'italic',
                              }}>
                                {appt.appointmentNote}
                              </Typography>
                            )}
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Fragment>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {/* ── Reschedule confirmation dialog ── */}
      <Dialog open={!!rescheduleDialog} onClose={() => setRescheduleDialog(null)}>
        <DialogTitle>Confirm Reschedule</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {rescheduleDialog?.label}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRescheduleDialog(null)}>Cancel</Button>
          <Button onClick={handleConfirmReschedule} variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
