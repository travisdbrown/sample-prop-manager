import {
  Box, Typography, Button, CircularProgress, Snackbar, Alert, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, TextField, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types/auth';

interface AuditLogEntry {
  id: number;
  entityType: string;
  action: string;
  entityId: string;
  userId: string;
  tenantId: string;
  timestamp: string;
}

interface AuditLogsResponse {
  items: AuditLogEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
}

type ActionFilter = 'ALL' | 'ADDED' | 'MODIFIED' | 'DELETED' | 'EXPORTED';

export default function AuditLogPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const preFilterUserId = searchParams.get('userId') ?? '';

  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0); // MUI TablePagination is 0-based
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filter state — initialize userId from URL param for pre-filter from UserManagementPage
  const [userIdFilter, setUserIdFilter] = useState(preFilterUserId);
  const [actionFilter, setActionFilter] = useState<ActionFilter>('ALL');
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');

  // Applied filters (committed on search, not on every keystroke)
  const [appliedUserId, setAppliedUserId] = useState(preFilterUserId);
  const [appliedAction, setAppliedAction] = useState<ActionFilter>('ALL');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');

  const [snackbar, setSnackbar] = useState({
    open: false, message: '', severity: 'error' as 'success' | 'warning' | 'error',
  });

  const closeSnackbar = () => setSnackbar(s => ({ ...s, open: false }));

  // Sync filter fields when the ?userId= URL param changes (e.g. navigating back with a different user).
  // Reset all applied filters so stale date/action state doesn't silently narrow the new userId view.
  useEffect(() => {
    const uid = searchParams.get('userId') ?? '';
    setUserIdFilter(uid);
    setAppliedUserId(uid);
    setActionFilter('ALL');
    setAppliedAction('ALL');
    setFromFilter('');
    setAppliedFrom('');
    setToFilter('');
    setAppliedTo('');
    setPage(0);
  }, [searchParams]);

  const buildQueryParams = useCallback((overrides?: Record<string, string>) => {
    const params = new URLSearchParams();
    const userId = overrides?.userId ?? appliedUserId;
    const action = overrides?.action ?? appliedAction;
    const from = overrides?.from ?? appliedFrom;
    const to = overrides?.to ?? appliedTo;
    const p = overrides?.page ?? String(page + 1);
    const ps = overrides?.pageSize ?? String(pageSize);

    if (userId) params.set('userId', userId);
    if (action && action !== 'ALL') params.set('action', action);
    // Append UTC qualifiers so the backend DateTimeOffset parser receives an unambiguous value.
    // MUI date inputs return YYYY-MM-DD; without a timezone suffix SQL Server defaults to local time.
    if (from) params.set('from', `${from}T00:00:00Z`);
    if (to) params.set('to', `${to}T23:59:59Z`);
    params.set('page', p);
    params.set('pageSize', ps);
    if (overrides?.format) params.set('format', overrides.format);
    return params.toString();
  }, [appliedUserId, appliedAction, appliedFrom, appliedTo, page, pageSize]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<AuditLogsResponse>(`/api/audit/logs?${buildQueryParams()}`);
      setEntries(res.data.items);
      setTotalCount(res.data.totalCount);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load audit records.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleApplyFilters = () => {
    if (fromFilter && toFilter && fromFilter > toFilter) {
      setSnackbar({ open: true, message: "'From' date must be earlier than or equal to 'To' date.", severity: 'error' });
      return;
    }
    setAppliedUserId(userIdFilter);
    setAppliedAction(actionFilter);
    setAppliedFrom(fromFilter);
    setAppliedTo(toFilter);
    setPage(0);
  };

  const handleClearFilters = () => {
    setUserIdFilter('');
    setActionFilter('ALL');
    setFromFilter('');
    setToFilter('');
    setAppliedUserId('');
    setAppliedAction('ALL');
    setAppliedFrom('');
    setAppliedTo('');
    setPage(0);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportPageSize = 200;
      const params = buildQueryParams({ format: 'pdf', page: '1', pageSize: String(exportPageSize) });
      const response = await apiClient.get(`/api/audit/logs?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/html' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const truncatedTotal = response.headers['x-export-truncated'];
      if (truncatedTotal) {
        setSnackbar({
          open: true,
          message: `Export contains the first ${exportPageSize} of ${truncatedTotal} matching records. Narrow the date range to export all records.`,
          severity: 'warning',
        });
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to export audit log.', severity: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const activeChips: { label: string; onDelete: () => void }[] = [];
  if (appliedUserId) activeChips.push({ label: `User: ${appliedUserId}`, onDelete: () => { setUserIdFilter(''); setAppliedUserId(''); setPage(0); } });
  if (appliedAction !== 'ALL') activeChips.push({ label: `Action: ${appliedAction}`, onDelete: () => { setActionFilter('ALL'); setAppliedAction('ALL'); setPage(0); } });
  if (appliedFrom) activeChips.push({ label: `From: ${appliedFrom}`, onDelete: () => { setFromFilter(''); setAppliedFrom(''); setPage(0); } });
  if (appliedTo) activeChips.push({ label: `To: ${appliedTo}`, onDelete: () => { setToFilter(''); setAppliedTo(''); setPage(0); } });

  const hasDeletedAuditEntity = entries.some(e => e.action === 'DELETED');

  if (!user) return <Navigate to="/login" replace />;
  if (!user.roles.includes(Role.PracticeOwner)) return <Navigate to="/" replace />;

  return (
    <Box sx={{ p: 3, maxWidth: 1200 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Audit Log</Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={handleExport}
          disabled={exporting}
          startIcon={exporting ? <CircularProgress size={16} /> : undefined}
        >
          Export PDF
        </Button>
      </Box>

      {/* Filter controls */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <TextField
          label="User ID / Email"
          size="small"
          value={userIdFilter}
          onChange={e => setUserIdFilter(e.target.value)}
          sx={{ minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Action</InputLabel>
          <Select
            label="Action"
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value as ActionFilter)}
          >
            <MenuItem value="ALL">All</MenuItem>
            <MenuItem value="ADDED">ADDED</MenuItem>
            <MenuItem value="MODIFIED">MODIFIED</MenuItem>
            <MenuItem value="DELETED">DELETED</MenuItem>
            <MenuItem value="EXPORTED">EXPORTED</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="From"
          type="date"
          size="small"
          value={fromFilter}
          onChange={e => setFromFilter(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          label="To"
          type="date"
          size="small"
          value={toFilter}
          onChange={e => setToFilter(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 160 }}
        />
        <Button variant="contained" onClick={handleApplyFilters}>Apply Filters</Button>
        {activeChips.length > 0 && (
          <Button variant="text" onClick={handleClearFilters}>Clear All</Button>
        )}
      </Box>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {activeChips.map(chip => (
            <Chip
              key={chip.label}
              label={chip.label}
              onDelete={chip.onDelete}
              size="small"
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      )}

      {/* Anomaly alert — any DELETED record warrants attention */}
      {hasDeletedAuditEntity && (
        <Alert severity="warning" role="alert" sx={{ mb: 2 }}>
          This log contains DELETED records. Review carefully for compliance.
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : entries.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SecurityIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>No audit records found for the applied filters.</Typography>
          {activeChips.length > 0 && (
            <Button variant="outlined" onClick={handleClearFilters} sx={{ mt: 1 }}>
              Clear Filters
            </Button>
          )}
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp (UTC)</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Entity Type</TableCell>
                  <TableCell>Entity ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {new Date(entry.timestamp).toLocaleString('en-US', { timeZone: 'UTC', hour12: false })}
                    </TableCell>
                    <TableCell>{entry.userId}</TableCell>
                    <TableCell>
                      <Chip
                        label={entry.action}
                        size="small"
                        color={entry.action === 'DELETED' ? 'error' : entry.action === 'ADDED' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{entry.entityType}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{entry.entityId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[25, 50, 100, 200]}
          />
        </>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={null} onClose={closeSnackbar}>
        <Alert severity={snackbar.severity} onClose={closeSnackbar}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
