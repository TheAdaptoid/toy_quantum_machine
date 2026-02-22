import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";
import type { MeasurementResult } from "@/types/quantum";
import { formatProbability } from "@/utils/format";

interface MeasurementDialogProps {
  open: boolean;
  numQubits: number;
  onClose: () => void;
  onMeasure: (targets: number[]) => MeasurementResult | undefined;
  lastMeasurement?: MeasurementResult;
}

export function MeasurementDialog({
  open,
  numQubits,
  onClose,
  onMeasure,
  lastMeasurement,
}: MeasurementDialogProps) {
  const [selected, setSelected] = useState<number[]>([]);

  const toggleQubit = (value: number) => {
    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter((entry) => entry !== value)
        : [...prev, value],
    );
  };

  const handleMeasure = () => {
    if (selected.length === 0) {
      return;
    }
    onMeasure(selected);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
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
            background:
              "linear-gradient(135deg, rgba(247, 37, 133, 0.2) 0%, rgba(123, 44, 191, 0.2) 100%)",
            border: "1px solid rgba(247, 37, 133, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ScienceIcon sx={{ color: "#f72585", fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem" }}>
            Measure Qubits
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Select qubits to collapse into classical states
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Box>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 1.5,
                textTransform: "uppercase",
                letterSpacing: 2,
                color: "text.secondary",
                fontSize: "0.65rem",
              }}
            >
              Select Qubits
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {Array.from({ length: numQubits }, (_, idx) => {
                const isSelected = selected.includes(idx);
                return (
                  <Box
                    key={idx}
                    onClick={() => toggleQubit(idx)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      cursor: "pointer",
                      background: isSelected
                        ? "linear-gradient(135deg, rgba(0, 245, 212, 0.15) 0%, rgba(247, 37, 133, 0.1) 100%)"
                        : "rgba(255, 255, 255, 0.03)",
                      border: isSelected
                        ? "1px solid rgba(0, 245, 212, 0.4)"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        background: isSelected
                          ? "linear-gradient(135deg, rgba(0, 245, 212, 0.2) 0%, rgba(247, 37, 133, 0.15) 100%)"
                          : "rgba(255, 255, 255, 0.06)",
                      },
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      size="small"
                      sx={{
                        p: 0,
                        "& .MuiSvgIcon-root": { fontSize: 18 },
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: "0.8rem",
                        color: isSelected ? "primary.main" : "text.primary",
                      }}
                    >
                      q{idx}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          {lastMeasurement && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                background: "rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 1,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: "text.secondary",
                  fontSize: "0.6rem",
                }}
              >
                Previous Result
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  color: "primary.main",
                  fontWeight: 600,
                  mb: 1,
                }}
              >
                {lastMeasurement.outcome}
              </Typography>
              <Stack spacing={0.5}>
                {Object.entries(lastMeasurement.probabilities).map(
                  ([label, probability]) => (
                    <Stack
                      key={label}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: '"JetBrains Mono", monospace',
                          color: "text.secondary",
                          fontSize: "0.7rem",
                        }}
                      >
                        {label}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: "0.7rem",
                        }}
                      >
                        {formatProbability(probability)}
                      </Typography>
                    </Stack>
                  ),
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ px: 3 }}>
          Cancel
        </Button>
        <Button
          onClick={handleMeasure}
          disabled={selected.length === 0}
          variant="contained"
          color="secondary"
          startIcon={<ScienceIcon />}
          sx={{ px: 3 }}
        >
          Measure
        </Button>
      </DialogActions>
    </Dialog>
  );
}
