import { nanoid } from "nanoid";
import type {
  GateInstance,
  GateName,
  MeasurementResult,
  PackedMatrix,
  StateVector,
  TimelineEntry,
} from "@/types/quantum";
import { GATE_LIBRARY } from "./gates";
import { magnitudeSquared, multiplyComplex } from "./complex";

export function createBasisState(
  numQubits: number,
  initialState?: number[],
): StateVector {
  const dimension = 1 << numQubits;
  const real = new Float64Array(dimension);
  const imag = new Float64Array(dimension);
  const bits = initialState ?? [];
  let index = 0;
  for (let qubit = 0; qubit < numQubits; qubit += 1) {
    if (bits[qubit] === 1) {
      index |= 1 << qubit;
    }
  }
  real[index] = 1;
  return { real, imag };
}

export function createZeroState(numQubits: number): StateVector {
  return createBasisState(numQubits);
}

export function cloneState(source: StateVector): StateVector {
  return {
    real: new Float64Array(source.real),
    imag: new Float64Array(source.imag),
  };
}

export function applyGateToState(
  state: StateVector,
  gateName: GateName,
  targets: number[],
  numQubits: number,
) {
  const gate = GATE_LIBRARY[gateName];
  if (!gate) {
    throw new Error(`Unknown gate ${gateName}`);
  }
  if (targets.length !== gate.arity) {
    throw new Error(`Gate ${gateName} expects ${gate.arity} targets`);
  }
  if (gate.arity === 1) {
    applySingleQubitGate(state, gate.matrix, targets[0]);
  } else {
    applyMultiQubitGate(state, gate.matrix, targets, numQubits);
  }
}

export function buildTimeline(
  numQubits: number,
  gates: GateInstance[],
  initialState?: number[],
): TimelineEntry[] {
  const orderedGates = [...gates].sort((a, b) =>
    a.column === b.column ? a.id.localeCompare(b.id) : a.column - b.column,
  );
  const timeline: TimelineEntry[] = [];
  let workingState = createBasisState(numQubits, initialState);
  timeline.push({ step: 0, state: cloneState(workingState) });

  orderedGates.forEach((gate, index) => {
    workingState = cloneState(workingState);
    applyGateToState(workingState, gate.name, gate.targets, numQubits);
    timeline.push({ step: index + 1, state: cloneState(workingState), gate });
  });

  return timeline;
}

export function measureState(
  state: StateVector,
  measuredQubits: number[],
  numQubits: number,
): { nextState: StateVector; result: MeasurementResult } {
  if (measuredQubits.length === 0) {
    throw new Error("Select at least one qubit to measure");
  }
  const sortedQubits = [...new Set(measuredQubits)].sort((a, b) => a - b);
  sortedQubits.forEach((idx) => {
    if (idx < 0 || idx >= numQubits) {
      throw new Error("Measurement target outside register range");
    }
  });

  const blockSize = 1 << sortedQubits.length;
  const subsetProbabilities = new Array(blockSize).fill(0);
  const totalStates = state.real.length;

  for (let basis = 0; basis < totalStates; basis += 1) {
    let pattern = 0;
    sortedQubits.forEach((q, bitIdx) => {
      const bit = (basis >> q) & 1;
      pattern |= bit << bitIdx;
    });
    const prob = magnitudeSquared(state.real[basis], state.imag[basis]);
    subsetProbabilities[pattern] += prob;
  }

  const probabilitiesMap: Record<string, number> = {};
  subsetProbabilities.forEach((probability, pattern) => {
    const label = describePattern(pattern, sortedQubits);
    probabilitiesMap[label] = probability;
  });

  const selectedPattern = samplePattern(subsetProbabilities);
  const collapsed = cloneState(state);
  const maskExpectations = new Map<number, number>();
  sortedQubits.forEach((qubit, idx) => {
    maskExpectations.set(qubit, (selectedPattern >> idx) & 1);
  });

  let normalization = 0;
  for (let basis = 0; basis < totalStates; basis += 1) {
    if (!matchesMask(basis, maskExpectations)) {
      collapsed.real[basis] = 0;
      collapsed.imag[basis] = 0;
      continue;
    }
    normalization += magnitudeSquared(
      collapsed.real[basis],
      collapsed.imag[basis],
    );
  }

  const normFactor = normalization > 0 ? 1 / Math.sqrt(normalization) : 0;
  for (let basis = 0; basis < totalStates; basis += 1) {
    collapsed.real[basis] *= normFactor;
    collapsed.imag[basis] *= normFactor;
  }

  const result: MeasurementResult = {
    outcome: describePattern(selectedPattern, sortedQubits),
    measuredQubits: sortedQubits,
    probabilities: probabilitiesMap,
  };

  return { nextState: collapsed, result };
}

export function createGateInstance(
  name: GateName,
  targets: number[],
  column: number,
): GateInstance {
  return {
    id: nanoid(6),
    name,
    targets,
    column,
  };
}

function matchesMask(
  basis: number,
  expectations: Map<number, number>,
): boolean {
  for (const [qubit, expected] of expectations.entries()) {
    const bit = (basis >> qubit) & 1;
    if (bit !== expected) {
      return false;
    }
  }
  return true;
}

function describePattern(pattern: number, qubits: number[]): string {
  return qubits
    .map((qubit, idx) => `q${qubit}=${(pattern >> idx) & 1}`)
    .join(" ");
}

function samplePattern(probabilities: number[]): number {
  const total = probabilities.reduce((sum, value) => sum + value, 0);
  if (total === 0) {
    return 0;
  }
  const threshold = Math.random() * total;
  let accumulator = 0;
  for (let i = 0; i < probabilities.length; i += 1) {
    accumulator += probabilities[i];
    if (threshold <= accumulator) {
      return i;
    }
  }
  return probabilities.length - 1;
}

function applySingleQubitGate(
  state: StateVector,
  matrix: PackedMatrix,
  targetQubit: number,
) {
  const { real, imag } = state;
  const stride = 1 << targetQubit;
  const span = stride << 1;
  const size = real.length;

  const m = matrix.data;
  const m00r = m[0];
  const m00i = m[1];
  const m01r = m[2];
  const m01i = m[3];
  const m10r = m[4];
  const m10i = m[5];
  const m11r = m[6];
  const m11i = m[7];

  for (let base = 0; base < size; base += span) {
    for (let offset = 0; offset < stride; offset += 1) {
      const i0 = base + offset;
      const i1 = i0 + stride;
      const aReal = real[i0];
      const aImag = imag[i0];
      const bReal = real[i1];
      const bImag = imag[i1];

      const [c00r, c00i] = multiplyComplex(m00r, m00i, aReal, aImag);
      const [c01r, c01i] = multiplyComplex(m01r, m01i, bReal, bImag);
      const [c10r, c10i] = multiplyComplex(m10r, m10i, aReal, aImag);
      const [c11r, c11i] = multiplyComplex(m11r, m11i, bReal, bImag);

      real[i0] = c00r + c01r;
      imag[i0] = c00i + c01i;
      real[i1] = c10r + c11r;
      imag[i1] = c10i + c11i;
    }
  }
}

function applyMultiQubitGate(
  state: StateVector,
  matrix: PackedMatrix,
  targets: number[],
  numQubits: number,
) {
  const { real, imag } = state;
  const orderedTargets = [...targets];
  const targetCount = orderedTargets.length;
  const blockSize = 1 << targetCount;
  const targetFlags = new Array<boolean>(numQubits).fill(false);
  orderedTargets.forEach((idx) => {
    targetFlags[idx] = true;
  });
  const otherCount = numQubits - targetCount;
  const combos = 1 << otherCount;
  const vectorReal = new Float64Array(blockSize);
  const vectorImag = new Float64Array(blockSize);
  const nextReal = new Float64Array(blockSize);
  const nextImag = new Float64Array(blockSize);

  for (let combo = 0; combo < combos; combo += 1) {
    const baseIndex = scatterBits(combo, targetFlags);
    for (let pattern = 0; pattern < blockSize; pattern += 1) {
      const idx = baseIndex | encodePattern(pattern, orderedTargets);
      vectorReal[pattern] = real[idx];
      vectorImag[pattern] = imag[idx];
    }

    for (let row = 0; row < blockSize; row += 1) {
      let accReal = 0;
      let accImag = 0;
      for (let col = 0; col < blockSize; col += 1) {
        const offset = (row * matrix.size + col) * 2;
        const mReal = matrix.data[offset];
        const mImag = matrix.data[offset + 1];
        const [prodReal, prodImag] = multiplyComplex(
          mReal,
          mImag,
          vectorReal[col],
          vectorImag[col],
        );
        accReal += prodReal;
        accImag += prodImag;
      }
      nextReal[row] = accReal;
      nextImag[row] = accImag;
    }

    for (let pattern = 0; pattern < blockSize; pattern += 1) {
      const idx = baseIndex | encodePattern(pattern, orderedTargets);
      real[idx] = nextReal[pattern];
      imag[idx] = nextImag[pattern];
    }
  }
}

function scatterBits(value: number, targetFlags: boolean[]): number {
  let result = 0;
  let otherBitIndex = 0;
  for (let bit = 0; bit < targetFlags.length; bit += 1) {
    if (targetFlags[bit]) {
      continue;
    }
    const bitValue = (value >> otherBitIndex) & 1;
    if (bitValue) {
      result |= 1 << bit;
    }
    otherBitIndex += 1;
  }
  return result;
}

function encodePattern(pattern: number, targets: number[]): number {
  let mask = 0;
  const lastIndex = targets.length - 1;
  for (let i = 0; i < targets.length; i += 1) {
    const bitIndex = lastIndex - i;
    if ((pattern >> bitIndex) & 1) {
      mask |= 1 << targets[i];
    }
  }
  return mask;
}

export function enumerateAmplitudes(state: StateVector, numQubits: number) {
  const entries = [] as Array<{
    basisLabel: string;
    real: number;
    imag: number;
    probability: number;
  }>;
  const totalStates = state.real.length;
  for (let basis = 0; basis < totalStates; basis += 1) {
    const basisLabel = basisToLabel(basis, numQubits);
    const real = state.real[basis];
    const imag = state.imag[basis];
    const probability = magnitudeSquared(real, imag);
    entries.push({ basisLabel, real, imag, probability });
  }
  return entries;
}

function basisToLabel(index: number, numQubits: number) {
  const bits = [] as string[];
  for (let qubit = numQubits - 1; qubit >= 0; qubit -= 1) {
    bits.push(((index >> qubit) & 1).toString());
  }
  return `|${bits.join("")}>`;
}

export function normalizeState(state: StateVector) {
  let norm = 0;
  for (let i = 0; i < state.real.length; i += 1) {
    norm += magnitudeSquared(state.real[i], state.imag[i]);
  }
  const factor = norm > 0 ? 1 / Math.sqrt(norm) : 0;
  for (let i = 0; i < state.real.length; i += 1) {
    state.real[i] *= factor;
    state.imag[i] *= factor;
  }
}

export function enforceQubitLimit(numQubits: number) {
  if (numQubits < 1 || numQubits > 6) {
    throw new Error("Supported qubit range is 1-6");
  }
}
