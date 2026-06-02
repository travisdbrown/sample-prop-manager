import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box, Typography, Chip, TextField, Button, CircularProgress,
  Snackbar, Alert, Card, CardContent,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types/auth';

interface TenantResponse {
  tenantId: string;
  name: string;
  tier: string;
  seatCount: number;
  createdAt: string;
}

interface UpdateSeatCountRequest {
  seatCount: number;
}

export default function SubscriptionPage() {
  const { user } = useAuth();

  const [tenant, setTenant] = useState<TenantResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [newSeatCount, setNewSeatCount] = useState<number>(1);
  const [seatCountError, setSeatCountError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('Starter');
  const [updatingTier, setUpdatingTier] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false, message: '', severity: 'success' as 'success' | 'error', autoHide: true,
  });

  const closeSnackbar = () => setSnackbar(s => ({ ...s, open: false }));
  const showSuccess = (msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'success', autoHide: true });
  const showError = (msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'error', autoHide: false });

  useEffect(() => {
    apiClient.get<TenantResponse>('/api/tenancy')
      .then(res => {
        setTenant(res.data);
        setNewSeatCount(res.data.seatCount);
        setSelectedTier(res.data.tier);
      })
      .catch(() => showError('Failed to load subscription data.'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateTier = async () => {
    if (!tenant || selectedTier === tenant.tier) return;
    setUpdatingTier(true);
    try {
      const res = await apiClient.patch<TenantResponse>(
        '/api/tenancy/subscription-tier',
        { tier: selectedTier },
      );
      setTenant(res.data);
      setSelectedTier(res.data.tier);
      showSuccess('Subscription tier updated.');
    } catch {
      showError('Failed to update subscription tier.');
    } finally {
      setUpdatingTier(false);
    }
  };

  const handleSeatCountBlur = () => {
    if (newSeatCount < 1) {
      setSeatCountError('Seat count must be at least 1');
    } else {
      setSeatCountError(null);
    }
  };

  const handleUpdate = async () => {
    if (newSeatCount < 1) return;
    setUpdating(true);
    try {
      const body: UpdateSeatCountRequest = { seatCount: newSeatCount };
      const res = await apiClient.patch<TenantResponse>('/api/tenancy/seat-count', body);
      setTenant(res.data);
      setNewSeatCount(res.data.seatCount);
      showSuccess('Seat count updated.');
    } catch {
      showError('Failed to update seat count.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!user.roles.includes(Role.PracticeOwner)) return <Navigate to="/" replace />;

  return (
    <Box sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Subscription Settings
      </Typography>

      {tenant && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {tenant.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Subscription Tier:
              </Typography>
              <Chip label={tenant.tier} color="primary" size="small" />
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Current Seats: <strong>{tenant.seatCount}</strong>
            </Typography>
          </CardContent>
        </Card>
      )}

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Update Subscription Tier
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 4 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="tier-select-label">Subscription Tier</InputLabel>
          <Select
            labelId="tier-select-label"
            label="Subscription Tier"
            value={selectedTier}
            onChange={(e: SelectChangeEvent) => setSelectedTier(e.target.value)}
            disabled={updatingTier}
          >
            <MenuItem value="Starter">Starter</MenuItem>
            <MenuItem value="Professional">Professional</MenuItem>
            <MenuItem value="Enterprise">Enterprise</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          disabled={updatingTier || !tenant || selectedTier === tenant.tier}
          onClick={handleUpdateTier}
          sx={{ mt: 1 }}
        >
          {updatingTier ? <CircularProgress size={22} color="inherit" /> : 'Update Tier'}
        </Button>
      </Box>

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Update Seat Count
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <TextField
          label="Number of Seats *"
          type="number"
          value={newSeatCount}
          onChange={e => setNewSeatCount(Number(e.target.value))}
          onBlur={handleSeatCountBlur}
          error={!!seatCountError}
          helperText={seatCountError}
          slotProps={{ htmlInput: { min: 1 } }}
          sx={{ width: 200 }}
        />
        <Button
          variant="contained"
          disabled={updating || loading || newSeatCount < 1}
          onClick={handleUpdate}
          sx={{ mt: 1 }}
        >
          {updating ? <CircularProgress size={22} color="inherit" /> : 'Update'}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHide ? 3000 : null}
        onClose={closeSnackbar}
      >
        <Alert severity={snackbar.severity} onClose={closeSnackbar}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
