export type PhantomId = 'disk' | 'asymmetric';
export type FilterKind = 'ramp' | 'hann';
export type Disk = { x: number; y: number; radius: number; value: number };
export type ExperimentConfig = { n: 128; phantom: PhantomId; views: 12 | 30 | 60 | 90 | 180 | 360; noiseLevel: number; seed: number; alpha: number };
export type ViewState = { step: number; angleIndex: number; filter: FilterKind };
export type Metrics = { rmse: number; relativeL2: number | null; sampleCount: number };
export type Grid = { n: number; views: number; h: number; nFFT: number; x: Float64Array; y: Float64Array; detector: Float64Array; angles: Float64Array; frequencies: Float64Array };
export type EngineResult = {
  config: ExperimentConfig; grid: Grid; reference: Float64Array; clean: Float64Array; noisy: Float64Array;
  filtered: Record<FilterKind, Float64Array>; spectrumMagnitude: Float64Array;
  symbols: Record<FilterKind, Float64Array>; backprojection: Float64Array;
  reconstructions: Record<FilterKind, Float64Array>; metrics: Record<FilterKind, Metrics>; computeMs: number;
};
