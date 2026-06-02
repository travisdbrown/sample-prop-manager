import { useState, useEffect } from 'react';
import {
  Box, Typography, IconButton, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CloseIcon from '@mui/icons-material/Close';
import BookingForm, { type BookAppointmentFormData } from './BookingForm';
import RescheduleForm from './RescheduleForm';
import type { ProviderOption } from './types';

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

interface ScheduleDetailPanelProps {
  selectedAppointmentId: string | null;
  selectedPatientId: string | null;
  appointments: AppointmentResponse[];
  bookingSlot: { slotStart: Date; preselectedProviderId?: string } | null;
  providerOptions: ProviderOption[];
  providersLoading?: boolean;
  onBookingCancel: () => void;
  onBookingSubmit: (data: BookAppointmentFormData) => Promise<void>;
  onProviderChange?: (providerId: string) => void;
  onReschedule: (appointmentId: string, newSlotStart: Date, durationMinutes: number) => Promise<void>;
  onCancel: (appointmentId: string) => Promise<void>;
  onClose?: () => void;
}

export default function ScheduleDetailPanel({
  selectedAppointmentId,
  selectedPatientId,
  appointments,
  bookingSlot,
  providerOptions,
  providersLoading,
  onBookingCancel,
  onBookingSubmit,
  onProviderChange,
  onReschedule,
  onCancel,
  onClose,
}: ScheduleDetailPanelProps) {
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  useEffect(() => {
    setRescheduleMode(false);
    setCancelDialogOpen(false);
  }, [selectedAppointmentId]);

  const selectedAppt = appointments.find(a => a.entityId === selectedAppointmentId) ?? null;

  // Priority 1: booking form
  if (bookingSlot) {
    return (
      <BookingForm
        key={bookingSlot.slotStart.toISOString()}
        slotStart={bookingSlot.slotStart}
        preselectedPatientId={selectedPatientId}
        preselectedProviderId={bookingSlot.preselectedProviderId}
        providerOptions={providerOptions}
        providersLoading={providersLoading}
        onSubmit={onBookingSubmit}
        onCancel={onBookingCancel}
        onProviderChange={onProviderChange}
      />
    );
  }

  // Priority 2: reschedule form
  if (rescheduleMode && selectedAppt) {
    return (
      <RescheduleForm
        appointment={selectedAppt}
        onSubmit={async (newSlotStart, durationMinutes) => {
          await onReschedule(selectedAppt.entityId, newSlotStart, durationMinutes);
          setRescheduleMode(false);
        }}
        onCancel={() => setRescheduleMode(false)}
      />
    );
  }

  // Priority 3: empty state
  if (!selectedAppt && !selectedPatientId) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3, textAlign: 'center', gap: 1.5 }}>
        {onClose && (
          <IconButton onClick={onClose} sx={{ alignSelf: 'flex-end' }}>
            <CloseIcon />
          </IconButton>
        )}
        <CalendarTodayIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
        <Typography variant="body2" color="text.secondary">
          Select a patient from the list or click a slot on the calendar.
        </Typography>
      </Box>
    );
  }

  // Priority 4: appointment detail with Reschedule / Cancel actions
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {onClose && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 0.5 }}>
          <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
        </Box>
      )}
      <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
          {selectedAppt?.patientName || 'Appointment Detail'}
        </Typography>
        {selectedAppt && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Type</Typography>
              <Typography variant="body2">{selectedAppt.appointmentType}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Status</Typography>
              <Typography variant="body2">{selectedAppt.status}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Time</Typography>
              <Typography variant="body2">
                {new Date(selectedAppt.slotStart).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} –{' '}
                {new Date(selectedAppt.slotEnd).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Provider</Typography>
              <Typography variant="body2">
                {(() => {
                  const match = providerOptions.find(p => p.id === selectedAppt.providerId);
                  return match ? `${match.email} (${match.roles})` : selectedAppt.providerId;
                })()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => setRescheduleMode(true)}
              >
                Reschedule
              </Button>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                color="error"
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancel Appointment
              </Button>
            </Box>
          </Box>
        )}
      </Box>
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Appointment</DialogTitle>
        <DialogContent>
          <Typography>
            Cancel {selectedAppt?.patientName || 'this appointment'}'s{' '}
            {selectedAppt
              ? new Date(selectedAppt.slotStart).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                })
              : ''}{' '}
            appointment?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Keep</Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              setCancelDialogOpen(false);
              if (selectedAppt) await onCancel(selectedAppt.entityId);
            }}
          >
            Cancel Appointment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
