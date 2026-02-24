import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  CircuitDefinition,
  GateInstance,
  GateName,
  MeasurementResult,
  StateVector,
  TimelineEntry,
} from "@/types/quantum";
import {
  applyGateToState,
  buildTimeline,
  cloneState,
  createGateInstance,
  enforceQubitLimit,
  measureState,
} from "@/simulation/engine";

interface CircuitStoreState {
  numQubits: number;
  initialState: number[];
  gates: GateInstance[];
  timeline: TimelineEntry[];
  currentStep: number;
  measurement?: MeasurementResult;
}

interface CircuitStoreActions {
  setNumQubits: (value: number) => void;
  setInitialState: (state: number[]) => void;
  addGate: (gateName: GateName, targets: number[], column: number) => void;
  removeGate: (id: string) => void;
  moveGate: (id: string, column: number) => void;
  resetCircuit: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  jumpToStep: (step: number) => void;
  measure: (qubits: number[]) => MeasurementResult | undefined;
  loadCircuit: (definition: CircuitDefinition) => void;
  exportCircuit: () => CircuitDefinition;
}

export type CircuitStore = CircuitStoreState & CircuitStoreActions;

const initialQubits = 3;
const initialState = normalizeInitialState(initialQubits);
const initialTimeline = buildTimeline(initialQubits, [], initialState);

export const useCircuitStore = create<CircuitStore>()(
  immer((set, get) => ({
    numQubits: initialQubits,
    initialState,
    gates: [],
    timeline: initialTimeline,
    currentStep: 0,
    measurement: undefined,

    setNumQubits: (value) => {
      enforceQubitLimit(value);
      const nextInitialState = normalizeInitialState(value, get().initialState);
      set(() => ({
        numQubits: value,
        initialState: nextInitialState,
        gates: [],
        timeline: buildTimeline(value, [], nextInitialState),
        currentStep: 0,
        measurement: undefined,
      }));
    },

    setInitialState: (state) => {
      set((draft) => {
        const nextInitialState = normalizeInitialState(draft.numQubits, state);
        draft.initialState = nextInitialState;
        draft.timeline = buildTimeline(
          draft.numQubits,
          draft.gates,
          nextInitialState,
        );
        draft.currentStep = Math.min(
          draft.currentStep,
          draft.timeline.length - 1,
        );
        draft.measurement = undefined;
      });
    },

    addGate: (gateName, targets, column) => {
      const { numQubits, initialState: currentInitialState } = get();
      enforceTargets(targets, numQubits);
      set((draft) => {
        const safeColumn = Math.max(0, column);
        draft.gates.push(createGateInstance(gateName, targets, safeColumn));
        draft.timeline = buildTimeline(
          draft.numQubits,
          draft.gates,
          currentInitialState,
        );
        draft.currentStep = Math.min(
          draft.currentStep,
          draft.timeline.length - 1,
        );
        draft.measurement = undefined;
      });
    },

    removeGate: (id) => {
      set((draft) => {
        draft.gates = draft.gates.filter((gate) => gate.id !== id);
        draft.timeline = buildTimeline(
          draft.numQubits,
          draft.gates,
          draft.initialState,
        );
        draft.currentStep = Math.min(
          draft.currentStep,
          draft.timeline.length - 1,
        );
      });
    },

    moveGate: (id, column) => {
      set((draft) => {
        const target = draft.gates.find((gate) => gate.id === id);
        if (!target) {
          return;
        }
        target.column = Math.max(0, column);
        draft.timeline = buildTimeline(
          draft.numQubits,
          draft.gates,
          draft.initialState,
        );
      });
    },

    resetCircuit: () => {
      set((draft) => {
        draft.gates = [];
        draft.timeline = buildTimeline(
          draft.numQubits,
          draft.gates,
          draft.initialState,
        );
        draft.currentStep = 0;
        draft.measurement = undefined;
      });
    },

    stepForward: () => {
      set((draft) => {
        draft.currentStep = Math.min(
          draft.timeline.length - 1,
          draft.currentStep + 1,
        );
        draft.measurement = undefined;
      });
    },

    stepBackward: () => {
      set((draft) => {
        draft.currentStep = Math.max(0, draft.currentStep - 1);
        draft.measurement = undefined;
      });
    },

    jumpToStep: (step) => {
      set((draft) => {
        draft.currentStep = Math.max(
          0,
          Math.min(step, draft.timeline.length - 1),
        );
        draft.measurement = undefined;
      });
    },

    measure: (qubits) => {
      const { numQubits, timeline, currentStep } = get();
      if (!timeline[currentStep]) {
        return undefined;
      }
      const working = cloneState(timeline[currentStep].state);
      const { nextState, result } = measureState(working, qubits, numQubits);

      set((draft) => {
        const currentColumn = draft.timeline[draft.currentStep]?.column ?? -1;
        const futureGates = orderGates(draft.gates).filter(
          (g) => g.column > currentColumn,
        );
        const preserved = draft.timeline.slice(0, draft.currentStep);
        const baseEntry: TimelineEntry = {
          ...draft.timeline[draft.currentStep],
          state: cloneState(nextState),
        };
        const rebuilt = rebuildFutureTimeline(
          baseEntry.state,
          futureGates,
          draft.currentStep,
          draft.numQubits,
        );
        draft.timeline = [...preserved, baseEntry, ...rebuilt];
        draft.measurement = result;
      });

      return result;
    },

    loadCircuit: (definition) => {
      enforceQubitLimit(definition.numQubits);
      const nextInitialState = normalizeInitialState(
        definition.numQubits,
        definition.initialState,
      );
      set(() => ({
        numQubits: definition.numQubits,
        initialState: nextInitialState,
        gates: definition.gates,
        timeline: buildTimeline(
          definition.numQubits,
          definition.gates,
          nextInitialState,
        ),
        currentStep: 0,
        measurement: undefined,
      }));
    },

    exportCircuit: () => {
      const { numQubits, gates, initialState: currentInitialState } = get();
      return { numQubits, gates, initialState: currentInitialState };
    },
  })),
);

function normalizeInitialState(numQubits: number, state?: number[]) {
  const nextState = new Array<number>(numQubits).fill(0);
  if (!state || !Array.isArray(state)) {
    return nextState;
  }
  for (let idx = 0; idx < Math.min(numQubits, state.length); idx += 1) {
    nextState[idx] = state[idx] === 1 ? 1 : 0;
  }
  return nextState;
}

function enforceTargets(targets: number[], numQubits: number) {
  const unique = new Set(targets);
  if (unique.size !== targets.length) {
    throw new Error("Duplicate qubit targets are not allowed");
  }
  targets.forEach((target) => {
    if (target < 0 || target >= numQubits) {
      throw new Error("Target outside of register range");
    }
  });
}

function rebuildFutureTimeline(
  baseState: StateVector,
  gates: GateInstance[],
  startingStep: number,
  numQubits: number,
) {
  const entries: TimelineEntry[] = [];
  const working = cloneState(baseState);

  // Group future gates by column
  const columnGroups = new Map<number, GateInstance[]>();
  gates.forEach((gate) => {
    const group = columnGroups.get(gate.column);
    if (group) {
      group.push(gate);
    } else {
      columnGroups.set(gate.column, [gate]);
    }
  });

  const sortedColumns = [...columnGroups.keys()].sort((a, b) => a - b);
  sortedColumns.forEach((col, idx) => {
    const group = columnGroups.get(col)!;
    group.forEach((gate) => {
      applyGateToState(working, gate.name, gate.targets, numQubits);
    });
    entries.push({
      step: startingStep + idx + 1,
      gates: group,
      column: col,
      state: cloneState(working),
    });
  });
  return entries;
}

function orderGates(gates: GateInstance[]) {
  return [...gates].sort((a, b) =>
    a.column === b.column ? a.id.localeCompare(b.id) : a.column - b.column,
  );
}
