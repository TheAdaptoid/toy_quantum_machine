import { useMemo, useState } from "react";
import {
  Box,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import { formatComplex, formatProbability } from "@/utils/format";

interface StateInspectorProps {
  amplitudes: Array<{
    basisLabel: string;
    real: number;
    imag: number;
    probability: number;
  }>;
}

export function StateInspector({ amplitudes }: StateInspectorProps) {
  const [hideZeros, setHideZeros] = useState(true);

  const filteredAmplitudes = useMemo(() => {
    if (!hideZeros) return amplitudes;
    return amplitudes.filter((entry) => entry.probability > 1e-10);
  }, [amplitudes, hideZeros]);

  const numQubits = Math.log2(amplitudes.length);
  const chartHeight = numQubits <= 2 ? 220 : numQubits <= 4 ? 280 : 340;

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: "rgba(7,10,22,0.95)",
        border: "1px solid rgba(104,128,222,0.25)",
      }}
      role="region"
      aria-label="Quantum state inspector"
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          State Inspector
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={hideZeros}
              onChange={(e) => setHideZeros(e.target.checked)}
              size="small"
            />
          }
          label={<Typography variant="caption">Hide zeros</Typography>}
        />
      </Box>
      <Box sx={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filteredAmplitudes.map((entry) => ({
              basis: entry.basisLabel,
              probability: entry.probability,
            }))}
            margin={{ bottom: 60 }}
          >
            <XAxis
              dataKey="basis"
              stroke="#8da5ff"
              tickLine={false}
              axisLine={{ stroke: "#243067" }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              stroke="#8da5ff"
              tickFormatter={(value) => `${Math.round(value * 100)}%`}
              width={60}
            />
            <RechartsTooltip<number, string>
              formatter={(value) => formatProbability(Number(value))}
              labelFormatter={(label) => label}
            />
            <Bar dataKey="probability" fill="#4dd0e1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
      <Box sx={{ mt: 2, maxHeight: 260, overflow: "auto" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Basis</TableCell>
              <TableCell>Amplitude</TableCell>
              <TableCell>Probability</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAmplitudes.map((entry) => (
              <TableRow
                key={entry.basisLabel}
                sx={{
                  "&:nth-of-type(even)": {
                    bgcolor: "rgba(255,255,255,0.02)",
                  },
                }}
              >
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
  );
}
