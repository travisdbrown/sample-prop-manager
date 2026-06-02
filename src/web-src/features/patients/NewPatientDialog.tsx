import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, CircularProgress, Stepper, Step, StepLabel,
  TextField, Typography, Box, Stack, Snackbar, Alert,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

// Phone removed in Story 2.6 — phone numbers are managed via the Contact & Communication
// card on the Patient Detail page after registration.

interface PatientSummaryResponse {
  entityId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string | null;
}

interface RegisterPatientResponse {
  entityId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string | null;
  createdAt: string;
}

interface RegisterPatientRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  allergies: string | null;
  medicalConditions: string | null;
  currentMedications: string | null;
  medicalNotes: string | null;
}

interface NewPatientDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newPatient: PatientSummaryResponse, warning?: string) => void;
  prefilledName?: string;
}

const STEPS = ['Demographics', 'Address', 'Medical History', 'Insurance'];

const validateDateOfBirth = (value: string): string | null => {
  if (!value) return 'Date of birth is required';
  const date = new Date(value + 'T00:00:00'); // local midnight, not UTC
  if (isNaN(date.getTime())) return 'Enter a valid date';
  if (date > new Date()) return 'Date of birth cannot be in the future';
  return null;
};

const validateAddressField = (name: string, value: string): string | null => {
  if (name === 'addressLine1' && value.length > 255) return 'Cannot exceed 255 characters';
  if (name === 'addressLine2' && value.length > 255) return 'Cannot exceed 255 characters';
  if (name === 'city' && value.length > 100) return 'Cannot exceed 100 characters';
  if (name === 'state' && value.length > 50) return 'Cannot exceed 50 characters';
  if (name === 'postalCode' && value.length > 20) return 'Cannot exceed 20 characters';
  if (name === 'country' && value.length > 100) return 'Cannot exceed 100 characters';
  return null;
};

export default function NewPatientDialog({ open, onClose, onSuccess, prefilledName }: NewPatientDialogProps) {
  const { user } = useAuth();
  const draftKey = user?.tenantId && user?.userId
    ? `dental_patient_registration_draft_${user.tenantId}_${user.userId}`
    : null;

  // Step 1 — Demographics
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 2 — Address (all optional)
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  // Step 3 — Medical History
  const [allergies, setAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');

  // Navigation + submit
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const showError = (msg: string) => setSnackbar({ open: true, message: msg });
  const closeSnackbar = () => setSnackbar(s => ({ ...s, open: false }));

  // Draft auto-save — runs on every field change
  useEffect(() => {
    const draft = {
      firstName, lastName, dateOfBirth, email,
      addressLine1, addressLine2, city, state: addressState, postalCode, country,
      allergies, medicalConditions, currentMedications, medicalNotes,
      activeStep,
    };
    if (draftKey) { try { localStorage.setItem(draftKey, JSON.stringify(draft)); } catch { /* quota exceeded — skip draft save */ } }
  }, [draftKey, firstName, lastName, dateOfBirth, email, addressLine1, addressLine2, city, addressState, postalCode, country, allergies, medicalConditions, currentMedications, medicalNotes, activeStep]);

  // Restore draft on dialog open; fall back to prefilledName when draft has no first/last name
  useEffect(() => {
    if (!open) return;

    let first = '', last = '', dob = '', emailVal = '';
    let line1 = '', line2 = '', cityVal = '', stateVal = '', zip = '', countryVal = '';
    let allergiesVal = '', conditions = '', medications = '', notes = '';
    let step = 0;

    if (draftKey) {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        try {
          const draft = JSON.parse(raw);
          first = draft.firstName ?? '';
          last = draft.lastName ?? '';
          dob = draft.dateOfBirth ?? '';
          emailVal = draft.email ?? '';
          line1 = draft.addressLine1 ?? '';
          line2 = draft.addressLine2 ?? '';
          cityVal = draft.city ?? '';
          stateVal = draft.state ?? '';
          zip = draft.postalCode ?? '';
          countryVal = draft.country ?? '';
          allergiesVal = draft.allergies ?? '';
          conditions = draft.medicalConditions ?? '';
          medications = draft.currentMedications ?? '';
          notes = draft.medicalNotes ?? '';
          step = draft.activeStep ?? 0;
        } catch { /* ignore corrupt draft */ }
      }
    }

    if (prefilledName && !first && !last) {
      const parts = prefilledName.trim().split(' ');
      first = parts[0] ?? '';
      last = parts.slice(1).join(' ');
    }

    setFirstName(first);
    setLastName(last);
    setDateOfBirth(dob);
    setEmail(emailVal);
    setAddressLine1(line1);
    setAddressLine2(line2);
    setCity(cityVal);
    setAddressState(stateVal);
    setPostalCode(zip);
    setCountry(countryVal);
    setAllergies(allergiesVal);
    setMedicalConditions(conditions);
    setCurrentMedications(medications);
    setMedicalNotes(notes);
    setActiveStep(step);
  }, [open, draftKey, prefilledName]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setDateOfBirth('');
    setEmail('');
    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setAddressState('');
    setPostalCode('');
    setCountry('');
    setAllergies('');
    setMedicalConditions('');
    setCurrentMedications('');
    setMedicalNotes('');
    setActiveStep(0);
    setErrors({});
    setAddressErrors({});
  };

  const validateDemoField = (name: string, value: string): string | null => {
    if (name === 'firstName') return value ? null : 'First name is required';
    if (name === 'lastName') return value ? null : 'Last name is required';
    if (name === 'dateOfBirth') return validateDateOfBirth(value);
    if (name === 'email') {
      if (!value) return null;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Enter a valid email address';
    }
    return null;
  };

  const handleBlur = (name: string, value: string) => {
    const error = validateDemoField(name, value);
    setErrors(prev => {
      const next = { ...prev };
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const handleAddressBlur = (name: string, value: string) => {
    const error = validateAddressField(name, value);
    setAddressErrors(prev => {
      const next = { ...prev };
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    const fnErr = validateDemoField('firstName', firstName);
    const lnErr = validateDemoField('lastName', lastName);
    const dobErr = validateDemoField('dateOfBirth', dateOfBirth);
    const emailErr = validateDemoField('email', email);
    if (fnErr) newErrors.firstName = fnErr;
    if (lnErr) newErrors.lastName = lnErr;
    if (dobErr) newErrors.dateOfBirth = dobErr;
    if (emailErr) newErrors.email = emailErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    const fields: [string, string][] = [
      ['addressLine1', addressLine1], ['addressLine2', addressLine2],
      ['city', city], ['state', addressState],
      ['postalCode', postalCode], ['country', country],
    ];
    for (const [name, value] of fields) {
      const err = validateAddressField(name, value);
      if (err) newErrors[name] = err;
    }
    setAddressErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isStep1Valid =
    !errors.firstName && !errors.lastName && !errors.dateOfBirth && !errors.email
    && !!firstName && !!lastName && !!dateOfBirth;

  const handleNext = () => {
    if (activeStep === 0 && !validateStep1()) return;
    if (activeStep === 1 && !validateStep2()) return;
    setActiveStep(s => s + 1);
  };

  const handleBack = () => setActiveStep(s => s - 1);

  const handleCancel = () => {
    if (draftKey) localStorage.removeItem(draftKey);
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await apiClient.post<RegisterPatientResponse>(
        '/api/patients/register',
        {
          firstName,
          lastName,
          dateOfBirth,
          email: email || null,
          addressLine1: addressLine1.trim() || null,
          addressLine2: addressLine2.trim() || null,
          city: city.trim() || null,
          state: addressState.trim() || null,
          postalCode: postalCode.trim() || null,
          country: country.trim() || null,
          allergies: allergies || null,
          medicalConditions: medicalConditions || null,
          currentMedications: currentMedications || null,
          medicalNotes: medicalNotes || null,
        } satisfies RegisterPatientRequest,
      );

      if (draftKey) localStorage.removeItem(draftKey);
      onSuccess({
        entityId: res.data.entityId,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        dateOfBirth: res.data.dateOfBirth,
        email: res.data.email,
      });
      onClose();
      resetForm();
    } catch {
      showError('Failed to register patient. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!submitting ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      aria-labelledby="new-patient-dialog-title"
    >
      <DialogTitle id="new-patient-dialog-title">New Patient Registration</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {STEPS.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: Demographics */}
        {activeStep === 0 && (
          <Stack spacing={2}>
            <TextField
              label="First Name *"
              fullWidth
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              onBlur={() => handleBlur('firstName', firstName)}
              error={!!errors.firstName}
              helperText={errors.firstName}
            />
            <TextField
              label="Last Name *"
              fullWidth
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              onBlur={() => handleBlur('lastName', lastName)}
              error={!!errors.lastName}
              helperText={errors.lastName}
            />
            <TextField
              label="Date of Birth *"
              type="date"
              fullWidth
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
              onBlur={() => handleBlur('dateOfBirth', dateOfBirth)}
              error={!!errors.dateOfBirth}
              helperText={errors.dateOfBirth}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => handleBlur('email', email)}
              error={!!errors.email}
              helperText={errors.email}
            />
            <Typography variant="caption" color="text.secondary">
              Phone numbers can be added from the patient record after registration.
            </Typography>
          </Stack>
        )}

        {/* Step 2: Address */}
        {activeStep === 1 && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              All fields are optional — can be updated later.
            </Typography>
            <TextField
              label="Address Line 1"
              fullWidth
              value={addressLine1}
              onChange={e => setAddressLine1(e.target.value)}
              onBlur={() => handleAddressBlur('addressLine1', addressLine1)}
              error={!!addressErrors.addressLine1}
              helperText={addressErrors.addressLine1}
            />
            <TextField
              label="Address Line 2"
              fullWidth
              value={addressLine2}
              onChange={e => setAddressLine2(e.target.value)}
              onBlur={() => handleAddressBlur('addressLine2', addressLine2)}
              error={!!addressErrors.addressLine2}
              helperText={addressErrors.addressLine2}
            />
            <TextField
              label="City"
              fullWidth
              value={city}
              onChange={e => setCity(e.target.value)}
              onBlur={() => handleAddressBlur('city', city)}
              error={!!addressErrors.city}
              helperText={addressErrors.city}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="State"
                fullWidth
                value={addressState}
                onChange={e => setAddressState(e.target.value)}
                onBlur={() => handleAddressBlur('state', addressState)}
                error={!!addressErrors.state}
                helperText={addressErrors.state}
              />
              <TextField
                label="Postal Code"
                fullWidth
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                onBlur={() => handleAddressBlur('postalCode', postalCode)}
                error={!!addressErrors.postalCode}
                helperText={addressErrors.postalCode}
              />
            </Stack>
            <TextField
              label="Country"
              fullWidth
              value={country}
              onChange={e => setCountry(e.target.value)}
              onBlur={() => handleAddressBlur('country', country)}
              error={!!addressErrors.country}
              helperText={addressErrors.country}
            />
          </Stack>
        )}

        {/* Step 3: Medical History */}
        {activeStep === 2 && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              All fields are optional — can be updated later.
            </Typography>
            <TextField
              label="Allergies"
              multiline
              rows={2}
              fullWidth
              value={allergies}
              onChange={e => setAllergies(e.target.value)}
            />
            {allergies.trim() && (
              <Alert severity="warning" icon={<WarningIcon />} sx={{ py: 0.5 }}>
                An allergy alert will be created automatically when saved.
              </Alert>
            )}
            <TextField
              label="Medical Conditions"
              multiline
              rows={2}
              fullWidth
              value={medicalConditions}
              onChange={e => setMedicalConditions(e.target.value)}
            />
            <TextField
              label="Current Medications"
              multiline
              rows={2}
              fullWidth
              value={currentMedications}
              onChange={e => setCurrentMedications(e.target.value)}
            />
            <TextField
              label="Notes"
              multiline
              rows={3}
              fullWidth
              value={medicalNotes}
              onChange={e => setMedicalNotes(e.target.value)}
            />
          </Stack>
        )}

        {/* Step 4: Insurance */}
        {activeStep === 3 && (
          <Box sx={{ py: 2 }}>
            <Typography>Insurance information is not required at registration.</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Insurance details can be added to the patient record at any time.
            </Typography>
          </Box>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={null}
          onClose={closeSnackbar}
        >
          <Alert severity="error" onClose={closeSnackbar}>{snackbar.message}</Alert>
        </Snackbar>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={submitting}>Cancel</Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={submitting}>Back</Button>
        )}
        {activeStep < 3 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={activeStep === 0 && !isStep1Valid}
          >
            Next →
          </Button>
        )}
        {activeStep === 3 && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Register Patient'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
