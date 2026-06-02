import { Fragment, useMemo } from 'react';
import {
  Box, Typography, IconButton, Button, Skeleton, Tooltip,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { amber } from '@mui/material/colors';

// Shared types — inlined per MVP guidance
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

type SlotLockState = 'soft' | 'hard';

interface WeekCalendarGridProps {
  appointments: AppointmentResponse[];
  weekStart: Date;
  loading: boolean;
  selectedAppointmentId: string | null;
  slotLocks: Map<string, { state: SlotLockState; heldByName: string }>;
  onSlotClick: (appointmentId: string | null, patientId: string | null, slotStart?: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

const HOUR_START = 7;
const HOUR_END = 19;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 32;
const HEADER_HEIGHT = 48;
const TIME_COL_WIDTH = 52;
const TOTAL_SLOTS = ((HOUR_END - HOUR_START) * 60) / SLOT_MINUTES; // 24 slots

const addDays = (d: Date, n: number): Date => {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
};

const toSlotKey = (providerId: string, d: Date): string =>
  `${providerId}~${d.toISOString().replace(/[-:T]/g, '').slice(0, 12)}`;

const toTimeKey = (d: Date): string =>
  d.toISOString().replace(/[-:T]/g, '').slice(0, 12);

const formatTime = (hour: number, minute: number): string =>
  `${hour % 12 || 12}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;

const formatDayHeader = (date: Date): { dayName: string; dateNum: string; isToday: boolean } => ({
  dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
  dateNum: date.getDate().toString(),
  isToday: date.toDateString() === new Date().toDateString(),
});

// Provider color palette — distinct colors for visual differentiation (AC 3)
const PROVIDER_COLORS = [
  '#1976D2', // Blue
  '#D32F2F', // Red
  '#388E3C', // Green
  '#F57C00', // Orange
  '#7B1FA2', // Purple
  '#0097A7', // Cyan
  '#C62828', // Dark Red
  '#5E35B1', // Deep Purple
];

const getProviderColor = (providerId: string, allProviderIds: string[]): string => {
  const index = allProviderIds.indexOf(providerId);
  return PROVIDER_COLORS[Math.max(0, index % PROVIDER_COLORS.length)];
};

const getSlotStyle = (slotStart: string, slotEnd: string) => {
  const start = new Date(slotStart);
  const end = new Date(slotEnd);
  const startMins = start.getHours() * 60 + start.getMinutes() - HOUR_START * 60;
  const durationMins = (end.getTime() - start.getTime()) / 60000;
  const top = (startMins / SLOT_MINUTES) * SLOT_HEIGHT;
  const height = Math.max((durationMins / SLOT_MINUTES) * SLOT_HEIGHT, SLOT_HEIGHT);
  const dayOfWeek = start.getDay();
  return { top, height, dayCol: dayOfWeek === 0 ? 7 : dayOfWeek };
};

export default function WeekCalendarGrid({
  appointments,
  weekStart,
  loading,
  selectedAppointmentId,
  slotLocks,
  onSlotClick,
  onPrevWeek,
  onNextWeek,
  onToday,
}: WeekCalendarGridProps) {
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  // Keyed by UTC time string (yyyyMMddHHmm) — used to tint empty cells when any provider holds that slot.
  // Collects ALL lock holders per time key so no provider's lock is silently dropped.
  const lockedByTime = useMemo(() => {
    const map = new Map<string, { heldByNames: string[] }>();
    slotLocks.forEach((lock, key) => {
      const tilde = key.indexOf('~');
      if (tilde === -1) return;
      const timeKey = key.slice(tilde + 1);
      const existing = map.get(timeKey);
      if (existing) {
        existing.heldByNames.push(lock.heldByName);
      } else {
        map.set(timeKey, { heldByNames: [lock.heldByName] });
      }
    });
    return map;
  }, [slotLocks]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<number, AppointmentResponse[]>();
    for (let i = 1; i <= 7; i++) map.set(i, []);
    for (const appt of appointments) {
      const d = new Date(appt.slotStart);
      const col = d.getDay() === 0 ? 7 : d.getDay();
      map.get(col)?.push(appt);
    }
    return map;
  }, [appointments]);

  // Get all unique provider IDs for consistent color mapping (AC 3)
  const allProviderIds = useMemo(() => {
    const ids = [...new Set(appointments.map(a => a.providerId))];
    return ids.sort();
  }, [appointments]);

  const containerHeight = HEADER_HEIGHT + TOTAL_SLOTS * SLOT_HEIGHT;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Week navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1, gap: 1, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <IconButton size="small" onClick={onPrevWeek} aria-label="Previous week">
          <ChevronLeftIcon />
        </IconButton>
        <Button size="small" variant="outlined" onClick={onToday} sx={{ minWidth: 60 }}>
          Today
        </Button>
        <IconButton size="small" onClick={onNextWeek} aria-label="Next week">
          <ChevronRightIcon />
        </IconButton>
        <Typography variant="subtitle2" sx={{ ml: 1 }}>
          {weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Typography>
      </Box>

      {/* Loading skeleton */}
      {loading && (
        <Box sx={{ p: 2, flex: 1 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={SLOT_HEIGHT} sx={{ mb: 0.5, borderRadius: 1 }} />
          ))}
        </Box>
      )}

      {/* Calendar grid — always rendered so empty weeks remain clickable */}
      {!loading && (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(7, 1fr)`,
              position: 'relative',
              height: containerHeight,
              minWidth: 600,
            }}
          >
            {/* Day header row */}
            <Box sx={{ height: HEADER_HEIGHT, borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 2 }} />
            {weekDays.map((day, i) => {
              const { dayName, dateNum, isToday } = formatDayHeader(day);
              return (
                <Box
                  key={i}
                  sx={{
                    height: HEADER_HEIGHT,
                    borderBottom: 1,
                    borderLeft: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'background.paper',
                    zIndex: 2,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">{dayName}</Typography>
                  <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: isToday ? 'primary.main' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" sx={{ color: isToday ? 'white' : 'text.primary', fontWeight: isToday ? 600 : 400 }}>
                      {dateNum}
                    </Typography>
                  </Box>
                </Box>
              );
            })}

            {/* Time slot rows */}
            {Array.from({ length: TOTAL_SLOTS }, (_, slotIdx) => {
              const totalMins = HOUR_START * 60 + slotIdx * SLOT_MINUTES;
              const hour = Math.floor(totalMins / 60);
              const minute = totalMins % 60;
              const showLabel = minute === 0;
              return (
                <Fragment key={`slot-row-${slotIdx}`}>
                  {/* Time label */}
                  <Box
                    sx={{
                      height: SLOT_HEIGHT,
                      display: 'flex',
                      alignItems: 'flex-start',
                      pr: 1,
                      pt: 0.25,
                      borderBottom: minute === 30 ? '1px dashed' : '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {showLabel && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1.2 }}>
                        {formatTime(hour, 0)}
                      </Typography>
                    )}
                  </Box>
                  {/* Day cells */}
                  {Array.from({ length: 7 }, (_, dayIdx) => {
                    const slotHour = HOUR_START + Math.floor((slotIdx * SLOT_MINUTES) / 60);
                    const slotMinute = (slotIdx * SLOT_MINUTES) % 60;
                    const slotDateTime = new Date(weekDays[dayIdx]);
                    slotDateTime.setHours(slotHour, slotMinute, 0, 0);
                    const cellKey = `cell-${slotIdx}-${dayIdx}`;
                    const timeLock = lockedByTime.get(toTimeKey(slotDateTime));
                    const cellBox = (
                      <Box
                        sx={{
                          height: SLOT_HEIGHT,
                          borderBottom: minute === 30 ? '1px dashed' : '1px solid',
                          borderLeft: '1px solid',
                          borderColor: 'divider',
                          position: 'relative',
                          cursor: timeLock ? 'not-allowed' : 'pointer',
                          bgcolor: timeLock ? amber[50] : undefined,
                          display: 'flex',
                          alignItems: 'center',
                          pl: 0.5,
                          '&:hover': timeLock
                            ? { bgcolor: amber[100] }
                            : { bgcolor: 'primary.light', opacity: 0.4 },
                        }}
                        aria-label={timeLock ? `Slot ${formatTime(hour, minute)}: held by ${timeLock.heldByNames.join(', ')}` : `Slot ${formatTime(hour, minute)}: available`}
                        onClick={() => { if (!timeLock) onSlotClick(null, null, slotDateTime); }}
                      >
                        {timeLock && <LockOutlinedIcon sx={{ fontSize: 12, color: amber[700], opacity: 0.8 }} />}
                      </Box>
                    );
                    return timeLock
                      ? <Tooltip key={cellKey} title={`Held by ${timeLock.heldByNames.join(', ')}`} placement="right">{cellBox}</Tooltip>
                      : <Fragment key={cellKey}>{cellBox}</Fragment>;
                  })}
                </Fragment>
              );
            })}

            {/* Appointment overlays with multi-lane layout (AC 3) */}
            {Array.from({ length: 7 }, (_, dayIdx) => {
              const col = dayIdx + 1;
              const dayAppts = appointmentsByDay.get(col) ?? [];

              // Group day appointments by time slot
              const apptsByTimeAtDay = new Map<string, AppointmentResponse[]>();
              dayAppts.forEach(appt => {
                const timeKey = toTimeKey(new Date(appt.slotStart));
                if (!apptsByTimeAtDay.has(timeKey)) apptsByTimeAtDay.set(timeKey, []);
                apptsByTimeAtDay.get(timeKey)?.push(appt);
              });

              return (
                <Fragment key={`day-${dayIdx}`}>
                  {/* Render appointment cells side-by-side with space for new appointments */}
                  {dayAppts.map((appt) => {
                    const { top, height } = getSlotStyle(appt.slotStart, appt.slotEnd);
                    const timeKey = toTimeKey(new Date(appt.slotStart));
                    const apptAtSlot = apptsByTimeAtDay.get(timeKey) ?? [];
                    const numAppts = apptAtSlot.length;

                    // Reserve space for new appointments: if there's 1 appointment, take 50%; if 2+, divide equally
                    const slotsForExisting = Math.max(1, numAppts);
                    const numLanes = Math.min(3, slotsForExisting + 1); // Max 3 lanes: existing apps + 1 for new

                    // Find this appointment's index among others at same time
                    const apptIndexAtTime = apptAtSlot.indexOf(appt);

                    const slotKey = toSlotKey(appt.providerId, new Date(appt.slotStart));
                    const lock = slotLocks.get(slotKey);
                    const isSelected = appt.entityId === selectedAppointmentId;
                    const displayName = appt.patientName || appt.appointmentType;

                    // Calculate width and position for side-by-side layout with gaps (AC 3)
                    const GAP = 2; // pixels between appointments
                    const dayWidth = `((100% - ${TIME_COL_WIDTH}px) / 7)`;
                    const laneWidthPercent = `${dayWidth} / ${numLanes}`;
                    const laneWidth = `calc(${laneWidthPercent} - ${GAP / numLanes}px)`;
                    const laneLeft = `calc(${TIME_COL_WIDTH}px + ${dayIdx} * ${dayWidth} + ${apptIndexAtTime} * (${laneWidthPercent} + ${GAP}px) + 1px)`;

                    // Get color for this provider (consistent across week)
                    const providerBgColor = getProviderColor(appt.providerId, allProviderIds);
                    const displayBgColor = lock?.state === 'hard'
                      ? '#FFCCBC'
                      : lock?.state === 'soft'
                      ? '#FFF3E0'
                      : isSelected
                      ? providerBgColor
                      : providerBgColor;
                    const displayBorderColor = lock?.state === 'hard'
                      ? '#E64A19'
                      : lock?.state === 'soft'
                      ? '#F57C00'
                      : 'transparent';
                    const textColor = lock || isSelected ? '#1A1A1A' : 'white';
                    const secondaryTextColor = lock || isSelected ? '#555' : 'rgba(255,255,255,0.85)';

                    return (
                      <Tooltip
                        key={appt.entityId}
                        title={lock ? `Held by ${lock.heldByName}` : `${displayName} (${appt.providerId}) — ${appt.appointmentType}`}
                        placement="right"
                      >
                        <Box
                          onClick={() => onSlotClick(appt.entityId, appt.patientId)}
                          sx={{
                            position: 'absolute',
                            top: HEADER_HEIGHT + top,
                            left: laneLeft,
                            width: laneWidth,
                            height: height - 2,
                            bgcolor: displayBgColor,
                            border: `1px solid ${displayBorderColor}`,
                            borderRadius: 0.5,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            zIndex: 1,
                            px: 0.5,
                            py: 0.25,
                            minWidth: '50px',
                          }}
                          aria-label={`Slot ${new Date(appt.slotStart).toLocaleTimeString()}: booked — ${displayName}`}
                        >
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: textColor, lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: '0.68rem' }}>
                            {displayName}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: secondaryTextColor, fontSize: '0.63rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            {appt.appointmentType}
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  })}

                  {/* Render clickable "New Appointment" spaces in each time slot */}
                  {Array.from(apptsByTimeAtDay.entries()).map(([timeKey, appts]) => {
                    const firstAppt = appts[0];
                    const { top, height } = getSlotStyle(firstAppt.slotStart, firstAppt.slotEnd);
                    const numAppts = appts.length;
                    const numLanes = Math.min(3, numAppts + 1);
                    const newApptIndex = numAppts; // New appointment goes in last lane

                    // Account for gaps in layout (AC 3)
                    const GAP = 2;
                    const dayWidth = `((100% - ${TIME_COL_WIDTH}px) / 7)`;
                    const laneWidthPercent = `${dayWidth} / ${numLanes}`;
                    const laneWidth = `calc(${laneWidthPercent} - ${GAP / numLanes}px)`;
                    const laneLeft = `calc(${TIME_COL_WIDTH}px + ${dayIdx} * ${dayWidth} + ${newApptIndex} * (${laneWidthPercent} + ${GAP}px) + 1px)`;

                    // Parse slot time for click handler
                    const slotDateTime = new Date(firstAppt.slotStart);
                    const overflowTimeLock = lockedByTime.get(timeKey);

                    return (
                      <Tooltip
                        key={`new-appt-${timeKey}`}
                        title={overflowTimeLock ? `Held by ${overflowTimeLock.heldByNames.join(', ')}` : 'Click to book for another provider'}
                        placement="right"
                      >
                        <Box
                          onClick={() => { if (!overflowTimeLock) onSlotClick(null, null, slotDateTime); }}
                          sx={{
                            position: 'absolute',
                            top: HEADER_HEIGHT + top,
                            left: laneLeft,
                            width: laneWidth,
                            height: height - 2,
                            bgcolor: overflowTimeLock ? amber[50] : 'transparent',
                            border: '1px dashed',
                            borderColor: overflowTimeLock ? amber[300] : 'divider',
                            borderRadius: 0.5,
                            cursor: overflowTimeLock ? 'not-allowed' : 'pointer',
                            zIndex: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '&:hover': overflowTimeLock
                              ? { bgcolor: amber[100] }
                              : { bgcolor: 'primary.light', opacity: 0.2, borderColor: 'primary.main' },
                            minWidth: '50px',
                          }}
                          aria-label={overflowTimeLock ? `Slot at ${slotDateTime.toLocaleTimeString()}: held by ${overflowTimeLock.heldByNames.join(', ')}` : `Available slot for new appointment at ${slotDateTime.toLocaleTimeString()}`}
                        >
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', textAlign: 'center' }}>
                            +
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Fragment>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}
