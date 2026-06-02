import { useState, useEffect } from 'react';
import {
  Box, Button, CircularProgress, Alert, TextField, Typography,
  Card, CardContent, Divider, Snackbar,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { getClinicalNotes, createHygieneNote } from '../../services/clinical/clinicalService';
import type { ClinicalNoteData } from './types';

interface HygieneNotesPanelProps {
  patientId: string;
}

export default function HygieneNotesPanel({ patientId }: HygieneNotesPanelProps) {
  const [notes, setNotes] = useState<ClinicalNoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [content, setContent] = useState('');
  const [visitDate, setVisitDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const fetchNotes = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const data = await getClinicalNotes(patientId);
      setNotes(data);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotes(); }, [patientId]);

  const openNewEditor = () => {
    setContent('');
    setVisitDate(new Date().toISOString().slice(0, 10));
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const created = await createHygieneNote(patientId, {
        content: content.trim(),
        visitDate: new Date(visitDate).toISOString(),
      });
      setNotes(prev => [created, ...prev]);
      setSaveSuccess(true);
      setEditorOpen(false);
      setContent('');
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" action={
          <Button size="small" onClick={fetchNotes}>Retry</Button>
        }>
          Unable to load notes.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {!editorOpen ? (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={openNewEditor}
          sx={{ mb: 2 }}
        >
          Add Hygiene Note
        </Button>
      ) : (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              New Hygiene Note
            </Typography>

            <TextField
              label="Visit Date"
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              size="small"
              sx={{ mb: 2 }}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />

            <TextField
              multiline
              minRows={4}
              fullWidth
              placeholder="Enter hygiene observations…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              sx={{ mb: 2 }}
              disabled={saving}
              aria-label="Hygiene note content"
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={!content.trim() || saving}
              >
                Save Note
              </Button>
              <Button
                variant="text"
                onClick={() => setEditorOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {notes.length === 0 ? (
        <Alert severity="info" sx={{ mt: 1 }}>
          No notes recorded yet.
          <Button size="small" onClick={openNewEditor} sx={{ ml: 1 }}>
            Add First Note
          </Button>
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {notes.map((note) => (
            <Card
              key={note.noteId}
              variant="outlined"
              sx={note.noteType === 'Hygiene'
                ? { borderColor: 'success.light', bgcolor: alpha('#4caf50', 0.05) }
                : undefined}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle2">
                      {note.noteType === 'Hygiene' ? 'Hygiene Note' : 'Treatment Note'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {note.createdByName} · {new Date(note.visitDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {note.content}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSaveSuccess(false)}>
          Hygiene note saved.
        </Alert>
      </Snackbar>

      <Snackbar
        open={saveError}
        autoHideDuration={5000}
        onClose={() => setSaveError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setSaveError(false)}>
          Failed to save note. Please try again.
        </Alert>
      </Snackbar>
    </Box>
  );
}
