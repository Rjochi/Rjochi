import type { Vec3 } from "./path";

export interface ArcPath { points: readonly Vec3[]; distances: number[]; length: number }

export function measurePath(points: readonly Vec3[]): ArcPath {
  const distances = [0];
  for (let i = 1; i < points.length; i++) {
    distances.push(distances[i - 1] + Math.hypot(...points[i].map((v, axis) => v - points[i - 1][axis])));
  }
  return { points, distances, length: distances.at(-1) ?? 0 };
}

/** Distance-based interpolation: short edges no longer cause abrupt speed changes. */
export function pointAtDistance(path: ArcPath, progress: number): Vec3 {
  if (!path.points.length) return [0, 0, 0];
  const distance = Math.max(0, Math.min(1, progress)) * path.length;
  let low = 0, high = path.distances.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (path.distances[mid] < distance) low = mid + 1;
    else high = mid;
  }
  const index = Math.max(1, low), a = path.points[index - 1], b = path.points[index] ?? a;
  const span = (path.distances[index] ?? 0) - path.distances[index - 1];
  const t = span > 0 ? (distance - path.distances[index - 1]) / span : 0;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Ease only the ends of the whole journey; do not stop at intermediate waypoints. */
export function travelProgress(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * x * (10 + x * (-15 + 6 * x));
}

export const DEMO_TIMING = { search: 1.8, refine: 2.2, travel: 10, hold: 2.5, duration: 16.5 } as const;

export function demoFrame(seconds: number) {
  const t = Math.max(0, seconds);
  const stage = t < 1.8 ? "search" : t < 4 ? "refine" : "playback";
  return {
    stage,
    search: Math.min(t / 1.8, 1),
    refine: Math.max(0, Math.min((t - 1.8) / 2.2, 1)),
    travel: travelProgress((t - 4) / 10),
    complete: t >= DEMO_TIMING.duration,
  };
}
