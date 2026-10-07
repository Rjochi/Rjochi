import { describe, expect, it } from "vitest";
import { loadScene } from "../../src/content/load";
import { findPath, isCollisionFreeCurve, isCollisionFreeSegment, type Vec3 } from "../../src/demo/path";
import { DEMO_TIMING, demoFrame, measurePath, pointAtDistance, travelProgress } from "../../src/demo/motion";
import type { DemoSceneDraft } from "../../src/schema/types";

const scene = loadScene();
const sandbox: DemoSceneDraft = {
  ...scene, robot_radius: .1, workspace: { min: [-10, -10, -10], max: [10, 10, 10] },
  obstacles: [{ min: [-.5, -.5, -.5], max: [.5, .5, .5] }],
};

describe("validated curved trajectory", () => {
  for (const clearance of scene.clearance_presets) {
    it(`rounds all signature corners with continuous clearance ${clearance}`, () => {
      const result = findPath(scene, clearance);
      expect(result.status).toBe("ok");
      expect(result.roundedCorners).toBeGreaterThanOrEqual(3);
      expect(result.fallbackCorners).toBe(0);
      expect(result.smoothPath[0]).toEqual(scene.start);
      expect(result.smoothPath.at(-1)).toEqual(scene.goal);
      for (const segment of result.segments) {
        if (segment.kind === "quadratic") expect(isCollisionFreeCurve(scene, segment.from, segment.control, segment.to, clearance)).toBe(true);
        else expect(isCollisionFreeSegment(scene, segment.from, segment.to, clearance)).toBe(true);
      }
      result.smoothPath.slice(1).forEach((point, i) => expect(isCollisionFreeSegment(scene, result.smoothPath[i], point, clearance)).toBe(true));
      // Direction continuity at every line/Bezier join, not just rounded-looking pixels.
      const direction = (a: Vec3, b: Vec3) => {
        const delta = b.map((v, axis) => v - a[axis]);
        return delta.map((v) => v / Math.hypot(...delta));
      };
      for (let i = 1; i < result.segments.length; i++) {
        const a = result.segments[i - 1], b = result.segments[i];
        expect(a.to).toEqual(b.from);
        const exit = direction(a.kind === "line" ? a.from : a.control, a.to);
        const entry = direction(b.from, b.kind === "line" ? b.to : b.control);
        expect(exit.reduce((sum, v, axis) => sum + v * entry[axis], 0)).toBeCloseTo(1, 8);
      }
    });
  }
  it("rejects a curve through an obstacle despite free endpoints", () => {
    expect(isCollisionFreeCurve(sandbox, [-2, 0, 0], [0, 0, 0], [2, 0, 0], 0)).toBe(false);
  });
  it("subdivides ambiguous control bounds to prove a safe arch", () => {
    expect(isCollisionFreeCurve(sandbox, [-2, 0, 0], [0, 4, 0], [2, 0, 0], 0)).toBe(true);
  });
  it("rejects boundary contact and curves outside the workspace", () => {
    expect(isCollisionFreeCurve(sandbox, [-2, .6, 0], [0, .6, 0], [2, .6, 0], 0)).toBe(false);
    expect(isCollisionFreeCurve(sandbox, [-2, 0, 0], [0, 25, 0], [2, 0, 0], 0)).toBe(false);
  });
  it("returns no path without fabricating a curve when the goal is obstructed", () => {
    const blocked = { ...scene, obstacles: [{ min: scene.workspace.min, max: scene.workspace.max }] };
    expect(findPath(blocked, .2)).toMatchObject({ status: "no_path", smoothPath: [], segments: [] });
  });
});

describe("distance-based playback", () => {
  it("travels equal distances over unequal edges", () => {
    const path = measurePath([[0, 0, 0], [1, 0, 0], [10, 0, 0]]);
    expect(pointAtDistance(path, .2)).toEqual([2, 0, 0]);
    expect(pointAtDistance(path, .8)).toEqual([8, 0, 0]);
    expect(pointAtDistance(path, 2)).toEqual([10, 0, 0]);
  });
  it("handles empty, stationary, and duplicate points", () => {
    for (const points of [[], [[2, 3, 4]], [[2, 3, 4], [2, 3, 4]]] as Vec3[][]) {
      expect(pointAtDistance(measurePath(points), .5).every(Number.isFinite)).toBe(true);
    }
  });
  it("eases to rest at both ends without resetting at the destination", () => {
    expect(travelProgress(0)).toBe(0);
    expect(travelProgress(1)).toBe(1);
    expect(travelProgress(.001)).toBeLessThan(.000001);
    expect(1 - travelProgress(.999)).toBeLessThan(.000001);
    expect(demoFrame(DEMO_TIMING.duration + 5)).toMatchObject({ complete: true, travel: 1, stage: "playback" });
  });
});
