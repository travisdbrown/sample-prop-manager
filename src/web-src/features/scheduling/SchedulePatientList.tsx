import { useState, useMemo } from 'react';
import {
  Box, Typography, TextField, InputAdornment, List, ListItemButton, ListItemText, Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';

interface AppointmentResponse {
  entityId: string;
  patientId: string;
  patientName: string;
  providerId: string;
  appointmentType: string;
  status: string;
  slotStart: string;
  slotEnd: string;
}

interface SchedulePatientListProps {
  appointments: AppointmentResponse[];
  selectedPatientId: string | null;
  onPatientSelect: (patientId: string, appointmentId: string) => void;
  onBookAppointment: () => void;
}

export default function SchedulePatientList({
  appointments,
  selectedPatientId,
  onPatientSelect,
  onBookAppointment,
}: SchedulePatientListProps) {
  const [filterTerm, setFilterTerm] = useState('');
  const todayStr = new Date().toDateString();

  const todayAppts = useMemo(
    () =>
      appointments
        .filter(a => new Date(a.slotStart).toDateString() === todayStr)
        .sort((a, b) => new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime()),
    [appointments],
  );

  const visible = todayAppts.filter(a =>
    (a.patientName || a.appointmentType).toLowerCase().includes(filterTerm.toLowerCase()),
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>Today's Patients</Typography>
        <TextField
          size="small"
          fullWidth
          placeholder="Filter patients…"
          value={filterTerm}
          onChange={e => setFilterTerm(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
      <List dense sx={{ flex: 1, overflow: 'auto', py: 0 }}>
        {visible.length === 0 && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No patients today.</Typography>
          </Box>
        )}
        {visible.map(appt => {
          const isSelected = appt.patientId === selectedPatientId;
          const displayName = appt.patientName || `Patient (${appt.appointmentType})`;
          return (
            <ListItemButton
              key={appt.entityId}
              selected={isSelected}
              onClick={() => onPatientSelect(appt.patientId, appt.entityId)}
              sx={{
                borderLeft: isSelected ? '3px solid' : '3px solid transparent',
                borderLeftColor: isSelected ? 'primary.main' : 'transparent',
                bgcolor: isSelected ? 'primary.light' : 'transparent',
                minHeight: 44,
                '&.Mui-selected': { bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.light' } },
              }}
            >
              <ListItemText
                primary={displayName}
                secondary={`${new Date(appt.slotStart).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · ${appt.appointmentType}`}
                slotProps={{
                  primary: { style: { fontWeight: isSelected ? 600 : 400, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: '0.875rem' } },
                  secondary: { style: { overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: '0.75rem' } },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
        <Button fullWidth variant="outlined" size="small" startIcon={<AddIcon />} onClick={onBookAppointment}>
          Book Appointment
        </Button>
      </Box>
    </Box>
  );
}
