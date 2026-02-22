import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import type { GateName } from "@/types/quantum";
import { GATE_LIBRARY } from "@/simulation/gates";

interface GateTargetDialogProps {
  open: boolean;
  gateName: GateName;
  numQubits: number;
  initialTargets: number[];
  onConfirm: (targets: number[]) => void;
  onCancel: () => void;
}

export function GateTargetDialog({
  open,
  gateName,
  numQubits,
  initialTargets,
  onConfirm,
  onCancel,
}: GateTargetDialogProps) {
  const fallbackSecond =
    initialTargets[1] ?? Math.min(initialTargets[0] + 1, numQubits - 1);
  const getAvailableTarget = (taken: number[]) => {
    for (let idx = 0; idx < numQubits; idx += 1) {
      if (!taken.includes(idx)) {
        return idx;
      }
    }
    return 0;
  };
  const fallbackThird =
    initialTargets[2] ??
    getAvailableTarget([initialTargets[0], fallbackSecond]);

  const [first, setFirst] = useState(initialTargets[0]);
  const [second, setSecond] = useState(fallbackSecond);
  const [third, setThird] = useState(fallbackThird);

  const needsThird = gateName === "TOFFOLI";
  const labels =
    gateName === "CNOT"
      ? ["Control", "Target"]
      : gateName === "TOFFOLI"
        ? ["Control 1", "Control 2", "Target"]
        : ["Qubit A", "Qubit B"];

  const selectedTargets = needsThird ? [first, second, third] : [first, second];
  const duplicate = new Set(selectedTargets).size !== selectedTargets.length;

  const handleConfirm = () => {
    if (!duplicate) {
      onConfirm(selectedTargets);
    }
  };

  const gateColor = GATE_LIBRARY[gateName]?.color || "#00f5d4";

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          pb: 1,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${gateColor}30 0%, ${gateColor}10 100%)`,
            border: `1px solid ${gateColor}50`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: gateColor,
            fontWeight: 700,
            fontSize: "0.9rem",
          }}
        >
          {gateName}
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem" }}>
            Configure Gate
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Select target qubits for this operation
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontSize: "0.85rem" }}>{labels[0]}</InputLabel>
              <Select
                label={labels[0]}
                value={first}
                onChange={(event) => setFirst(Number(event.target.value))}
                size="small"
              >
                {Array.from({ length: numQubits }, (_, idx) => (
                  <MenuItem key={`first-${idx}`} value={idx}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor:
                            idx === first ? "primary.main" : "transparent",
                          border: "1px solid",
                          borderColor:
                            idx === first ? "primary.main" : "divider",
                        }}
                      />
                      <span>q{idx}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel sx={{ fontSize: "0.85rem" }}>{labels[1]}</InputLabel>
              <Select
                label={labels[1]}
                value={second}
                onChange={(event) => setSecond(Number(event.target.value))}
                size="small"
              >
                {Array.from({ length: numQubits }, (_, idx) => (
                  <MenuItem key={`second-${idx}`} value={idx}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor:
                            idx === second ? "secondary.main" : "transparent",
                          border: "1px solid",
                          borderColor:
                            idx === second ? "secondary.main" : "divider",
                        }}
                      />
                      <span>q{idx}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {needsThird && (
              <FormControl fullWidth>
                <InputLabel sx={{ fontSize: "0.85rem" }}>
                  {labels[2]}
                </InputLabel>
                <Select
                  label={labels[2]}
                  value={third}
                  onChange={(event) => setThird(Number(event.target.value))}
                  size="small"
                >
                  {Array.from({ length: numQubits }, (_, idx) => (
                    <MenuItem key={`third-${idx}`} value={idx}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor:
                              idx === third ? "primary.light" : "transparent",
                            border: "1px solid",
                            borderColor:
                              idx === third ? "primary.light" : "divider",
                          }}
                        />
                        <span>q{idx}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
          {duplicate && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                background: "rgba(247, 37, 133, 0.1)",
                border: "1px solid rgba(247, 37, 133, 0.3)",
              }}
            >
              <Typography variant="caption" color="error.light">
                Each qubit must be unique. Please select different qubits.
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onCancel} sx={{ px: 3 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={duplicate}
          sx={{ px: 3 }}
        >
          Place Gate
        </Button>
      </DialogActions>
    </Dialog>
  );
}
