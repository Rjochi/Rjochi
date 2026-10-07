import type { PathResult, Vec3 } from "../demo/path";
import type { DemoSceneDraft } from "../schema/types";

export interface HeroOptions {
  compact?: boolean;
  theme?: "light" | "dark";
}

function project(scene: DemoSceneDraft, point: Vec3): [number, number] {
  const width = scene.workspace.max[0] - scene.workspace.min[0];
  const height = scene.workspace.max[1] - scene.workspace.min[1];
  return [
    80 + ((point[0] - scene.workspace.min[0]) / width) * 800,
    300 - ((point[1] - scene.workspace.min[1]) / height) * 230,
  ];
}

function points(scene: DemoSceneDraft, path: readonly Vec3[]): string {
  return path.map((point) => project(scene, point).join(",")).join(" ");
}

function circle(scene: DemoSceneDraft, point: Vec3, color: string): string {
  const [x, y] = project(scene, point);
  return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="7" fill="${color}"/>`;
}

export function renderHeroSvg(scene: DemoSceneDraft, path: PathResult, options: HeroOptions = {}): string {
  const compact = options.compact ?? false;
  const theme = options.theme ?? "dark";
  const colors = theme === "light"
    ? { background: "#F7FAFC", text: "#142238", muted: "#42566F", accent: "#006B62", line: "#C3CFDC" }
    : { background: "#0B1220", text: "#E8EEF8", muted: "#A9B8CC", accent: "#5DE2D1", line: "#344359" };
  const obstacles = scene.obstacles.map((obstacle) => {
    const [left, bottom] = project(scene, obstacle.min);
    const [right, top] = project(scene, obstacle.max);
    return `<rect x="${left.toFixed(2)}" y="${top.toFixed(2)}" width="${(right - left).toFixed(2)}" height="${(bottom - top).toFixed(2)}"/>`;
  }).join("");
  const raw = points(scene, path.rawPath);
  const refined = points(scene, path.smoothPath);
  const status = path.status === "ok" ? "GEOMETRY CHECKED" : "NO PATH";

  const viewBox = compact ? "0 0 480 420" : "0 0 960 380";
  const marker = circle(scene, scene.start, colors.accent).replace("<circle ", "<circle id=\"playback-marker\" ");
  const graphic = compact ? `<g transform="translate(0 12) scale(0.5)"><g id="obstacle-envelope" fill="none" stroke="${colors.line}" stroke-width="1">${obstacles}</g>
  <polyline id="search-path" points="${raw}" fill="none" stroke="${colors.muted}" stroke-width="2" stroke-dasharray="6 8" opacity="0.75"/>
  <polyline id="refined-path" points="${refined}" fill="none" stroke="${colors.accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  ${circle(scene, scene.start, "#F0C36A")}
  ${circle(scene, scene.goal, colors.accent)}${marker}</g>
  <text x="24" y="266" fill="${colors.text}" font-family="system-ui, sans-serif" font-size="16" font-weight="700">SEARCH / REFINE / PLAYBACK</text>
  <text x="24" y="300" fill="${colors.muted}" font-family="ui-monospace, monospace" font-size="10" letter-spacing="0.7">${status}</text>
  <text x="24" y="324" fill="${colors.muted}" font-family="ui-monospace, monospace" font-size="10" letter-spacing="0.7">PRECOMPUTED GEOMETRIC DEMONSTRATION</text>` : `<g id="obstacle-envelope" fill="none" stroke="${colors.line}" stroke-width="1">${obstacles}</g>
  <polyline id="search-path" points="${raw}" fill="none" stroke="${colors.muted}" stroke-width="2" stroke-dasharray="6 8" opacity="0.75"/>
  <polyline id="refined-path" points="${refined}" fill="none" stroke="${colors.accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  ${circle(scene, scene.start, "#F0C36A")}
  ${circle(scene, scene.goal, colors.accent)}${marker}
  <text x="52" y="52" fill="${colors.text}" font-family="system-ui, sans-serif" font-size="20" font-weight="700">SEARCH / REFINE / PLAYBACK</text>
  <text x="52" y="348" fill="${colors.muted}" font-family="ui-monospace, monospace" font-size="13" letter-spacing="1">${status} · PRECOMPUTED GEOMETRIC DEMONSTRATION</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-labelledby="hero-title hero-desc">
  <title id="hero-title">Abstract motion planning path</title>
  <desc id="hero-desc">A geometric route searches around outlined obstacles and is reduced to a shorter collision-free path.</desc>
  <rect width="${compact ? 480 : 960}" height="${compact ? 420 : 380}" fill="${colors.background}"/>
  ${graphic}
</svg>`;
}
