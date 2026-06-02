import { createTheme } from '@mui/material/styles';

const dentalTheme = createTheme({
  palette: {
    primary: {
      main: '#00897B',  // Teal
      light: '#4DB8A8',
      dark: '#00695C',
      contrastText: '#fff',
    },
    secondary: {
      main: '#FFA726',  // Amber/Orange
      light: '#FFB74D',
      dark: '#FB8C00',
      contrastText: '#fff',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    error: {
      main: '#D32F2F',
    },
    warning: {
      main: '#FFA726',
    },
    info: {
      main: '#1976D2',
    },
    success: {
      main: '#388E3C',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 600 },
    h2: { fontSize: '1.75rem', fontWeight: 600 },
    h3: { fontSize: '1.5rem', fontWeight: 600 },
    h4: { fontSize: '1.25rem', fontWeight: 600 },
    h5: { fontSize: '1rem', fontWeight: 600 },
    h6: { fontSize: '0.875rem', fontWeight: 600 },
    body1: { fontSize: '1rem', lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    // WCAG 2.1 AA — 2px solid focus ring on every focusable MUI element.
    // Applies to Button, IconButton, Switch, MenuItem, Checkbox, etc. via the
    // shared MuiButtonBase root. outlineOffset: '2px' keeps the ring clear of
    // the element border so it is visible on both light and dark backgrounds.
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            outline: '2px solid #00897B',
            outlineOffset: '2px',
          },
        },
      },
    },
  },
});

export default dentalTheme;
