import { Card, Box, Typography, Button, Stack } from '@mui/material';

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

interface AppointmentCardProps {
  appointment: AppointmentResponse;
  providerMap: Record<string, string>;
  onCheckIn?: (appointmentId: string) => void;
  onReschedule?: (appointmentId: string) => void;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function AppointmentCard({
  appointment, providerMap, onCheckIn, onReschedule,
}: AppointmentCardProps) {
  const providerName = providerMap[appointment.providerId] ?? appointment.providerId;
  const bgColor = appointment.status === 'Confirmed' ? 'primary.lighter' : 'success.lighter';

  return (
    <Card
      variant="outlined"
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        backgroundColor: bgColor,
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {appointment.patientName || `Patient #${appointment.patientId.slice(-4)}`}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {formatTime(appointment.slotStart)} — {providerName}
        </Typography>
      </Box>

      {(onCheckIn || onReschedule) && (
        <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
          {appointment.status === 'Confirmed' && onCheckIn && (
            <Button
              size="small"
              variant="contained"
              color="warning"
              onClick={() => onCheckIn(appointment.entityId)}
            >
              Check In
            </Button>
          )}
          {appointment.status === 'Confirmed' && onReschedule && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => onReschedule(appointment.entityId)}
            >
              Reschedule
            </Button>
          )}
        </Stack>
      )}
    </Card>
  );
}
