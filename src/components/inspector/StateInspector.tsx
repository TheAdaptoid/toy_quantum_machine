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
  Cell,
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
  const chartHeight = numQubits <= 2 ? 180 : numQubits <= 4 ? 220 : 260;

  // Generate gradient colors for bars
  const getBarColor = (index: number, total: number) => {
    const t = total > 1 ? index / (total - 1) : 0;
    // Interpolate from cyan to magenta
    return `rgb(${Math.round(0 + t * 247)}, ${Math.round(245 + t * (37 - 245))}, ${Math.round(212 + t * (133 - 212))})`;
  };

  return (
    <Box
      role="region"
      aria-label="Quantum state inspector"
      sx={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          mb: 2,
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={hideZeros}
              onChange={(e) => setHideZeros(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography
              variant="caption"
              sx={{ fontSize: "0.7rem", color: "text.secondary" }}
            >
              Hide zeros
            </Typography>
          }
          sx={{ mr: 0 }}
        />
      </Box>

      {/* Chart */}
      <Box
        sx={{
          height: chartHeight,
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          background: "rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.03)",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filteredAmplitudes.map((entry, idx) => ({
              basis: entry.basisLabel,
              probability: entry.probability,
              index: idx,
            }))}
            margin={{ top: 8, right: 8, bottom: 40, left: 0 }}
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00f5d4" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#f72585" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="basis"
              stroke="#5a6a9a"
              tickLine={false}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.06)" }}
              angle={-45}
              textAnchor="end"
              height={40}
              tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
            />
            <YAxis
              stroke="#5a6a9a"
              tickFormatter={(value) => `${Math.round(value * 100)}%`}
              width={40}
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.06)" }}
              tickLine={false}
            />
            <RechartsTooltip<number, string>
              formatter={(value) => [
                formatProbability(Number(value)),
                "Probability",
              ]}
              labelFormatter={(label) => `State: ${label}`}
              contentStyle={{
                backgroundColor: "rgba(12, 15, 30, 0.95)",
                border: "1px solid rgba(0, 245, 212, 0.2)",
                borderRadius: 8,
                fontSize: "0.8rem",
              }}
            />
            <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
              {filteredAmplitudes.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(index, filteredAmplitudes.length)}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Table */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          borderRadius: 2,
          background: "rgba(0, 0, 0, 0.15)",
          border: "1px solid rgba(255, 255, 255, 0.03)",
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  background: "rgba(8, 12, 24, 0.9)",
                  backdropFilter: "blur(8px)",
                }}
              >
                State
              </TableCell>
              <TableCell
                sx={{
                  background: "rgba(8, 12, 24, 0.9)",
                  backdropFilter: "blur(8px)",
                }}
              >
                Amplitude
              </TableCell>
              <TableCell
                sx={{
                  background: "rgba(8, 12, 24, 0.9)",
                  backdropFilter: "blur(8px)",
                }}
              >
                Prob
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAmplitudes.map((entry, idx) => (
              <TableRow
                key={entry.basisLabel}
                sx={{
                  "&:hover": {
                    bgcolor: "rgba(0, 245, 212, 0.04)",
                  },
                }}
              >
                <TableCell
                  sx={{
                    color: getBarColor(idx, filteredAmplitudes.length),
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: "0.75rem",
                  }}
                >
                  {entry.basisLabel}
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: "0.7rem",
                    color: "text.secondary",
                  }}
                >
                  {formatComplex(entry.real, entry.imag)}
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: "0.7rem",
                  }}
                >
                  {formatProbability(entry.probability)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}
