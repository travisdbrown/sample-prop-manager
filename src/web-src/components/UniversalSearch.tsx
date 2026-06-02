import {
  Dialog, Box, TextField, InputAdornment, CircularProgress,
  List, ListItemButton, ListItemText, Typography, Button, Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useState, useEffect, useRef } from 'react';
import apiClient from '../services/apiClient';
import { useTabContext } from '../contexts/TabContext';

interface UniversalSearchProps {
  open: boolean;
  onClose: () => void;
}

interface PatientAlertSummary {
  entityId: string;
  alertType: string;
  title: string;
}

interface PatientSearchResult {
  entityId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO "YYYY-MM-DD"
  email: string | null;
  phone: string | null;
  activeAlerts: PatientAlertSummary[];
}

const formatDob = (dob: string) =>
  new Date(dob + 'T00:00:00').toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric',
  });

export default function UniversalSearch({ open, onClose }: UniversalSearchProps) {
  const { openTab, navigateMainTab } = useTabContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchPatients = async (term: string) => {
    setLoading(true);
    setSearchError(false);
    try {
      const res = await apiClient.get<PatientSearchResult[]>(
        `/api/patients?searchTerm=${encodeURIComponent(term)}&pageSize=10&pageIndex=0`,
      );
      setResults(res.data);
      setSelectedIndex(i => (res.data.length === 0 ? -1 : Math.min(i, res.data.length - 1)));
    } catch {
      setSearchError(true);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => searchPatients(query.trim()), 300);
    } else {
      setResults([]);
      setSearchError(false);
      debounceRef.current = null;
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSearchError(false);
      setSelectedIndex(-1);
    }
  }, [open]);

  const handleSelect = (p: PatientSearchResult) => {
    openTab(`/patients/${p.entityId}`, `${p.firstName} ${p.lastName}`);
    onClose();
  };

  const handleRegisterNew = () => {
    navigateMainTab('/patients?registerName=' + encodeURIComponent(query.trim()));
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { mt: '10vh', verticalAlign: 'top', maxHeight: '70vh' } } }}
      onKeyDown={handleKeyDown}
    >
      <Box sx={{ p: 2, pb: 1 }}>
        <TextField
          autoFocus
          fullWidth
          variant="outlined"
          placeholder="Search by name, DOB (MM/DD/YYYY), or ID…"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelectedIndex(-1); }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  {loading ? <CircularProgress size={18} /> : <SearchIcon />}
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Box sx={{ overflow: 'auto', maxHeight: 340, px: 1, pb: 1 }}>
        {query.trim().length < 2 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Type at least 2 characters to search
            </Typography>
          </Box>
        ) : searchError ? (
          <Box sx={{ px: 1, py: 2 }}>
            <Alert severity="error">Search failed. Check your connection and try again.</Alert>
          </Box>
        ) : results.length > 0 ? (
          <List dense>
            {results.map((p, i) => (
              <ListItemButton
                key={p.entityId}
                selected={selectedIndex === i}
                onClick={() => handleSelect(p)}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <ListItemText
                  primary={`${p.lastName}, ${p.firstName}`}
                  secondary={`DOB: ${formatDob(p.dateOfBirth)}  ·  ID: ${p.entityId.slice(0, 8)}…`}
                />
              </ListItemButton>
            ))}
          </List>
        ) : !loading ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No patients found for '{query}'.
            </Typography>
            <Button variant="text" onClick={handleRegisterNew} sx={{ mt: 1 }}>
              Register New Patient named "{query}"
            </Button>
          </Box>
        ) : null}
      </Box>
    </Dialog>
  );
}
