// src/theme.js
import { createTheme, alpha } from '@mui/material/styles';

// Premium Color Palette
export const brand = {
  50: '#f0f4ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6', // Primary Main
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
};

export const secondary = {
  50: '#fdf4ff',
  100: '#fae8ff',
  200: '#f5d0fe',
  300: '#f0abfc',
  400: '#e879f9',
  500: '#d946ef',
  600: '#c026d3',
  700: '#a21caf',
  800: '#86198f',
  900: '#701a75',
};

export const gray = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
};

// Custom Shadows
const createCustomShadows = (mode) => {
  const color = mode === 'dark' ? '#000000' : '#94a3b8';
  return [
    'none',
    `0px 2px 4px ${alpha(color, 0.1)}`,
    `0px 4px 8px ${alpha(color, 0.1)}`,
    `0px 8px 16px ${alpha(color, 0.1)}`,
    `0px 16px 32px ${alpha(color, 0.1)}`,
    ...Array(20).fill('none'), // Fill rest to match MUI expectation if needed, or just rely on defaults for higher elevations
  ];
};

export const getDesignTokens = (mode) => {
  const isDark = mode === 'dark';

  return {
    palette: {
      mode,
      primary: {
        light: brand[300],
        main: brand[600],
        dark: brand[800],
        contrastText: '#ffffff',
      },
      secondary: {
        light: secondary[300],
        main: secondary[600],
        dark: secondary[800],
        contrastText: '#ffffff',
      },
      background: {
        default: isDark ? '#0f172a' : '#f8fafc',
        paper: isDark ? '#1e293b' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f1f5f9' : '#1e293b',
        secondary: isDark ? '#94a3b8' : '#64748b',
      },
      divider: isDark ? alpha(gray[700], 0.5) : alpha(gray[200], 0.8),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700, fontSize: '2.5rem' },
      h2: { fontWeight: 700, fontSize: '2rem' },
      h3: { fontWeight: 600, fontSize: '1.75rem' },
      h4: { fontWeight: 600, fontSize: '1.5rem' },
      h5: { fontWeight: 600, fontSize: '1.25rem' },
      h6: { fontWeight: 600, fontSize: '1rem' },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '10px',
            padding: '8px 16px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: `0 4px 12px ${alpha(brand[500], 0.2)}`,
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease-in-out',
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${brand[600]} 0%, ${brand[700]} 100%)`,
          },
          containedSecondary: {
            background: `linear-gradient(135deg, ${secondary[600]} 0%, ${secondary[700]} 100%)`,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            boxShadow: isDark
              ? '0 4px 20px rgba(0,0,0,0.4)'
              : '0 4px 20px rgba(0,0,0,0.05)',
            backgroundImage: 'none',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: isDark
                ? '0 12px 30px rgba(0,0,0,0.5)'
                : '0 12px 30px rgba(0,0,0,0.1)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isDark ? alpha('#1e293b', 0.8) : alpha('#ffffff', 0.8),
            backdropFilter: 'blur(12px)',
            boxShadow: 'none',
            borderBottom: `1px solid ${isDark ? alpha(gray[700], 0.5) : alpha(gray[200], 0.8)}`,
            color: isDark ? '#f1f5f9' : '#1e293b',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: 'none',
            background: isDark ? '#1e293b' : '#ffffff',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              '& fieldset': {
                borderColor: isDark ? gray[700] : gray[300],
              },
              '&:hover fieldset': {
                borderColor: brand[400],
              },
              '&.Mui-focused fieldset': {
                borderColor: brand[500],
                borderWidth: '2px',
              },
            },
          },
        },
      },
    },
  };
};
