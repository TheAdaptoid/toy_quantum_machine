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
  onQubitsChange: (value: number) => void;
  onReset: () => void;
  onSave: () => void;
  onLoadClick: () => void;
  onShare: () => void;
  onRestore?: () => void;
}

export function TopBar({
  numQubits,
  onQubitsChange,
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
