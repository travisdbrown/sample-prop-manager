import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsIcon from '@mui/icons-material/Notifications';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import type { SvgIconComponent } from '@mui/icons-material';

const ICON_MAP: Record<string, SvgIconComponent> = {
  dashboard: DashboardIcon,
  person: PersonIcon,
  people: PeopleIcon,
  calendar: CalendarMonthIcon,
  medical: MedicalServicesIcon,
  admin: AdminPanelSettingsIcon,
  'manage-accounts': ManageAccountsIcon,
  security: SecurityIcon,
  notifications: NotificationsIcon,
  page: InsertDriveFileIcon,
};

interface TabItemProps {
  id: string;
  label: string;
  icon?: string;
  isActive: boolean;
  isDirty: boolean;
  isCloseable: boolean;
  onSelect: () => void;
  onClose: () => void;
}

export default function TabItem({ label, icon, isActive, isDirty, isCloseable, onSelect, onClose }: TabItemProps) {
  const IconComponent = icon ? (ICON_MAP[icon] ?? InsertDriveFileIcon) : null;

  return (
    <Box
      role="tab"
      tabIndex={isActive ? 0 : -1}
      aria-selected={isActive}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1.5,
        mt: '4px',
        height: 'calc(100% - 4px)',
        cursor: 'pointer',
        borderRadius: '8px 8px 0 0',
        borderBottomWidth: 0,
        backgroundColor: isActive ? 'primary.main' : 'transparent',
        color: isActive ? 'primary.contrastText' : 'text.secondary',
        flexShrink: 0,
        transition: 'background-color 0.15s, color 0.15s',
        '&:hover': {
          backgroundColor: isActive ? 'primary.dark' : 'action.hover',
          color: isActive ? 'primary.contrastText' : 'text.primary',
        },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: '-2px' },
        userSelect: 'none',
      }}
    >
      {IconComponent && (
        <IconComponent sx={{ fontSize: 14, color: 'inherit', flexShrink: 0 }} />
      )}
      {isDirty && (
        <FiberManualRecordIcon sx={{ fontSize: 8, color: 'inherit', opacity: 0.8, flexShrink: 0 }} />
      )}
      <Tooltip title={label} enterDelay={800} placement="bottom">
        <Typography
          variant="body2"
          noWrap
          sx={{ maxWidth: { xs: 100, md: 140 }, fontSize: '0.8125rem' }}
        >
          {label}
        </Typography>
      </Tooltip>
      {isCloseable && (
        <IconButton
          size="small"
          aria-label={`Close ${label} tab`}
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          sx={{
            p: 0.25,
            ml: 0.25,
            flexShrink: 0,
            color: 'inherit',
            opacity: 0.75,
            '&:hover': { opacity: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
          }}
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>
      )}
    </Box>
  );
}
