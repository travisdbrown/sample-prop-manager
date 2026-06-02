import { Box, Card, CardContent, Typography, Button, TextField, Chip, Divider, CircularProgress } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

interface AiSuggestionCardProps {
  rawDictation: string;
  structuredContent: string;
  onContentChange: (content: string) => void;
  onConfirm: () => void;
  onRedictate: () => void;
  onDismiss: () => void;
  confirming?: boolean;
}

export default function AiSuggestionCard({
  rawDictation,
  structuredContent,
  onContentChange,
  onConfirm,
  onRedictate,
  onDismiss,
  confirming = false,
}: AiSuggestionCardProps) {
  return (
    <Card
      variant="outlined"
      role="region"
      aria-label="AI suggestion: documentation"
      sx={{
        borderColor: '#1565C0',
        bgcolor: 'rgba(21, 101, 192, 0.04)',
        mb: 2,
      }}
    >
      <CardContent>
        {/* AI-assisted label — robot icon always paired with text (NFR-A3, FR24) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <SmartToyIcon sx={{ color: '#1565C0', fontSize: 20 }} />
          <Chip
            label="AI-assisted"
            size="small"
            sx={{ bgcolor: '#1565C0', color: '#fff', fontWeight: 600 }}
          />
        </Box>

        {/* Raw dictation — shown alongside for comparison (AC1) */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Your dictation:
        </Typography>
        <Typography
          variant="body2"
          sx={{ bgcolor: 'action.hover', p: 1, borderRadius: 1, mb: 2, fontStyle: 'italic' }}
        >
          {rawDictation}
        </Typography>

        <Divider sx={{ mb: 1 }} />

        {/* Structured note — editable inline (AC2b) */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          AI-structured note (edit if needed):
        </Typography>
        <TextField
          multiline
          minRows={3}
          fullWidth
          value={structuredContent}
          onChange={(e) => onContentChange(e.target.value)}
          disabled={confirming}
          aria-live="polite"
          aria-label="AI-structured note content"
          sx={{ mb: 2 }}
        />

        {/* Action row */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={onConfirm}
            disabled={!structuredContent.trim() || confirming}
            startIcon={confirming ? <CircularProgress size={16} /> : undefined}
            sx={{ bgcolor: '#1565C0', '&:hover': { bgcolor: '#0d47a1' } }}
          >
            Confirm
          </Button>
          <Button
            variant="outlined"
            onClick={onRedictate}
            disabled={confirming}
          >
            Re-dictate
          </Button>
          <Button
            variant="text"
            onClick={onDismiss}
            disabled={confirming}
          >
            Dismiss
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
