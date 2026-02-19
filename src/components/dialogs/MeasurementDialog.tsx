import { useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material'
import type { MeasurementResult } from '@/types/quantum'
import { formatProbability } from '@/utils/format'

interface MeasurementDialogProps {
  open: boolean
  numQubits: number
  onClose: () => void
  onMeasure: (targets: number[]) => MeasurementResult | undefined
  lastMeasurement?: MeasurementResult
}

export function MeasurementDialog({ open, numQubits, onClose, onMeasure, lastMeasurement }: MeasurementDialogProps) {
  const [selected, setSelected] = useState<number[]>([])

  const toggleQubit = (value: number) => {
    setSelected((prev) => (prev.includes(value) ? prev.filter((entry) => entry !== value) : [...prev, value]))
  }

  const handleMeasure = () => {
    if (selected.length === 0) {
      return
    }
    onMeasure(selected)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Measure qubits</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Select one or more qubits. The engine will compute probabilities, sample an outcome, and collapse the circuit state.
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          {Array.from({ length: numQubits }, (_, idx) => (
            <FormControlLabel
              key={idx}
              control={<Checkbox checked={selected.includes(idx)} onChange={() => toggleQubit(idx)} />}
              label={`Qubit ${idx}`}
            />
          ))}
        </Stack>
        {lastMeasurement && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Last measurement: {lastMeasurement.outcome}
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', pl: 0, m: 0 }}>
              {Object.entries(lastMeasurement.probabilities).map(([label, probability]) => (
                <li key={label}>
                  <Typography variant="body2">
                    {label}: {formatProbability(probability)}
                  </Typography>
                </li>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handleMeasure} disabled={selected.length === 0} variant="contained">
          Measure
        </Button>
      </DialogActions>
    </Dialog>
  )
}
