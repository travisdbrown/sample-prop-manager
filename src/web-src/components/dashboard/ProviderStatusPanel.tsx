import { Box, Card, CardContent, Typography, Chip, Stack, CircularProgress } from '@mui/material';

interface ProviderStatus {
  providerId: string;
  providerName: string;
  status: 'available' | 'busy' | 'break';
  currentPatient?: string;
  nextAppointment?: {
    time: string;
    patientName: string;
  };
  minutesRemaining?: number;
}

interface ProviderStatusPanelProps {
  providers: ProviderStatus[];
  loading?: boolean;
}

function getStatusColor(status: 'available' | 'busy' | 'break') {
  switch (status) {
    case 'available':
      return 'success';
    case 'busy':
      return 'info';
    case 'break':
      return 'warning';
    default:
      return 'default';
  }
}

function getStatusLabel(status: 'available' | 'busy' | 'break') {
  switch (status) {
    case 'available':
      return '🟢 Available';
    case 'busy':
      return '🔵 With patient';
    case 'break':
      return '🟡 On break';
    default:
      return 'Unknown';
  }
}

export default function ProviderStatusPanel({ providers, loading = false }: ProviderStatusPanelProps) {
  if (loading) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress size={40} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Provider Status
        </Typography>

        {providers.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No providers available.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {providers.map((provider) => (
              <Box
                key={provider.providerId}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  backgroundColor: provider.status === 'available' ? 'success.lighter' : 'action.hover',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {provider.providerName}
                  </Typography>
                  <Chip
                    label={getStatusLabel(provider.status)}
                    size="small"
                    color={getStatusColor(provider.status)}
                    variant="filled"
                  />
                </Box>

                {provider.currentPatient && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    Currently: {provider.currentPatient}
                    {provider.minutesRemaining && ` (${provider.minutesRemaining} min)`}
                  </Typography>
                )}

                {provider.nextAppointment && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Next: {provider.nextAppointment.time} — {provider.nextAppointment.patientName}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
