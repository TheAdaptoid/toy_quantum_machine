import { useState } from 'react'
import {
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
} from '@mui/material'
import type { GateName } from '@/types/quantum'

interface GateTargetDialogProps {
  open: boolean
  gateName: GateName
  numQubits: number
  initialTargets: number[]
  onConfirm: (targets: number[]) => void
  onCancel: () => void
}

export function GateTargetDialog({ open, gateName, numQubits, initialTargets, onConfirm, onCancel }: GateTargetDialogProps) {
  const fallbackSecond = initialTargets[1] ?? Math.min(initialTargets[0] + 1, numQubits - 1)
  const [first, setFirst] = useState(initialTargets[0])
  const [second, setSecond] = useState(fallbackSecond)

  const duplicate = first === second
  const labels = gateName === 'CNOT' ? ['Control', 'Target'] : ['Qubit A', 'Qubit B']

  const handleConfirm = () => {
    if (!duplicate) {
      onConfirm([first, second])
    }
  }

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Configure {gateName}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Select the qubits this gate spans. Qubit indices start at 0 (top wire) and increase downward.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl fullWidth>
            <InputLabel>{labels[0]}</InputLabel>
            <Select label={labels[0]} value={first} onChange={(event) => setFirst(Number(event.target.value))}>
              {Array.from({ length: numQubits }, (_, idx) => (
                <MenuItem key={`first-${idx}`} value={idx}>
                  Qubit {idx}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>{labels[1]}</InputLabel>
            <Select label={labels[1]} value={second} onChange={(event) => setSecond(Number(event.target.value))}>
              {Array.from({ length: numQubits }, (_, idx) => (
                <MenuItem key={`second-${idx}`} value={idx}>
                  Qubit {idx}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        {duplicate && (
          <Typography variant="caption" color="error" sx={{ mt: 1 }}>
            Choose two distinct qubits.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={duplicate}>
          Place gate
        </Button>
      </DialogActions>
    </Dialog>
  )
}
