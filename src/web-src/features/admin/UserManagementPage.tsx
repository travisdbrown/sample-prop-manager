import {
  Box, Typography, Button, CircularProgress, Snackbar, Alert, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types/auth';

interface UserSummaryResponse {
  entityId: string;
  email: string;
  roles: Role[];
  isActive: boolean;
  createdAt: string;
}
interface InviteUserRequest { email: string; roles: Role[]; }
interface ChangeUserRoleRequest { roles: Role[]; }

export default function UserManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deactivateTarget, setDeactivateTarget] = useState<UserSummaryResponse | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteEmailError, setInviteEmailError] = useState<string | null>(null);
  const [inviteRoles, setInviteRoles] = useState<Role[]>([Role.FrontDesk]);
  const [inviting, setInviting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false, message: '', severity: 'success' as 'success' | 'error', autoHide: true,
  });

  const closeSnackbar = () => setSnackbar(s => ({ ...s, open: false }));
  const showSuccess = (msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'success', autoHide: true });
  const showError = (msg: string) =>
    setSnackbar({ open: true, message: msg, severity: 'error', autoHide: false });

  useEffect(() => {
    apiClient.get<UserSummaryResponse[]>('/api/identity/users')
      .then(res => setUsers(res.data))
      .catch(() => showError('Failed to load users.'))
      .finally(() => setLoading(false));
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail || inviteEmailError || inviteRoles.length === 0) return;
    setInviting(true);
    try {
      const body: InviteUserRequest = { email: inviteEmail, roles: inviteRoles };
      const res = await apiClient.post<UserSummaryResponse>('/api/identity/users/invite', body);
      setUsers(prev => [...prev, {
        entityId: res.data.entityId,
        email: res.data.email,
        roles: res.data.roles,
        isActive: true,
        createdAt: new Date().toISOString(),
      }]);
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRoles([Role.FrontDesk]);
      showSuccess(`Invitation sent to ${inviteEmail}.`);
    } catch {
      showError('Failed to send invitation. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    const target = deactivateTarget; // capture before clearing
    setDeactivating(true);
    setDeactivateTarget(null); // close dialog immediately (optimistic feel)
    setUsers(prev => prev.map(u =>
      u.entityId === target.entityId ? { ...u, isActive: false } : u
    ));
    try {
      await apiClient.post(`/api/identity/users/${target.entityId}/deactivate`);
      showSuccess('Access revoked.');
    } catch {
      // Rollback optimistic update on failure
      setUsers(prev => prev.map(u =>
        u.entityId === target.entityId ? { ...u, isActive: true } : u
      ));
      showError('Failed to deactivate account. Please try again.');
    } finally {
      setDeactivating(false);
    }
  };

  const handleRoleChange = async (userId: string, newRoles: Role[]) => {
    if (newRoles.length === 0) return;
    try {
      await apiClient.patch(`/api/identity/users/${userId}/role`, { roles: newRoles } satisfies ChangeUserRoleRequest);
      setUsers(prev => prev.map(u => u.entityId === userId ? { ...u, roles: newRoles } : u));
      showSuccess("Roles updated. Changes take effect on user's next login.");
    } catch {
      showError('Failed to update roles.');
    }
  };

  const handleEmailBlur = () => {
    if (!inviteEmail) {
      setInviteEmailError('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      setInviteEmailError('Enter a valid email address');
    } else {
      setInviteEmailError(null);
    }
  };

  if (!user) return <Navigate to="/login" replace />;
  if (!user.roles.some(r => r === Role.PracticeOwner || r === Role.OfficeManager)) return <Navigate to="/" replace />;

  const isPracticeOwner = user.roles.includes(Role.PracticeOwner);
  const ALL_ROLES: Role[] = [Role.PracticeOwner, Role.OfficeManager, Role.FrontDesk, Role.Dentist, Role.Hygienist];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>User Management</Typography>
        <Button variant="contained" onClick={() => setInviteOpen(true)}>Invite Staff Member</Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PeopleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>No staff accounts yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Invite your first team member to get started.
          </Typography>
          <Button variant="contained" onClick={() => setInviteOpen(true)}>Invite Staff Member</Button>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
                {isPracticeOwner && <TableCell>Change Role</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.entityId}>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {u.roles.map(r => <Chip key={r} label={r} size="small" color="primary" />)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={u.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {u.isActive && u.entityId !== user.userId && (
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => setDeactivateTarget(u)}
                        >
                          Deactivate
                        </Button>
                      )}
                      {isPracticeOwner && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/admin/audit?userId=${encodeURIComponent(u.entityId)}`)}
                        >
                          View Audit Log
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                  {isPracticeOwner && (
                    <TableCell>
                      <Select
                        multiple
                        size="small"
                        value={u.roles}
                        onChange={e => handleRoleChange(u.entityId, e.target.value as Role[])}
                        renderValue={(selected) => (selected as Role[]).join(', ')}
                        sx={{ minWidth: 200 }}
                      >
                        {ALL_ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                      </Select>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Deactivate Confirmation Dialog */}
      <Dialog
        open={!!deactivateTarget}
        onClose={() => !deactivating && setDeactivateTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Deactivate Account</DialogTitle>
        <DialogContent>
          <Typography>
            Deactivate <strong>{deactivateTarget?.email}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will immediately revoke all system access. Active sessions will be terminated.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeactivateTarget(null)}
            disabled={deactivating}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeactivate}
            disabled={deactivating}
          >
            {deactivating ? <CircularProgress size={20} color="inherit" /> : 'Deactivate Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Invite Staff Member</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Email *"
            type="email"
            fullWidth
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            onBlur={handleEmailBlur}
            error={!!inviteEmailError}
            helperText={inviteEmailError}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Roles * (select one or more)</InputLabel>
            <Select
              multiple
              label="Roles * (select one or more)"
              value={inviteRoles}
              onChange={e => setInviteRoles(e.target.value as Role[])}
              renderValue={(selected) => (selected as Role[]).join(', ')}
            >
              {ALL_ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setInviteOpen(false); setInviteEmail(''); setInviteEmailError(null); setInviteRoles([Role.FrontDesk]); }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={inviting || !inviteEmail || !!inviteEmailError || inviteRoles.length === 0}
            onClick={handleInvite}
          >
            {inviting ? <CircularProgress size={20} color="inherit" /> : 'Send Invitation'}
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
    </Box>
  );
}
