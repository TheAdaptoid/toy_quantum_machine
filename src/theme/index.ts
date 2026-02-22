import { createTheme, alpha } from "@mui/material/styles";

// Cosmic Aurora color palette
const aurora = {
  cyan: "#00f5d4",
  magenta: "#f72585",
  violet: "#7b2cbf",
  blue: "#3a0ca3",
  white: "#f0f6ff",
  muted: "#8b9cc7",
};

// Gate colors - vibrant versions for glass panels
export const GATE_COLORS: Record<string, string> = {
  X: "#ff6b7a",
  Z: "#d4a5d4",
  H: "#b8e986",
  S: "#64b5f6",
  T: "#ffb74d",
  CNOT: "#82b1ff",
  TOFFOLI: "#64ffda",
  SWAP: "#ff8a80",
};

export const appTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: aurora.cyan,
      light: "#5ff7e0",
      dark: "#00c4a7",
      contrastText: "#030308",
    },
    secondary: {
      main: aurora.magenta,
      light: "#ff5da2",
      dark: "#c41e68",
      contrastText: "#ffffff",
    },
    background: {
      default: "transparent",
      paper: "rgba(10, 12, 25, 0.65)",
    },
    text: {
      primary: aurora.white,
      secondary: aurora.muted,
    },
    divider: "rgba(255, 255, 255, 0.06)",
    error: {
      main: "#ff5252",
      light: "#ff8a80",
    },
    success: {
      main: aurora.cyan,
    },
  },
  typography: {
    fontFamily: '"Outfit", system-ui, -apple-system, sans-serif',
    h1: { fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontWeight: 600, letterSpacing: "-0.01em" },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
    subtitle1: { fontWeight: 500, letterSpacing: "0.01em" },
    subtitle2: { fontWeight: 500, letterSpacing: "0.02em" },
    body1: { fontWeight: 400, lineHeight: 1.6 },
    body2: { fontWeight: 400, lineHeight: 1.5 },
    button: {
      textTransform: "none",
      fontWeight: 500,
      letterSpacing: "0.02em",
    },
    caption: {
      fontWeight: 400,
      letterSpacing: "0.03em",
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          "--glass-blur": "20px",
          "--glass-bg": "rgba(8, 10, 22, 0.65)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(10, 12, 25, 0.65)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 60px rgba(0, 245, 212, 0.05)",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: "rgba(12, 15, 30, 0.85)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: `
            0 24px 80px rgba(0, 0, 0, 0.6),
            0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `,
          borderRadius: 24,
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        enterDelay: 100,
        arrow: true,
      },
      styleOverrides: {
        tooltip: {
          fontSize: "0.8rem",
          fontWeight: 400,
          backgroundColor: "rgba(15, 18, 35, 0.95)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(0, 245, 212, 0.2)",
          borderRadius: 12,
          padding: "8px 14px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
        },
        arrow: {
          color: "rgba(15, 18, 35, 0.95)",
          "&::before": {
            border: "1px solid rgba(0, 245, 212, 0.2)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "10px 20px",
          fontWeight: 500,
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "translateY(-1px)",
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${aurora.cyan} 0%, ${alpha(aurora.cyan, 0.8)} 100%)`,
          boxShadow: `0 4px 20px ${alpha(aurora.cyan, 0.3)}`,
          "&:hover": {
            background: `linear-gradient(135deg, ${aurora.cyan} 0%, #5ff7e0 100%)`,
            boxShadow: `0 6px 28px ${alpha(aurora.cyan, 0.4)}`,
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${aurora.magenta} 0%, ${alpha(aurora.magenta, 0.8)} 100%)`,
          boxShadow: `0 4px 20px ${alpha(aurora.magenta, 0.3)}`,
          "&:hover": {
            background: `linear-gradient(135deg, ${aurora.magenta} 0%, #ff5da2 100%)`,
            boxShadow: `0 6px 28px ${alpha(aurora.magenta, 0.4)}`,
          },
        },
        outlined: {
          borderColor: "rgba(255, 255, 255, 0.15)",
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          backdropFilter: "blur(8px)",
          "&:hover": {
            borderColor: aurora.cyan,
            backgroundColor: alpha(aurora.cyan, 0.08),
            boxShadow: `0 0 20px ${alpha(aurora.cyan, 0.15)}`,
          },
        },
        text: {
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.05)",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            boxShadow: `0 0 16px ${alpha(aurora.cyan, 0.2)}`,
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 6,
        },
        track: {
          background: `linear-gradient(90deg, ${aurora.cyan}, ${aurora.magenta})`,
          border: "none",
        },
        rail: {
          backgroundColor: "rgba(255, 255, 255, 0.08)",
        },
        thumb: {
          width: 20,
          height: 20,
          background: `linear-gradient(135deg, ${aurora.cyan}, ${aurora.magenta})`,
          boxShadow: `0 0 16px ${alpha(aurora.cyan, 0.4)}`,
          "&:hover, &.Mui-focusVisible": {
            boxShadow: `0 0 24px ${alpha(aurora.cyan, 0.6)}`,
          },
          "&::before": {
            display: "none",
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          backdropFilter: "blur(8px)",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255, 255, 255, 0.1)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255, 255, 255, 0.2)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: aurora.cyan,
            boxShadow: `0 0 12px ${alpha(aurora.cyan, 0.2)}`,
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 52,
          height: 28,
          padding: 0,
        },
        sizeSmall: {
          width: 42,
          height: 22,
          "& .MuiSwitch-switchBase": {
            padding: 2,
            "&.Mui-checked": {
              transform: "translateX(20px)",
            },
          },
          "& .MuiSwitch-thumb": {
            width: 18,
            height: 18,
          },
          "& .MuiSwitch-track": {
            borderRadius: 11,
          },
        },
        switchBase: {
          padding: 2,
          "&.Mui-checked": {
            transform: "translateX(24px)",
            "& + .MuiSwitch-track": {
              background: `linear-gradient(90deg, ${aurora.cyan}, ${aurora.magenta})`,
              opacity: 1,
            },
            "& .MuiSwitch-thumb": {
              backgroundColor: "#fff",
            },
          },
        },
        thumb: {
          width: 24,
          height: 24,
          backgroundColor: aurora.muted,
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        },
        track: {
          borderRadius: 14,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          opacity: 1,
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: "rgba(255, 255, 255, 0.3)",
          "&.Mui-checked": {
            color: aurora.cyan,
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255, 255, 255, 0.05)",
          padding: "12px 16px",
        },
        head: {
          fontWeight: 600,
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          color: aurora.muted,
          textTransform: "uppercase",
          fontSize: "0.7rem",
          letterSpacing: "0.08em",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background-color 0.15s ease",
          "&:hover": {
            backgroundColor: "rgba(0, 245, 212, 0.03)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          backdropFilter: "blur(8px)",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255, 255, 255, 0.06)",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backdropFilter: "blur(12px)",
        },
        standardSuccess: {
          backgroundColor: alpha(aurora.cyan, 0.15),
          border: `1px solid ${alpha(aurora.cyan, 0.3)}`,
        },
        standardError: {
          backgroundColor: alpha("#ff5252", 0.15),
          border: "1px solid rgba(255, 82, 82, 0.3)",
        },
        standardInfo: {
          backgroundColor: alpha(aurora.violet, 0.15),
          border: `1px solid ${alpha(aurora.violet, 0.3)}`,
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          "& .MuiPaper-root": {
            backdropFilter: "blur(16px)",
          },
        },
      },
    },
  },
});
