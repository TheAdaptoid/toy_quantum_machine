import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  Alert,
  Box,
  Drawer,
  IconButton,
  Snackbar,
  Tooltip,
} from "@mui/material";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { GATE_LIST } from "@/simulation/gates";
import BarChartIcon from "@mui/icons-material/BarChart";
import CloseIcon from "@mui/icons-material/Close";
import { useCircuitStore } from "@/store/useCircuitStore";
import { CircuitCanvas } from "@/components/circuit/CircuitCanvas";
import { GatePalette } from "@/components/palette/GatePalette";
import { StepControls } from "@/components/layout/StepControls";
import { TopBar } from "@/components/layout/TopBar";
import { MeasurementDialog } from "@/components/dialogs/MeasurementDialog";
import { GateTargetDialog } from "@/components/dialogs/GateTargetDialog";
import { StateInspector } from "@/components/inspector/StateInspector";
import { enumerateAmplitudes } from "@/simulation/engine";
import {
  decodeCircuitFromQuery,
  downloadCircuit,
  encodeCircuitForQuery,
  importCircuitFromFile,
  loadCircuitFromStorage,
  saveCircuitToStorage,
} from "@/utils/persistence";
import type { GateName } from "@/types/quantum";

const DOCK_HEIGHT = 140;

interface DropCellData {
  column: number;
  qubit: number;
}

type PendingPlacement = {
  gateName: GateName;
  column: number;
  primaryQubit: number;
};

function buildDefaultTargets(
  gateName: GateName,
  primaryQubit: number,
  numQubits: number,
) {
  if (gateName !== "TOFFOLI") {
    const neighbor =
      primaryQubit + 1 < numQubits
        ? primaryQubit + 1
        : Math.max(0, primaryQubit - 1);
    return [primaryQubit, neighbor];
  }

  const targets = [primaryQubit];
  let offset = 1;
  while (
    targets.length < 3 &&
    (primaryQubit + offset < numQubits || primaryQubit - offset >= 0)
  ) {
    if (primaryQubit + offset < numQubits) {
      targets.push(primaryQubit + offset);
    }
    if (targets.length < 3 && primaryQubit - offset >= 0) {
      targets.push(primaryQubit - offset);
    }
    offset += 1;
  }
  return targets;
}

function App() {
  const {
    numQubits,
    initialState,
    gates,
    timeline,
    currentStep,
    measurement,
    setNumQubits,
    setInitialState,
    addGate,
    removeGate,
    resetCircuit,
    stepBackward,
    stepForward,
    jumpToStep,
    measure,
    loadCircuit,
    exportCircuit,
  } = useCircuitStore();

  /* ── mouse-tracking parallax ── */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    const onMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      document.documentElement.style.setProperty("--mouse-x", String(x));
      document.documentElement.style.setProperty("--mouse-y", String(y));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [measurementOpen, setMeasurementOpen] = useState(false);
  const [pendingPlacement, setPendingPlacement] =
    useState<PendingPlacement | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    severity: "success" | "info" | "error";
  } | null>(null);
  const [activeGate, setActiveGate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentState = timeline[currentStep]?.state;
  const amplitudes = useMemo(
    () => (currentState ? enumerateAmplitudes(currentState, numQubits) : []),
    [currentState, numQubits],
  );

  const maxColumns = useMemo(() => {
    const maxColumn = gates.reduce(
      (acc, gate) => Math.max(acc, gate.column),
      0,
    );
    return Math.max(8, maxColumn + 4);
  }, [gates]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const shared = decodeCircuitFromQuery(window.location.search);
    if (shared) {
      loadCircuit(shared);
      setToast({ message: "Loaded shared circuit", severity: "success" });
    }
  }, [loadCircuit]);

  const handleDragStart = (event: DragStartEvent) => {
    const gateName = event.active?.data?.current?.gateName as
      | string
      | undefined;
    setActiveGate(gateName ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveGate(null);
    const gateName = event.active?.data?.current?.gateName as
      | string
      | undefined;
    const arity = event.active?.data?.current?.arity as number | undefined;
    const overData = event.over?.data?.current as DropCellData | undefined;
    if (!gateName || !arity || !overData) {
      return;
    }
    if (arity > numQubits) {
      setToast({
        message: "Increase the register size before placing that gate.",
        severity: "error",
      });
      return;
    }
    if (arity === 1) {
      addGate(gateName as never, [overData.qubit], overData.column);
      return;
    }
    setPendingPlacement({
      gateName: gateName as PendingPlacement["gateName"],
      column: overData.column,
      primaryQubit: overData.qubit,
    });
  };

  const handlePlacementConfirm = (targets: number[]) => {
    if (!pendingPlacement) {
      return;
    }
    addGate(
      pendingPlacement.gateName as never,
      targets,
      pendingPlacement.column,
    );
    setPendingPlacement(null);
  };

  const handleMeasure = (qubits: number[]) => {
    const result = measure(qubits);
    if (result) {
      setToast({ message: `Outcome ${result.outcome}`, severity: "info" });
    }
    return result;
  };

  const handleSave = () => {
    const circuit = exportCircuit();
    downloadCircuit(circuit);
    saveCircuitToStorage(circuit);
    setToast({ message: "Circuit exported", severity: "success" });
  };

  const handleShare = async () => {
    if (typeof window === "undefined") {
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}?circuit=${encodeCircuitForQuery(exportCircuit())}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast({
        message: "Share URL copied to clipboard",
        severity: "success",
      });
    } catch {
      setToast({
        message: "Copy failed. Manually copy from address bar.",
        severity: "error",
      });
    }
  };

  const handleLoadFromStorage = () => {
    const stored = loadCircuitFromStorage();
    if (!stored) {
      setToast({
        message: "No saved circuit in this browser",
        severity: "error",
      });
      return;
    }
    loadCircuit(stored);
    setToast({ message: "Restored circuit from storage", severity: "success" });
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const imported = await importCircuitFromFile(file);
      loadCircuit(imported);
      setToast({ message: "Circuit imported", severity: "success" });
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : "Failed to import circuit",
        severity: "error",
      });
    } finally {
      event.target.value = "";
    }
  };

  const closeToast = () => setToast(null);
  const activeGateData = activeGate
    ? GATE_LIST.find((g) => g.name === activeGate)
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          pb: `${DOCK_HEIGHT}px`,
        }}
      >
        {/* Main content area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            p: { xs: 2, md: 3 },
            overflow: "hidden",
          }}
        >
          {/* Floating TopBar */}
          <Box className="reveal-stagger" sx={{ animationDelay: "0ms" }}>
            <TopBar
              numQubits={numQubits}
              initialState={initialState}
              onQubitsChange={setNumQubits}
              onInitialStateChange={setInitialState}
              onReset={resetCircuit}
              onSave={handleSave}
              onLoadClick={() => fileInputRef.current?.click()}
              onShare={handleShare}
              onRestore={handleLoadFromStorage}
              onMeasure={() => setMeasurementOpen(true)}
              measurement={measurement}
            />
          </Box>

          {/* Circuit Canvas - hero element */}
          <Box
            className="reveal-stagger"
            sx={{
              animationDelay: "80ms",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: 2,
              minHeight: 0,
            }}
          >
            <CircuitCanvas
              numQubits={numQubits}
              gates={gates}
              currentStep={currentStep}
              maxColumns={maxColumns}
              onRemoveGate={removeGate}
            />
          </Box>
        </Box>

        {/* Bottom Dock - Gates + Step Controls + Inspector Toggle */}
        <Box
          className="reveal-stagger"
          sx={{
            animationDelay: "160ms",
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: DOCK_HEIGHT,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            px: { xs: 2, md: 3 },
            py: 2,
            background:
              "linear-gradient(to top, rgba(3, 3, 8, 0.98) 0%, rgba(3, 3, 8, 0.9) 70%, transparent 100%)",
            zIndex: 1100,
          }}
        >
          {/* Gate Palette Row */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <GatePalette />

            {/* Inspector Toggle Button */}
            <Tooltip title="State Inspector">
              <IconButton
                onClick={() => setInspectorOpen(true)}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 3,
                  background: inspectorOpen
                    ? "linear-gradient(135deg, rgba(0, 245, 212, 0.2), rgba(247, 37, 133, 0.2))"
                    : "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(12px)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, rgba(0, 245, 212, 0.15), rgba(247, 37, 133, 0.15))",
                    borderColor: "rgba(0, 245, 212, 0.3)",
                    boxShadow: "0 0 20px rgba(0, 245, 212, 0.2)",
                  },
                }}
              >
                <BarChartIcon sx={{ color: "#00f5d4" }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Step Controls Row */}
          <StepControls
            currentStep={currentStep}
            totalSteps={timeline.length}
            onStepBack={stepBackward}
            onStepForward={stepForward}
            onJump={jumpToStep}
          />
        </Box>

        {/* State Inspector Drawer */}
        <Drawer
          anchor="bottom"
          open={inspectorOpen}
          onClose={() => setInspectorOpen(false)}
          PaperProps={{
            sx: {
              height: "50vh",
              maxHeight: 500,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              background: "rgba(8, 12, 24, 0.95)",
              backdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderBottom: "none",
              boxShadow:
                "0 -8px 40px rgba(0, 0, 0, 0.5), 0 0 80px rgba(0, 245, 212, 0.05)",
            },
          }}
        >
          <Box
            sx={{
              p: 3,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box
                sx={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: 3,
                  color: "text.secondary",
                }}
              >
                State Inspector
              </Box>
              <IconButton
                onClick={() => setInspectorOpen(false)}
                size="small"
                sx={{ color: "text.secondary" }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
              <StateInspector amplitudes={amplitudes} />
            </Box>
          </Box>
        </Drawer>

        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept="application/json"
          onChange={handleFileSelect}
        />

        <MeasurementDialog
          open={measurementOpen}
          numQubits={numQubits}
          onClose={() => setMeasurementOpen(false)}
          onMeasure={(targets) => {
            const result = handleMeasure(targets);
            setMeasurementOpen(false);
            return result;
          }}
          lastMeasurement={measurement}
        />

        {pendingPlacement && (
          <GateTargetDialog
            key={`${pendingPlacement.gateName}-${pendingPlacement.primaryQubit}-${pendingPlacement.column}`}
            open
            gateName={pendingPlacement.gateName}
            numQubits={numQubits}
            initialTargets={buildDefaultTargets(
              pendingPlacement.gateName,
              pendingPlacement.primaryQubit,
              numQubits,
            )}
            onConfirm={handlePlacementConfirm}
            onCancel={() => setPendingPlacement(null)}
          />
        )}

        {toast && (
          <Snackbar
            open
            autoHideDuration={4000}
            onClose={closeToast}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert severity={toast.severity}>{toast.message}</Alert>
          </Snackbar>
        )}

        {/* Drag overlay for cross-container dragging */}
        <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
          {activeGateData && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.75,
                px: 2,
                py: 1,
                borderRadius: 3,
                fontWeight: 600,
                fontSize: "0.85rem",
                fontFamily: '"Outfit", sans-serif',
                cursor: "grabbing",
                userSelect: "none",
                background: `linear-gradient(135deg, ${activeGateData.color}30 0%, ${activeGateData.color}15 100%)`,
                border: `1px solid ${activeGateData.color}60`,
                color: activeGateData.color,
                boxShadow: `0 0 30px ${activeGateData.color}60, 0 8px 24px rgba(0, 0, 0, 0.4)`,
                transform: "scale(1.1)",
              }}
            >
              <span>{activeGateData.label}</span>
              {activeGateData.arity > 1 && (
                <Box
                  component="span"
                  sx={{
                    fontSize: "0.65rem",
                    opacity: 0.7,
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  ×{activeGateData.arity}
                </Box>
              )}
            </Box>
          )}
        </DragOverlay>
      </Box>
    </DndContext>
  );
}

export default App;
