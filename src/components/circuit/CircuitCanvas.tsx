import { useCallback, useEffect, useMemo, useRef, memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Application, Graphics, Text } from "pixi.js";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { GateInstance } from "@/types/quantum";
import { GATE_LIBRARY } from "@/simulation/gates";

const COLUMN_WIDTH = 120;
const ROW_HEIGHT = 72;
const CANVAS_PADDING = 36;
const LABEL_WIDTH = 48;
const HEADER_HEIGHT = 32;

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

    const backdrop = new Graphics();
    backdrop
      .roundRect(0, 0, width, height, 28)
      .fill({ color: 0x070b18, alpha: 0.95 });
    app.stage.addChild(backdrop);

    // Draw qubit labels on the left
    for (let row = 0; row < numQubits; row += 1) {
      const label = new Text({
        text: `|q${row}⟩`,
        style: {
          fill: 0x9ea9c4,
          fontSize: 14,
          fontWeight: "500",
          fontFamily: "IBM Plex Mono",
        },
      });
      label.x = CANVAS_PADDING + 4;
      label.y =
        CANVAS_PADDING +
        HEADER_HEIGHT +
        row * ROW_HEIGHT +
        ROW_HEIGHT / 2 -
        label.height / 2;
      app.stage.addChild(label);
    }

    // Draw column numbers on top
    for (let col = 0; col < maxColumns; col += 1) {
      const colLabel = new Text({
        text: col.toString(),
        style: {
          fill: 0x6880de,
          fontSize: 12,
          fontWeight: "600",
          fontFamily: "Space Grotesk",
        },
      });
      colLabel.x =
        CANVAS_PADDING +
        LABEL_WIDTH +
        col * COLUMN_WIDTH +
        COLUMN_WIDTH / 2 -
        colLabel.width / 2;
      colLabel.y = CANVAS_PADDING + 8;
      app.stage.addChild(colLabel);
    }

    const grid = new Graphics();
    grid.lineStyle(1, 0x1a2749, 0.8);
    const gridLeft = CANVAS_PADDING + LABEL_WIDTH;
    const gridTop = CANVAS_PADDING + HEADER_HEIGHT;
    for (let col = 0; col <= maxColumns; col += 1) {
      const x = gridLeft + col * COLUMN_WIDTH;
      grid.moveTo(x, gridTop);
      grid.lineTo(x, height - CANVAS_PADDING);
    }
    for (let row = 0; row < numQubits; row += 1) {
      const y = gridTop + ROW_HEIGHT / 2 + row * ROW_HEIGHT;
      grid.moveTo(gridLeft, y);
      grid.lineTo(width - CANVAS_PADDING, y);
    }
    app.stage.addChild(grid);

    const stepLine = new Graphics();
    const stepX = CANVAS_PADDING + LABEL_WIDTH + currentStep * COLUMN_WIDTH;
    stepLine.lineStyle(3, 0x4dd0e1, 0.8);
    stepLine.moveTo(stepX, gridTop);
    stepLine.lineTo(stepX, height - CANVAS_PADDING);
    app.stage.addChild(stepLine);

    orderedGates.forEach((gate) => {
      const stepIndex = gateStepLookup.get(gate.id) ?? -1;
      const executed = stepIndex <= currentStep;
      const definition = GATE_LIBRARY[gate.name];
      const minTarget = Math.min(...gate.targets);
      const maxTarget = Math.max(...gate.targets);
      const span = maxTarget - minTarget + 1;
      const gateHeight = Math.max(48, span * ROW_HEIGHT - 16);
      const gateWidth = COLUMN_WIDTH - 24;
      const centerX =
        CANVAS_PADDING +
        LABEL_WIDTH +
        gate.column * COLUMN_WIDTH +
        COLUMN_WIDTH / 2;
      const top =
        CANVAS_PADDING +
        HEADER_HEIGHT +
        minTarget * ROW_HEIGHT +
        (ROW_HEIGHT - gateHeight) / 2;

      const rect = new Graphics();
      rect
        .roundRect(centerX - gateWidth / 2, top, gateWidth, gateHeight, 14)
        .fill({
          color: hexToNumber(definition.color),
          alpha: executed ? 0.55 : 0.85,
        });
      app.stage.addChild(rect);

      const label = new Text({
        text: gate.name,
        style: {
          fill: executed ? 0x0a0d18 : 0x051018,
          fontSize: 18,
          fontWeight: "700",
          fontFamily: "Space Grotesk",
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
    <Box sx={{ position: "relative", overflowX: "auto" }}>
      <Box sx={{ position: "relative", width, height }}>
        <Box
          ref={containerRef}
          sx={{
            width,
            height,
            borderRadius: 4,
            border: "1px solid rgba(113,141,255,0.2)",
            background:
              "linear-gradient(120deg, rgba(9,13,26,0.95), rgba(3,5,12,0.95))",
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
          ? "2px solid rgba(77,208,225,0.9)"
          : "1px dashed transparent",
        bgcolor: isOver ? "rgba(77,208,225,0.08)" : "transparent",
        transition: "all 150ms ease",
        "&:hover": {
          border: "1px dashed rgba(77,208,225,0.4)",
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
        const gateHeight = Math.max(48, span * ROW_HEIGHT - 16);
        const gateWidth = COLUMN_WIDTH - 24;
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
            arrow
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
                pr: 0.5,
              }}
            >
              {onRemoveGate && (
                <IconButton
                  size="small"
                  onClick={() => onRemoveGate(gate.id)}
                  aria-label={`Remove ${gate.name} gate from column ${gate.column}`}
                  sx={{
                    pointerEvents: "auto",
                    width: 44,
                    height: 44,
                    bgcolor: "rgba(5,6,10,0.6)",
                    color: executed ? "text.secondary" : "text.primary",
                    "&:hover": { bgcolor: "rgba(5,6,10,0.9)" },
                  }}
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Tooltip>
        );
      })}
      <Typography
        variant="caption"
        sx={{
          position: "absolute",
          left: 16,
          top: 8,
          letterSpacing: 4,
          color: "rgba(255,255,255,0.35)",
        }}
      >
        drag gates into the grid
      </Typography>
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
