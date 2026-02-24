import { useCallback, useEffect, useMemo, useRef, memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Application, Graphics, Text, Container } from "pixi.js";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { GateInstance } from "@/types/quantum";
import { GATE_LIBRARY } from "@/simulation/gates";

const COLUMN_WIDTH = 100;
const ROW_HEIGHT = 64;
const CANVAS_PADDING = 32;
const LABEL_WIDTH = 52;
const HEADER_HEIGHT = 28;

/* ── helpers ──────────────────────────────── */

function orderGates(gates: GateInstance[]) {
  return [...gates].sort((a, b) =>
    a.column === b.column ? a.id.localeCompare(b.id) : a.column - b.column,
  );
}

/** Map each gate ID → the column-based step index (1-based). */
function createGateStepMap(gates: GateInstance[]) {
  const lookup = new Map<string, number>();
  const columnSet = new Set(gates.map((g) => g.column));
  const sortedColumns = [...columnSet].sort((a, b) => a - b);
  const colToStep = new Map<number, number>();
  sortedColumns.forEach((col, idx) => colToStep.set(col, idx + 1));
  gates.forEach((gate) => lookup.set(gate.id, colToStep.get(gate.column)!));
  return lookup;
}

function hexToNumber(color: string) {
  return Number.parseInt(color.replace("#", ""), 16);
}

function easeOut(t: number) {
  return 1 - (1 - t) ** 3;
}

/* ── types ────────────────────────────────── */

export interface CircuitCanvasProps {
  numQubits: number;
  gates: GateInstance[];
  currentStep: number;
  maxColumns: number;
  onRemoveGate?: (id: string) => void;
}

/* ── main component ───────────────────────── */

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
    () => createGateStepMap(orderedGates),
    [orderedGates],
  );

  /* animation refs */
  const prevStepRef = useRef(currentStep);
  const stepAnimRef = useRef({
    from: currentStep,
    to: currentStep,
    progress: 1,
  });
  const prevGateIdsRef = useRef(new Set<string>());
  const gateEntranceRef = useRef(new Map<string, number>());
  const wirePulseRef = useRef<
    Array<{
      qubit: number;
      toCol: number;
      color: number;
      progress: number;
    }>
  >([]);
  /** Ref to clean up the previous ticker callback — prevents stacking. */
  const tickerCleanupRef = useRef<(() => void) | null>(null);

  /* detect new gates for entrance animation */
  useEffect(() => {
    const currentIds = new Set(gates.map((g) => g.id));
    gates.forEach((g) => {
      if (!prevGateIdsRef.current.has(g.id)) {
        gateEntranceRef.current.set(g.id, 0);
      }
    });
    // Clean up removed gates from entrance map
    for (const id of gateEntranceRef.current.keys()) {
      if (!currentIds.has(id)) gateEntranceRef.current.delete(id);
    }
    prevGateIdsRef.current = currentIds;
  }, [gates]);

  /* detect step change for slide + wire pulse */
  useEffect(() => {
    const prev = prevStepRef.current;
    if (prev !== currentStep) {
      stepAnimRef.current = { from: prev, to: currentStep, progress: 0 };
      if (currentStep > prev) {
        const colSet = new Set(gates.map((g) => g.column));
        const sortedCols = [...colSet].sort((a, b) => a - b);
        const targetCol = sortedCols[currentStep - 1];
        if (targetCol !== undefined) {
          const gatesAtCol = gates.filter((g) => g.column === targetCol);
          gatesAtCol.forEach((gate) => {
            const def = GATE_LIBRARY[gate.name];
            const color = hexToNumber(def.color);
            gate.targets.forEach((qubit) => {
              wirePulseRef.current.push({
                qubit,
                toCol: targetCol,
                color,
                progress: 0,
              });
            });
          });
        }
      }
      prevStepRef.current = currentStep;
    }
  }, [currentStep, gates]);

  const drawScene = useCallback(() => {
    const app = appRef.current;
    if (!app) return;

    /* clean up previous ticker to prevent callback stacking */
    if (tickerCleanupRef.current) {
      tickerCleanupRef.current();
      tickerCleanupRef.current = null;
    }

    const width = CANVAS_PADDING * 2 + LABEL_WIDTH + maxColumns * COLUMN_WIDTH;
    const height = CANVAS_PADDING * 2 + HEADER_HEIGHT + numQubits * ROW_HEIGHT;
    app.renderer.resize(width, height);
    const stage = app.stage;
    stage.removeChildren();

    const backdrop = new Graphics();
    backdrop
      .roundRect(0, 0, width, height, 24)
      .fill({ color: 0x060810, alpha: 0.85 });
    stage.addChild(backdrop);

    const innerGlow = new Graphics();
    innerGlow.lineStyle(1, 0x00f5d4, 0.08);
    innerGlow.drawRoundedRect(1, 1, width - 2, height - 2, 24);
    stage.addChild(innerGlow);

    const gridLeft = CANVAS_PADDING + LABEL_WIDTH;
    const gridTop = CANVAS_PADDING + HEADER_HEIGHT;

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
      stage.addChild(label);
    }

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
      stage.addChild(colLabel);
    }

    const wires = new Graphics();
    for (let row = 0; row < numQubits; row += 1) {
      const y = gridTop + ROW_HEIGHT / 2 + row * ROW_HEIGHT;
      wires.lineStyle(2, 0x1e2a4a, 0.6);
      wires.moveTo(gridLeft, y);
      wires.lineTo(width - CANVAS_PADDING, y);
      wires.lineStyle(4, 0x00f5d4, 0.03);
      wires.moveTo(gridLeft, y);
      wires.lineTo(width - CANVAS_PADDING, y);
    }
    stage.addChild(wires);

    const dividers = new Graphics();
    dividers.lineStyle(1, 0x1a2545, 0.3);
    for (let col = 1; col < maxColumns; col += 1) {
      const x = gridLeft + col * COLUMN_WIDTH;
      dividers.moveTo(x, gridTop);
      dividers.lineTo(x, height - CANVAS_PADDING);
    }
    stage.addChild(dividers);

    /* animated layers */
    const animLayer = new Container();
    stage.addChild(animLayer);
    const stepIndicator = new Container();
    animLayer.addChild(stepIndicator);
    const wirePulseContainer = new Container();
    animLayer.addChild(wirePulseContainer);
    const gateContainer = new Container();
    animLayer.addChild(gateContainer);

    function drawStepIndicator(stepX: number) {
      stepIndicator.removeChildren();
      const glow = new Graphics();
      glow.lineStyle(8, 0x00f5d4, 0.1);
      glow.moveTo(stepX, gridTop - 4);
      glow.lineTo(stepX, height - CANVAS_PADDING + 4);
      stepIndicator.addChild(glow);
      const line = new Graphics();
      const stepHeight = height - CANVAS_PADDING - gridTop + 8;
      const segments = 20;
      for (let i = 0; i < segments; i++) {
        const t = i / segments;
        const segY = gridTop - 4 + t * stepHeight;
        const segH = stepHeight / segments;
        const r = Math.round(0x00 + t * (0xf7 - 0x00));
        const g = Math.round(0xf5 + t * (0x25 - 0xf5));
        const b = Math.round(0xd4 + t * (0x85 - 0xd4));
        const color = (r << 16) + (g << 8) + b;
        line.rect(stepX - 1.5, segY, 3, segH + 1).fill({ color, alpha: 0.9 });
      }
      stepIndicator.addChild(line);
    }

    function stepToX(step: number) {
      if (step <= 0) return gridLeft;
      const colSet = new Set(orderedGates.map((g) => g.column));
      const sortedCols = [...colSet].sort((a, b) => a - b);
      const col = sortedCols[step - 1];
      if (col === undefined) {
        // Step is beyond all gates — position after last occupied column
        const lastCol = sortedCols[sortedCols.length - 1] ?? 0;
        return gridLeft + (lastCol + 1) * COLUMN_WIDTH;
      }
      return gridLeft + (col + 1) * COLUMN_WIDTH;
    }

    /* ── gate drawing ── */
    function drawGates() {
      gateContainer.removeChildren();
      orderedGates.forEach((gate) => {
        const stepIndex = gateStepLookup.get(gate.id) ?? -1;
        const executed = stepIndex <= currentStep;
        const definition = GATE_LIBRARY[gate.name];
        const gateColor = hexToNumber(definition.color);
        const centerX =
          gridLeft + gate.column * COLUMN_WIDTH + COLUMN_WIDTH / 2;

        const entranceProgress = gateEntranceRef.current.get(gate.id);
        const ep =
          entranceProgress !== undefined && entranceProgress < 1
            ? easeOut(entranceProgress)
            : 1;
        const gateAlpha = ep;
        const gateScale = 0.5 + 0.5 * ep;

        if (gate.targets.length > 1) {
          drawMultiQubitGate(
            gateContainer,
            gate,
            definition,
            centerX,
            gridTop,
            executed,
            gateColor,
            gateAlpha,
            gateScale,
          );
        } else {
          drawSingleQubitGate(
            gateContainer,
            gate,
            centerX,
            gridTop,
            executed,
            gateColor,
            gateAlpha,
            gateScale,
          );
        }
      });
    }

    function drawSingleQubitGate(
      parent: Container,
      gate: GateInstance,
      centerX: number,
      gTop: number,
      executed: boolean,
      gateColor: number,
      alpha: number,
      scale: number,
    ) {
      const gateWidth = COLUMN_WIDTH - 20;
      const gateHeight = 44;
      const row = gate.targets[0];
      const top = gTop + row * ROW_HEIGHT + (ROW_HEIGHT - gateHeight) / 2;
      const c = new Container();
      c.alpha = alpha;
      c.scale.set(scale);
      c.pivot.set(centerX, top + gateHeight / 2);
      c.position.set(centerX, top + gateHeight / 2);

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
        c.addChild(glow);
      }

      const rect = new Graphics();
      rect
        .roundRect(centerX - gateWidth / 2, top, gateWidth, gateHeight, 12)
        .fill({
          color: executed ? 0x151a28 : gateColor,
          alpha: executed ? 0.6 : 0.25,
        });
      rect.lineStyle(1.5, gateColor, executed ? 0.3 : 0.6);
      rect.drawRoundedRect(
        centerX - gateWidth / 2,
        top,
        gateWidth,
        gateHeight,
        12,
      );
      c.addChild(rect);

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
      c.addChild(label);
      parent.addChild(c);
    }

    function drawMultiQubitGate(
      parent: Container,
      gate: GateInstance,
      _definition: (typeof GATE_LIBRARY)[keyof typeof GATE_LIBRARY],
      centerX: number,
      gTop: number,
      executed: boolean,
      gateColor: number,
      alpha: number,
      scale: number,
    ) {
      const targets = gate.targets;
      const minT = Math.min(...targets);
      const maxT = Math.max(...targets);
      const wireY = (row: number) => gTop + row * ROW_HEIGHT + ROW_HEIGHT / 2;
      const midY = wireY((minT + maxT) / 2);
      const c = new Container();
      c.alpha = alpha;
      c.scale.set(scale);
      c.pivot.set(centerX, midY);
      c.position.set(centerX, midY);

      const lineAlpha = executed ? 0.3 : 0.7;
      const symbolAlpha = executed ? 0.5 : 1.0;
      const fillColor = executed ? 0x6a7a9a : gateColor;

      // Vertical connecting line
      const vLine = new Graphics();
      vLine.lineStyle(2.5, gateColor, lineAlpha);
      vLine.moveTo(centerX, wireY(minT));
      vLine.lineTo(centerX, wireY(maxT));
      c.addChild(vLine);
      if (!executed) {
        const glow = new Graphics();
        glow.lineStyle(8, gateColor, 0.08);
        glow.moveTo(centerX, wireY(minT));
        glow.lineTo(centerX, wireY(maxT));
        c.addChild(glow);
      }

      if (gate.name === "SWAP") {
        targets.forEach((qubit) => {
          drawCrossSymbol(
            c,
            centerX,
            wireY(qubit),
            14,
            fillColor,
            symbolAlpha,
            gateColor,
            executed,
          );
        });
      } else if (gate.name === "CNOT") {
        drawControlDot(c, centerX, wireY(targets[0]), fillColor, symbolAlpha);
        drawTargetSymbol(
          c,
          centerX,
          wireY(targets[1]),
          fillColor,
          symbolAlpha,
          executed,
        );
      } else if (gate.name === "TOFFOLI") {
        drawControlDot(c, centerX, wireY(targets[0]), fillColor, symbolAlpha);
        drawControlDot(c, centerX, wireY(targets[1]), fillColor, symbolAlpha);
        drawTargetSymbol(
          c,
          centerX,
          wireY(targets[2]),
          fillColor,
          symbolAlpha,
          executed,
        );
      } else {
        // Fallback: generic multi-qubit box
        const span = maxT - minT + 1;
        const gh = Math.max(44, span * ROW_HEIGHT - 12);
        const gw = COLUMN_WIDTH - 20;
        const top = gTop + minT * ROW_HEIGHT + (ROW_HEIGHT - gh) / 2;
        const rect = new Graphics();
        rect.roundRect(centerX - gw / 2, top, gw, gh, 12).fill({
          color: executed ? 0x151a28 : gateColor,
          alpha: executed ? 0.6 : 0.25,
        });
        rect.lineStyle(1.5, gateColor, executed ? 0.3 : 0.6);
        rect.drawRoundedRect(centerX - gw / 2, top, gw, gh, 12);
        c.addChild(rect);
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
        label.y = top + gh / 2 - label.height / 2;
        c.addChild(label);
      }
      parent.addChild(c);
    }

    function drawControlDot(
      parent: Container,
      x: number,
      y: number,
      color: number,
      alpha: number,
    ) {
      const d = new Graphics();
      d.circle(x, y, 8).fill({ color, alpha });
      d.circle(x - 1.5, y - 1.5, 3).fill({ color: 0xffffff, alpha: 0.15 });
      parent.addChild(d);
    }

    function drawTargetSymbol(
      parent: Container,
      x: number,
      y: number,
      color: number,
      alpha: number,
      executed: boolean,
    ) {
      const radius = 14;
      const g = new Graphics();
      g.lineStyle(2.5, color, alpha);
      g.drawCircle(x, y, radius);
      g.circle(x, y, radius).fill({
        color: executed ? 0x151a28 : color,
        alpha: executed ? 0.4 : 0.1,
      });
      g.lineStyle(2, color, alpha);
      g.moveTo(x - radius, y);
      g.lineTo(x + radius, y);
      g.moveTo(x, y - radius);
      g.lineTo(x, y + radius);
      parent.addChild(g);
    }

    function drawCrossSymbol(
      parent: Container,
      x: number,
      y: number,
      size: number,
      color: number,
      alpha: number,
      baseColor: number,
      executed: boolean,
    ) {
      const g = new Graphics();
      /* backdrop circle for visibility */
      if (!executed) {
        g.circle(x, y, size + 5).fill({ color: baseColor, alpha: 0.08 });
      }
      g.circle(x, y, size + 2).fill({
        color: executed ? 0x151a28 : baseColor,
        alpha: executed ? 0.3 : 0.12,
      });
      /* cross lines */
      g.lineStyle(3, color, alpha);
      g.moveTo(x - size, y - size);
      g.lineTo(x + size, y + size);
      g.moveTo(x + size, y - size);
      g.lineTo(x - size, y + size);
      parent.addChild(g);
    }

    /* initial draw */
    const anim = stepAnimRef.current;
    const fromX = stepToX(anim.from);
    const toX = stepToX(anim.to);
    const curX =
      anim.progress >= 1 ? toX : fromX + (toX - fromX) * easeOut(anim.progress);
    drawStepIndicator(curX);
    drawGates();

    /* ticker for animations */
    const ticker = app.ticker;
    const tickFn = (tick: { deltaMS: number }) => {
      let needsRedraw = false;
      const dt = tick.deltaMS / 1000;

      const sa = stepAnimRef.current;
      if (sa.progress < 1) {
        sa.progress = Math.min(1, sa.progress + dt / 0.3);
        const fX = stepToX(sa.from);
        const tX = stepToX(sa.to);
        drawStepIndicator(fX + (tX - fX) * easeOut(sa.progress));
        needsRedraw = true;
      }

      for (const [id, prog] of gateEntranceRef.current.entries()) {
        if (prog < 1) {
          gateEntranceRef.current.set(id, Math.min(1, prog + dt / 0.25));
          needsRedraw = true;
        }
      }

      const pulses = wirePulseRef.current;
      if (pulses.length > 0) {
        wirePulseContainer.removeChildren();
        const remaining: typeof pulses = [];
        for (const pulse of pulses) {
          pulse.progress = Math.min(1, pulse.progress + dt / 0.5);
          if (pulse.progress < 1) remaining.push(pulse);
          const pEase = easeOut(pulse.progress);
          const startX = gridLeft;
          const endX = gridLeft + pulse.toCol * COLUMN_WIDTH + COLUMN_WIDTH / 2;
          const pX = startX + (endX - startX) * pEase;
          const pY = gridTop + pulse.qubit * ROW_HEIGHT + ROW_HEIGHT / 2;
          const pulseAlpha = Math.max(0, 1 - pulse.progress * 1.2);
          const pg = new Graphics();
          /* outer glow */
          pg.circle(pX, pY, 12).fill({
            color: pulse.color,
            alpha: 0.12 * pulseAlpha,
          });
          /* core */
          pg.circle(pX, pY, 5).fill({
            color: pulse.color,
            alpha: 0.9 * pulseAlpha,
          });
          /* bright center */
          pg.circle(pX, pY, 2).fill({
            color: 0xffffff,
            alpha: 0.6 * pulseAlpha,
          });
          wirePulseContainer.addChild(pg);
        }
        wirePulseRef.current = remaining;
        needsRedraw = true;
      }

      if (needsRedraw) drawGates();
    };
    ticker.add(tickFn);

    /* store cleanup so next drawScene call removes this callback */
    tickerCleanupRef.current = () => {
      ticker.remove(tickFn);
    };
  }, [currentStep, gateStepLookup, maxColumns, numQubits, orderedGates]);

  useEffect(() => {
    drawSceneRef.current = drawScene;
  }, [drawScene]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const app = new Application();
    let destroyed = false;
    app.init({ backgroundAlpha: 0, antialias: true }).then(() => {
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
      if (tickerCleanupRef.current) {
        tickerCleanupRef.current();
        tickerCleanupRef.current = null;
      }
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
          sx={{ width, height, borderRadius: 3, overflow: "hidden" }}
        />
        <DropGrid numQubits={numQubits} maxColumns={maxColumns} />
        <GateOverlay
          gates={orderedGates}
          gateStepLookup={gateStepLookup}
          currentStep={currentStep}
          onRemoveGate={onRemoveGate}
        />
      </Box>
    </Box>
  );
}

/* ── Drop Grid ────────────────────────────── */

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

/* ── Gate Overlay (DOM layer for tooltips & remove buttons) ── */

function GateOverlay({
  gates,
  gateStepLookup,
  currentStep,
  onRemoveGate,
}: {
  gates: GateInstance[];
  gateStepLookup: Map<string, number>;
  currentStep: number;
  onRemoveGate?: (id: string) => void;
}) {
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
        const isMultiQubit = gate.targets.length > 1;

        const gateHeight = isMultiQubit ? span * ROW_HEIGHT : 44;
        const gateWidth = isMultiQubit ? 40 : COLUMN_WIDTH - 20;
        const x = gate.column * COLUMN_WIDTH + COLUMN_WIDTH / 2 - gateWidth / 2;
        const y = isMultiQubit
          ? minTarget * ROW_HEIGHT
          : minTarget * ROW_HEIGHT + (ROW_HEIGHT - gateHeight) / 2;

        const executed = (gateStepLookup.get(gate.id) ?? -1) <= currentStep;

        let tooltipText: string;
        if (gate.name === "CNOT") {
          tooltipText = `CNOT: ● control q${gate.targets[0]}, ⊕ target q${gate.targets[1]}`;
        } else if (gate.name === "TOFFOLI") {
          tooltipText = `TOFFOLI: ● ctrl q${gate.targets[0]}, ● ctrl q${gate.targets[1]}, ⊕ target q${gate.targets[2]}`;
        } else if (gate.name === "SWAP") {
          tooltipText = `SWAP: q${gate.targets[0]} ↔ q${gate.targets[1]}`;
        } else {
          const targetsText =
            gate.targets.length === 1
              ? `q${gate.targets[0]}`
              : `q${gate.targets.join(", q")}`;
          tooltipText = `${gate.name} gate on ${targetsText}`;
        }

        return (
          <Tooltip key={gate.id} title={tooltipText} placement="top">
            <Box
              sx={{
                position: "absolute",
                left: x,
                top: y,
                width: gateWidth,
                height: gateHeight,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                pt: 0.5,
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
