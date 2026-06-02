import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, CircularProgress,
  Snackbar, Alert, InputAdornment, IconButton, Link,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface SignupForm {
  practiceName: string;
  seatCount: number;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPassword: string;
  confirmPassword: string;
}

interface ProvisionTenantRequest {
  practiceName: string;
  seatCount: number;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPassword: string;
}

const initialForm: SignupForm = {
  practiceName: '',
  seatCount: 5,
  ownerFirstName: '',
  ownerLastName: '',
  ownerEmail: '',
  ownerPassword: '',
  confirmPassword: '',
};

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SignupForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof SignupForm, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false, message: '', severity: 'success' as 'success' | 'error', autoHide: true,
  });
  const navigate = useNavigate();

  const closeSnackbar = () => setSnackbar(s => ({ ...s, open: false }));
  const showError = (msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'error', autoHide: false });

  const handleChange = (field: keyof SignupForm, value: string | number) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const validateOnBlur = (field: keyof SignupForm) => {
    const newErrors = { ...errors };

    if (field === 'practiceName') {
      if (!form.practiceName.trim()) {
        newErrors.practiceName = 'Practice name is required';
      } else if (form.practiceName.length > 200) {
        newErrors.practiceName = 'Practice name must be 200 characters or fewer';
      } else {
        delete newErrors.practiceName;
      }
    }

    if (field === 'seatCount') {
      if (!form.seatCount || form.seatCount < 1) {
        newErrors.seatCount = 'Seat count must be at least 1';
      } else {
        delete newErrors.seatCount;
      }
    }

    if (field === 'ownerFirstName') {
      if (!form.ownerFirstName.trim()) {
        newErrors.ownerFirstName = 'First name is required';
      } else {
        delete newErrors.ownerFirstName;
      }
    }

    if (field === 'ownerLastName') {
      if (!form.ownerLastName.trim()) {
        newErrors.ownerLastName = 'Last name is required';
      } else {
        delete newErrors.ownerLastName;
      }
    }

    if (field === 'ownerEmail') {
      if (!form.ownerEmail.trim()) {
        newErrors.ownerEmail = 'Email is required';
      } else {
        delete newErrors.ownerEmail;
      }
    }

    if (field === 'ownerPassword') {
      if (!form.ownerPassword) {
        newErrors.ownerPassword = 'Password is required';
      } else if (form.ownerPassword.length < 8) {
        newErrors.ownerPassword = 'Password must be at least 8 characters';
      } else if (!/[A-Z]/.test(form.ownerPassword)) {
        newErrors.ownerPassword = 'Password must contain at least one uppercase letter';
      } else if (!/[a-z]/.test(form.ownerPassword)) {
        newErrors.ownerPassword = 'Password must contain at least one lowercase letter';
      } else if (!/[0-9]/.test(form.ownerPassword)) {
        newErrors.ownerPassword = 'Password must contain at least one digit';
      } else {
        delete newErrors.ownerPassword;
      }
    }

    if (field === 'confirmPassword') {
      if (form.confirmPassword !== form.ownerPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      } else {
        delete newErrors.confirmPassword;
      }
    }

    setErrors(newErrors);
  };

  const isStep1Valid = form.practiceName.trim().length > 0 && form.seatCount >= 1;

  const isPasswordComplex = (p: string) =>
    p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p);

  const isStep2Valid =
    form.ownerFirstName.trim().length > 0 &&
    form.ownerLastName.trim().length > 0 &&
    form.ownerEmail.trim().length > 0 &&
    isPasswordComplex(form.ownerPassword) &&
    form.confirmPassword === form.ownerPassword;

  const handleNext = () => setStep(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep2Valid) return;

    setLoading(true);
    try {
      const body: ProvisionTenantRequest = {
        practiceName: form.practiceName,
        seatCount: form.seatCount,
        ownerFirstName: form.ownerFirstName,
        ownerLastName: form.ownerLastName,
        ownerEmail: form.ownerEmail,
        ownerPassword: form.ownerPassword,
      };
      await apiClient.post('/api/tenancy/provision', body);
      navigate('/login', { state: { message: 'Practice created! Sign in to get started.' } });
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { detail?: string } } })?.response;
      if (response?.status === 400 && response.data?.detail) {
        showError(response.data.detail);
      } else if (response?.status === 400) {
        showError('Please check your input and try again.');
      } else {
        showError('Something went wrong. Please try again.');
      }
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
      <Card sx={{ width: 440, p: 1 }} variant="outlined">
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
            DyVisions Dental
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            Create your practice
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
            Step {step} of 2
          </Typography>

          {step === 1 && (
            <Box>
              <TextField
                fullWidth
                label="Practice Name *"
                value={form.practiceName}
                onChange={e => handleChange('practiceName', e.target.value)}
                onBlur={() => validateOnBlur('practiceName')}
                margin="normal"
                required
                error={!!errors.practiceName}
                helperText={errors.practiceName}
                slotProps={{ htmlInput: { maxLength: 200 } }}
              />
              <TextField
                fullWidth
                label="Number of Seats *"
                type="number"
                value={form.seatCount}
                onChange={e => handleChange('seatCount', Number(e.target.value))}
                onBlur={() => validateOnBlur('seatCount')}
                margin="normal"
                required
                error={!!errors.seatCount}
                helperText={errors.seatCount}
                slotProps={{ htmlInput: { min: 1 } }}
              />
              <Button
                fullWidth
                variant="contained"
                size="large"
                disabled={!isStep1Valid}
                onClick={handleNext}
                sx={{ mt: 3 }}
              >
                Next →
              </Button>
            </Box>
          )}

          {step === 2 && (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                label="First Name *"
                value={form.ownerFirstName}
                onChange={e => handleChange('ownerFirstName', e.target.value)}
                onBlur={() => validateOnBlur('ownerFirstName')}
                margin="normal"
                required
                error={!!errors.ownerFirstName}
                helperText={errors.ownerFirstName}
              />
              <TextField
                fullWidth
                label="Last Name *"
                value={form.ownerLastName}
                onChange={e => handleChange('ownerLastName', e.target.value)}
                onBlur={() => validateOnBlur('ownerLastName')}
                margin="normal"
                required
                error={!!errors.ownerLastName}
                helperText={errors.ownerLastName}
              />
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={form.ownerEmail}
                onChange={e => handleChange('ownerEmail', e.target.value)}
                onBlur={() => validateOnBlur('ownerEmail')}
                margin="normal"
                required
                error={!!errors.ownerEmail}
                helperText={errors.ownerEmail}
                autoComplete="email"
              />
              <TextField
                fullWidth
                label="Password *"
                type={showPassword ? 'text' : 'password'}
                value={form.ownerPassword}
                onChange={e => handleChange('ownerPassword', e.target.value)}
                onBlur={() => validateOnBlur('ownerPassword')}
                margin="normal"
                required
                error={!!errors.ownerPassword}
                helperText={errors.ownerPassword}
                autoComplete="new-password"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(v => !v)}
                          edge="end"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                fullWidth
                label="Confirm Password *"
                type="password"
                value={form.confirmPassword}
                onChange={e => handleChange('confirmPassword', e.target.value)}
                onBlur={() => validateOnBlur('confirmPassword')}
                margin="normal"
                required
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                autoComplete="new-password"
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => setStep(1)}
                  sx={{ flex: 1 }}
                >
                  ← Back
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading || !isStep2Valid}
                  sx={{ flex: 2 }}
                >
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Practice'}
                </Button>
              </Box>
            </Box>
          )}

          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            <Link component={RouterLink} to="/login">Back to Login</Link>
          </Typography>
        </CardContent>
      </Card>

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
