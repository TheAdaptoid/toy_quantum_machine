import { describe, expect, it } from 'vitest'
import { applyGateToState, createZeroState, enumerateAmplitudes, measureState } from './engine'

describe('simulation engine', () => {
  it('initializes |0> state correctly', () => {
    const state = createZeroState(1)
    expect(state.real[0]).toBe(1)
    expect(state.imag[0]).toBe(0)
    expect(state.real[1]).toBe(0)
  })

  it('applies Hadamard on a single qubit', () => {
    const state = createZeroState(1)
    applyGateToState(state, 'H', [0], 1)
    const amplitudes = enumerateAmplitudes(state, 1)
    const probs = amplitudes.map((entry) => entry.probability)
    expect(probs[0]).toBeCloseTo(0.5, 5)
    expect(probs[1]).toBeCloseTo(0.5, 5)
  })

  it('applies CNOT entanglement', () => {
    const state = createZeroState(2)
    applyGateToState(state, 'H', [0], 2)
    applyGateToState(state, 'CNOT', [0, 1], 2)
    const amplitudes = enumerateAmplitudes(state, 2)
    const probs = amplitudes.map((entry) => entry.probability)
    expect(probs[0]).toBeCloseTo(0.5, 5)
    expect(probs[3]).toBeCloseTo(0.5, 5)
  })

  it('collapses measurement results', () => {
    const state = createZeroState(1)
    applyGateToState(state, 'H', [0], 1)
    const { nextState, result } = measureState(state, [0], 1)
    expect(Object.values(result.probabilities).reduce((sum, p) => sum + p, 0)).toBeCloseTo(1)
    const amplitudes = enumerateAmplitudes(nextState, 1)
    const nonZero = amplitudes.filter((entry) => entry.probability > 0.99)
    expect(nonZero).toHaveLength(1)
  })
})
