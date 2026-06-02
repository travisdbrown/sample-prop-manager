import { Box, Card, CardContent, Typography, Button, Chip, CircularProgress } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

interface SchedulingAiSuggestionCardProps {
  content: string;
  onApply: () => void;
  onDismiss: () => void;
  loading?: boolean;
}

export default function SchedulingAiSuggestionCard({
  content,
  onApply,
  onDismiss,
  loading = false,
}: SchedulingAiSuggestionCardProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
        <CircularProgress size={16} sx={{ color: '#1565C0' }} />
        <Typography variant="caption" color="text.secondary">
          AI is generating a scheduling suggestion…
        </Typography>
      </Box>
    );
  }

  return (
    <Card
      variant="outlined"
      role="region"
      aria-label="AI suggestion: scheduling"
      sx={{
        borderColor: '#1565C0',
        bgcolor: 'rgba(21, 101, 192, 0.04)',
        mb: 1,
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <SmartToyIcon sx={{ color: '#1565C0', fontSize: 16 }} />
          <Chip
            label="AI-assisted"
            size="small"
            sx={{ bgcolor: '#1565C0', color: '#fff', fontWeight: 600, fontSize: '0.65rem', height: 20 }}
          />
        </Box>

        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
          {content}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            onClick={onApply}
            sx={{ bgcolor: '#1565C0', '&:hover': { bgcolor: '#0d47a1' }, fontSize: '0.7rem' }}
          >
            Book This Slot
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={onDismiss}
            sx={{ color: 'text.secondary', fontSize: '0.7rem' }}
            aria-label="Dismiss AI scheduling suggestion"
          >
            Dismiss
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
