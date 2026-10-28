import { assertSignal } from './validation';

function validateSeed(seed: number) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Expected a uint32 seed.');
}

/** Engine v0.1: Mulberry32 uniform stream and paired Box–Muller normals. */
export function standardNoise(length: number, seed: number): Float64Array {
  validateSeed(seed);
  if (!Number.isSafeInteger(length) || length < 0) throw new Error('Expected a nonnegative noise length.');
  let state = seed;
  const uniform = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const output = new Float64Array(length);
  for (let i = 0; i < length; i += 2) {
    const radius = Math.sqrt(-2 * Math.log(1 - uniform())), angle = 2 * Math.PI * uniform();
    output[i] = radius * Math.cos(angle);
    if (i + 1 < length) output[i + 1] = radius * Math.sin(angle);
  }
  return output;
}

export function addNoise(clean: Float64Array, level: number, seed: number): Float64Array {
  assertSignal(clean, clean.length); validateSeed(seed);
  if (!Number.isFinite(level) || level < 0 || level > 0.05) throw new Error('Invalid noise level.');
  if (level === 0) return clean.slice();
  let maximum = 0;
  for (const value of clean) maximum = Math.max(maximum, Math.abs(value));
  const noise = standardNoise(clean.length, seed);
  return Float64Array.from(clean, (value, i) => value + level * maximum * noise[i]);
}
