import type { DemoSceneDraft } from "../schema/types";

export type Vec3 = readonly [number, number, number];

interface GridNode {
  index: [number, number, number];
  point: Vec3;
}

interface PolylineResult {
  status: "ok" | "no_path";
  rawPath: readonly Vec3[];
  simplifiedPath: readonly Vec3[];
}

export type PathSegment =
  | { kind: "line"; from: Vec3; to: Vec3 }
  | { kind: "quadratic"; from: Vec3; control: Vec3; to: Vec3 };

export interface PathResult extends PolylineResult {
  segments: readonly PathSegment[];
  smoothPath: readonly Vec3[];
  roundedCorners: number;
  fallbackCorners: number;
}

const EPSILON = 1e-9;
const NEIGHBORS: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

function add(first: Vec3, second: Vec3): Vec3 {
  return [first[0] + second[0], first[1] + second[1], first[2] + second[2]];
}

function subtract(first: Vec3, second: Vec3): Vec3 {
  return [first[0] - second[0], first[1] - second[1], first[2] - second[2]];
}

function scale(vector: Vec3, factor: number): Vec3 {
  return [vector[0] * factor, vector[1] * factor, vector[2] * factor];
}

function length(vector: Vec3): number {
  return Math.hypot(vector[0], vector[1], vector[2]);
}

function pointInsideBox(point: Vec3, min: Vec3, max: Vec3): boolean {
  return point.every((coordinate, axis) => coordinate >= min[axis] - EPSILON && coordinate <= max[axis] + EPSILON);
}

function segmentIntersectsBox(from: Vec3, to: Vec3, min: Vec3, max: Vec3): boolean {
  const direction = subtract(to, from);
  let near = 0;
  let far = 1;

  for (let axis = 0; axis < 3; axis += 1) {
    if (Math.abs(direction[axis]) <= EPSILON) {
      if (from[axis] < min[axis] - EPSILON || from[axis] > max[axis] + EPSILON) return false;
      continue;
    }

    const inverse = 1 / direction[axis];
    let entry = (min[axis] - from[axis]) * inverse;
    let exit = (max[axis] - from[axis]) * inverse;
    if (entry > exit) [entry, exit] = [exit, entry];
    near = Math.max(near, entry);
    far = Math.min(far, exit);
    if (near > far + EPSILON) return false;
  }

  return far >= -EPSILON && near <= 1 + EPSILON;
}

function expandedObstacle(
  obstacle: DemoSceneDraft["obstacles"][number],
  margin: number,
): { min: Vec3; max: Vec3 } {
  return {
    min: [obstacle.min[0] - margin, obstacle.min[1] - margin, obstacle.min[2] - margin],
    max: [obstacle.max[0] + margin, obstacle.max[1] + margin, obstacle.max[2] + margin],
  };
}

function isFreePoint(scene: DemoSceneDraft, point: Vec3, margin: number): boolean {
  const innerMin = add(scene.workspace.min, [margin, margin, margin]);
  const innerMax = subtract(scene.workspace.max, [margin, margin, margin]);
  if (!pointInsideBox(point, innerMin, innerMax)) return false;

  return scene.obstacles.every((obstacle) => {
    const expanded = expandedObstacle(obstacle, margin);
    return !pointInsideBox(point, expanded.min, expanded.max);
  });
}

export function isCollisionFreeSegment(scene: DemoSceneDraft, from: Vec3, to: Vec3, clearance: number): boolean {
  const margin = scene.robot_radius + clearance;
  const innerMin = add(scene.workspace.min, [margin, margin, margin]);
  const innerMax = subtract(scene.workspace.max, [margin, margin, margin]);
  if (!pointInsideBox(from, innerMin, innerMax) || !pointInsideBox(to, innerMin, innerMax)) return false;

  return scene.obstacles.every((obstacle) => {
    const expanded = expandedObstacle(obstacle, margin);
    return !segmentIntersectsBox(from, to, expanded.min, expanded.max);
  });
}

function key(index: readonly [number, number, number]): string {
  return `${index[0]}:${index[1]}:${index[2]}`;
}

function gridPoint(scene: DemoSceneDraft, index: readonly [number, number, number]): Vec3 {
  return [
    scene.workspace.min[0] + (index[0] + 0.5) * scene.grid_step,
    scene.workspace.min[1] + (index[1] + 0.5) * scene.grid_step,
    scene.workspace.min[2] + (index[2] + 0.5) * scene.grid_step,
  ];
}

function gridIndex(scene: DemoSceneDraft, point: Vec3): [number, number, number] {
  return [
    Math.round((point[0] - scene.workspace.min[0]) / scene.grid_step - 0.5),
    Math.round((point[1] - scene.workspace.min[1]) / scene.grid_step - 0.5),
    Math.round((point[2] - scene.workspace.min[2]) / scene.grid_step - 0.5),
  ];
}

function inGrid(scene: DemoSceneDraft, index: readonly [number, number, number]): boolean {
  return index.every((coordinate, axis) => coordinate >= 0 && coordinate < Math.round((scene.workspace.max[axis] - scene.workspace.min[axis]) / scene.grid_step));
}

function heuristic(first: Vec3, second: Vec3): number {
  return Math.abs(first[0] - second[0]) + Math.abs(first[1] - second[1]) + Math.abs(first[2] - second[2]);
}

function findPolyline(scene: DemoSceneDraft, clearance: number): PolylineResult {
  const startIndex = gridIndex(scene, scene.start);
  const goalIndex = gridIndex(scene, scene.goal);
  const start: GridNode = { index: startIndex, point: scene.start };
  const goal: GridNode = { index: goalIndex, point: scene.goal };
  if (!isFreePoint(scene, start.point, scene.robot_radius + clearance) || !isFreePoint(scene, goal.point, scene.robot_radius + clearance)) {
    return { status: "no_path", rawPath: [], simplifiedPath: [] };
  }

  const open = [{ node: start, score: heuristic(start.point, goal.point) }];
  const costs = new Map<string, number>([[key(start.index), 0]]);
  const parents = new Map<string, string>();
  const nodes = new Map<string, GridNode>([[key(start.index), start], [key(goal.index), goal]]);

  while (open.length > 0) {
    open.sort((first, second) => second.score - first.score || key(second.node.index).localeCompare(key(first.node.index)));
    const current = open.pop()!;
    const currentKey = key(current.node.index);
    if (currentKey === key(goal.index)) {
      const path: Vec3[] = [];
      let cursor: string | undefined = currentKey;
      while (cursor) {
        path.push(nodes.get(cursor)!.point);
        cursor = parents.get(cursor);
      }
      path.reverse();
      return { status: "ok", rawPath: path, simplifiedPath: simplifyPath(scene, path, clearance) };
    }

    const currentCost = costs.get(currentKey)!;
    for (const direction of NEIGHBORS) {
      const nextIndex: [number, number, number] = [
        current.node.index[0] + direction[0],
        current.node.index[1] + direction[1],
        current.node.index[2] + direction[2],
      ];
      if (!inGrid(scene, nextIndex)) continue;
      const nextPoint = nextIndex.every((coordinate, axis) => coordinate === goalIndex[axis]) ? scene.goal : gridPoint(scene, nextIndex);
      if (!isCollisionFreeSegment(scene, current.node.point, nextPoint, clearance)) continue;
      const nextKey = key(nextIndex);
      const nextCost = currentCost + length(subtract(nextPoint, current.node.point));
      if (nextCost >= (costs.get(nextKey) ?? Number.POSITIVE_INFINITY)) continue;
      const nextNode: GridNode = { index: nextIndex, point: nextPoint };
      nodes.set(nextKey, nextNode);
      costs.set(nextKey, nextCost);
      parents.set(nextKey, currentKey);
      open.push({ node: nextNode, score: nextCost + heuristic(nextPoint, goal.point) });
    }
  }

  return { status: "no_path", rawPath: [], simplifiedPath: [] };
}

function simplifyPath(scene: DemoSceneDraft, path: readonly Vec3[], clearance: number): readonly Vec3[] {
  if (path.length < 3) return path;
  const simplified: Vec3[] = [path[0]];
  let anchor = 0;
  while (anchor < path.length - 1) {
    let farthest = anchor + 1;
    for (let candidate = farthest + 1; candidate < path.length; candidate += 1) {
      if (isCollisionFreeSegment(scene, path[anchor], path[candidate], clearance)) farthest = candidate;
    }
    simplified.push(path[farthest]);
    anchor = farthest;
  }
  return simplified;
}

function mix(a: Vec3, b: Vec3, t: number): Vec3 {
  return add(scale(a, 1 - t), scale(b, t));
}

export function quadraticPoint(a: Vec3, control: Vec3, b: Vec3, t: number): Vec3 {
  return mix(mix(a, control, t), mix(control, b, t), t);
}

/** Convex-hull subdivision proves separation for the entire curve, not just samples. */
export function isCollisionFreeCurve(scene: DemoSceneDraft, a: Vec3, control: Vec3, b: Vec3, clearance: number): boolean {
  const margin = scene.robot_radius + clearance;
  const innerMin = add(scene.workspace.min, [margin, margin, margin]);
  const innerMax = subtract(scene.workspace.max, [margin, margin, margin]);
  const boxes = scene.obstacles.map((obstacle) => expandedObstacle(obstacle, margin));
  let budget = 4096;
  const separated = (p: Vec3, c: Vec3, q: Vec3, depth: number): boolean => {
    if (--budget < 0) return false;
    if (![p, c, q].every((point) => pointInsideBox(point, innerMin, innerMax))) return false;
    const min = p.map((v, axis) => Math.min(v, c[axis], q[axis]));
    const max = p.map((v, axis) => Math.max(v, c[axis], q[axis]));
    if (boxes.every((box) => min.some((v, axis) => v > box.max[axis] + EPSILON || max[axis] < box.min[axis] - EPSILON))) return true;
    if (depth >= 16) return false;
    const pc = mix(p, c, 0.5), cq = mix(c, q, 0.5), middle = mix(pc, cq, 0.5);
    return separated(p, pc, middle, depth + 1) && separated(middle, cq, q, depth + 1);
  };
  return separated(a, control, b, 0);
}

export function roundPath(scene: DemoSceneDraft, points: readonly Vec3[], clearance: number): Pick<PathResult, "segments" | "smoothPath" | "roundedCorners" | "fallbackCorners"> {
  if (points.length < 2) return { segments: [], smoothPath: [...points], roundedCorners: 0, fallbackCorners: 0 };
  const segments: PathSegment[] = [];
  let cursor = points[0], roundedCorners = 0, fallbackCorners = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const before = points[i - 1], corner = points[i], after = points[i + 1];
    const incoming = length(subtract(corner, before)), outgoing = length(subtract(after, corner));
    let cut = Math.min(incoming / 4, outgoing / 4, 1.8);
    let accepted = false;
    for (let attempt = 0; attempt < 8 && cut > 1e-5; attempt++, cut *= 0.5) {
      const a = mix(corner, before, cut / incoming), b = mix(corner, after, cut / outgoing);
      if (!isCollisionFreeCurve(scene, a, corner, b, clearance)) continue;
      // The renderer uses a fine polyline of this curve. Validate its chords as well.
      const samples = Array.from({ length: 65 }, (_, step) => quadraticPoint(a, corner, b, step / 64));
      if (!samples.slice(1).every((point, index) => isCollisionFreeSegment(scene, samples[index], point, clearance))) continue;
      segments.push({ kind: "line", from: cursor, to: a }, { kind: "quadratic", from: a, control: corner, to: b });
      cursor = b;
      roundedCorners++;
      accepted = true;
      break;
    }
    if (!accepted) {
      segments.push({ kind: "line", from: cursor, to: corner });
      cursor = corner;
      fallbackCorners++;
    }
  }
  segments.push({ kind: "line", from: cursor, to: points[points.length - 1] });
  const smoothPath: Vec3[] = [points[0]];
  for (const segment of segments) {
    const count = segment.kind === "quadratic" ? 64 : Math.max(1, Math.ceil(length(subtract(segment.to, segment.from)) / 0.08));
    for (let step = 1; step <= count; step++) {
      smoothPath.push(segment.kind === "line" ? mix(segment.from, segment.to, step / count) : quadraticPoint(segment.from, segment.control, segment.to, step / count));
    }
  }
  return { segments, smoothPath, roundedCorners, fallbackCorners };
}

export function findPath(scene: DemoSceneDraft, clearance: number): PathResult {
  // Reserve room for visible turns, then prove the rounded route at the requested clearance.
  // Tight scenes still retain the original validated polyline as a conservative fallback.
  const roomy = findPolyline(scene, clearance + 0.3);
  const result = roomy.status === "ok" ? roomy : findPolyline(scene, clearance);
  return { ...result, ...roundPath(scene, result.simplifiedPath, clearance) };
}
