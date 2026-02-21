import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );
  const [measurementOpen, setMeasurementOpen] = useState(false);
  const [pendingPlacement, setPendingPlacement] =
    useState<PendingPlacement | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    severity: "success" | "info" | "error";
  } | null>(null);
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

  const handleDragEnd = (event: DragEndEvent) => {
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

  return (
    <Box sx={{ py: { xs: 4, md: 6 }, px: 2 }}>
      <Container maxWidth="xl">
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
        />

        <Stack spacing={4} sx={{ mt: 4 }}>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <GatePalette />
            <CircuitCanvas
              numQubits={numQubits}
              gates={gates}
              currentStep={currentStep}
              maxColumns={maxColumns}
              onRemoveGate={removeGate}
            />
          </DndContext>

          <StepControls
            currentStep={currentStep}
            totalSteps={timeline.length}
            onStepBack={stepBackward}
            onStepForward={stepForward}
            onJump={jumpToStep}
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                p: 3,
                borderRadius: 3,
                border: "1px solid rgba(132,150,255,0.25)",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Box>
                  <Typography variant="h6">Measurement</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Inspect probabilities then collapse the register.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  onClick={() => setMeasurementOpen(true)}
                >
                  Measure qubits
                </Button>
              </Stack>
              {measurement ? (
                <Box>
                  <Typography variant="subtitle2">
                    Outcome: {measurement.outcome}
                  </Typography>
                  {Object.entries(measurement.probabilities).map(
                    ([label, probability]) => (
                      <Typography variant="body2" key={label}>
                        {label}: {(probability * 100).toFixed(2)}%
                      </Typography>
                    ),
                  )}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  No measurements yet. Use the button above to sample.
                </Typography>
              )}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <StateInspector amplitudes={amplitudes} />
            </Box>
          </Stack>
        </Stack>
      </Container>

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
        <Snackbar open autoHideDuration={4000} onClose={closeToast}>
          <Alert severity={toast.severity}>{toast.message}</Alert>
        </Snackbar>
      )}
    </Box>
  );
}

export default App;
