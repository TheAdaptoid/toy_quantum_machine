import { memo } from "react";
import ReactMarkdown from "react-markdown";
import { useDraggable } from "@dnd-kit/core";
import { Box, Chip, Divider, Stack, Tooltip, Typography } from "@mui/material";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { GATE_LIST } from "@/simulation/gates";

export function GatePalette() {
  const singleQubitGates = GATE_LIST.filter((gate) => gate.arity === 1);
  const multiQubitGates = GATE_LIST.filter((gate) => gate.arity > 1);

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: "rgba(7,11,24,0.85)",
        border: "1px solid rgba(128,152,231,0.25)",
      }}
      role="region"
      aria-label="Gate palette"
    >
      <Typography
        variant="subtitle2"
        sx={{
          textTransform: "uppercase",
          letterSpacing: 2,
          color: "primary.light",
          mb: 2,
        }}
      >
        Gate Palette
      </Typography>

      <Stack spacing={2}>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", mb: 1, display: "block" }}
          >
            Single-Qubit Gates
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {singleQubitGates.map((gate) => (
              <GateChip key={gate.name} gate={gate} />
            ))}
          </Stack>
        </Box>

        <Divider sx={{ opacity: 0.3 }} />

        <Box>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", mb: 1, display: "block" }}
          >
            Multi-Qubit Gates
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {multiQubitGates.map((gate) => (
              <GateChip key={gate.name} gate={gate} />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

const GateChip = memo(({ gate }: { gate: (typeof GATE_LIST)[number] }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `gate-${gate.name}`,
      data: { gateName: gate.name, arity: gate.arity },
    });

  const ariaLabel = `${gate.name} gate: ${gate.description}. ${gate.arity > 1 ? `Requires ${gate.arity} qubits.` : ""} Drag to place on circuit.`;
  const latexMarkdown = `$$${gate.tooltipLatex}$$`;

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {gate.description}
          </Typography>
          <Box
            sx={{
              mt: 0.5,
              "& .katex": { fontSize: "0.85rem" },
              "& .katex-display": { margin: 0 },
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {latexMarkdown}
            </ReactMarkdown>
          </Box>
        </Box>
      }
    >
      <Chip
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        label={
          <Stack direction="row" spacing={0.5} alignItems="center">
            <span>{gate.label}</span>
            {gate.arity > 1 && (
              <Typography
                component="span"
                sx={{
                  fontSize: "0.7rem",
                  opacity: 0.8,
                  fontFamily: "IBM Plex Mono",
                }}
              >
                ×{gate.arity}
              </Typography>
            )}
          </Stack>
        }
        aria-label={ariaLabel}
        sx={{
          bgcolor: gate.color,
          color: "#05060a",
          fontWeight: 600,
          cursor: "grab",
          userSelect: "none",
          minHeight: 44,
          px: gate.arity > 1 ? 2 : 1.5,
          boxShadow: isDragging ? "0 0 0 2px rgba(255,255,255,0.5)" : "none",
          transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : "none",
          transition: "box-shadow 150ms ease",
          "&:active": {
            cursor: "grabbing",
          },
        }}
      />
    </Tooltip>
  );
});

GateChip.displayName = "GateChip";
