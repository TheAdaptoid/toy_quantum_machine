import { describe, expect, it } from "vitest";
import {
  applyGateToState,
  buildTimeline,
  createGateInstance,
  createZeroState,
  enumerateAmplitudes,
  measureState,
} from "./engine";

describe("simulation engine", () => {
  it("initializes |0> state correctly", () => {
    const state = createZeroState(1);
    expect(state.real[0]).toBe(1);
    expect(state.imag[0]).toBe(0);
    expect(state.real[1]).toBe(0);
  });

  it("applies Hadamard on a single qubit", () => {
    const state = createZeroState(1);
    applyGateToState(state, "H", [0], 1);
    const amplitudes = enumerateAmplitudes(state, 1);
    const probs = amplitudes.map((entry) => entry.probability);
    expect(probs[0]).toBeCloseTo(0.5, 5);
    expect(probs[1]).toBeCloseTo(0.5, 5);
  });

  it("starts from a custom initial state", () => {
    const timeline = buildTimeline(3, [], [1, 0, 1]);
    const amplitudes = enumerateAmplitudes(timeline[0].state, 3);
    const probs = amplitudes.map((entry) => entry.probability);
    expect(probs[5]).toBeCloseTo(1, 5);
  });

  it("applies CNOT entanglement", () => {
    const state = createZeroState(2);
    applyGateToState(state, "H", [0], 2);
    applyGateToState(state, "CNOT", [0, 1], 2);
    const amplitudes = enumerateAmplitudes(state, 2);
    const probs = amplitudes.map((entry) => entry.probability);
    expect(probs[0]).toBeCloseTo(0.5, 5);
    expect(probs[3]).toBeCloseTo(0.5, 5);
  });

  it("applies Toffoli when both controls are 1", () => {
    const state = createZeroState(3);
    applyGateToState(state, "X", [0], 3);
    applyGateToState(state, "X", [1], 3);
    applyGateToState(state, "TOFFOLI", [0, 1, 2], 3);
    const amplitudes = enumerateAmplitudes(state, 3);
    const probs = amplitudes.map((entry) => entry.probability);
    expect(probs[7]).toBeCloseTo(1, 5);
    expect(probs[3]).toBeCloseTo(0, 5);
  });

  it("collapses measurement results", () => {
    const state = createZeroState(1);
    applyGateToState(state, "H", [0], 1);
    const { nextState, result } = measureState(state, [0], 1);
    expect(
      Object.values(result.probabilities).reduce((sum, p) => sum + p, 0),
    ).toBeCloseTo(1);
    const amplitudes = enumerateAmplitudes(nextState, 1);
    const nonZero = amplitudes.filter((entry) => entry.probability > 0.99);
    expect(nonZero).toHaveLength(1);
  });

  it("groups same-column gates into a single timeline step", () => {
    const gateA = createGateInstance("X", [0], 0);
    const gateB = createGateInstance("X", [1], 0);
    const timeline = buildTimeline(2, [gateA, gateB]);
    // step 0 = initial, step 1 = both gates applied concurrently
    expect(timeline).toHaveLength(2);
    expect(timeline[1].gates).toHaveLength(2);
    expect(timeline[1].column).toBe(0);
    // Both X gates flip their respective qubits → |11⟩
    const amplitudes = enumerateAmplitudes(timeline[1].state, 2);
    expect(amplitudes[3].probability).toBeCloseTo(1, 5);
  });

  it("creates separate steps for different columns", () => {
    const gateA = createGateInstance("X", [0], 0);
    const gateB = createGateInstance("H", [1], 2);
    const timeline = buildTimeline(2, [gateA, gateB]);
    // step 0 = initial, step 1 = col 0, step 2 = col 2
    expect(timeline).toHaveLength(3);
    expect(timeline[1].gates).toHaveLength(1);
    expect(timeline[1].gates[0].name).toBe("X");
    expect(timeline[2].gates).toHaveLength(1);
    expect(timeline[2].gates[0].name).toBe("H");
  });
});
