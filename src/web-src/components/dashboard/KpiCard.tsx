import { Card, CardContent, CardActionArea, Box, Typography, Skeleton } from '@mui/material';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  loading?: boolean;
  color?: 'primary' | 'warning' | 'error';
  onClick?: () => void;
}

export default function KpiCard({
  title, value, icon, loading = false, color = 'primary', onClick,
}: KpiCardProps) {
  const content = (
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box sx={{ color: 'primary.main' }}>{icon}</Box>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {title}
        </Typography>
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
