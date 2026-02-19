import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts'
import { formatComplex, formatProbability } from '@/utils/format'

interface StateInspectorProps {
  amplitudes: Array<{ basisLabel: string; real: number; imag: number; probability: number }>
}

export function StateInspector({ amplitudes }: StateInspectorProps) {
  return (
    <Box sx={{ p: 3, borderRadius: 3, bgcolor: 'rgba(7,10,22,0.95)', border: '1px solid rgba(104,128,222,0.25)' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        State Inspector
      </Typography>
      <Box sx={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={amplitudes.map((entry) => ({ basis: entry.basisLabel, probability: entry.probability }))}>
            <XAxis dataKey="basis" stroke="#8da5ff" tickLine={false} axisLine={{ stroke: '#243067' }} angle={-25} textAnchor="end" height={50} />
            <YAxis stroke="#8da5ff" tickFormatter={(value) => `${Math.round(value * 100)}%`} width={60} />
            <RechartsTooltip<number, string>
              formatter={(value) => formatProbability(Number(value))}
              labelFormatter={(label) => label}
            />
            <Bar dataKey="probability" fill="#4dd0e1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
      <Box sx={{ mt: 2, maxHeight: 260, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Basis</TableCell>
              <TableCell>Amplitude</TableCell>
              <TableCell>Probability</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {amplitudes.map((entry) => (
              <TableRow key={entry.basisLabel}>
                <TableCell>{entry.basisLabel}</TableCell>
                <TableCell sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>
                  {formatComplex(entry.real, entry.imag)}
                </TableCell>
                <TableCell>{formatProbability(entry.probability)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  )
}
