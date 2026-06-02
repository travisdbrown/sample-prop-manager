import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, CircularProgress, Alert } from '@mui/material';
import apiClient from '../../services/apiClient';

interface AcceptInviteRequest {
  email: string;
  token: string;
  newPassword: string;
  displayName: string;
}

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get('email') ?? '';
  const token = searchParams.get('token') ?? '';

  const [displayName, setDisplayName] = useState('');
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateDisplayName = () => {
    if (!displayName.trim()) {
      setDisplayNameError('Display name is required');
      return false;
    }
    setDisplayNameError(null);
    return true;
  };

  const validatePassword = () => {
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!/[0-9]/.test(password) || !/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      setPasswordError('Password must contain a number, lowercase, and uppercase letter');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const validateConfirm = () => {
    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      return false;
    }
    setConfirmError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dnOk = validateDisplayName();
    const pwOk = validatePassword();
    const cfOk = validateConfirm();
    if (!dnOk || !pwOk || !cfOk) return;

    setSubmitting(true);
    setError(null);
    try {
      const body: AcceptInviteRequest = { email, token, newPassword: password, displayName: displayName.trim() };
      await apiClient.post('/api/auth/accept-invite', body);
      navigate('/login', { state: { message: 'Password set. Please log in.' } });
    } catch {
      setError('Invalid or expired invitation link. Please request a new invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ width: '100%', maxWidth: 400, p: 4, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>Set Your Password</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Complete your account setup for <strong>{email}</strong>
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Email"
            value={email}
            fullWidth
            slotProps={{ input: { readOnly: true } }}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Display Name *"
            fullWidth
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            onBlur={validateDisplayName}
            error={!!displayNameError}
            helperText={displayNameError ?? 'Your name as it will appear on clinical notes (e.g. Dr. Sarah Johnson)'}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Password *"
            type="password"
            fullWidth
            value={password}
            onChange={e => setPassword(e.target.value)}
            onBlur={validatePassword}
            error={!!passwordError}
            helperText={passwordError}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Confirm Password *"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            onBlur={validateConfirm}
            error={!!confirmError}
            helperText={confirmError}
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={submitting || !displayName.trim() || !password || !confirmPassword}
          >
            {submitting ? <CircularProgress size={22} color="inherit" /> : 'Set Password & Activate Account'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
