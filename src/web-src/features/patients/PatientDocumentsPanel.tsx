import {
  Box, Typography, Button, CircularProgress, Snackbar, Alert, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

interface PatientDocumentsPanelProps {
  patientId: string;
}

interface DocumentSummary {
  entityId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string; // ISO 8601
}

function formatFileSize(bytes: number): string {
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export default function PatientDocumentsPanel({ patientId }: PatientDocumentsPanelProps) {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DocumentSummary | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false, message: '', severity: 'success' as 'success' | 'error', autoHide: true,
  });

  const closeSnackbar = () => setSnackbar(s => ({ ...s, open: false }));
  const showSuccess = (msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'success', autoHide: true });
  const showError = (msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'error', autoHide: false });

  useEffect(() => {
    apiClient.get<DocumentSummary[]>(`/api/patients/${patientId}/documents`)
      .then(res => setDocuments(res.data))
      .catch(() => showError('Failed to load documents.'))
      .finally(() => setLoading(false));
  }, [patientId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    if (file.size > 10_485_760) {
      showError('File exceeds the 10 MB limit.');
      e.target.value = '';
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await apiClient.post<DocumentSummary>(
        `/api/patients/${patientId}/documents`,
        fd,
      );
      setDocuments(prev => [...prev, res.data]);
      showSuccess('Document uploaded.');
    } catch {
      showError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async (doc: DocumentSummary) => {
    if (downloading === doc.entityId) return;
    setDownloading(doc.entityId);
    try {
      const res = await apiClient.get(
        `/api/patients/${patientId}/documents/${doc.entityId}`,
        { responseType: 'blob' },
      );
      const cd = res.headers['content-disposition'] as string | undefined;
      const match = cd?.match(/filename="?([^"]+)"?/);
      const fileName = match?.[1] ?? doc.fileName;
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      showError('Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    setDeleting(confirmDelete.entityId);
    try {
      await apiClient.delete(`/api/patients/${patientId}/documents/${confirmDelete.entityId}`);
      setDocuments(prev => prev.filter(d => d.entityId !== confirmDelete.entityId));
      showSuccess('Document deleted.');
    } catch {
      showError('Delete failed. Please try again.');
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {documents.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <DescriptionIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
            No documents uploaded yet.
          </Typography>
          <Button component="label" variant="contained" startIcon={<CloudUploadIcon />} disabled={uploading}>
            Upload Document
            <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleUpload} />
          </Button>
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
              <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleUpload} />
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>File Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Uploaded</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map(doc => (
                  <TableRow key={doc.entityId}>
                    <TableCell>{doc.fileName}</TableCell>
                    <TableCell>{doc.contentType}</TableCell>
                    <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                    <TableCell>{new Date(doc.uploadedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Tooltip title="Download">
                        <span>
                          <IconButton
                            onClick={() => handleDownload(doc)}
                            disabled={downloading === doc.entityId}
                            size="small"
                            aria-label="Download document"
                          >
                            {downloading === doc.entityId ? <CircularProgress size={18} /> : <DownloadIcon />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <span>
                          <IconButton
                            color="error"
                            onClick={() => setConfirmDelete(doc)}
                            disabled={!!deleting}
                            size="small"
                            aria-label="Delete document"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        maxWidth="xs"
        aria-labelledby="delete-document-dialog-title"
      >
        <DialogTitle id="delete-document-dialog-title">Delete Document</DialogTitle>
        <DialogContent>
          <Typography>Delete "{confirmDelete?.fileName}"? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)} disabled={!!deleting}>Cancel</Button>
          <Button variant="outlined" color="error" onClick={handleDeleteConfirmed} disabled={!!deleting}>
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHide ? 3000 : null}
        onClose={closeSnackbar}
      >
        <Alert severity={snackbar.severity} onClose={closeSnackbar}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
