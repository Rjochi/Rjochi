import type { DemoSceneDraft } from "../schema/types";
import type { PathResult, Vec3 } from "../demo/path";
import { PALETTE, projectScene } from "../demo/presentation";

export function renderSignatureSvg(scene: DemoSceneDraft, path: PathResult, description: string): string {
  const label = description.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
  const pt = (p: Vec3) => projectScene(p).map((v) => v.toFixed(2)).join(",");
  const line = (a: Vec3, b: Vec3, color = "#24323a", opacity = 1) => `<path d="M${pt(a)} L${pt(b)}" stroke="${color}" opacity="${opacity}" fill="none"/>`;
  const grid = Array.from({ length: 13 }, (_, x) => line([x, 0, 0], [x, 8, 0])).join("") + Array.from({ length: 9 }, (_, y) => line([0, y, 0], [12, y, 0])).join("");
  const boxes = scene.obstacles.map(({ min: a, max: b }) => {
    const vertices: Vec3[] = [[a[0], a[1], a[2]], [b[0], a[1], a[2]], [b[0], b[1], a[2]], [a[0], b[1], a[2]], [a[0], a[1], b[2]], [b[0], a[1], b[2]], [b[0], b[1], b[2]], [a[0], b[1], b[2]]];
    return [[3, 2, 6, 7], [1, 2, 6, 5], [4, 5, 6, 7]].map((face, index) => `<polygon points="${face.map((i) => pt(vertices[i])).join(" ")}" fill="${["#1e2c31", "#152329", "#293c42"][index]}" stroke="${PALETTE.edge}" stroke-width="0.8"/>`).join("");
  }).join("");
  const curve = path.segments.map((segment, i) => `${i === 0 ? `M${pt(segment.from)} ` : ""}${segment.kind === "line" ? `L${pt(segment.to)}` : `Q${pt(segment.control)} ${pt(segment.to)}`}`).join(" ");
  const start = projectScene(scene.start), end = projectScene(scene.goal);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640" fill="none" role="img" aria-label="${label}">
    <g stroke-width="0.6">${grid}</g>${boxes}
    <path d="${curve}" stroke="${PALETTE.accent}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="${start[0]}" cy="${start[1]}" r="4" fill="${PALETTE.background}" stroke="${PALETTE.accent}"/>
    <circle cx="${end[0]}" cy="${end[1]}" r="7" fill="${PALETTE.background}" stroke="${PALETTE.accent}"/>
    <circle cx="${end[0]}" cy="${end[1]}" r="2" fill="${PALETTE.accent}"/>
  </svg>`;
}
