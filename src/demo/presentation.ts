import type { Vec3 } from "./path";

export const CAMERA = { target: [6, 1.2, 4] as Vec3, offset: [6, 16, 16] as Vec3, height: 10.5, width: 15.6 };
export const PALETTE = { background: "#0b1116", surface: "#18242b", edge: "#52666c", accent: "#b5f1cf", muted: "#80949b", text: "#e8eee9" };

/** Matches the orthographic WebGL camera; the poster is the same scene, not a different drawing. */
export function projectScene(point: Vec3, width = 960, height = 640): [number, number] {
  const normalize = (v: readonly number[]) => { const length = Math.hypot(...v); return v.map((n) => n / length); };
  const forward = normalize(CAMERA.offset);
  const right = normalize([forward[2], 0, -forward[0]]);
  const up = [forward[1] * right[2], forward[2] * right[0] - forward[0] * right[2], -forward[1] * right[0]];
  // camera up = forward cross right
  const world = [point[0] - CAMERA.target[0], point[2] - CAMERA.target[1], point[1] - CAMERA.target[2]];
  const scale = height / Math.max(CAMERA.height, CAMERA.width / (width / height));
  return [width / 2 + world.reduce((sum, n, i) => sum + n * right[i], 0) * scale,
    height / 2 - world.reduce((sum, n, i) => sum + n * up[i], 0) * scale];
}
