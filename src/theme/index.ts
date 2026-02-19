import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4dd0e1',
      contrastText: '#020308',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#05060a',
      paper: '#0f1118',
    },
    text: {
      primary: '#f8fbff',
      secondary: '#9ea9c4',
    },
    divider: 'rgba(154, 172, 219, 0.18)',
  },
  typography: {
    fontFamily: '"Space Grotesk", "IBM Plex Mono", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 500 },
    h4: { fontWeight: 500 },
    button: { textTransform: 'none', letterSpacing: 0.2 },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(145deg, rgba(16,18,30,0.9), rgba(8,9,16,0.95))',
          border: '1px solid rgba(141, 161, 222, 0.12)',
          boxShadow: '0 20px 60px rgba(1, 4, 12, 0.55)',
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        enterDelay: 100,
      },
      styleOverrides: {
        tooltip: {
          fontSize: '0.85rem',
          backgroundColor: '#131626',
          border: '1px solid rgba(77, 208, 225, 0.4)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingLeft: '1.25rem',
          paddingRight: '1.25rem',
        },
      },
    },
  },
})
