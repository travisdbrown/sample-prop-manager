import { Box, Typography, Button } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        gap: 2,
        textAlign: 'center',
      }}
    >
      <LockIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Access Denied
      </Typography>
      <Typography variant="body2" color="text.secondary">
        You don't have permission to view this page.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')}>
        Go to Dashboard
      </Button>
    </Box>
  );
}
