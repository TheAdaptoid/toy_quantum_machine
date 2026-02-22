import { useCallback, useEffect, useMemo, useRef, memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Application, Graphics, Text } from "pixi.js";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { GateInstance } from "@/types/quantum";
import { GATE_LIBRARY } from "@/simulation/gates";

const COLUMN_WIDTH = 100;
const ROW_HEIGHT = 64;
const CANVAS_PADDING = 32;
const LABEL_WIDTH = 52;
const HEADER_HEIGHT = 28;

export interface CircuitCanvasProps {
  numQubits: number;
  gates: GateInstance[];
  currentStep: number;
  maxColumns: number;
  onRemoveGate?: (id: string) => void;
}

export function CircuitCanvas({
  numQubits,
  gates,
  currentStep,
  maxColumns,
  onRemoveGate,
}: CircuitCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const drawSceneRef = useRef<() => void>(() => {});
  const orderedGates = useMemo(() => orderGates(gates), [gates]);
  const gateStepLookup = useMemo(
    () => createGateIndexMap(orderedGates),
    [orderedGates],
  );

  const drawScene = useCallback(() => {
    const app = appRef.current;
    if (!app) {
      return;
    }
    const width = CANVAS_PADDING * 2 + LABEL_WIDTH + maxColumns * COLUMN_WIDTH;
    const height = CANVAS_PADDING * 2 + HEADER_HEIGHT + numQubits * ROW_HEIGHT;
    app.stage.removeChildren();
    app.renderer.resize(width, height);

    // Cosmic backdrop with subtle gradient
    const backdrop = new Graphics();
    backdrop
      .roundRect(0, 0, width, height, 24)
      .fill({ color: 0x060810, alpha: 0.85 });
    app.stage.addChild(backdrop);

    // Subtle inner glow border
    const innerGlow = new Graphics();
    innerGlow.lineStyle(1, 0x00f5d4, 0.08);
    innerGlow.drawRoundedRect(1, 1, width - 2, height - 2, 24);
    app.stage.addChild(innerGlow);

    const gridLeft = CANVAS_PADDING + LABEL_WIDTH;
    const gridTop = CANVAS_PADDING + HEADER_HEIGHT;

    // Draw qubit labels on the left with soft styling
    for (let row = 0; row < numQubits; row += 1) {
      const label = new Text({
        text: `|q${row}⟩`,
        style: {
          fill: 0x8b9cc7,
          fontSize: 13,
          fontWeight: "500",
          fontFamily: "JetBrains Mono",
        },
      });
      label.x = CANVAS_PADDING + 2;
      label.y = gridTop + row * ROW_HEIGHT + ROW_HEIGHT / 2 - label.height / 2;
      app.stage.addChild(label);
    }

    // Draw column numbers on top
    for (let col = 0; col < maxColumns; col += 1) {
      const colLabel = new Text({
        text: col.toString(),
        style: {
          fill: 0x5a6a9a,
          fontSize: 10,
          fontWeight: "500",
          fontFamily: "Outfit",
        },
      });
      colLabel.x =
        gridLeft + col * COLUMN_WIDTH + COLUMN_WIDTH / 2 - colLabel.width / 2;
      colLabel.y = CANVAS_PADDING + 6;
      app.stage.addChild(colLabel);
    }

    // Soft quantum wire lines (horizontal)
    const wires = new Graphics();
    for (let row = 0; row < numQubits; row += 1) {
      const y = gridTop + ROW_HEIGHT / 2 + row * ROW_HEIGHT;
      // Gradient effect by drawing multiple lines with fading alpha
      wires.lineStyle(2, 0x1e2a4a, 0.6);
      wires.moveTo(gridLeft, y);
      wires.lineTo(width - CANVAS_PADDING, y);
      // Subtle glow line
      wires.lineStyle(4, 0x00f5d4, 0.03);
      wires.moveTo(gridLeft, y);
      wires.lineTo(width - CANVAS_PADDING, y);
    }
    app.stage.addChild(wires);

    // Subtle vertical column dividers
    const dividers = new Graphics();
    dividers.lineStyle(1, 0x1a2545, 0.3);
    for (let col = 1; col < maxColumns; col += 1) {
      const x = gridLeft + col * COLUMN_WIDTH;
      dividers.moveTo(x, gridTop);
      dividers.lineTo(x, height - CANVAS_PADDING);
    }
    app.stage.addChild(dividers);

    // Animated step indicator - aurora gradient bar
    const stepX = gridLeft + currentStep * COLUMN_WIDTH;

    // Outer glow
    const stepGlow = new Graphics();
    stepGlow.lineStyle(8, 0x00f5d4, 0.1);
    stepGlow.moveTo(stepX, gridTop - 4);
    stepGlow.lineTo(stepX, height - CANVAS_PADDING + 4);
    app.stage.addChild(stepGlow);

    // Main indicator line with gradient simulation
    const stepLine = new Graphics();
    const stepHeight = height - CANVAS_PADDING - gridTop + 8;
    const segments = 20;
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const segY = gridTop - 4 + t * stepHeight;
      const segHeight = stepHeight / segments;
      // Interpolate between cyan and magenta
      const r = Math.round(0x00 + t * (0xf7 - 0x00));
      const g = Math.round(0xf5 + t * (0x25 - 0xf5));
      const b = Math.round(0xd4 + t * (0x85 - 0xd4));
      const color = (r << 16) + (g << 8) + b;
      stepLine
        .rect(stepX - 1.5, segY, 3, segHeight + 1)
        .fill({ color, alpha: 0.9 });
    }
    app.stage.addChild(stepLine);

    // Draw gates with glass effect
    orderedGates.forEach((gate) => {
      const stepIndex = gateStepLookup.get(gate.id) ?? -1;
      const executed = stepIndex <= currentStep;
      const definition = GATE_LIBRARY[gate.name];
      const minTarget = Math.min(...gate.targets);
      const maxTarget = Math.max(...gate.targets);
      const span = maxTarget - minTarget + 1;
      const gateHeight = Math.max(44, span * ROW_HEIGHT - 12);
      const gateWidth = COLUMN_WIDTH - 20;
      const centerX = gridLeft + gate.column * COLUMN_WIDTH + COLUMN_WIDTH / 2;
      const top =
        gridTop + minTarget * ROW_HEIGHT + (ROW_HEIGHT - gateHeight) / 2;
      const gateColor = hexToNumber(definition.color);

      // Outer glow for non-executed gates
      if (!executed) {
        const glow = new Graphics();
        glow
          .roundRect(
            centerX - gateWidth / 2 - 4,
            top - 4,
            gateWidth + 8,
            gateHeight + 8,
            16,
          )
          .fill({ color: gateColor, alpha: 0.15 });
        app.stage.addChild(glow);
      }

      // Gate background with glass effect
      const rect = new Graphics();
      rect
        .roundRect(centerX - gateWidth / 2, top, gateWidth, gateHeight, 12)
        .fill({
          color: executed ? 0x151a28 : gateColor,
          alpha: executed ? 0.6 : 0.25,
        });
      // Border
      rect.lineStyle(1.5, gateColor, executed ? 0.3 : 0.6);
      rect.drawRoundedRect(
        centerX - gateWidth / 2,
        top,
        gateWidth,
        gateHeight,
        12,
      );
      app.stage.addChild(rect);

      // Gate label
      const label = new Text({
        text: gate.name,
        style: {
          fill: executed ? 0x6a7a9a : gateColor,
          fontSize: 14,
          fontWeight: "600",
          fontFamily: "Outfit",
        },
      });
      label.x = centerX - label.width / 2;
      label.y = top + gateHeight / 2 - label.height / 2;
      app.stage.addChild(label);
    });
  }, [currentStep, gateStepLookup, maxColumns, numQubits, orderedGates]);

  useEffect(() => {
    drawSceneRef.current = drawScene;
  }, [drawScene]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const app = new Application();
    let destroyed = false;
    app
      .init({
        backgroundAlpha: 0,
        antialias: true,
      })
      .then(() => {
        if (destroyed) {
          app.destroy(true);
          return;
        }
        container.appendChild(app.canvas);
        appRef.current = app;
        drawSceneRef.current();
      });
    return () => {
      destroyed = true;
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
        return;
      }
      app.destroy(true);
    };
  }, []);

  useEffect(() => {
    drawScene();
  }, [drawScene]);

  const width = CANVAS_PADDING * 2 + LABEL_WIDTH + maxColumns * COLUMN_WIDTH;
  const height = CANVAS_PADDING * 2 + HEADER_HEIGHT + numQubits * ROW_HEIGHT;

  return (
    <Box
      sx={{
        position: "relative",
        overflowX: "auto",
        borderRadius: 4,
        p: 0.5,
        background: "rgba(8, 12, 24, 0.4)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        boxShadow: `
          0 8px 40px rgba(0, 0, 0, 0.4),
          0 0 80px rgba(0, 245, 212, 0.03),
          inset 0 1px 0 rgba(255, 255, 255, 0.02)
        `,
      }}
    >
      <Box sx={{ position: "relative", width, height }}>
        <Box
          ref={containerRef}
          sx={{
            width,
            height,
            borderRadius: 3,
            overflow: "hidden",
          }}
        />
        <DropGrid numQubits={numQubits} maxColumns={maxColumns} />
        <GateOverlay
          gates={orderedGates}
          currentStep={currentStep}
          onRemoveGate={onRemoveGate}
        />
      </Box>
    </Box>
  );
}

function DropGrid({
  numQubits,
  maxColumns,
}: {
  numQubits: number;
  maxColumns: number;
}) {
  const rows = Array.from({ length: numQubits }, (_, row) => row);
  const columns = Array.from({ length: maxColumns }, (_, col) => col);
  return (
    <Box
      sx={{
        position: "absolute",
        left: `${CANVAS_PADDING + LABEL_WIDTH}px`,
        top: `${CANVAS_PADDING + HEADER_HEIGHT}px`,
        right: `${CANVAS_PADDING}px`,
        bottom: `${CANVAS_PADDING}px`,
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "grid",
          gridTemplateColumns: `repeat(${maxColumns}, ${COLUMN_WIDTH}px)`,
          gridTemplateRows: `repeat(${numQubits}, ${ROW_HEIGHT}px)`,
          gap: "0px",
        }}
      >
        {rows.map((row) =>
          columns.map((col) => (
            <DropCell key={`${row}-${col}`} row={row} column={col} />
          )),
        )}
      </Box>
    </Box>
  );
}

const DropCell = memo(function DropCell({
  row,
  column,
}: {
  row: number;
  column: number;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `cell-${row}-${column}`,
    data: { column, qubit: row },
  });
  return (
    <Box
      ref={setNodeRef}
      sx={{
        pointerEvents: "auto",
        borderRadius: 2,
        border: isOver
          ? "2px solid rgba(0, 245, 212, 0.8)"
          : "1px dashed transparent",
        bgcolor: isOver ? "rgba(0, 245, 212, 0.1)" : "transparent",
        boxShadow: isOver
          ? "0 0 20px rgba(0, 245, 212, 0.2), inset 0 0 20px rgba(0, 245, 212, 0.05)"
          : "none",
        transition: "all 200ms ease",
        "&:hover": {
          border: "1px dashed rgba(0, 245, 212, 0.3)",
          bgcolor: "rgba(0, 245, 212, 0.03)",
        },
      }}
    />
  );
});

function GateOverlay({
  gates,
  currentStep,
  onRemoveGate,
}: {
  gates: GateInstance[];
  currentStep: number;
  onRemoveGate?: (id: string) => void;
}) {
  const gateSteps = useMemo(() => createGateIndexMap(gates), [gates]);
  return (
    <Box
      sx={{
        position: "absolute",
        left: `${CANVAS_PADDING + LABEL_WIDTH}px`,
        top: `${CANVAS_PADDING + HEADER_HEIGHT}px`,
        right: `${CANVAS_PADDING}px`,
        bottom: `${CANVAS_PADDING}px`,
      }}
    >
      {gates.map((gate) => {
        const minTarget = Math.min(...gate.targets);
        const maxTarget = Math.max(...gate.targets);
        const span = maxTarget - minTarget + 1;
        const gateHeight = Math.max(44, span * ROW_HEIGHT - 12);
        const gateWidth = COLUMN_WIDTH - 20;
        const x = gate.column * COLUMN_WIDTH + COLUMN_WIDTH / 2 - gateWidth / 2;
        const y = minTarget * ROW_HEIGHT + (ROW_HEIGHT - gateHeight) / 2;
        const executed = (gateSteps.get(gate.id) ?? -1) <= currentStep;
        const targetsText =
          gate.targets.length === 1
            ? `q${gate.targets[0]}`
            : `q${gate.targets.join(", q")}`;
        return (
          <Tooltip
            key={gate.id}
            title={`${gate.name} gate on ${targetsText}`}
            placement="top"
          >
            <Box
              sx={{
                position: "absolute",
                left: x,
                top: y,
                width: gateWidth,
                height: gateHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                pr: 0,
              }}
            >
              {onRemoveGate && (
                <IconButton
                  size="small"
                  onClick={() => onRemoveGate(gate.id)}
                  aria-label={`Remove ${gate.name} gate from column ${gate.column}`}
                  sx={{
                    pointerEvents: "auto",
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(8, 12, 24, 0.7)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: executed ? "text.secondary" : "text.primary",
                    opacity: 0,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      background: "rgba(247, 37, 133, 0.3)",
                      borderColor: "rgba(247, 37, 133, 0.5)",
                    },
                    ".MuiBox-root:hover &": {
                      opacity: 1,
                    },
                  }}
                >
                  <CloseRoundedIcon sx={{ fontSize: 14 }} />
                </IconButton>
              )}
            </Box>
          </Tooltip>
        );
      })}
      {gates.length === 0 && (
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            letterSpacing: 2,
            textTransform: "uppercase",
            fontSize: "0.65rem",
            color: "rgba(139, 156, 199, 0.4)",
            pointerEvents: "none",
          }}
        >
          Drag gates here
        </Typography>
      )}
    </Box>
  );
}

function orderGates(gates: GateInstance[]) {
  return [...gates].sort((a, b) =>
    a.column === b.column ? a.id.localeCompare(b.id) : a.column - b.column,
  );
}

function createGateIndexMap(gates: GateInstance[]) {
  const lookup = new Map<string, number>();
  gates.forEach((gate, index) => lookup.set(gate.id, index + 1));
  return lookup;
}

function hexToNumber(color: string) {
  return Number.parseInt(color.replace("#", ""), 16);
}
