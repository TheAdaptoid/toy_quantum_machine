export type GateName =
  | "X"
  | "Z"
  | "H"
  | "S"
  | "T"
  | "CNOT"
  | "TOFFOLI"
  | "SWAP";

export interface StateVector {
  real: Float64Array;
  imag: Float64Array;
}

export interface GateInstance {
  id: string;
  name: GateName;
  targets: number[];
  column: number;
}

export interface CircuitDefinition {
  numQubits: number;
  gates: GateInstance[];
  initialState?: number[];
}

export interface MeasurementResult {
  outcome: string;
  measuredQubits: number[];
  probabilities: Record<string, number>;
}

export interface PackedMatrix {
  size: number;
  data: Float64Array;
}

export interface GateDescriptor {
  name: GateName;
  label: string;
  description: string;
  tooltipLatex: string;
  arity: number;
  paletteGroup: "single" | "multi";
  color: string;
}

export interface GateDefinition extends GateDescriptor {
  matrix: PackedMatrix;
}

export interface TimelineEntry {
  step: number;
  gate?: GateInstance;
  state: StateVector;
}
