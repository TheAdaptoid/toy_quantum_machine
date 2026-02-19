export function formatComplex(real: number, imag: number, precision = 3): string {
  const re = real.toFixed(precision)
  const sign = imag >= 0 ? '+' : '-'
  const im = Math.abs(imag).toFixed(precision)
  return `${re} ${sign} ${im}i`
}

export function formatProbability(probability: number, precision = 2) {
  return `${(probability * 100).toFixed(precision)}%`
}

export function bitstringLabel(bits: string) {
  return `|${bits}>`
}
