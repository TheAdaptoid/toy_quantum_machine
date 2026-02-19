import type { GateDefinition, GateName, PackedMatrix } from '@/types/quantum'
import { EPSILON, multiplyComplex } from './complex'

const SQRT1_2 = 1 / Math.sqrt(2)
const TAU_EIGHTH = Math.PI / 4

function createMatrix(size: number, entries: number[]): PackedMatrix {
  if (entries.length !== size * size * 2) {
    throw new Error(`Matrix entries mismatch for size ${size}`)
  }
  const matrix: PackedMatrix = {
    size,
    data: Float64Array.from(entries),
  }
  validateUnitary(matrix)
  return matrix
}

function getEntry(matrix: PackedMatrix, row: number, column: number): [number, number] {
  const offset = (row * matrix.size + column) * 2
  return [matrix.data[offset], matrix.data[offset + 1]]
}

function validateUnitary(matrix: PackedMatrix) {
  for (let row = 0; row < matrix.size; row += 1) {
    for (let col = 0; col < matrix.size; col += 1) {
      let real = 0
      let imag = 0
      for (let k = 0; k < matrix.size; k += 1) {
        const [aReal, aImag] = getEntry(matrix, row, k)
        const [bReal, bImag] = getEntry(matrix, col, k)
        const [prodReal, prodImag] = multiplyComplex(aReal, aImag, bReal, -bImag)
        real += prodReal
        imag += prodImag
      }
      const isDiagonal = row === col
      const expectedReal = isDiagonal ? 1 : 0
      if (Math.abs(real - expectedReal) > EPSILON || Math.abs(imag) > EPSILON) {
        throw new Error('Non-unitary matrix detected during gate initialization')
      }
    }
  }
}

const gatePalette: GateDefinition[] = [
  {
    name: 'X',
    label: 'X',
    description: 'Pauli-X flips the qubit',
    tooltipLatex: 'X = \\begin{pmatrix}0 & 1 \\\\ 1 & 0\\end{pmatrix}',
    arity: 1,
    paletteGroup: 'single',
    color: '#ec5f67',
    matrix: createMatrix(2, [
      0, 0, 1, 0,
      1, 0, 0, 0,
    ]),
  },
  {
    name: 'Z',
    label: 'Z',
    description: 'Pauli-Z applies a phase flip',
    tooltipLatex: 'Z = \\begin{pmatrix}1 & 0 \\\\ 0 & -1\\end{pmatrix}',
    arity: 1,
    paletteGroup: 'single',
    color: '#c594c5',
    matrix: createMatrix(2, [
      1, 0, 0, 0,
      0, 0, -1, 0,
    ]),
  },
  {
    name: 'H',
    label: 'H',
    description: 'Hadamard maps between X and Z bases',
    tooltipLatex: 'H = \\frac{1}{\\sqrt{2}} \\begin{pmatrix}1 & 1 \\\\ 1 & -1\\end{pmatrix}',
    arity: 1,
    paletteGroup: 'single',
    color: '#c3e88d',
    matrix: createMatrix(2, [
      SQRT1_2, 0, SQRT1_2, 0,
      SQRT1_2, 0, -SQRT1_2, 0,
    ]),
  },
  {
    name: 'S',
    label: 'S',
    description: 'Quarter turn phase gate',
    tooltipLatex: 'S = \\begin{pmatrix}1 & 0 \\\\ 0 & i\\end{pmatrix}',
    arity: 1,
    paletteGroup: 'single',
    color: '#6699cc',
    matrix: createMatrix(2, [
      1, 0, 0, 0,
      0, 0, 0, 1,
    ]),
  },
  {
    name: 'T',
    label: 'T',
    description: 'Pi/8 phase gate',
    tooltipLatex: 'T = \\begin{pmatrix}1 & 0 \\\\ 0 & e^{i\\pi/4}\\end{pmatrix}',
    arity: 1,
    paletteGroup: 'single',
    color: '#f99157',
    matrix: createMatrix(2, [
      1, 0, 0, 0,
      0, 0, Math.cos(TAU_EIGHTH), Math.sin(TAU_EIGHTH),
    ]),
  },
  {
    name: 'CNOT',
    label: 'CNOT',
    description: 'Controlled-NOT entangles two qubits',
    tooltipLatex: 'CNOT = |0\\rangle\\langle0|\\otimes I + |1\\rangle\\langle1|\\otimes X',
    arity: 2,
    paletteGroup: 'multi',
    color: '#82aaff',
    matrix: createMatrix(4, [
      1, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 1, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 1, 0,
      0, 0, 0, 0, 1, 0, 0, 0,
    ]),
  },
  {
    name: 'SWAP',
    label: 'SWAP',
    description: 'Exchange two qubits',
    tooltipLatex: 'SWAP = \\begin{pmatrix}1 & 0 & 0 & 0 \\\\ 0 & 0 & 1 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & 0 & 1\\end{pmatrix}',
    arity: 2,
    paletteGroup: 'multi',
    color: '#f7768e',
    matrix: createMatrix(4, [
      1, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 1, 0, 0, 0,
      0, 0, 1, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 1, 0,
    ]),
  },
]

export const GATE_LIBRARY: Record<GateName, GateDefinition> = gatePalette.reduce(
  (acc, gate) => ({ ...acc, [gate.name]: gate }),
  {} as Record<GateName, GateDefinition>,
)

export const GATE_LIST = gatePalette
