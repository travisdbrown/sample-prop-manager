import {
  Box, Typography, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, TextField, InputAdornment,
  Snackbar, Alert,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';

interface PatientSummary {
  entityId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string | null;
}

export default function ClinicalLandingPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorOpen, setErrorOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPatients = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const res = await apiClient.get<PatientSummary[]>(
        `/api/patients?searchTerm=${encodeURIComponent(term)}&pageSize=100&pageIndex=0`,
      );
      setPatients(res.data);
    } catch {
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPatients(''); }, [loadPatients]);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const emptyState = (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" color="text.secondary">
        {searchTerm ? `No patients found for "${searchTerm}"` : 'No patients registered yet.'}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Clinical</Typography>
        <Typography variant="body2" color="text.secondary">Select a patient to open their dental chart.</Typography>
      </Box>

      <TextField
        size="small"
        placeholder="Search patients…"
        value={searchTerm}
        onChange={e => {
          const term = e.target.value;
          setSearchTerm(term);
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => loadPatients(term), 300);
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 2, width: 320 }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : patients.length === 0 ? emptyState : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Date of Birth</TableCell>
                <TableCell>Phone</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patients.map(p => (
                <TableRow
                  key={p.entityId}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/patients/${p.entityId}/chart`)}
                >
                  <TableCell>{p.firstName} {p.lastName}</TableCell>
                  <TableCell>{p.dateOfBirth}</TableCell>
                  <TableCell>{p.phone ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={errorOpen}
        autoHideDuration={null}
        onClose={() => setErrorOpen(false)}
      >
        <Alert severity="error" onClose={() => setErrorOpen(false)}>
          Failed to load patients. Please try again.
        </Alert>
      </Snackbar>
    </Box>
  );
}
