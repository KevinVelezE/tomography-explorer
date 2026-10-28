import type { Disk, Grid } from './types';
export function projectAt(disks: readonly Disk[], t: number, theta: number): number {
  let value = 0;
  const cosine = Math.cos(theta), sine = Math.sin(theta);
  for (const disk of disks) {
    const distance = t - disk.x * cosine - disk.y * sine;
    const chordSquared = disk.radius ** 2 - distance ** 2;
    if (chordSquared > 0) value += 2 * disk.value * Math.sqrt(chordSquared);
  }
  return value;
}

export function projectDisks(disks: readonly Disk[], grid: Grid): Float64Array {
  const data = new Float64Array(grid.n * grid.views);
  for (let angle = 0; angle < grid.views; angle++) for (let detector = 0; detector < grid.n; detector++) {
    data[angle * grid.n + detector] = projectAt(disks, grid.detector[detector], grid.angles[angle]);
  }
  return data;
}
