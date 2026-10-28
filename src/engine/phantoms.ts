import type { Disk, Grid, PhantomId } from './types';
const scenes: Record<PhantomId, readonly Disk[]> = {
  disk: [{ x: 0, y: 0, radius: 0.65, value: 1 }],
  asymmetric: [{ x: -0.04, y: 0, radius: 0.66, value: 0.8 }, { x: 0.25, y: 0.2, radius: 0.12, value: 1.3 }],
};

export function getDisks(id: PhantomId): readonly Disk[] {
  if (!Object.hasOwn(scenes, id)) throw new Error('Unknown phantom.');
  return scenes[id].map(disk => ({ ...disk }));
}

export function samplePhantom(disks: readonly Disk[], grid: Grid): Float64Array {
  const image = new Float64Array(grid.n * grid.n);
  for (let row = 0; row < grid.n; row++) for (let col = 0; col < grid.n; col++) {
    for (const disk of disks) if ((grid.x[col] - disk.x) ** 2 + (grid.y[row] - disk.y) ** 2 <= disk.radius ** 2) image[row * grid.n + col] += disk.value;
  }
  return image;
}
