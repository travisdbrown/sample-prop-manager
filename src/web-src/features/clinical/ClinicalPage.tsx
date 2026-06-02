import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar, Box, Button, Chip, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import apiClient from '../../services/apiClient';
import ClinicalChartPanel from './ClinicalChartPanel';

interface PatientSummary {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string | null;
  phone: string | null;
  premedRequired?: boolean;
  namePronunciation?: string | null;
}

const formatDob = (dob: string) =>
  new Date(dob + 'T00:00:00').toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric',
  });

const getInitials = (first: string, last: string) =>
  ((first[0] ?? '') + (last[0] ?? '')).toUpperCase();

export default function ClinicalPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const patientLoadRef = useRef<string | null>(null);

  useEffect(() => {
    if (patientId && patientLoadRef.current !== patientId) {
      patientLoadRef.current = patientId;
      apiClient.get<PatientSummary>(`/api/patients/${patientId}`)
        .then(res => setPatient(res.data))
        .catch(() => {});
    }
  }, [patientId]);

  if (!patientId) return null;

  return (
    <Box>
      {/* Patient header strip */}
      {patient && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, fontSize: '1.5rem' }}>
            {getInitials(patient.firstName, patient.lastName)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {patient.firstName} {patient.lastName}
              </Typography>
              {patient.namePronunciation && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  ({patient.namePronunciation})
                </Typography>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" noWrap>
              DOB: {formatDob(patient.dateOfBirth)}
              {patient.phone && ` · ${patient.phone}`}
            </Typography>
            {patient.premedRequired && (
              <Chip
                icon={<WarningAmberIcon />}
                label="Premedication Required"
                color="warning"
                size="small"
                sx={{ mt: 0.75, fontWeight: 600 }}
              />
            )}
          </Box>
          <Button
            variant="outlined"
            startIcon={<PersonIcon />}
            onClick={() => navigate(`/patients/${patientId}`)}
            sx={{ flexShrink: 0 }}
          >
            Patient
          </Button>
        </Box>
      )}

      <ClinicalChartPanel
        patientId={patientId}
        patientName={patient ? `${patient.firstName} ${patient.lastName}` : undefined}
      />
    </Box>
  );
}
