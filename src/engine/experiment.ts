import type { EngineResult, ExperimentConfig } from './types';
import { validateConfig } from './config';
import { createGrid } from './geometry';
import { getDisks, samplePhantom } from './phantoms';
import { projectDisks } from './projection';
import { addNoise } from './noise';
import { filterProfiles } from './filters';
import { backproject } from './backprojection';
import { measure } from './metrics';

export function runExperiment(input: ExperimentConfig): EngineResult {
  const config = validateConfig(input), start = performance.now();
  const grid = createGrid(config.n, config.views), disks = getDisks(config.phantom);
  const reference = samplePhantom(disks, grid), clean = projectDisks(disks, grid);
  const noisy = addNoise(clean, config.noiseLevel, config.seed);
  const filters = filterProfiles(noisy, grid, config.alpha);
  const backprojection = backproject(noisy, grid);
  const reconstructions = { ramp: backproject(filters.filtered.ramp, grid), hann: backproject(filters.filtered.hann, grid) };
  const metrics = { ramp: measure(reconstructions.ramp, reference, grid), hann: measure(reconstructions.hann, reference, grid) };
  return { config, grid, reference, clean, noisy, ...filters, backprojection, reconstructions, metrics, computeMs: performance.now() - start };
}
