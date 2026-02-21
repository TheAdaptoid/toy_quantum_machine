import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";

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
}: TopBarProps) {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleChange = (event: SelectChangeEvent<number>) => {
    onQubitsChange(Number(event.target.value));
  };

  const handleResetClick = () => {
    setResetDialogOpen(true);
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

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
          alignItems: { md: "center" },
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Quantum Playground
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Drag XZ-calculus gates, evolve the state vector, and inspect
            amplitudes in real time.
          </Typography>
        </Box>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          <Stack spacing={0.5}>
            <Typography
              variant="caption"
              sx={{ textTransform: "uppercase", letterSpacing: 1 }}
            >
              Qubits
            </Typography>
            <Select
              value={numQubits}
              onChange={handleChange}
              size="small"
              sx={{ minWidth: 120 }}
            >
              {Array.from({ length: 6 }, (_, idx) => idx + 1).map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </Select>
          </Stack>
          <Stack spacing={0.5}>
            <Typography
              variant="caption"
              sx={{ textTransform: "uppercase", letterSpacing: 1 }}
            >
              Initial State
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {initialState.map((bit, idx) => (
                <Button
                  key={`init-${idx}`}
                  size="small"
                  variant={bit === 1 ? "contained" : "outlined"}
                  color={bit === 1 ? "primary" : "inherit"}
                  onClick={() => handleInitialToggle(idx)}
                  aria-label={`Toggle initial state of qubit ${idx} to ${bit === 1 ? "0" : "1"}`}
                  sx={{
                    minHeight: 36,
                    px: 1.5,
                    fontFamily: '"IBM Plex Mono", monospace',
                  }}
                >
                  q{idx}:{bit}
                </Button>
              ))}
            </Stack>
          </Stack>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleResetClick}
            sx={{ minHeight: 44 }}
          >
            Reset
          </Button>
          <Button variant="contained" onClick={onSave} sx={{ minHeight: 44 }}>
            Save JSON
          </Button>
          <Button
            variant="outlined"
            onClick={onLoadClick}
            sx={{ minHeight: 44 }}
          >
            Load JSON
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={onShare}
            sx={{ minHeight: 44 }}
          >
            Share URL
          </Button>
          {onRestore && (
            <Button
              variant="text"
              color="info"
              onClick={onRestore}
              sx={{ minHeight: 44 }}
            >
              Restore last
            </Button>
          )}
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
