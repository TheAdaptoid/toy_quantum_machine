import { memo } from "react";
import ReactMarkdown from "react-markdown";
import { useDraggable } from "@dnd-kit/core";
import { Box, Tooltip, Typography } from "@mui/material";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { GATE_LIST } from "@/simulation/gates";

export function GatePalette() {
  return (
    <Box
      role="region"
      aria-label="Gate palette"
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1,
        borderRadius: 3,
        background: "rgba(8, 12, 24, 0.6)",
        backdropFilter: "blur(16px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        overflowX: "auto",
        overflowY: "hidden",
        minWidth: 0,
        // Custom scrollbar
        "&::-webkit-scrollbar": {
          height: 4,
        },
        "&::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: 2,
        },
        "&::-webkit-scrollbar-thumb:hover": {
          background: "rgba(255, 255, 255, 0.2)",
        },
      }}
    >
      {/* Single qubit gates */}
      {GATE_LIST.filter((g) => g.arity === 1).map((gate) => (
        <GateChip key={gate.name} gate={gate} />
      ))}

      {/* Divider */}
      <Box
        sx={{
          width: 1,
          height: 20,
          mx: 0.5,
          background: "rgba(255, 255, 255, 0.15)",
          borderRadius: 1,
          flexShrink: 1,
        }}
      />

      {/* Multi qubit gates */}
      {GATE_LIST.filter((g) => g.arity > 1).map((gate) => (
        <GateChip key={gate.name} gate={gate} />
      ))}
    </Box>
  );
}

const GateChip = memo(({ gate }: { gate: (typeof GATE_LIST)[number] }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `gate-${gate.name}`,
    data: { gateName: gate.name, arity: gate.arity },
  });

  const ariaLabel = `${gate.name} gate: ${gate.description}. ${gate.arity > 1 ? `Requires ${gate.arity} qubits.` : ""} Drag to place on circuit.`;
  const latexMarkdown = `$$${gate.tooltipLatex}$$`;

  // Generate a glow color from the gate color
  const glowColor = gate.color + "60"; // 60 = ~37% opacity in hex

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {gate.description}
          </Typography>
          <Box
            sx={{
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
      <Box
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        aria-label={ariaLabel}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
          px: 1.5,
          py: 0.75,
          borderRadius: 2.5,
          fontWeight: 600,
          fontSize: "0.8rem",
          fontFamily: '"Outfit", sans-serif',
          cursor: "grab",
          userSelect: "none",
          whiteSpace: "nowrap",
          flexShrink: 0,
          background: `linear-gradient(135deg, ${gate.color}20 0%, ${gate.color}10 100%)`,
          border: `1px solid ${gate.color}40`,
          color: gate.color,
          boxShadow: "0 0 0 transparent",
          opacity: isDragging ? 0.4 : 1,
          transition:
            "box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease, opacity 0.15s ease",
          "&:hover": {
            background: `linear-gradient(135deg, ${gate.color}30 0%, ${gate.color}15 100%)`,
            borderColor: `${gate.color}60`,
            boxShadow: `0 0 20px ${glowColor}`,
          },
          "&:active": {
            cursor: "grabbing",
          },
        }}
      >
        <span>{gate.label}</span>
        {gate.arity > 1 && (
          <Typography
            component="span"
            sx={{
              fontSize: "0.6rem",
              opacity: 0.7,
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            ×{gate.arity}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
});

GateChip.displayName = "GateChip";
