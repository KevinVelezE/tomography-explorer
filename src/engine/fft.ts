/** Radix-2 decimation in frequency; bit-reversed output is reordered at the end. */
export function fft(real: Float64Array, imaginary: Float64Array, inverse = false): void {
  const n = real.length;
  if (n < 2 || (n & (n - 1)) !== 0 || imaginary.length !== n || !real.every(Number.isFinite) || !imaginary.every(Number.isFinite)) throw new Error('FFT requires matching finite power-of-two arrays.');
  for (let span = n; span >= 2; span /= 2) {
    const half = span / 2, direction = (inverse ? 2 : -2) * Math.PI / span;
    for (let start = 0; start < n; start += span) for (let offset = 0; offset < half; offset++) {
      const a = start + offset, b = a + half;
      const differenceReal = real[a] - real[b], differenceImaginary = imaginary[a] - imaginary[b];
      real[a] += real[b]; imaginary[a] += imaginary[b];
      const cosine = Math.cos(direction * offset), sine = Math.sin(direction * offset);
      real[b] = differenceReal * cosine - differenceImaginary * sine;
      imaginary[b] = differenceReal * sine + differenceImaginary * cosine;
    }
  }
  const bits = Math.log2(n);
  for (let i = 0; i < n; i++) {
    let reversed = 0, source = i;
    for (let bit = 0; bit < bits; bit++) { reversed = (reversed << 1) | (source & 1); source >>= 1; }
    if (reversed > i) {
      const r = real[i], im = imaginary[i]; real[i] = real[reversed]; imaginary[i] = imaginary[reversed]; real[reversed] = r; imaginary[reversed] = im;
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { real[i] /= n; imaginary[i] /= n; }
}
