export function assertSignal(values: Float64Array, length: number): void {
  if (!(values instanceof Float64Array) || values.length !== length || !values.every(Number.isFinite)) throw new Error('Expected a finite signal with the declared dimensions.');
}
