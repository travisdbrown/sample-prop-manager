import { Chip } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

interface PatientAlertSummary {
  entityId: string;
  alertType: string;
  title: string;
}

interface PatientAlertBadgeProps {
  alert: PatientAlertSummary;
  onDismiss?: () => void;
}

export default function PatientAlertBadge({ alert, onDismiss }: PatientAlertBadgeProps) {
  const isAllergy = alert.alertType === 'Allergy';

  return (
    <span role="status" style={{ display: 'inline-flex' }}>
      <Chip
        color={isAllergy ? 'error' : 'warning'}
        icon={isAllergy ? <WarningIcon /> : <InfoIcon />}
        label={alert.title}
        size="small"
        onDelete={onDismiss}
      />
    </span>
  );
}
