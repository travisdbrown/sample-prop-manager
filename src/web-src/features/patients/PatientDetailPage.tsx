import {
  Box, Stack, Grid, Typography, CircularProgress,
  Card, CardContent, Avatar, Alert,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar,
  List, ListItem, ListItemText, Divider, TextField, Tooltip,
  Switch, FormControlLabel, Select, MenuItem, FormControl, InputLabel,
  IconButton, Chip, Checkbox, Tab, Tabs,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  MonitorHeart as MonitorHeartIcon,
  Person as PersonIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTabContext } from '../../contexts/TabContext';
import { Role } from '../../types/auth';
import PatientAlertBadge from '../../components/PatientAlertBadge';
import PatientDocumentsPanel from './PatientDocumentsPanel';
import ClinicalChartPanel from '../clinical/ClinicalChartPanel';

interface UpcomingAppointment {
  entityId: string;
  appointmentType: string;
  status: string;
  slotStart: string;
  slotEnd: string;
  providerId: string;
}

interface PatientAlertDetail {
  entityId: string;
  alertType: string;
  title: string;
  isActive: boolean;
  createdAt: string;
}

interface PhoneNumberDetail {
  entityId: string;
  phoneType: 'Home' | 'Work' | 'Mobile' | 'Other';
  number: string;
  doNotContact: boolean;
}

interface ContactPreferencesApiResponse {
  entityId: string;
  phoneNumbers: PhoneNumberDetail[];
  smsOptIn: boolean;
  smsOptedInAt: string | null;
  smsOptedOutAt: string | null;
  appointmentContactMethod: string;
  financialContactMethod: string;
  marketingContactMethod: string;
}

interface CategoryTagDetail {
  tagId: string;
}

interface PatientDetailResponse {
  entityId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;          // "YYYY-MM-DD"
  email: string | null;
  createdAt: string;
  allergies: string | null;
  medicalConditions: string | null;
  currentMedications: string | null;
  medicalNotes: string | null;
  medicalHistoryUpdatedAt: string | null;
  alerts: PatientAlertDetail[];
  // Contact & communication preferences (Story 2.6)
  phoneNumbers: PhoneNumberDetail[];
  smsOptIn: boolean;
  smsOptedInAt: string | null;
  smsOptedOutAt: string | null;
  appointmentContactMethod: string;
  financialContactMethod: string;
  marketingContactMethod: string;
  // Clinical flags (Story 2.7)
  premedRequired: boolean;
  appointmentNote: string | null;
  preferredDayOfWeek: string;
  preferredEarliestTime: string | null;
  preferredLatestTime: string | null;
  preferredArriveEarlyMinutes: number;
  namePronunciation: string | null;
  categoryTags: CategoryTagDetail[];
  // Address
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

interface UpdatePatientRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // "YYYY-MM-DD"
  email: string | null;
}

interface MedicalHistoryApiResponse {
  allergies: string | null;
  medicalConditions: string | null;
  currentMedications: string | null;
  medicalNotes: string | null;
  medicalHistoryUpdatedAt: string | null;
  alerts: PatientAlertDetail[];
}

const CONTACT_METHODS = [
  'None', 'DoNotContact', 'HomePhone', 'WorkPhone', 'Mobile', 'Email', 'SMS', 'Mail', 'SeeNotes',
] as const;
const PHONE_TYPES = ['Home', 'Work', 'Mobile', 'Other'] as const;

const DAYS_OF_WEEK = ['Any', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

import { AVAILABLE_TAGS } from '../../constants/patientTags';

interface ClinicalFlagsApiResponse {
  entityId: string;
  premedRequired: boolean;
  appointmentNote: string | null;
  preferredDayOfWeek: string;
  preferredEarliestTime: string | null;  // "HH:mm:ss"
  preferredLatestTime: string | null;    // "HH:mm:ss"
  preferredArriveEarlyMinutes: number;
  namePronunciation: string | null;
  categoryTags: { tagId: string }[];
}

type ClinicalFlagsForm = {
  premedRequired: boolean;
  appointmentNote: string;
  preferredDayOfWeek: string;
  preferredEarliestTime: string;  // "HH:mm" — <input type="time"> format
  preferredLatestTime: string;
  preferredArriveEarlyMinutes: string; // string for input binding
  namePronunciation: string;
  categoryTagIds: string[];
};

type ClinicalFlagsErrors = {
  appointmentNote: string;
  preferredEarliestTime: string;
  preferredLatestTime: string;
  preferredArriveEarlyMinutes: string;
  namePronunciation: string;
};

/** Converts backend "HH:mm:ss" TimeOnly string → "HH:mm" for <input type="time">. */
const toTimeInput = (t: string | null | undefined): string =>
  t ? t.slice(0, 5) : '';

/** Converts "HH:mm" input → "HH:mm:ss" for the API payload. */
const toTimePayload = (t: string): string | null =>
  t ? `${t}:00` : null;

/** Converts "HH:mm" to total minutes for numeric time comparison. */
const toMinutes = (t: string): number => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

/** Normalises a contact method to a known value; falls back to 'None' for unknown API values. */
const normalizeContactMethod = (m: string): string =>
  (CONTACT_METHODS as readonly string[]).includes(m) ? m : 'None';

/** Phone entry in the contact form. _key is a stable React list key — not sent to the API. */
type PhoneFormEntry = { _key: string; phoneType: string; number: string; doNotContact: boolean };

const formatDob = (dob: string) =>
  new Date(dob + 'T00:00:00').toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric',
  });

const getInitials = (first: string, last: string) =>
  ((first[0] ?? '') + (last[0] ?? '')).toUpperCase();

/**
 * Converts PascalCase contact method names to readable labels.
 * Splits only at lowercase→uppercase boundaries so acronyms like "SMS" stay intact.
 * Examples: "HomePhone" → "Home Phone", "DoNotContact" → "Do Not Contact", "SMS" → "SMS"
 */
const formatContactMethod = (method: string): string =>
  method ? method.replace(/([a-z])([A-Z])/g, '$1 $2') : '—';

/**
 * Formats a phone number for display.
 * - 10-digit US numbers  → (555) 123-4567
 * - 11-digit US numbers starting with '1' (E.164) → (555) 123-4567 (strips country code)
 * - Anything else → returned as-is
 * - null/undefined → empty string (safe for read-mode render)
 */
const formatPhone = (raw: string | null | undefined): string => {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10)
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === '1')
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return raw;
};

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { activeTabId, updateTabLabel } = useTabContext();
  const canViewChart = user?.roles.some(r => r === Role.Dentist || r === Role.Hygienist) ?? false;

  const [activeTab, setActiveTab] = useState(0);
  const [patient, setPatient] = useState<PatientDetailResponse | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [notFound, setNotFound] = useState(!id);
  const [dismissing, setDismissing] = useState<string | null>(null);
  const [confirmDismiss, setConfirmDismiss] = useState<PatientAlertDetail | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false, message: '', severity: 'success' as 'success' | 'error', autoHide: true,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState(false);

  // Demographics edit state
  const [editingDemographics, setEditingDemographics] = useState(false);
  const [demoForm, setDemoForm] = useState({ firstName: '', lastName: '', dateOfBirth: '', email: '' });
  const [demoErrors, setDemoErrors] = useState({ firstName: '', lastName: '', dateOfBirth: '', email: '' });
  const [demoSaving, setDemoSaving] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Medical history edit state
  const [editingMedicalHistory, setEditingMedicalHistory] = useState(false);
  const [medForm, setMedForm] = useState({ allergies: '', medicalConditions: '', currentMedications: '', medicalNotes: '' });
  const [medSaving, setMedSaving] = useState(false);

  // Contact & communication preferences edit state (Story 2.6)
  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    // _key is a stable identity used as the React list key (not sent to the API).
    // Existing phones use entityId; new phones get a crypto.randomUUID().
    phoneNumbers: [] as PhoneFormEntry[],
    smsOptIn: false,
    appointmentContactMethod: 'None',
    financialContactMethod: 'None',
    marketingContactMethod: 'None',
  });
  const [phoneBlurErrors, setPhoneBlurErrors] = useState<Record<number, string>>({});
  const [contactSaving, setContactSaving] = useState(false);

  // Clinical flags & scheduling preferences edit state (Story 2.7)
  const [editingClinicalFlags, setEditingClinicalFlags] = useState(false);
  const [clinicalFlagsForm, setClinicalFlagsForm] = useState<ClinicalFlagsForm>({
    premedRequired: false,
    appointmentNote: '',
    preferredDayOfWeek: 'Any',
    preferredEarliestTime: '',
    preferredLatestTime: '',
    preferredArriveEarlyMinutes: '0',
    namePronunciation: '',
    categoryTagIds: [],
  });
  const [clinicalFlagsErrors, setClinicalFlagsErrors] = useState<ClinicalFlagsErrors>({
    appointmentNote: '',
    preferredEarliestTime: '',
    preferredLatestTime: '',
    preferredArriveEarlyMinutes: '',
    namePronunciation: '',
  });
  const [clinicalFlagsSaving, setClinicalFlagsSaving] = useState(false);

  // Address edit state
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({ addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: '' });
  const [addressErrors, setAddressErrors] = useState({ addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: '' });
  const [addressSaving, setAddressSaving] = useState(false);

  const closeSnackbar = () => setSnackbar(s => ({ ...s, open: false }));
  const showSuccess = (msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'success', autoHide: true });
  const showError = (msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'error', autoHide: false });

  useEffect(() => {
    if (!id) return;
    apiClient.get<PatientDetailResponse>(`/api/patients/${id}`)
      .then(res => {
        setPatient(res.data);
        updateTabLabel(activeTabId, `${res.data.firstName} ${res.data.lastName}`);
      })
      .catch(err => {
        if (err instanceof AxiosError && err.response?.status === 404) {
          setNotFound(true);
        } else {
          showError('Failed to load patient record.');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) { setAppointmentsLoading(false); return; }
    const today = new Date().toLocaleDateString('en-CA');
    const oneYearOut = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA');
    apiClient.get<UpcomingAppointment[]>(
      `/api/scheduling/appointments?startDate=${today}&endDate=${oneYearOut}&patientId=${id}`,
    )
      .then(res => setUpcomingAppointments(res.data))
      .catch(() => setAppointmentsError(true))
      .finally(() => setAppointmentsLoading(false));
  }, [id]);

  const handleDismissAlert = (alert: PatientAlertDetail) => {
    setConfirmDismiss(alert);
  };

  const handleConfirmDismiss = async () => {
    if (!confirmDismiss || !id) return;
    setDismissing(confirmDismiss.entityId);
    try {
      await apiClient.delete(`/api/patients/${id}/alerts/${confirmDismiss.entityId}`);
      setPatient(p =>
        p ? { ...p, alerts: p.alerts.map(a =>
          a.entityId === confirmDismiss!.entityId ? { ...a, isActive: false } : a,
        ) } : p,
      );
      showSuccess('Alert dismissed.');
    } catch {
      showError('Failed to dismiss alert.');
    } finally {
      setDismissing(null);
      setConfirmDismiss(null);
    }
  };

  // Demographics handlers
  const handleDemoEditOpen = () => {
    if (!patient) return;
    setDemoForm({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      email: patient.email ?? '',
    });
    setDemoErrors({ firstName: '', lastName: '', dateOfBirth: '', email: '' });
    setEditingDemographics(true);
  };

  const validateDemoField = (field: string, value: string): string => {
    if (field === 'firstName' && !value.trim()) return 'First name is required.';
    if (field === 'lastName' && !value.trim()) return 'Last name is required.';
    if (field === 'dateOfBirth') {
      if (!value) return 'Date of birth is required.';
      if (new Date(value + 'T00:00:00') > new Date()) return 'Date of birth cannot be in the future.';
    }
    if (field === 'email' && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return 'Email address is not valid.';
    return '';
  };

  const handleDemoBlur = (field: string, value: string) => {
    setDemoErrors(e => ({ ...e, [field]: validateDemoField(field, value) }));
  };

  const handleDemoSave = async () => {
    const errors = {
      firstName: validateDemoField('firstName', demoForm.firstName),
      lastName: validateDemoField('lastName', demoForm.lastName),
      dateOfBirth: validateDemoField('dateOfBirth', demoForm.dateOfBirth),
      email: validateDemoField('email', demoForm.email),
    };
    setDemoErrors(errors);
    if (Object.values(errors).some(e => e)) return;

    setDemoSaving(true);
    try {
      const payload: UpdatePatientRequest = {
        firstName: demoForm.firstName,
        lastName: demoForm.lastName,
        dateOfBirth: demoForm.dateOfBirth,
        email: demoForm.email.trim() || null,
      };
      const res = await apiClient.put<PatientDetailResponse>(`/api/patients/${id}`, payload);
      setPatient(p => p ? {
        ...p,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        dateOfBirth: res.data.dateOfBirth,
        email: res.data.email,
      } : p);
      setEditingDemographics(false);
      showSuccess('Patient record updated.');
    } catch {
      showError('Failed to update patient record.');
    } finally {
      setDemoSaving(false);
    }
  };

  const handleDemoCancel = () => setEditingDemographics(false);

  // Medical history handlers
  const handleMedEditOpen = () => {
    if (!patient) return;
    setMedForm({
      allergies: patient.allergies ?? '',
      medicalConditions: patient.medicalConditions ?? '',
      currentMedications: patient.currentMedications ?? '',
      medicalNotes: patient.medicalNotes ?? '',
    });
    setEditingMedicalHistory(true);
  };

  const handleMedSave = async () => {
    setMedSaving(true);
    try {
      const payload = {
        allergies: medForm.allergies.trim() || null,
        medicalConditions: medForm.medicalConditions.trim() || null,
        currentMedications: medForm.currentMedications.trim() || null,
        medicalNotes: medForm.medicalNotes.trim() || null,
      };
      const res = await apiClient.put<MedicalHistoryApiResponse>(`/api/patients/${id}/medical-history`, payload);
      setPatient(p => p ? {
        ...p,
        allergies: res.data.allergies,
        medicalConditions: res.data.medicalConditions,
        currentMedications: res.data.currentMedications,
        medicalNotes: res.data.medicalNotes,
        medicalHistoryUpdatedAt: res.data.medicalHistoryUpdatedAt,
        alerts: res.data.alerts,
      } : p);
      setEditingMedicalHistory(false);
      showSuccess('Medical history updated.');
    } catch {
      showError('Failed to update medical history.');
    } finally {
      setMedSaving(false);
    }
  };

  const handleMedCancel = () => setEditingMedicalHistory(false);

  // Contact & communication preferences handlers (Story 2.6)
  const handleContactEditOpen = () => {
    if (!patient) return;
    setContactForm({
      // ?? [] guards against the API returning null for patients with no phones
      phoneNumbers: (patient.phoneNumbers ?? []).map(p => ({
        _key: p.entityId,
        phoneType: p.phoneType,
        number: p.number,
        doNotContact: p.doNotContact,
      })),
      smsOptIn: patient.smsOptIn,
      // normalizeContactMethod maps any unknown API value to 'None' so the
      // Select always has a valid selection and never renders blank.
      appointmentContactMethod: normalizeContactMethod(patient.appointmentContactMethod),
      financialContactMethod: normalizeContactMethod(patient.financialContactMethod),
      marketingContactMethod: normalizeContactMethod(patient.marketingContactMethod),
    });
    setPhoneBlurErrors({});
    setEditingContact(true);
  };

  const handleContactSave = async () => {
    // Pre-save sweep — catches empty numbers that were never blurred.
    // Builds the full error map so every invalid row shows its error message.
    const blurErrors: Record<number, string> = {};
    contactForm.phoneNumbers.forEach((p, idx) => {
      const digits = p.number.replace(/\D/g, '');
      if (digits.length === 0)       blurErrors[idx] = 'Phone number is required.';
      else if (digits.length < 7)    blurErrors[idx] = 'Phone number is too short (minimum 7 digits).';
      else if (digits.length > 15)   blurErrors[idx] = 'Phone number is too long (maximum 15 digits).';
    });
    if (Object.keys(blurErrors).length > 0) {
      setPhoneBlurErrors(blurErrors);
      return;
    }

    // C-6: id from useParams is theoretically undefined — guard before building the URL.
    if (!id) { showError('Invalid patient ID.'); return; }

    setContactSaving(true);
    try {
      const res = await apiClient.put<ContactPreferencesApiResponse>(
        `/api/patients/${id}/contact-preferences`,
        contactForm,
      );
      // C-7: null-coalesce every field so a partial API response never sets a
      // patient state field to undefined, which would crash formatContactMethod().
      setPatient(p => p ? {
        ...p,
        phoneNumbers: res.data.phoneNumbers ?? p.phoneNumbers,
        smsOptIn: res.data.smsOptIn ?? p.smsOptIn,
        smsOptedInAt: res.data.smsOptedInAt ?? p.smsOptedInAt,
        smsOptedOutAt: res.data.smsOptedOutAt ?? p.smsOptedOutAt,
        appointmentContactMethod: res.data.appointmentContactMethod ?? p.appointmentContactMethod,
        financialContactMethod: res.data.financialContactMethod ?? p.financialContactMethod,
        marketingContactMethod: res.data.marketingContactMethod ?? p.marketingContactMethod,
      } : p);
      setEditingContact(false);
      showSuccess('Contact preferences updated.');
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      const detail = axiosErr.response?.data?.detail ?? 'Failed to update contact preferences.';
      showError(detail);
    } finally {
      setContactSaving(false);
    }
  };

  const handleContactCancel = () => setEditingContact(false);

  // Phone number edit helpers
  const addPhone = () => setContactForm(f => ({
    ...f,
    phoneNumbers: [...f.phoneNumbers, { _key: crypto.randomUUID(), phoneType: 'Mobile', number: '', doNotContact: false }],
  }));

  const removePhone = (idx: number) => {
    setContactForm(f => ({ ...f, phoneNumbers: f.phoneNumbers.filter((_, i) => i !== idx) }));
    setPhoneBlurErrors(e => {
      const next: Record<number, string> = {};
      Object.entries(e).forEach(([k, v]) => {
        const ki = Number(k);
        if (Number.isNaN(ki)) return; // guard: keys are always numeric indices; skip any anomaly
        if (ki < idx) next[ki] = v;
        else if (ki > idx) next[ki - 1] = v;
      });
      return next;
    });
  };

  const updatePhone = (idx: number, field: keyof Omit<PhoneFormEntry, '_key'>, value: string | boolean) =>
    setContactForm(f => ({
      ...f,
      phoneNumbers: f.phoneNumbers.map((p, i) => i === idx ? { ...p, [field]: value } : p),
    }));

  const handlePhoneNumberBlur = (idx: number, value: string) => {
    // Mirror domain normalization: strip non-digits, then validate length bounds.
    const digits = value.replace(/\D/g, '');
    const err =
      digits.length === 0 ? 'Phone number is required.' :
      digits.length < 7   ? 'Phone number is too short (minimum 7 digits).' :
      digits.length > 15  ? 'Phone number is too long (maximum 15 digits).' :
      '';
    setPhoneBlurErrors(e => ({ ...e, [idx]: err }));
  };

  // Clinical flags handlers (Story 2.7)
  const handleClinicalFlagsEditOpen = () => {
    if (!patient) return;
    setClinicalFlagsForm({
      premedRequired: patient.premedRequired,
      appointmentNote: patient.appointmentNote ?? '',
      preferredDayOfWeek: (DAYS_OF_WEEK as readonly string[]).includes(patient.preferredDayOfWeek) ? patient.preferredDayOfWeek : 'Any',
      preferredEarliestTime: toTimeInput(patient.preferredEarliestTime),
      preferredLatestTime: toTimeInput(patient.preferredLatestTime),
      preferredArriveEarlyMinutes: String(Number.isFinite(patient.preferredArriveEarlyMinutes) ? patient.preferredArriveEarlyMinutes : 0),
      namePronunciation: patient.namePronunciation ?? '',
      categoryTagIds: (patient.categoryTags ?? []).map(t => t.tagId),
    });
    setClinicalFlagsErrors({ appointmentNote: '', preferredEarliestTime: '', preferredLatestTime: '', preferredArriveEarlyMinutes: '', namePronunciation: '' });
    setEditingClinicalFlags(true);
  };

  const validateClinicalFlagsField = (field: keyof ClinicalFlagsErrors, value: string): string => {
    if (field === 'appointmentNote' && value.length > 255) return 'Appointment note cannot exceed 255 characters.';
    if (field === 'namePronunciation' && value.length > 255) return 'Name pronunciation cannot exceed 255 characters.';
    if (field === 'preferredArriveEarlyMinutes') {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 0 || n > 120) return 'Must be a whole number between 0 and 120.';
    }
    return '';
  };

  const handleClinicalFlagsBlur = (field: keyof ClinicalFlagsErrors, value: string) => {
    const fieldError = validateClinicalFlagsField(field, value);
    if (field === 'preferredEarliestTime' || field === 'preferredLatestTime') {
      const earliest = field === 'preferredEarliestTime' ? value : clinicalFlagsForm.preferredEarliestTime;
      const latest   = field === 'preferredLatestTime'   ? value : clinicalFlagsForm.preferredLatestTime;
      const crossErr = (earliest && latest && toMinutes(latest) <= toMinutes(earliest))
        ? 'Latest time cannot be before earliest time.'
        : '';
      setClinicalFlagsErrors(e => ({ ...e, [field]: fieldError, preferredLatestTime: crossErr }));
    } else {
      setClinicalFlagsErrors(e => ({ ...e, [field]: fieldError }));
    }
  };

  const handleClinicalFlagsSave = async () => {
    // Validate all fields before save
    const errs: ClinicalFlagsErrors = {
      appointmentNote: validateClinicalFlagsField('appointmentNote', clinicalFlagsForm.appointmentNote),
      namePronunciation: validateClinicalFlagsField('namePronunciation', clinicalFlagsForm.namePronunciation),
      preferredArriveEarlyMinutes: validateClinicalFlagsField('preferredArriveEarlyMinutes', clinicalFlagsForm.preferredArriveEarlyMinutes),
      preferredEarliestTime: '',
      preferredLatestTime: '',
    };
    // Cross-field: latest must be strictly after earliest (equal times rejected by domain)
    if (clinicalFlagsForm.preferredEarliestTime && clinicalFlagsForm.preferredLatestTime &&
        toMinutes(clinicalFlagsForm.preferredLatestTime) <= toMinutes(clinicalFlagsForm.preferredEarliestTime)) {
      errs.preferredLatestTime = 'Latest time cannot be before earliest time.';
    }
    setClinicalFlagsErrors(errs);
    if (Object.values(errs).some(e => e)) return;

    if (!id) { showError('Invalid patient ID.'); return; }
    setClinicalFlagsSaving(true);
    try {
      const payload = {
        premedRequired: clinicalFlagsForm.premedRequired,
        appointmentNote: clinicalFlagsForm.appointmentNote.trim() || null,
        preferredDayOfWeek: clinicalFlagsForm.preferredDayOfWeek,
        preferredEarliestTime: toTimePayload(clinicalFlagsForm.preferredEarliestTime),
        preferredLatestTime: toTimePayload(clinicalFlagsForm.preferredLatestTime),
        preferredArriveEarlyMinutes: parseInt(clinicalFlagsForm.preferredArriveEarlyMinutes, 10) || 0,
        namePronunciation: clinicalFlagsForm.namePronunciation.trim() || null,
        categoryTagIds: clinicalFlagsForm.categoryTagIds,
      };
      const res = await apiClient.put<ClinicalFlagsApiResponse>(`/api/patients/${id}/clinical-flags`, payload);
      setPatient(p => p ? {
        ...p,
        premedRequired: res.data.premedRequired,
        appointmentNote: res.data.appointmentNote,
        preferredDayOfWeek: res.data.preferredDayOfWeek,
        preferredEarliestTime: res.data.preferredEarliestTime,
        preferredLatestTime: res.data.preferredLatestTime,
        preferredArriveEarlyMinutes: res.data.preferredArriveEarlyMinutes,
        namePronunciation: res.data.namePronunciation,
        categoryTags: res.data.categoryTags,
      } : p);
      setEditingClinicalFlags(false);
      showSuccess('Clinical flags updated.');
    } catch (err) {
      const axiosErr = err as import('axios').AxiosError<{ detail?: string }>;
      showError(axiosErr.response?.data?.detail ?? 'Failed to save clinical flags.');
    } finally {
      setClinicalFlagsSaving(false);
    }
  };

  const handleClinicalFlagsCancel = () => setEditingClinicalFlags(false);

  // Address handlers
  const handleAddressEditOpen = () => {
    if (!patient) return;
    setAddressForm({
      addressLine1: patient.addressLine1 ?? '',
      addressLine2: patient.addressLine2 ?? '',
      city: patient.city ?? '',
      state: patient.state ?? '',
      postalCode: patient.postalCode ?? '',
      country: patient.country ?? '',
    });
    setAddressErrors({ addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: '' });
    setEditingAddress(true);
  };

  const validateAddressField = (field: string, value: string): string => {
    if (field === 'addressLine1' && value.length > 255) return 'Address line 1 cannot exceed 255 characters.';
    if (field === 'addressLine2' && value.length > 255) return 'Address line 2 cannot exceed 255 characters.';
    if (field === 'city' && value.length > 100) return 'City cannot exceed 100 characters.';
    if (field === 'state' && value.length > 50) return 'State cannot exceed 50 characters.';
    if (field === 'postalCode' && value.length > 20) return 'Postal code cannot exceed 20 characters.';
    if (field === 'country' && value.length > 100) return 'Country cannot exceed 100 characters.';
    return '';
  };

  const handleAddressBlur = (field: string, value: string) => {
    setAddressErrors(e => ({ ...e, [field]: validateAddressField(field, value) }));
  };

  const handleAddressSave = async () => {
    const errs = {
      addressLine1: validateAddressField('addressLine1', addressForm.addressLine1),
      addressLine2: validateAddressField('addressLine2', addressForm.addressLine2),
      city: validateAddressField('city', addressForm.city),
      state: validateAddressField('state', addressForm.state),
      postalCode: validateAddressField('postalCode', addressForm.postalCode),
      country: validateAddressField('country', addressForm.country),
    };
    setAddressErrors(errs);
    if (Object.values(errs).some(e => e)) return;

    if (!id) { showError('Invalid patient ID.'); return; }
    setAddressSaving(true);
    try {
      const payload = {
        addressLine1: addressForm.addressLine1.trim() || null,
        addressLine2: addressForm.addressLine2.trim() || null,
        city: addressForm.city.trim() || null,
        state: addressForm.state.trim() || null,
        postalCode: addressForm.postalCode.trim() || null,
        country: addressForm.country.trim() || null,
      };
      const res = await apiClient.put<{
        entityId: string;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        state: string | null;
        postalCode: string | null;
        country: string | null;
      }>(`/api/patients/${id}/address`, payload);
      setPatient(p => p ? {
        ...p,
        addressLine1: res.data.addressLine1,
        addressLine2: res.data.addressLine2,
        city: res.data.city,
        state: res.data.state,
        postalCode: res.data.postalCode,
        country: res.data.country,
      } : p);
      setEditingAddress(false);
      showSuccess('Address updated.');
    } catch {
      showError('Failed to update address.');
    } finally {
      setAddressSaving(false);
    }
  };

  const handleAddressCancel = () => setEditingAddress(false);

  const toggleCategoryTag = (tagId: string) =>
    setClinicalFlagsForm(f => ({
      ...f,
      categoryTagIds: f.categoryTagIds.includes(tagId)
        ? f.categoryTagIds.filter(t => t !== tagId)
        : [...f.categoryTagIds, tagId],
    }));

  const handleExportPatient = async () => {
    setExporting(true);
    try {
      const response = await apiClient.get(`/api/patients/${id}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient-${id}-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      showError('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notFound || !patient) {
    return (
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Patient Record</Typography>
        <Alert severity="error">Patient not found.</Alert>
      </Stack>
    );
  }

  const activeAlerts = patient.alerts.filter(a => a.isActive);
  const hasMedicalHistory = !!(
    patient.allergies || patient.medicalConditions ||
    patient.currentMedications || patient.medicalNotes
  );

  return (
    <Stack sx={{ height: '100%' }}>

      {/* Fixed header — identity + alerts stay in view */}
      <Stack spacing={2} sx={{ flexShrink: 0, mb: canViewChart ? 1 : 3 }}>
        <Stack direction="row" sx={{ alignItems: 'center' }} spacing={2}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
            {getInitials(patient.firstName, patient.lastName)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {patient.firstName} {patient.lastName}
              </Typography>
              {patient.namePronunciation && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  "{patient.namePronunciation}"
                </Typography>
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              DOB: {formatDob(patient.dateOfBirth)}
            </Typography>
          </Box>
          {/* Active Alerts + Premedication Badge — right-aligned in the header row */}
          {(activeAlerts.length > 0 || patient.premedRequired) && (
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
              {patient.premedRequired && (
                <Chip
                  icon={<WarningIcon />}
                  label="Premedication Required"
                  color="warning"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
              {activeAlerts.map(a => (
                <PatientAlertBadge
                  key={a.entityId}
                  alert={a}
                  onDismiss={a.alertType !== 'Allergy' ? () => handleDismissAlert(a) : undefined}
                />
              ))}
            </Stack>
          )}
          {user?.roles.includes(Role.PracticeOwner) && (
            <Button
              variant="outlined"
              startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={handleExportPatient}
              disabled={exporting}
            >
              {exporting ? 'Exporting...' : 'Export Patient Data'}
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Tabs — Overview / Chart — only for Dentist and Hygienist */}
      {canViewChart && (
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          aria-label="Patient sections"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label="Patient" icon={<PersonIcon />} iconPosition="start" />
          <Tab label="Chart" icon={<MonitorHeartIcon />} iconPosition="start" />
        </Tabs>
      )}

      {/* Chart tab — clinical chart panel */}
      {canViewChart && activeTab === 1 && (
        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <ClinicalChartPanel
            patientId={id!}
            patientName={`${patient.firstName} ${patient.lastName}`}
          />
        </Box>
      )}

      {/* Overview tab — scrollable card grid (always shown for non-clinical roles) */}
      {(!canViewChart || activeTab === 0) && (
      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <Stack spacing={3}>

      {/* Three-column: Demographics | Contact & Communication | Clinical Flags */}
      <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" sx={{ alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Demographics</Typography>
                {!editingDemographics && (
                  <Button size="small" variant="outlined" onClick={handleDemoEditOpen} sx={{ ml: 'auto' }}>
                    Edit
                  </Button>
                )}
              </Stack>
              {editingDemographics ? (
                <Stack spacing={1.5}>
                  <TextField
                    label="First Name"
                    size="small"
                    fullWidth
                    required
                    value={demoForm.firstName}
                    onChange={e => setDemoForm(f => ({ ...f, firstName: e.target.value }))}
                    onBlur={e => handleDemoBlur('firstName', e.target.value)}
                    error={!!demoErrors.firstName}
                    helperText={demoErrors.firstName}
                  />
                  <TextField
                    label="Last Name"
                    size="small"
                    fullWidth
                    required
                    value={demoForm.lastName}
                    onChange={e => setDemoForm(f => ({ ...f, lastName: e.target.value }))}
                    onBlur={e => handleDemoBlur('lastName', e.target.value)}
                    error={!!demoErrors.lastName}
                    helperText={demoErrors.lastName}
                  />
                  <TextField
                    label="Date of Birth"
                    type="date"
                    size="small"
                    fullWidth
                    required
                    value={demoForm.dateOfBirth}
                    onChange={e => setDemoForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                    onBlur={e => handleDemoBlur('dateOfBirth', e.target.value)}
                    error={!!demoErrors.dateOfBirth}
                    helperText={demoErrors.dateOfBirth}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    label="Email"
                    type="email"
                    size="small"
                    fullWidth
                    value={demoForm.email}
                    onChange={e => setDemoForm(f => ({ ...f, email: e.target.value }))}
                    onBlur={e => handleDemoBlur('email', e.target.value)}
                    error={!!demoErrors.email}
                    helperText={demoErrors.email}
                  />
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" size="small" onClick={handleDemoSave} disabled={demoSaving}>
                      {demoSaving ? <CircularProgress size={18} color="inherit" /> : 'Save'}
                    </Button>
                    <Button variant="outlined" size="small" onClick={handleDemoCancel} disabled={demoSaving}>
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                    <Typography variant="body2">{formatDob(patient.dateOfBirth)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Email</Typography>
                    <Typography variant="body2">{patient.email ?? '—'}</Typography>
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
      {/* Contact & Communication Preferences Card (Story 2.6) */}
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Stack direction="row" sx={{ alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Contact &amp; Communication</Typography>
            {!editingContact && (
              <Button size="small" variant="outlined" onClick={handleContactEditOpen} sx={{ ml: 'auto' }}>
                Edit
              </Button>
            )}
          </Stack>

          {editingContact ? (
            <Stack spacing={2}>
              {/* Phone Numbers */}
              <Box>
                <Stack direction="row" sx={{ alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">Phone Numbers</Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={addPhone}
                    disabled={contactForm.phoneNumbers.length >= 10}
                    sx={{ ml: 'auto' }}
                  >
                    Add Phone
                  </Button>
                </Stack>
                <Stack spacing={1}>
                  {contactForm.phoneNumbers.map((phone, idx) => (
                    <Stack key={phone._key} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                      <FormControl size="small" sx={{ minWidth: 110 }}>
                        <InputLabel>Type</InputLabel>
                        <Select
                          value={phone.phoneType}
                          label="Type"
                          onChange={(e: SelectChangeEvent) => updatePhone(idx, 'phoneType', e.target.value)}
                        >
                          {PHONE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <TextField
                        label="Number"
                        size="small"
                        value={phone.number}
                        onChange={e => updatePhone(idx, 'number', e.target.value)}
                        onBlur={e => handlePhoneNumberBlur(idx, e.target.value)}
                        error={!!phoneBlurErrors[idx]}
                        helperText={phoneBlurErrors[idx]}
                        sx={{ flex: 1 }}
                      />
                      <Tooltip title="Do Not Contact">
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={phone.doNotContact}
                              onChange={e => updatePhone(idx, 'doNotContact', e.target.checked)}
                            />
                          }
                          label="DNC"
                          sx={{ m: 0, whiteSpace: 'nowrap' }}
                        />
                      </Tooltip>
                      <Tooltip title="Remove phone number">
                        <IconButton
                          size="small"
                          aria-label="Remove phone number"
                          onClick={() => removePhone(idx)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  ))}
                  {contactForm.phoneNumbers.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No phone numbers. Click "Add Phone" to add one.
                    </Typography>
                  )}
                </Stack>
              </Box>

              {/* SMS Opt-In */}
              <FormControlLabel
                control={
                  <Switch
                    checked={contactForm.smsOptIn}
                    onChange={e => setContactForm(f => ({ ...f, smsOptIn: e.target.checked }))}
                  />
                }
                label="SMS Opt-In"
              />

              {/* Contact Method Preferences */}
              <Stack spacing={1.5}>
                <Typography variant="subtitle2">Contact Preferences</Typography>
                {(['appointmentContactMethod', 'financialContactMethod', 'marketingContactMethod'] as const).map(field => (
                  <FormControl key={field} size="small" fullWidth>
                    <InputLabel>
                      {field === 'appointmentContactMethod' ? 'Appointment' : field === 'financialContactMethod' ? 'Financial' : 'Marketing'}
                    </InputLabel>
                    <Select
                      value={contactForm[field]}
                      label={field === 'appointmentContactMethod' ? 'Appointment' : field === 'financialContactMethod' ? 'Financial' : 'Marketing'}
                      onChange={(e: SelectChangeEvent) => setContactForm(f => ({ ...f, [field]: e.target.value }))}
                    >
                      {CONTACT_METHODS.map(m => (
                        <MenuItem key={m} value={m}>{formatContactMethod(m)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ))}
              </Stack>

              {/* Actions */}
              <Stack direction="row" spacing={1}>
                <Button variant="contained" size="small" onClick={handleContactSave} disabled={contactSaving}>
                  {contactSaving ? <CircularProgress size={18} color="inherit" /> : 'Save'}
                </Button>
                <Button variant="outlined" size="small" onClick={handleContactCancel} disabled={contactSaving}>
                  Cancel
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              {/* Phone Numbers */}
              <Box>
                <Typography variant="caption" color="text.secondary">Phone Numbers</Typography>
                {patient.phoneNumbers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No phone numbers recorded.</Typography>
                ) : (
                  <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                    {patient.phoneNumbers.map(phone => (
                      <Stack key={phone.entityId} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Chip label={phone.phoneType} size="small" variant="outlined" />
                        <Typography variant="body2">{formatPhone(phone.number)}</Typography>
                        {phone.doNotContact && (
                          <Chip label="DNC" size="small" color="warning" />
                        )}
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Box>

              {/* SMS Opt-In */}
              <Box>
                <Typography variant="caption" color="text.secondary">SMS</Typography>
                <Typography variant="body2">{patient.smsOptIn ? 'Opted In' : 'Opted Out'}</Typography>
                {patient.smsOptedInAt && (
                  <Typography variant="caption" color="text.secondary">
                    Opted in {new Date(patient.smsOptedInAt).toLocaleDateString()}
                  </Typography>
                )}
              </Box>

              {/* Contact Method Preferences */}
              <Box>
                <Typography variant="caption" color="text.secondary">Contact Preferences</Typography>
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  <Stack direction="row" spacing={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>Appointment:</Typography>
                    <Typography variant="body2">{formatContactMethod(patient.appointmentContactMethod)}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>Financial:</Typography>
                    <Typography variant="body2">{formatContactMethod(patient.financialContactMethod)}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>Marketing:</Typography>
                    <Typography variant="body2">{formatContactMethod(patient.marketingContactMethod)}</Typography>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          )}
        </CardContent>
      </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
      {/* Clinical Flags & Scheduling Preferences Card (Story 2.7) */}
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Stack direction="row" sx={{ alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Clinical Flags &amp; Scheduling</Typography>
            {!editingClinicalFlags && (
              <Button size="small" variant="outlined" onClick={handleClinicalFlagsEditOpen} sx={{ ml: 'auto' }}>
                Edit
              </Button>
            )}
          </Stack>

          {editingClinicalFlags ? (
            <Stack spacing={2}>
              {/* Premedication */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={clinicalFlagsForm.premedRequired}
                    onChange={e => setClinicalFlagsForm(f => ({ ...f, premedRequired: e.target.checked }))}
                  />
                }
                label={
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <WarningIcon fontSize="small" color="warning" />
                    <Typography variant="body2">Premedication Required</Typography>
                  </Stack>
                }
              />

              {/* Name Pronunciation */}
              <TextField
                label="Name Pronunciation"
                size="small"
                fullWidth
                value={clinicalFlagsForm.namePronunciation}
                onChange={e => setClinicalFlagsForm(f => ({ ...f, namePronunciation: e.target.value }))}
                onBlur={e => handleClinicalFlagsBlur('namePronunciation', e.target.value)}
                error={!!clinicalFlagsErrors.namePronunciation}
                helperText={clinicalFlagsErrors.namePronunciation || 'e.g. "Say: Jo-say"'}
                slotProps={{ htmlInput: { maxLength: 255 } }}
              />

              {/* Appointment Note */}
              <TextField
                label="Appointment Note"
                size="small"
                fullWidth
                multiline
                minRows={2}
                value={clinicalFlagsForm.appointmentNote}
                onChange={e => {
                  const v = e.target.value;
                  setClinicalFlagsForm(f => ({ ...f, appointmentNote: v }));
                  if (v.length > 255) setClinicalFlagsErrors(er => ({ ...er, appointmentNote: 'Appointment note cannot exceed 255 characters.' }));
                  else setClinicalFlagsErrors(er => ({ ...er, appointmentNote: '' }));
                }}
                onBlur={e => handleClinicalFlagsBlur('appointmentNote', e.target.value)}
                error={!!clinicalFlagsErrors.appointmentNote}
                helperText={clinicalFlagsErrors.appointmentNote || `${clinicalFlagsForm.appointmentNote.length}/255 — shown on every appointment for this patient`}
                slotProps={{ htmlInput: { maxLength: 255 } }}
              />

              {/* Scheduling Preferences */}
              <Typography variant="subtitle2">Scheduling Preferences</Typography>
              <FormControl size="small" fullWidth>
                <InputLabel>Preferred Day</InputLabel>
                <Select
                  value={clinicalFlagsForm.preferredDayOfWeek}
                  label="Preferred Day"
                  onChange={(e: SelectChangeEvent) => setClinicalFlagsForm(f => ({ ...f, preferredDayOfWeek: e.target.value }))}
                >
                  {DAYS_OF_WEEK.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </Select>
              </FormControl>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label="Earliest Time"
                  type="time"
                  size="small"
                  fullWidth
                  value={clinicalFlagsForm.preferredEarliestTime}
                  onChange={e => setClinicalFlagsForm(f => ({ ...f, preferredEarliestTime: e.target.value }))}
                  onBlur={e => handleClinicalFlagsBlur('preferredEarliestTime', e.target.value)}
                  error={!!clinicalFlagsErrors.preferredEarliestTime}
                  helperText={clinicalFlagsErrors.preferredEarliestTime}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Latest Time"
                  type="time"
                  size="small"
                  fullWidth
                  value={clinicalFlagsForm.preferredLatestTime}
                  onChange={e => setClinicalFlagsForm(f => ({ ...f, preferredLatestTime: e.target.value }))}
                  onBlur={e => handleClinicalFlagsBlur('preferredLatestTime', e.target.value)}
                  error={!!clinicalFlagsErrors.preferredLatestTime}
                  helperText={clinicalFlagsErrors.preferredLatestTime}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>

              <TextField
                label="Arrive Early (minutes)"
                type="number"
                size="small"
                sx={{ maxWidth: 200 }}
                value={clinicalFlagsForm.preferredArriveEarlyMinutes}
                onChange={e => setClinicalFlagsForm(f => ({ ...f, preferredArriveEarlyMinutes: e.target.value }))}
                onBlur={e => handleClinicalFlagsBlur('preferredArriveEarlyMinutes', e.target.value)}
                error={!!clinicalFlagsErrors.preferredArriveEarlyMinutes}
                helperText={clinicalFlagsErrors.preferredArriveEarlyMinutes}
                slotProps={{ htmlInput: { min: 0, max: 120 } }}
              />

              {/* Category Tags */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.75 }}>Category Tags</Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  {AVAILABLE_TAGS.map(tag => {
                    const selected = clinicalFlagsForm.categoryTagIds.includes(tag);
                    return (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        clickable
                        color={selected ? 'primary' : 'default'}
                        variant={selected ? 'filled' : 'outlined'}
                        onClick={() => toggleCategoryTag(tag)}
                      />
                    );
                  })}
                  {/* Unknown tags (not in AVAILABLE_TAGS) — preserved from server, removable */}
                  {clinicalFlagsForm.categoryTagIds
                    .filter(id => !(AVAILABLE_TAGS as readonly string[]).includes(id))
                    .map(tag => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        color="primary"
                        variant="filled"
                        onDelete={() => toggleCategoryTag(tag)}
                      />
                    ))}
                </Stack>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button variant="contained" size="small" onClick={handleClinicalFlagsSave} disabled={clinicalFlagsSaving || Object.values(clinicalFlagsErrors).some(Boolean)}>
                  {clinicalFlagsSaving ? <CircularProgress size={18} color="inherit" /> : 'Save'}
                </Button>
                <Button variant="outlined" size="small" onClick={handleClinicalFlagsCancel} disabled={clinicalFlagsSaving}>
                  Cancel
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              {/* Premedication */}
              <Box>
                <Typography variant="caption" color="text.secondary">Premedication</Typography>
                {patient.premedRequired ? (
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.25 }}>
                    <WarningIcon fontSize="small" color="warning" />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.dark' }}>Required</Typography>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">Not required</Typography>
                )}
              </Box>

              {/* Name Pronunciation */}
              {patient.namePronunciation && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Name Pronunciation</Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>"{patient.namePronunciation}"</Typography>
                </Box>
              )}

              {/* Appointment Note */}
              <Box>
                <Typography variant="caption" color="text.secondary">Appointment Note</Typography>
                <Typography variant="body2">
                  {patient.appointmentNote
                    ? <span style={{ fontStyle: 'italic' }}>{patient.appointmentNote}</span>
                    : <span style={{ color: 'var(--mui-palette-text-secondary)' }}>—</span>}
                </Typography>
              </Box>

              {/* Scheduling Preferences */}
              <Box>
                <Typography variant="caption" color="text.secondary">Scheduling Preferences</Typography>
                <Stack component="table" sx={{ mt: 0.5, borderSpacing: 0 }}>
                  {[
                    ['Preferred Day', patient.preferredDayOfWeek || 'Any'],
                    ['Earliest', patient.preferredEarliestTime ? toTimeInput(patient.preferredEarliestTime) : '—'],
                    ['Latest', patient.preferredLatestTime ? toTimeInput(patient.preferredLatestTime) : '—'],
                    ['Arrive Early', `${patient.preferredArriveEarlyMinutes ?? 0} min`],
                  ].map(([label, value]) => (
                    <Box key={label} component="tr">
                      <Typography component="td" variant="body2" color="text.secondary" sx={{ pr: 2, py: 0.1, minWidth: 100 }}>{label}</Typography>
                      <Typography component="td" variant="body2">{value}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>

              {/* Category Tags */}
              <Box>
                <Typography variant="caption" color="text.secondary">Category Tags</Typography>
                {patient.categoryTags && patient.categoryTags.length > 0 ? (
                  <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                    {patient.categoryTags.map(t => (
                      <Chip key={t.tagId} label={t.tagId} size="small" color="primary" variant="outlined" />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">No tags assigned.</Typography>
                )}
              </Box>
            </Stack>
          )}
        </CardContent>
      </Card>
        </Grid>

        {/* Address Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" sx={{ alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Address</Typography>
                {!editingAddress && (
                  <Button size="small" variant="outlined" onClick={handleAddressEditOpen} sx={{ ml: 'auto' }}>
                    Edit
                  </Button>
                )}
              </Stack>

              {editingAddress ? (
                <Stack spacing={1.5}>
                  <TextField
                    label="Address Line 1"
                    size="small"
                    fullWidth
                    value={addressForm.addressLine1}
                    onChange={e => setAddressForm(f => ({ ...f, addressLine1: e.target.value }))}
                    onBlur={e => handleAddressBlur('addressLine1', e.target.value)}
                    error={!!addressErrors.addressLine1}
                    helperText={addressErrors.addressLine1}
                  />
                  <TextField
                    label="Address Line 2"
                    size="small"
                    fullWidth
                    value={addressForm.addressLine2}
                    onChange={e => setAddressForm(f => ({ ...f, addressLine2: e.target.value }))}
                    onBlur={e => handleAddressBlur('addressLine2', e.target.value)}
                    error={!!addressErrors.addressLine2}
                    helperText={addressErrors.addressLine2}
                  />
                  <TextField
                    label="City"
                    size="small"
                    fullWidth
                    value={addressForm.city}
                    onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))}
                    onBlur={e => handleAddressBlur('city', e.target.value)}
                    error={!!addressErrors.city}
                    helperText={addressErrors.city}
                  />
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="State"
                      size="small"
                      fullWidth
                      value={addressForm.state}
                      onChange={e => setAddressForm(f => ({ ...f, state: e.target.value }))}
                      onBlur={e => handleAddressBlur('state', e.target.value)}
                      error={!!addressErrors.state}
                      helperText={addressErrors.state}
                    />
                    <TextField
                      label="Postal Code"
                      size="small"
                      fullWidth
                      value={addressForm.postalCode}
                      onChange={e => setAddressForm(f => ({ ...f, postalCode: e.target.value }))}
                      onBlur={e => handleAddressBlur('postalCode', e.target.value)}
                      error={!!addressErrors.postalCode}
                      helperText={addressErrors.postalCode}
                    />
                  </Stack>
                  <TextField
                    label="Country"
                    size="small"
                    fullWidth
                    value={addressForm.country}
                    onChange={e => setAddressForm(f => ({ ...f, country: e.target.value }))}
                    onBlur={e => handleAddressBlur('country', e.target.value)}
                    error={!!addressErrors.country}
                    helperText={addressErrors.country}
                  />
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleAddressSave}
                      disabled={addressSaving || Object.values(addressErrors).some(Boolean)}
                    >
                      {addressSaving ? <CircularProgress size={18} color="inherit" /> : 'Save'}
                    </Button>
                    <Button variant="outlined" size="small" onClick={handleAddressCancel} disabled={addressSaving}>
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Address Line 1</Typography>
                    <Typography variant="body2">{patient.addressLine1 ?? '—'}</Typography>
                  </Box>
                  {patient.addressLine2 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Address Line 2</Typography>
                      <Typography variant="body2">{patient.addressLine2}</Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="caption" color="text.secondary">City</Typography>
                    <Typography variant="body2">{patient.city ?? '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">State</Typography>
                    <Typography variant="body2">{patient.state ?? '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Postal Code</Typography>
                    <Typography variant="body2">{patient.postalCode ?? '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Country</Typography>
                    <Typography variant="body2">{patient.country ?? '—'}</Typography>
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Medical History | Documents | Upcoming Appointments */}
      <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
        <Grid size={{ xs: 12, md: 4 }}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Stack direction="row" sx={{ alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Medical History</Typography>
            {!editingMedicalHistory && (
              <Button size="small" variant="outlined" onClick={handleMedEditOpen} sx={{ ml: 'auto' }}>
                Edit
              </Button>
            )}
          </Stack>
          {editingMedicalHistory ? (
            <Stack spacing={1.5}>
              <TextField
                label="Allergies"
                multiline
                minRows={2}
                size="small"
                fullWidth
                value={medForm.allergies}
                onChange={e => setMedForm(f => ({ ...f, allergies: e.target.value }))}
              />
              <TextField
                label="Medical Conditions"
                multiline
                minRows={2}
                size="small"
                fullWidth
                value={medForm.medicalConditions}
                onChange={e => setMedForm(f => ({ ...f, medicalConditions: e.target.value }))}
              />
              <TextField
                label="Current Medications"
                multiline
                minRows={2}
                size="small"
                fullWidth
                value={medForm.currentMedications}
                onChange={e => setMedForm(f => ({ ...f, currentMedications: e.target.value }))}
              />
              <TextField
                label="Notes"
                multiline
                minRows={3}
                size="small"
                fullWidth
                value={medForm.medicalNotes}
                onChange={e => setMedForm(f => ({ ...f, medicalNotes: e.target.value }))}
              />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" size="small" onClick={handleMedSave} disabled={medSaving}>
                  {medSaving ? <CircularProgress size={18} color="inherit" /> : 'Save'}
                </Button>
                <Button variant="outlined" size="small" onClick={handleMedCancel} disabled={medSaving}>
                  Cancel
                </Button>
              </Stack>
            </Stack>
          ) : hasMedicalHistory ? (
            <Stack spacing={1.5}>
              {patient.allergies && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Allergies</Typography>
                  <Typography variant="body2">{patient.allergies}</Typography>
                </Box>
              )}
              {patient.medicalConditions && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Medical Conditions</Typography>
                  <Typography variant="body2">{patient.medicalConditions}</Typography>
                </Box>
              )}
              {patient.currentMedications && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Current Medications</Typography>
                  <Typography variant="body2">{patient.currentMedications}</Typography>
                </Box>
              )}
              {patient.medicalNotes && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body2">{patient.medicalNotes}</Typography>
                </Box>
              )}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No medical history recorded.
            </Typography>
          )}
        </CardContent>
      </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Documents</Typography>
              {id && <PatientDocumentsPanel patientId={id} />}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Upcoming Appointments</Typography>
              {appointmentsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : appointmentsError ? (
                <Alert severity="error" sx={{ mt: 1 }}>Failed to load appointments.</Alert>
              ) : upcomingAppointments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No upcoming appointments.</Typography>
              ) : (
                <List disablePadding>
                  {upcomingAppointments.map((appt, idx) => (
                    <Box key={appt.entityId}>
                      {idx > 0 && <Divider />}
                      <ListItem disablePadding sx={{ py: 1 }}>
                        <ListItemText
                          primary={new Date(appt.slotStart).toLocaleString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric',
                            hour: 'numeric', minute: '2-digit',
                          })}
                          secondary={appt.appointmentType}
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

        </Stack>
      </Box>
      )}

      {/* Dialogs and Snackbars — outside the scroll area */}
      <Dialog
        open={!!confirmDismiss}
        onClose={() => setConfirmDismiss(null)}
        maxWidth="xs"
        aria-labelledby="dismiss-alert-dialog-title"
      >
        <DialogTitle id="dismiss-alert-dialog-title">Dismiss Alert</DialogTitle>
        <DialogContent>
          <Typography>
            Dismiss '{confirmDismiss?.title}'? This action is permanent.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDismiss(null)} disabled={dismissing !== null}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleConfirmDismiss}
            disabled={dismissing !== null}
          >
            {dismissing !== null ? <CircularProgress size={18} color="inherit" /> : 'Dismiss'}
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

    </Stack>
  );
}
