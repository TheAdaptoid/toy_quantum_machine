import type { CircuitDefinition, GateInstance } from '@/types/quantum'
import { enforceQubitLimit } from '@/simulation/engine'
import { GATE_LIBRARY } from '@/simulation/gates'

const STORAGE_KEY = 'toy-quantum-circuit'

export function saveCircuitToStorage(definition: CircuitDefinition) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(definition))
}

export function loadCircuitFromStorage(): CircuitDefinition | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }
  return parseCircuitJSON(raw)
}

export function parseCircuitJSON(raw: string): CircuitDefinition {
  const parsed = JSON.parse(raw)
  validateCircuitDefinition(parsed)
  return parsed
}

export function encodeCircuitForQuery(definition: CircuitDefinition): string {
  const serialized = JSON.stringify(definition)
  return encodeURIComponent(serialized)
}

export function decodeCircuitFromQuery(search: string): CircuitDefinition | null {
  const params = new URLSearchParams(search)
  const encoded = params.get('circuit')
  if (!encoded) {
    return null
  }
  const decoded = decodeURIComponent(encoded)
  return parseCircuitJSON(decoded)
}

function validateCircuitDefinition(input: CircuitDefinition): asserts input is CircuitDefinition {
  enforceQubitLimit(input.numQubits)
  if (!Array.isArray(input.gates)) {
    throw new Error('Circuit payload missing gates array')
  }
  input.gates.forEach((gate) => {
    const definition = GATE_LIBRARY[gate.name]
    if (!definition) {
      throw new Error(`Unsupported gate ${gate.name}`)
    }
    if (!Array.isArray(gate.targets) || gate.targets.length !== definition.arity) {
      throw new Error(`Gate ${gate.name} is missing targets`)
    }
    gate.targets.forEach((target) => {
      if (typeof target !== 'number' || target < 0 || target >= input.numQubits) {
        throw new Error('Circuit contains invalid target index')
      }
    })
    if (gate.column < 0) {
      throw new Error('Gate has invalid column index')
    }
  })
}

export function downloadCircuit(definition: CircuitDefinition) {
  const blob = new Blob([JSON.stringify(definition, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'toy-quantum-circuit.json'
  anchor.click()
  URL.revokeObjectURL(url)
}

export function importCircuitFromFile(file: File): Promise<CircuitDefinition> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result as string
        const parsed = parseCircuitJSON(text)
        resolve(parsed)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export function sanitizeCircuit(definition: CircuitDefinition): CircuitDefinition {
  const gates: GateInstance[] = definition.gates.map((gate) => ({ ...gate }))
  return { numQubits: definition.numQubits, gates }
}