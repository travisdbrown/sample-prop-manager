import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Typography, Chip, Drawer, Snackbar, Alert, useMediaQuery, useTheme, Button,
} from '@mui/material';
import type * as signalR from '@microsoft/signalr';
import apiClient from '../../services/apiClient';
import { buildSchedulingHub } from '../../signalr/schedulingHub';
import WeekCalendarGrid from './WeekCalendarGrid';
import SchedulePatientList from './SchedulePatientList';
import ScheduleDetailPanel from './ScheduleDetailPanel';
import ScheduleDayView from './ScheduleDayView';
import type { BookAppointmentFormData } from './BookingForm';
import type { ProviderOption } from './types';

interface AppointmentResponse {
  entityId: string;
  patientId: string;
  patientName: string;   // returns "" from BE in Story 3.1 — use appointmentType as display fallback
  providerId: string;
  appointmentType: string;
  status: string;
  slotStart: string;
  slotEnd: string;
  premedRequired?: boolean;
  appointmentNote?: string | null;
  namePronunciation?: string | null;
}

interface SlotLockNotification {
  slotKey: string;
  providerId: string;
  slotStart: string;
  heldByUserName: string;
}

interface BookingSlot {
  slotStart: Date;
  preselectedProviderId?: string;
}

type SlotLockState = 'soft' | 'hard';

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateParam = (d: Date): string =>
  d.toLocaleDateString('en-CA');

const addDays = (d: Date, n: number): Date => {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
};

const toSlotKey = (providerId: string, d: Date): string =>
  `${providerId}~${d.toISOString().replace(/[-:T]/g, '').slice(0, 12)}`;

export default function SchedulingPage() {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [dayViewDate, setDayViewDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<'day' | 'week'>(() => {
    const saved = localStorage.getItem('schedulingViewPreference');
    return (saved === 'day' || saved === 'week' ? saved : 'week') as 'day' | 'week';
  });
  const [selection, setSelection] = useState<{ patientId: string | null; appointmentId: string | null }>({ patientId: null, appointmentId: null });
  const [activeProviderFilter, setActiveProviderFilter] = useState<string | null>(null);
  const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null);
  const [slotLocks, setSlotLocks] = useState<Map<string, { state: SlotLockState; heldByName: string }>>(new Map());
  const [detailOpen, setDetailOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error', autoHide: true });
  const [bookingSlot, setBookingSlot] = useState<BookingSlot | null>(null);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);

  const hubRef = useRef<signalR.HubConnection | null>(null);
  const activeReservationRef = useRef<{ providerId: string; slotStart: string } | null>(null);
  const weekStartRef = useRef(weekStart);
  const viewTypeRef = useRef(viewType);
  const dayViewDateRef = useRef(dayViewDate);
  // Written during every render so handleProviderChange (stable [] callback) always sees the
  // current bookingSlot value. Using a useEffect instead would leave the ref stale when
  // BookingForm's auto-select effect fires during mount (child effects precede parent effects).
  // This is an intentional escape-hatch pattern endorsed by the React docs.
  const bookingSlotRef = useRef(bookingSlot);
  // eslint-disable-next-line react-hooks/refs
  bookingSlotRef.current = bookingSlot;
  useEffect(() => { weekStartRef.current = weekStart; }, [weekStart]);
  useEffect(() => { viewTypeRef.current = viewType; }, [viewType]);
  useEffect(() => { dayViewDateRef.current = dayViewDate; }, [dayViewDate]);

  const loadAppointments = useCallback(async (date: Date, view: 'day' | 'week') => {
    setLoading(true);
    try {
      const url = view === 'day'
        ? `/api/scheduling/appointments?startDate=${formatDateParam(date)}&endDate=${formatDateParam(date)}`
        : `/api/scheduling/appointments?startDate=${formatDateParam(date)}&endDate=${formatDateParam(addDays(date, 6))}`;
      const res = await apiClient.get<AppointmentResponse[]>(url);
      setAppointments(res.data.filter(a => a.status.toLowerCase() !== 'cancelled'));
    } catch {
      setSnackbar({ open: true, message: 'Failed to load appointments.', severity: 'error', autoHide: false });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when week/day date or view changes
  useEffect(() => {
    const date = viewType === 'day' ? dayViewDate : weekStart;
    loadAppointments(date, viewType);
  }, [weekStart, dayViewDate, viewType, loadAppointments]);

  // Save view preference to localStorage
  useEffect(() => {
    localStorage.setItem('schedulingViewPreference', viewType);
  }, [viewType]);

  useEffect(() => {
    // F-5: track keys released by live events between hub.start() and REST seed response
    const releasedSinceConnect = new Set<string>();
    // F-7: prevent stale seed update if the component unmounts before the fetch resolves
    let seedCancelled = false;

    const hub = buildSchedulingHub(import.meta.env.VITE_API_BASE_URL ?? '');
    hubRef.current = hub;
    hub.on('slotReserved', (notification: SlotLockNotification) => {
      setSlotLocks(prev => new Map(prev).set(notification.slotKey, { state: 'soft', heldByName: notification.heldByUserName }));
    });
    hub.on('slotReleased', (notification: { slotKey: string }) => {
      releasedSinceConnect.add(notification.slotKey); // F-5: record before seed can re-add it
      setSlotLocks(prev => {
        const next = new Map(prev);
        next.delete(notification.slotKey);
        return next;
      });
    });
    hub.on('appointmentUpdated', () => {
      const view = viewTypeRef.current;
      const date = view === 'day' ? dayViewDateRef.current : weekStartRef.current;
      loadAppointments(date, view); // refs avoid stale closure
    });
    hub.on('appointmentRescheduled', () => {
      const view = viewTypeRef.current;
      const date = view === 'day' ? dayViewDateRef.current : weekStartRef.current;
      loadAppointments(date, view);
    });
    hub.on('appointmentCancelled', () => {
      const view = viewTypeRef.current;
      const date = view === 'day' ? dayViewDateRef.current : weekStartRef.current;
      loadAppointments(date, view);
    });
    hub.start()
      .then(() => {
        // Seed existing locks so User B sees slots already held before they connected
        apiClient.get<{ slotKey: string; heldByUserName: string }[]>('/api/scheduling/slot-locks')
          .then(res => {
            if (seedCancelled) return; // F-7: component unmounted during fetch
            if (res.data.length > 0) {
              setSlotLocks(prev => {
                const next = new Map(prev);
                res.data.forEach(lock => {
                  // F-5: skip any key a live slotReleased event already removed
                  if (!releasedSinceConnect.has(lock.slotKey))
                    next.set(lock.slotKey, { state: 'soft', heldByName: lock.heldByUserName });
                });
                return next;
              });
            }
          })
          .catch(() => {}); // non-critical — live events will still arrive
      })
      .catch((err) => {
        console.warn('SignalR scheduling hub connection failed:', err);
      });
    return () => {
      seedCancelled = true; // F-7
      // F-13: explicitly release any held reservation before the connection drops.
      // Belt-and-suspenders alongside SchedulingHub.OnDisconnectedAsync auto-release.
      const pending = activeReservationRef.current;
      if (pending) {
        hub.invoke('ReleaseSlot', pending.providerId, pending.slotStart).catch(() => {});
        activeReservationRef.current = null;
      }
      hubRef.current = null;
      hub.stop(); // called after invoke so the outbound message is queued first
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    apiClient.get<{ entityId: string; email: string; roles: string[] }[]>('/api/identity/providers')
      .then(res => setProviders(res.data.map(p => ({ id: p.entityId, email: p.email, roles: p.roles }))))
      .catch(() => setProviders([]))
      .finally(() => setProvidersLoading(false));
  }, []); // fetch once on mount — providers don't change during a booking session

  const filteredAppointments = useMemo(() => {
    let appts = appointments;
    if (activeProviderFilter) appts = appts.filter(a => a.providerId === activeProviderFilter);
    if (activeTypeFilter) appts = appts.filter(a => a.appointmentType === activeTypeFilter);
    return appts;
  }, [appointments, activeProviderFilter, activeTypeFilter]);

  // Provider IDs derived from loaded appointments — used only for filter-bar chips
  const filterProviderIds = useMemo(
    () => [...new Set(appointments.map(a => a.providerId))].sort(),
    [appointments],
  );

  const typeOptions = useMemo(
    () => [...new Set(appointments.map(a => a.appointmentType))].sort(),
    [appointments],
  );

  const handlePrevWeek = () => setWeekStart(w => addDays(w, -7));
  const handleNextWeek = () => setWeekStart(w => addDays(w, 7));
  const handleToday = () => setWeekStart(getWeekStart(new Date()));

  const handleEmptySlotClick = useCallback((slotStart: Date, providerId?: string) => {
    const previousReservation = activeReservationRef.current;

    // Release any previously held slot before claiming the new one
    if (previousReservation) {
      hubRef.current?.invoke('ReleaseSlot', previousReservation.providerId, previousReservation.slotStart).catch(() => {});
      activeReservationRef.current = null;
    }

    setBookingSlot({ slotStart, preselectedProviderId: providerId });
    setSelection(s => ({ ...s, appointmentId: null }));
    if (isTablet) setDetailOpen(true);

    // Only reserve immediately when the provider is known (day view always passes an explicit
    // providerId). In week view (providerId = undefined) the reservation is deferred to
    // handleProviderChange, which fires when the form auto-selects or the user picks a provider.
    if (providerId) {
      hubRef.current?.invoke('ReserveSlot', providerId, slotStart.toISOString()).catch(() => {});
      activeReservationRef.current = { providerId, slotStart: slotStart.toISOString() };
    }
  }, [isTablet]);

  const handleBookingCancel = useCallback(() => {
    if (activeReservationRef.current) {
      hubRef.current?.invoke('ReleaseSlot', activeReservationRef.current.providerId, activeReservationRef.current.slotStart).catch(() => {});
      activeReservationRef.current = null;
    }
    setBookingSlot(null);
  }, []);

  // F-12: reads bookingSlot from bookingSlotRef (written during render) so the callback is
  // stable ([] deps) and always sees the current slot value — even when BookingForm's
  // auto-select useEffect fires before this component's own useEffect has had a chance to
  // update a ref via the pattern used in F-9. F-9's wrapper is no longer needed.
  const handleProviderChange = useCallback((newProviderId: string) => {
    const slot = bookingSlotRef.current;
    if (!slot) return;
    const slotIso = slot.slotStart.toISOString();
    if (activeReservationRef.current) {
      hubRef.current?.invoke('ReleaseSlot', activeReservationRef.current.providerId, activeReservationRef.current.slotStart).catch(() => {});
    }
    hubRef.current?.invoke('ReserveSlot', newProviderId, slotIso).catch(() => {});
    activeReservationRef.current = { providerId: newProviderId, slotStart: slotIso };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReschedule = useCallback(async (
    appointmentId: string,
    newSlotStart: Date,
    durationMinutes: number,
  ) => {
    try {
      await apiClient.patch(`/api/scheduling/appointments/${appointmentId}`, {
        newSlotStart: newSlotStart.toISOString(),
        durationMinutes,
      });
      setSnackbar({ open: true, message: 'Appointment rescheduled.', severity: 'success', autoHide: true });
      await loadAppointments(
        viewTypeRef.current === 'day' ? dayViewDateRef.current : weekStartRef.current,
        viewTypeRef.current,
      );
    } catch (err: unknown) {
      const axiosErr = err as import('axios').AxiosError<{ title?: string }>;
      const is409 = axiosErr.response?.status === 409;
      setSnackbar({
        open: true,
        message: is409
          ? 'That slot was just taken. Please choose another time.'
          : 'Failed to reschedule appointment. Please try again.',
        severity: 'error',
        autoHide: false,
      });
    }
  }, [loadAppointments]);

  const handleCancel = useCallback(async (appointmentId: string) => {
    try {
      await apiClient.delete(`/api/scheduling/appointments/${appointmentId}`);
      setSnackbar({ open: true, message: 'Appointment cancelled.', severity: 'success', autoHide: true });
      setSelection({ patientId: null, appointmentId: null });
      await loadAppointments(
        viewTypeRef.current === 'day' ? dayViewDateRef.current : weekStartRef.current,
        viewTypeRef.current,
      );
    } catch {
      setSnackbar({
        open: true,
        message: 'Failed to cancel appointment. Please try again.',
        severity: 'error',
        autoHide: false,
      });
    }
  }, [loadAppointments]);

  // Adapter for ScheduleDayView reschedule (newStart, newEnd, providerId) -> handleReschedule (newSlotStart, durationMinutes)
  const handleDayViewReschedule = useCallback(async (
    appointmentId: string,
    newStart: Date,
    newEnd: Date,
  ) => {
    const durationMinutes = Math.round((newEnd.getTime() - newStart.getTime()) / (1000 * 60));
    return handleReschedule(appointmentId, newStart, durationMinutes);
  }, [handleReschedule]);

  const handleBookingSubmit = useCallback(async (formData: BookAppointmentFormData) => {
    if (!bookingSlot) return;
    const heldSlot = bookingSlot; // capture before any state mutations (F-6)

    const slotKey = toSlotKey(formData.providerId, heldSlot.slotStart);

    // Only block if a *different* user holds the slot. If activeReservationRef matches,
    // we are the holder — booking our own reservation is allowed.
    const isOurReservation =
      activeReservationRef.current?.providerId === formData.providerId &&
      activeReservationRef.current?.slotStart === bookingSlot.slotStart.toISOString();

    if (!isOurReservation) {
      const existing = slotLocks.get(slotKey);
      if (existing) {
        setSnackbar({
          open: true,
          message: `This provider's slot is no longer available (held by ${existing.heldByName}). Please select another time.`,
          severity: 'error',
          autoHide: false,
        });
        setBookingSlot(null);
        return;
      }
    }

    // Optimistic update — add temporary entry immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticAppt: AppointmentResponse = {
      entityId: tempId,
      patientId: formData.patientId,
      patientName: formData.patientName,
      providerId: formData.providerId,
      appointmentType: formData.appointmentType,
      status: 'Scheduled',
      slotStart: heldSlot.slotStart.toISOString(),
      slotEnd: new Date(heldSlot.slotStart.getTime() + formData.durationMinutes * 60000).toISOString(),
      premedRequired: formData.premedRequired,
      appointmentNote: formData.appointmentNote,
      namePronunciation: formData.namePronunciation,
    };
    setAppointments(prev => [...prev, optimisticAppt]);
    const heldReservation = activeReservationRef.current;
    activeReservationRef.current = null;
    setBookingSlot(null); // close form immediately before await

    try {
      await apiClient.post('/api/scheduling/appointments', {
        slotEntityId: null,
        patientId: formData.patientId,
        patientName: formData.patientName,
        providerId: formData.providerId,
        appointmentType: formData.appointmentType,
        durationMinutes: formData.durationMinutes,
        slotStart: heldSlot.slotStart.toISOString(),
        premedRequired: formData.premedRequired,
        appointmentNote: formData.appointmentNote,
        namePronunciation: formData.namePronunciation,
      });
      setSnackbar({ open: true, message: 'Appointment booked successfully.', severity: 'success', autoHide: true });
      // appointmentUpdated SignalR event will reload appointments — no manual reload needed
    } catch (err: unknown) {
      // Revert optimistic update on any failure
      setAppointments(prev => prev.filter(a => a.entityId !== tempId));
      if (heldReservation) {
        hubRef.current?.invoke('ReleaseSlot', heldReservation.providerId, heldReservation.slotStart).catch(() => {});
      }
      const axiosErr = err as import('axios').AxiosError<{ title?: string }>;
      const is409 = axiosErr.response?.status === 409;
      setSnackbar({
        open: true,
        message: is409
          ? 'This provider is no longer available at this time. Please select another slot.'
          : 'Failed to book appointment. Please try again.',
        severity: 'error',
        autoHide: false,
      });
    }
  }, [bookingSlot, slotLocks]);

  const handleSlotClick = (appointmentId: string | null, patientId: string | null, slotStart?: Date) => {
    if (appointmentId === null && slotStart) {
      handleEmptySlotClick(slotStart);
      return;
    }
    // Existing appointment click — release any held slot before clearing the booking form
    if (activeReservationRef.current) {
      hubRef.current?.invoke('ReleaseSlot', activeReservationRef.current.providerId, activeReservationRef.current.slotStart).catch(() => {});
      activeReservationRef.current = null;
    }
    setBookingSlot(null);
    setSelection({ patientId, appointmentId });
    if (isTablet) setDetailOpen(true);
  };

  const snackbarEl = (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={snackbar.autoHide ? 3000 : null}
      onClose={() => setSnackbar(s => ({ ...s, open: false }))}
    >
      <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        {snackbar.message}
      </Alert>
    </Snackbar>
  );

  const filterBar = (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, px: 1, py: 0.75, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', alignItems: 'center' }}>
      {/* View Toggle */}
      <Box sx={{ display: 'flex', gap: 0.25, mr: 1, borderRight: 1, borderColor: 'divider', pr: 1 }}>
        <Button
          size="small"
          variant={viewType === 'day' ? 'contained' : 'outlined'}
          onClick={() => setViewType('day')}
          sx={{ minWidth: 50 }}
        >
          Day
        </Button>
        <Button
          size="small"
          variant={viewType === 'week' ? 'contained' : 'outlined'}
          onClick={() => setViewType('week')}
          sx={{ minWidth: 50 }}
        >
          Week
        </Button>
      </Box>

      {/* Filter chips for appointments */}
      {filterProviderIds.length > 0 && (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>Filter by Provider:</Typography>
          {filterProviderIds.map(p => {
            const match = providers.find(pr => pr.id === p);
            const label = match ? `${match.email} (${match.roles.join(', ')})` : p;
            return (
              <Chip
                key={p}
                label={label}
                size="small"
                color={activeProviderFilter === p ? 'primary' : 'default'}
                variant={activeProviderFilter === p ? 'filled' : 'outlined'}
                onClick={() => setActiveProviderFilter(prev => prev === p ? null : p)}
                sx={{ minHeight: 28 }}
              />
            );
          })}
        </>
      )}
      {typeOptions.length > 0 && (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ ml: filterProviderIds.length > 0 ? 1 : 0, mr: 0.5 }}>Type:</Typography>
          {typeOptions.map(t => (
            <Chip
              key={t}
              label={t}
              size="small"
              color={activeTypeFilter === t ? 'primary' : 'default'}
              variant={activeTypeFilter === t ? 'filled' : 'outlined'}
              onClick={() => setActiveTypeFilter(prev => prev === t ? null : t)}
              sx={{ minHeight: 28 }}
            />
          ))}
        </>
      )}
    </Box>
  );

  // Desktop: 3-panel split workspace (AC: 2)
  if (!isTablet) {
    return (
      <Box sx={{ display: 'flex', height: 'calc(100vh - 128px)', overflow: 'hidden', mx: -3, mt: -3 }}>
        {/* Left panel: patient list 22% */}
        <Box sx={{ width: '22%', minWidth: 200, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <SchedulePatientList
            appointments={appointments}
            selectedPatientId={selection.patientId}
            onPatientSelect={(patientId, appointmentId) => handleSlotClick(appointmentId, patientId)}
            onBookAppointment={() =>
              setSnackbar({ open: true, message: 'Click an available slot on the calendar to book.', severity: 'success', autoHide: true })
            }
          />
        </Box>
        {/* Center panel: calendar */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {filterBar}
          {viewType === 'day' ? (
            <ScheduleDayView
              appointments={filteredAppointments}
              providers={providers}
              isLoading={loading}
              currentDate={dayViewDate}
              slotLocks={slotLocks}
              onDateChange={setDayViewDate}
              onAppointmentClick={(aptId, patId) => handleSlotClick(aptId, patId)}
              onEmptySlotClick={handleEmptySlotClick}
              onReschedule={handleDayViewReschedule}
              selectedAppointmentId={selection.appointmentId}
            />
          ) : (
            <WeekCalendarGrid
              appointments={filteredAppointments}
              weekStart={weekStart}
              loading={loading}
              selectedAppointmentId={selection.appointmentId}
              slotLocks={slotLocks}
              onSlotClick={handleSlotClick}
              onPrevWeek={handlePrevWeek}
              onNextWeek={handleNextWeek}
              onToday={handleToday}
            />
          )}
        </Box>
        {/* Right panel: detail 24% */}
        <Box sx={{ width: '24%', minWidth: 220, borderLeft: 1, borderColor: 'divider', overflow: 'hidden' }}>
          <ScheduleDetailPanel
            selectedAppointmentId={selection.appointmentId}
            selectedPatientId={selection.patientId}
            appointments={appointments}
            bookingSlot={bookingSlot}
            providerOptions={providers}
            providersLoading={providersLoading}
            onBookingCancel={handleBookingCancel}
            onBookingSubmit={handleBookingSubmit}
            onProviderChange={handleProviderChange}
            onReschedule={handleReschedule}
            onCancel={handleCancel}
          />
        </Box>
        {snackbarEl}
      </Box>
    );
  }

  // Tablet: 2-column + Drawer for detail (AC: 3)
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 112px)', overflow: 'hidden', mx: -2, mt: -2 }}>
      {filterBar}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel: patient list */}
        <Box sx={{ width: '35%', borderRight: 1, borderColor: 'divider', overflow: 'hidden' }}>
          <SchedulePatientList
            appointments={appointments}
            selectedPatientId={selection.patientId}
            onPatientSelect={(patientId, appointmentId) => handleSlotClick(appointmentId, patientId)}
            onBookAppointment={() =>
              setSnackbar({ open: true, message: 'Click an available slot on the calendar to book.', severity: 'success', autoHide: true })
            }
          />
        </Box>
        {/* Center: calendar */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {viewType === 'day' ? (
            <ScheduleDayView
              appointments={filteredAppointments}
              providers={providers}
              isLoading={loading}
              currentDate={dayViewDate}
              slotLocks={slotLocks}
              onDateChange={setDayViewDate}
              onAppointmentClick={(aptId, patId) => handleSlotClick(aptId, patId)}
              onEmptySlotClick={handleEmptySlotClick}
              onReschedule={handleDayViewReschedule}
              selectedAppointmentId={selection.appointmentId}
            />
          ) : (
            <WeekCalendarGrid
              appointments={filteredAppointments}
              weekStart={weekStart}
              loading={loading}
              selectedAppointmentId={selection.appointmentId}
              slotLocks={slotLocks}
              onSlotClick={handleSlotClick}
              onPrevWeek={handlePrevWeek}
              onNextWeek={handleNextWeek}
              onToday={handleToday}
            />
          )}
        </Box>
      </Box>
      {/* Detail drawer (tablet) */}
      <Drawer
        anchor="right"
        open={detailOpen}
        onClose={() => { setDetailOpen(false); if (bookingSlot) handleBookingCancel(); }}
        sx={{ '& .MuiDrawer-paper': { width: '85%', maxWidth: 400 } }}
      >
        <ScheduleDetailPanel
          selectedAppointmentId={selection.appointmentId}
          selectedPatientId={selection.patientId}
          appointments={appointments}
          bookingSlot={bookingSlot}
          providerOptions={providers}
          providersLoading={providersLoading}
          onBookingCancel={handleBookingCancel}
          onBookingSubmit={handleBookingSubmit}
          onProviderChange={handleProviderChange}
          onReschedule={handleReschedule}
          onCancel={handleCancel}
          onClose={() => setDetailOpen(false)}
        />
      </Drawer>
      {snackbarEl}
    </Box>
  );
}
