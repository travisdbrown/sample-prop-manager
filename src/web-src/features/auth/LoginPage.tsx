import { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, CircularProgress, Alert, Link,
} from '@mui/material';
import apiClient, { saveSessionToken } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import type { Role } from '../../types/auth';

interface LoginResult {
  userId: string;
  roles: Role[];
  tenantId: string;
  expiresAt: string;  // ISO 8601
  token: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = (location.state as { message?: string } | null)?.message ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post<LoginResult>('/api/auth/login', { email, password });
      saveSessionToken(res.data.token);
      setUser({ userId: res.data.userId, roles: res.data.roles, tenantId: res.data.tenantId });
      navigate('/', { replace: true });
    } catch {
      // AC-2: both wrong credentials and account lockout return 401 with identical body.
      // NEVER show a different message based on the error type (NFR-S4).
      setError('Unable to sign in. Contact your Practice Owner if you need help.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ width: 400, p: 1 }} variant="outlined">
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
            DyVisions Dental
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Sign in to your practice
          </Typography>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              slotProps={{ htmlInput: { 'aria-label': 'Email address' } }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
              slotProps={{ htmlInput: { 'aria-label': 'Password' } }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !email || !password}
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>

          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            New practice?{' '}
            <Link component={RouterLink} to="/signup">Sign up here</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
