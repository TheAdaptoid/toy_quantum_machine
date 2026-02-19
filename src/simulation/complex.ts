export const EPSILON = 1e-9

export function multiplyComplex(
  aReal: number,
  aImag: number,
  bReal: number,
  bImag: number,
): [number, number] {
  return [aReal * bReal - aImag * bImag, aReal * bImag + aImag * bReal]
}

export function addComplex(
  aReal: number,
  aImag: number,
  bReal: number,
  bImag: number,
): [number, number] {
  return [aReal + bReal, aImag + bImag]
}

export function magnitudeSquared(real: number, imag: number): number {
  return real * real + imag * imag
}
