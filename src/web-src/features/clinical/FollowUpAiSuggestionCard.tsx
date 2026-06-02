import { Box, Card, CardContent, Typography, Button, Chip, CircularProgress } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

interface FollowUpAiSuggestionCardProps {
  content: string;
  proposedSlotStart: Date;
  onBook: () => void;
  onDismiss: () => void;
  loading?: boolean;
  booking?: boolean;  // true while POST /api/scheduling/appointments is in-flight
}

export default function FollowUpAiSuggestionCard({
  content,
  proposedSlotStart,
  onBook,
  onDismiss,
  loading = false,
  booking = false,
}: FollowUpAiSuggestionCardProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
        <CircularProgress size={16} sx={{ color: '#1565C0' }} />
        <Typography variant="caption" color="text.secondary">
          AI is generating a follow-up suggestion…
        </Typography>
      </Box>
    );
  }

  const formattedSlot = proposedSlotStart.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  }) + ' at ' + proposedSlotStart.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });

  return (
    <Card
      variant="outlined"
      role="region"
      aria-label="AI suggestion: follow-up scheduling"
      sx={{
        borderColor: '#1565C0',          // color-ai-assist (UX-DR8)
        bgcolor: 'rgba(21, 101, 192, 0.04)',
        mt: 2,
        mb: 1,
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* AI-assisted label — icon always paired with text (NFR-A3, FR24) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <SmartToyIcon sx={{ color: '#1565C0', fontSize: 16 }} />
          <Chip
            label="AI-assisted"
            size="small"
            sx={{ bgcolor: '#1565C0', color: '#fff', fontWeight: 600, fontSize: '0.65rem', height: 20 }}
          />
        </Box>

        {/* AI suggestion text */}
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.secondary' }}>
          {content}
        </Typography>

        {/* Formatted slot — shown separately for clarity */}
        <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600, color: 'text.primary' }}>
          Suggested: {formattedSlot}
        </Typography>

        {/* Action row — AI blue, never teal (FR24, UX-DR8) */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            onClick={onBook}
            disabled={booking}
            startIcon={booking ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ bgcolor: '#1565C0', '&:hover': { bgcolor: '#0d47a1' }, fontSize: '0.7rem', minHeight: 44 }}
          >
            Book Follow-up
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={onDismiss}
            disabled={booking}
            sx={{ color: 'text.secondary', fontSize: '0.7rem', minHeight: 44 }}
            aria-label="Dismiss follow-up suggestion"
          >
            Dismiss
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
