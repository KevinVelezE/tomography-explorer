import type { ExperimentConfig } from './types';
export const VIEW_COUNTS = [12, 30, 60, 90, 180, 360] as const;
export const DEFAULT_CONFIG: ExperimentConfig = Object.freeze({ n: 128, phantom: 'asymmetric', views: 180, noiseLevel: 0, seed: 42, alpha: 0.65 });

export function validateConfig(input: unknown): ExperimentConfig {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected an experiment configuration.');
  const c = input as Record<string, unknown>;
  if (c.n !== 128 || (c.phantom !== 'disk' && c.phantom !== 'asymmetric') || !VIEW_COUNTS.includes(c.views as ExperimentConfig['views'])) throw new Error('Choose a supported phantom and view count on the 128 × 128 grid.');
  if (typeof c.noiseLevel !== 'number' || !Number.isFinite(c.noiseLevel) || c.noiseLevel < 0 || c.noiseLevel > 0.05) throw new Error('Noise must be between 0 and 0.05.');
  if (typeof c.alpha !== 'number' || !Number.isFinite(c.alpha) || c.alpha < 0.1 || c.alpha > 1) throw new Error('Hann cutoff must be between 0.1 and 1.');
  if (typeof c.seed !== 'number' || !Number.isInteger(c.seed) || c.seed < 0 || c.seed > 4294967295) throw new Error('Seed must be an integer between 0 and 4294967295.');
  return { n: 128, phantom: c.phantom, views: c.views as ExperimentConfig['views'], noiseLevel: c.noiseLevel, seed: c.seed, alpha: c.alpha };
}
