import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardActionArea,
  Skeleton, Alert, Snackbar, Chip,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import PeopleIcon from '@mui/icons-material/People';
import MailIcon from '@mui/icons-material/Mail';
import SecurityIcon from '@mui/icons-material/Security';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import { Role } from '../../types/auth';

// ── Types ──────────────────────────────────────────────────────────────────

interface UserSummaryResponse {
  entityId: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface AuditLogEntryResponse {
  id: number;
  entityType: string;
  action: string;
  entityId: string;
  userId: string;
  tenantId: string;
  timestamp: string;
}

interface AuditLogsResponse {
  items: AuditLogEntryResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ── KpiCard ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  loading?: boolean;
  color?: 'primary' | 'warning' | 'error';
  onClick?: () => void;
}

function KpiCard({ title, value, icon, loading = false, color = 'primary', onClick }: KpiCardProps) {
  const content = (
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box sx={{ color: 'primary.main' }}>{icon}</Box>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{title}</Typography>
      </Box>
      <Box aria-live="polite" aria-atomic="true">
        {loading ? (
          <Skeleton variant="rectangular" height={40} />
        ) : (
          <Typography variant="h4" sx={{ fontWeight: 600, color: `${color}.main` }}>
            {value}
          </Typography>
        )}
      </Box>
    </CardContent>
  );

  return (
    <Card variant="outlined">
      {onClick ? <CardActionArea onClick={onClick}>{content}</CardActionArea> : content}
    </Card>
  );
}

// ── ActionCard ─────────────────────────────────────────────────────────────

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function ActionCard({ title, description, icon, onClick }: ActionCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' }, transition: 'border-color 0.2s' }}
    >
      <CardActionArea onClick={onClick}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box sx={{ color: 'primary.main' }}>{icon}</Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{title}</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">{description}</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// ── AdminPage ──────────────────────────────────────────────────────────────

const STALE_INVITE_MS = 48 * 60 * 60 * 1000;

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isPracticeOwner = user?.roles.includes(Role.PracticeOwner) ?? false;
  const isOfficeManager = user?.roles.includes(Role.OfficeManager) ?? false;

  const [users, setUsers] = useState<UserSummaryResponse[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditLogEntryResponse[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(isPracticeOwner);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  useEffect(() => {
    apiClient
      .get<UserSummaryResponse[]>('/api/identity/users')
      .then((res) => setUsers(res.data))
      .catch(() => setSnackbar({ open: true, message: 'Failed to load user data' }))
      .finally(() => setUsersLoading(false));

    if (isPracticeOwner) {
      apiClient
        .get<AuditLogsResponse>('/api/audit/logs', { params: { pageSize: 5 } })
        .then((res) => setAuditEntries(res.data.items))
        .catch(() => setSnackbar({ open: true, message: 'Failed to load audit log' }))
        .finally(() => setAuditLoading(false));
    }
  }, [isPracticeOwner]);

  // Derived values
  const activeStaffCount = users.filter((u) => u.isActive).length;
  const pendingUsers = users.filter((u) => !u.isActive && u.role != null && u.role !== '');
  const pendingInviteCount = pendingUsers.length;
  const stalePendingCount = pendingUsers.filter((u) => {
    const ts = new Date(u.createdAt).getTime();
    return !isNaN(ts) && new Date().getTime() - ts > STALE_INVITE_MS;
  }).length;
  const hasAnomalies = (auditEntries ?? []).some((e) => e.action === 'DELETED');

  const pageHeading = isOfficeManager ? 'Team Management' : 'Admin';

  const auditColumns: GridColDef<AuditLogEntryResponse>[] = [
    {
      field: 'timestamp',
      headerName: 'Time',
      width: 170,
      valueFormatter: (value: string) =>
        new Date(value).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
    },
    { field: 'userId', headerName: 'User', flex: 1 },
    {
      field: 'action',
      headerName: 'Action',
      width: 130,
      renderCell: ({ value, row }) =>
        row.action === 'DELETED' ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <WarningAmberIcon fontSize="small" color="warning" />
            <Chip size="small" label={value as string} color="warning" />
          </Box>
        ) : (
          <Chip size="small" label={value as string} />
        ),
    },
    {
      field: 'entityType',
      headerName: 'Record',
      width: 180,
      valueGetter: (_value: unknown, row: AuditLogEntryResponse) =>
        `${row.entityType} ${row.entityId.slice(-6)}`,
    },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        {pageHeading}
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <KpiCard
            title="Active Staff"
            value={usersLoading ? '…' : activeStaffCount}
            icon={<PeopleIcon />}
            loading={usersLoading}
            onClick={() => navigate('/admin/users')}
          />
        </Grid>

        {isPracticeOwner && (
          <>
            <Grid size={{ xs: 12, sm: 4 }}>
              <KpiCard
                title="Pending Invitations"
                value={usersLoading ? '…' : pendingInviteCount}
                icon={<MailIcon />}
                loading={usersLoading}
                color={stalePendingCount > 0 ? 'warning' : 'primary'}
                onClick={() => navigate('/admin/users')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <KpiCard
                title="Audit Events (24h)"
                value={auditLoading ? '…' : auditEntries.length}
                icon={<SecurityIcon />}
                loading={auditLoading}
                color={hasAnomalies ? 'error' : 'primary'}
                onClick={() => navigate('/admin/audit')}
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* Quick Action Cards */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Quick Actions</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ActionCard
            title="Manage Users"
            description="Invite staff, manage roles, deactivate accounts"
            icon={<ManageAccountsIcon />}
            onClick={() => navigate('/admin/users')}
          />
        </Grid>
        {isPracticeOwner && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <ActionCard
              title="Audit Log"
              description="Review compliance events and system activity"
              icon={<SecurityIcon />}
              onClick={() => navigate('/admin/audit')}
            />
          </Grid>
        )}
      </Grid>

      {/* Recent Audit Events — PracticeOwner only */}
      {isPracticeOwner && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Recent Audit Events</Typography>
          {auditLoading ? (
            <Skeleton variant="rectangular" height={200} />
          ) : (
            <DataGrid
              rows={auditEntries}
              columns={auditColumns}
              getRowId={(row) => row.id}
              hideFooter
              disableRowSelectionOnClick
              getRowClassName={({ row }) => (row.action === 'DELETED' ? 'audit-anomaly-row' : '')}
              sx={{
                '& .audit-anomaly-row': {
                  backgroundColor: 'warning.light',
                  '&:hover': { backgroundColor: 'warning.light' },
                },
              }}
              aria-label="Recent audit events"
            />
          )}
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
