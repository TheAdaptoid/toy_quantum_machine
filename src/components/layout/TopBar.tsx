import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import SettingsIcon from "@mui/icons-material/Settings";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import ShareIcon from "@mui/icons-material/Share";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import HistoryIcon from "@mui/icons-material/History";
import ScienceIcon from "@mui/icons-material/Science";
import type { MeasurementResult } from "@/types/quantum";

interface TopBarProps {
  numQubits: number;
  initialState: number[];
  onQubitsChange: (value: number) => void;
  onInitialStateChange: (state: number[]) => void;
  onReset: () => void;
  onSave: () => void;
  onLoadClick: () => void;
  onShare: () => void;
  onRestore?: () => void;
  onMeasure?: () => void;
  measurement?: MeasurementResult;
}

export function TopBar({
  numQubits,
  initialState,
  onQubitsChange,
  onInitialStateChange,
  onReset,
  onSave,
  onLoadClick,
  onShare,
  onRestore,
  onMeasure,
  measurement,
}: TopBarProps) {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleChange = (event: SelectChangeEvent<number>) => {
    onQubitsChange(Number(event.target.value));
  };

  const handleResetClick = () => {
    setResetDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleResetConfirm = () => {
    onReset();
    setResetDialogOpen(false);
  };

  const handleInitialToggle = (index: number) => {
    const nextState = [...initialState];
    nextState[index] = nextState[index] === 1 ? 0 : 1;
    onInitialStateChange(nextState);
  };

  const handleMenuClose = () => setMenuAnchor(null);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          alignItems: { sm: "center" },
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        {/* Left: Title and qubit config */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            px: 3,
            py: 2,
            borderRadius: 3,
            background: "rgba(8, 12, 24, 0.6)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            boxShadow: `
              0 4px 24px rgba(0, 0, 0, 0.3),
              0 0 40px rgba(0, 245, 212, 0.03)
            `,
          }}
        >
          {/* Logo / Title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                background: "linear-gradient(135deg, #00f5d4 0%, #f72585 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px rgba(0, 245, 212, 0.3)",
              }}
            >
              <Typography
                sx={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#030308",
                }}
              >
                Q
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: "1rem",
                  background:
                    "linear-gradient(135deg, #f0f6ff 0%, #8b9cc7 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Quantum Playground
              </Typography>
            </Box>
          </Box>

          {/* Qubit selector */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: 1,
                fontSize: "0.65rem",
              }}
            >
              Qubits
            </Typography>
            <Select
              value={numQubits}
              onChange={handleChange}
              size="small"
              sx={{
                minWidth: 60,
                "& .MuiSelect-select": {
                  py: 0.75,
                  px: 1.5,
                },
              }}
            >
              {Array.from({ length: 6 }, (_, idx) => idx + 1).map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* Initial state toggles */}
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: 1,
                fontSize: "0.65rem",
                mr: 1,
              }}
            >
              Initial
            </Typography>
            {initialState.map((bit, idx) => (
              <Tooltip key={`init-${idx}`} title={`Toggle q${idx}`}>
                <Button
                  size="small"
                  onClick={() => handleInitialToggle(idx)}
                  aria-label={`Toggle initial state of qubit ${idx} to ${bit === 1 ? "0" : "1"}`}
                  sx={{
                    minWidth: 32,
                    minHeight: 32,
                    px: 0,
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    borderRadius: 1.5,
                    background:
                      bit === 1
                        ? "linear-gradient(135deg, rgba(0, 245, 212, 0.3) 0%, rgba(247, 37, 133, 0.2) 100%)"
                        : "rgba(255, 255, 255, 0.04)",
                    border:
                      bit === 1
                        ? "1px solid rgba(0, 245, 212, 0.4)"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                    color: bit === 1 ? "#00f5d4" : "text.secondary",
                    "&:hover": {
                      background:
                        bit === 1
                          ? "linear-gradient(135deg, rgba(0, 245, 212, 0.4) 0%, rgba(247, 37, 133, 0.3) 100%)"
                          : "rgba(255, 255, 255, 0.08)",
                    },
                  }}
                >
                  {bit}
                </Button>
              </Tooltip>
            ))}
          </Stack>
        </Box>

        {/* Right: Action buttons */}
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Measurement indicator/button */}
          {onMeasure && (
            <Tooltip
              title={
                measurement ? `Last: ${measurement.outcome}` : "Measure qubits"
              }
            >
              <Button
                onClick={onMeasure}
                startIcon={<ScienceIcon />}
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  background: measurement
                    ? "linear-gradient(135deg, rgba(247, 37, 133, 0.2) 0%, rgba(123, 44, 191, 0.2) 100%)"
                    : "rgba(255, 255, 255, 0.04)",
                  border: measurement
                    ? "1px solid rgba(247, 37, 133, 0.3)"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                  backdropFilter: "blur(12px)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, rgba(247, 37, 133, 0.3) 0%, rgba(123, 44, 191, 0.3) 100%)",
                    boxShadow: "0 0 20px rgba(247, 37, 133, 0.2)",
                  },
                }}
              >
                {measurement ? measurement.outcome : "Measure"}
              </Button>
            </Tooltip>
          )}

          {/* Quick actions */}
          <Tooltip title="Save circuit">
            <IconButton
              onClick={onSave}
              sx={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(12px)",
              }}
            >
              <FileDownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Load circuit">
            <IconButton
              onClick={onLoadClick}
              sx={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(12px)",
              }}
            >
              <FileUploadIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Share URL">
            <IconButton
              onClick={onShare}
              sx={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(12px)",
              }}
            >
              <ShareIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Menu for less common actions */}
          <Tooltip title="More options">
            <IconButton
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(12px)",
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                background: "rgba(12, 15, 30, 0.9)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                minWidth: 180,
              },
            }}
          >
            {onRestore && (
              <MenuItem
                onClick={() => {
                  onRestore();
                  handleMenuClose();
                }}
              >
                <HistoryIcon fontSize="small" sx={{ mr: 1.5, opacity: 0.7 }} />
                Restore last
              </MenuItem>
            )}
            <MenuItem onClick={handleResetClick} sx={{ color: "error.light" }}>
              <RestartAltIcon fontSize="small" sx={{ mr: 1.5, opacity: 0.7 }} />
              Reset circuit
            </MenuItem>
          </Menu>
        </Stack>
      </Box>

      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        aria-labelledby="reset-dialog-title"
        aria-describedby="reset-dialog-description"
      >
        <DialogTitle id="reset-dialog-title">Reset Circuit?</DialogTitle>
        <DialogContent>
          <DialogContentText id="reset-dialog-description">
            This will remove all gates and reset the circuit to its initial
            state. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleResetConfirm}
            color="secondary"
            variant="contained"
            autoFocus
          >
            Reset Circuit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
