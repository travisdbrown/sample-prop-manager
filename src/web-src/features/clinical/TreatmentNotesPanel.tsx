import { useState, useEffect } from 'react';
import {
  Box, Button, CircularProgress, Alert, TextField, Typography,
  Card, CardContent, Divider, Snackbar, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types/auth';
import {
  getClinicalNotes,
  createClinicalNote,
  updateClinicalNote,
} from '../../services/clinical/clinicalService';
import { structureClinicalNote, generateFollowUpSuggestion } from '../../services/ai/aiService';
import type { AiFollowUpSuggestionResult } from '../../services/ai/aiService';
import DictationControl from './DictationControl';
import AiSuggestionCard from './AiSuggestionCard';
import FollowUpAiSuggestionCard from './FollowUpAiSuggestionCard';
import FollowUpBookingDialog from './FollowUpBookingDialog';
import apiClient from '../../services/apiClient';
import type { ClinicalNoteData } from './types';

interface TreatmentNotesPanelProps {
  patientId: string;
  patientName?: string;   // passed from ClinicalPage for follow-up booking
}

export default function TreatmentNotesPanel({ patientId, patientName }: TreatmentNotesPanelProps) {
  const { user } = useAuth();
  const isDentist = user?.roles.includes(Role.Dentist) ?? false;

  const [notes, setNotes] = useState<ClinicalNoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [visitDate, setVisitDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // AI structuring flow state
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiRawDictation, setAiRawDictation] = useState<string | null>(null);
  const [aiStructuredContent, setAiStructuredContent] = useState<string | null>(null);
  const [aiToken, setAiToken] = useState<string | null>(null);

  // Follow-up appointment suggestion state (shown after note save)
  const [followUpSuggestion, setFollowUpSuggestion] = useState<AiFollowUpSuggestionResult | null>(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpDismissed, setFollowUpDismissed] = useState(false);
  const [bookingFollowUp, setBookingFollowUp] = useState(false);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [conflictSlotStart, setConflictSlotStart] = useState<Date | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState(false);
  const [conflictSnackbarOpen, setConflictSnackbarOpen] = useState(false);

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
    setEditingNoteId(null);
    setContent('');
    setVisitDate(new Date().toISOString().slice(0, 10));
    setAiRawDictation(null);
    setAiStructuredContent(null);
    setAiToken(null);
    setEditorOpen(true);
  };

  const openEditEditor = (note: ClinicalNoteData) => {
    setEditingNoteId(note.noteId);
    setContent(note.content);
    setVisitDate(note.visitDate.slice(0, 10));
    setAiRawDictation(null);
    setAiStructuredContent(null);
    setAiToken(null);
    setEditorOpen(true);
  };

  const handleDictationTranscript = async (rawText: string) => {
    if (!rawText.trim()) return;

    // Always append to content in case AI is unavailable (AC5 graceful degradation)
    setContent(prev => prev ? `${prev} ${rawText}` : rawText);

    setAiProcessing(true);
    setAiRawDictation(rawText);
    try {
      const suggestion = await structureClinicalNote(
        rawText,
        patientId,
      );
      setAiStructuredContent(suggestion.content);
      setContent(suggestion.content);
      setAiToken(suggestion.aiToken ?? null);
    } catch {
      // AC5: graceful degradation — raw transcript already in content, no AI card shown
      setAiRawDictation(null);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      if (editingNoteId) {
        const updated = await updateClinicalNote(editingNoteId, content.trim());
        setNotes(prev => prev.map(n =>
          n.noteId === editingNoteId
            ? { ...n, content: updated.content, updatedAt: updated.updatedAt }
            : n,
        ));
      } else {
        const created = await createClinicalNote(patientId, {
          content: content.trim(),
          visitDate: new Date(visitDate).toISOString(),
          aiToken: aiToken ?? undefined,
        });
        setNotes(prev => [created, ...prev]);

        // Trigger follow-up AI suggestion after new note save (not on edits) — AC1, AC5
        setSaveSuccess(true);
        setEditorOpen(false);
        setContent('');
        setAiToken(null);
        setAiRawDictation(null);
        setAiStructuredContent(null);

        if (!navigator.onLine) {
          // AC5: suppress when offline
          return;
        }
        setFollowUpDismissed(false);
        setFollowUpSuggestion(null);
        setFollowUpLoading(true);
        generateFollowUpSuggestion(patientId)
          .then(suggestion => setFollowUpSuggestion(suggestion))
          .catch(() => setFollowUpSuggestion(null))  // graceful degradation — no card shown
          .finally(() => setFollowUpLoading(false));
      }
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleBookFollowUp = async () => {
    if (!followUpSuggestion) return;
    setBookingFollowUp(true);
    try {
      await apiClient.post('/api/scheduling/appointments', {
        slotEntityId: null,
        patientId,
        patientName: patientName ?? 'Unknown',
        providerId: user?.userId ?? '',
        appointmentType: 'Consultation',
        durationMinutes: followUpSuggestion.durationMinutes,
        slotStart: followUpSuggestion.proposedSlotStart,
      });
      setFollowUpSuggestion(null);
      setBookingSuccess(true);
    } catch (err: unknown) {
      const axiosErr = err as import('axios').AxiosError;
      if (axiosErr.response?.status === 409) {
        // AC4: slot conflict — open FollowUpBookingDialog with next slot
        const nextSlot = new Date(followUpSuggestion.proposedSlotStart);
        nextSlot.setHours(nextSlot.getHours() + 1);
        setConflictSlotStart(nextSlot);
        setFollowUpDialogOpen(true);
        setConflictSnackbarOpen(true);
      } else {
        setBookingError(true);
      }
    } finally {
      setBookingFollowUp(false);
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
          Unable to load treatment notes.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Dentist editor */}
      {isDentist && (
        <>
          {!editorOpen ? (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={openNewEditor}
              sx={{ mb: 2, minHeight: 44 }}
            >
              Add Note
            </Button>
          ) : (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  {editingNoteId ? 'Edit Note' : 'New Treatment Note'}
                </Typography>

                {!editingNoteId && (
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
                )}

                <DictationControl
                  onTranscript={handleDictationTranscript}
                  disabled={saving || aiProcessing}
                />

                {/* AI processing indicator */}
                {aiProcessing && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="caption" color="text.secondary">
                      AI is structuring your note…
                    </Typography>
                  </Box>
                )}

                {/* AI suggestion card — shown after successful AI structuring */}
                {!aiProcessing && aiRawDictation && aiStructuredContent && (
                  <AiSuggestionCard
                    rawDictation={aiRawDictation}
                    structuredContent={aiStructuredContent}
                    onContentChange={(val) => {
                      setAiStructuredContent(val);
                      setContent(val);
                    }}
                    onConfirm={() => {
                      setAiRawDictation(null);
                      setAiStructuredContent(null);
                    }}
                    onRedictate={() => {
                      setAiRawDictation(null);
                      setAiStructuredContent(null);
                      setContent('');
                      setAiToken(null);
                    }}
                    onDismiss={() => {
                      setAiRawDictation(null);
                      setAiStructuredContent(null);
                      setContent('');
                      setAiToken(null);
                    }}
                    confirming={saving}
                  />
                )}

                <TextField
                  multiline
                  minRows={4}
                  fullWidth
                  placeholder="Dictate or type treatment notes here…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  sx={{ mt: 1, mb: 2 }}
                  disabled={saving}
                  aria-label="Note content"
                />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    sx={{ minHeight: 44 }}
                    startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={!content.trim() || saving}
                  >
                    Save Note
                  </Button>
                  <Button
                    variant="text"
                    sx={{ minHeight: 44 }}
                    onClick={() => {
                      setAiToken(null);
                      setAiRawDictation(null);
                      setAiStructuredContent(null);
                      setEditorOpen(false);
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Follow-up AI suggestion card — shown after new note save (AC1) */}
      {(followUpLoading || followUpSuggestion) && !followUpDismissed && (
        <FollowUpAiSuggestionCard
          content={followUpSuggestion?.content ?? ''}
          proposedSlotStart={followUpSuggestion
            ? new Date(followUpSuggestion.proposedSlotStart)
            : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)}
          loading={followUpLoading}
          booking={bookingFollowUp}
          onBook={handleBookFollowUp}
          onDismiss={() => {
            setFollowUpSuggestion(null);
            setFollowUpDismissed(true);
          }}
        />
      )}

      {/* Notes list */}
      {notes.length === 0 ? (
        <Alert severity="info" sx={{ mt: 1 }}>
          No treatment notes recorded yet.
          {isDentist && (
            <Button size="small" onClick={openNewEditor} sx={{ ml: 1 }}>
              Add First Note
            </Button>
          )}
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {notes.map((note) => (
            <Card key={note.noteId} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2">
                        {note.noteType === 'Treatment' ? 'Treatment Note' : 'Hygiene Note'}
                      </Typography>
                      {note.aiAssisted && (
                        <Chip
                          icon={<SmartToyIcon />}
                          label="AI-assisted"
                          size="small"
                          sx={{ bgcolor: '#1565C0', color: '#fff', fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {note.createdByName} · {new Date(note.visitDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  {isDentist && note.noteType === 'Treatment' && (
                    <Button size="small" onClick={() => openEditEditor(note)}>
                      Edit
                    </Button>
                  )}
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

      {/* Success snackbar — 3s auto-dismiss, teal (success color) */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSaveSuccess(false)}>
          Note saved successfully.
        </Alert>
      </Snackbar>

      {/* Error snackbar */}
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

      {/* Follow-up booking dialog — opens on 409 conflict (AC4) */}
      {conflictSlotStart && (
        <FollowUpBookingDialog
          open={followUpDialogOpen}
          onClose={() => { setFollowUpDialogOpen(false); setFollowUpSuggestion(null); }}
          onBooked={() => {
            setBookingSuccess(true);
            setFollowUpSuggestion(null);
          }}
          patientId={patientId}
          patientName={patientName ?? 'Unknown'}
          initialSlotStart={conflictSlotStart}
        />
      )}

      {/* Booking success snackbar */}
      <Snackbar open={bookingSuccess} autoHideDuration={3000} onClose={() => setBookingSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setBookingSuccess(false)}>
          Follow-up appointment booked successfully.
        </Alert>
      </Snackbar>

      {/* Conflict snackbar — AC4 */}
      <Snackbar open={conflictSnackbarOpen} autoHideDuration={5000} onClose={() => setConflictSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="warning" onClose={() => setConflictSnackbarOpen(false)}>
          Original slot was taken — next available shown.
        </Alert>
      </Snackbar>

      {/* Booking error snackbar */}
      <Snackbar open={bookingError} autoHideDuration={5000} onClose={() => setBookingError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setBookingError(false)}>
          Failed to book follow-up. Please try again.
        </Alert>
      </Snackbar>
    </Box>
  );
}
