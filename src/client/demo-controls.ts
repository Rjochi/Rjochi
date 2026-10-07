interface DemoSceneData {
  workspace: { min: [number, number, number]; max: [number, number, number] };
}

type Point = [number, number, number];
interface PathSet {
  rawPath: Point[];
  simplifiedPath: Point[];
}
const root = document.querySelector<HTMLElement>("[data-planning-demo]");
const poster = document.querySelector<HTMLElement>("#planning-poster");
const statusElement = root?.querySelector<HTMLElement>("[data-demo-status]");
const marker = poster?.querySelector<SVGCircleElement>("#playback-marker");
const runtime = root?.querySelector<HTMLElement>("[data-demo-runtime]");
const scene = root?.dataset.scene ? JSON.parse(root.dataset.scene) as DemoSceneData : null;
const pathMap = root?.dataset.paths ? JSON.parse(root.dataset.paths) as Record<string, PathSet> : {};
let path = root?.dataset.path ? JSON.parse(root.dataset.path) as Point[] : [];
let animationFrame = 0;
let playing = false;
let startedAt = 0;
let interactiveLoaded = false;
let interactivePlaying = false;

function setStatus(message: string): void {
  if (statusElement) statusElement.textContent = message;
}

function restoreStaticRuntime(): void {
  if (runtime && poster) {
    const staticMarkup = poster.innerHTML
      .replaceAll('id="search-path"', 'id="runtime-search-path"')
      .replaceAll('id="refined-path"', 'id="runtime-refined-path"')
      .replaceAll('id="obstacle-envelope"', 'id="runtime-obstacle-envelope"')
      .replaceAll('id="playback-marker"', 'id="runtime-playback-marker"');
    runtime.innerHTML = `<div class="runtime-poster">${staticMarkup}</div>`;
  }
}

function project(point: Point): [number, number] {
  if (!scene) return [0, 0];
  return [
    80 + ((point[0] - scene.workspace.min[0]) / (scene.workspace.max[0] - scene.workspace.min[0])) * 800,
    300 - ((point[1] - scene.workspace.min[1]) / (scene.workspace.max[1] - scene.workspace.min[1])) * 230,
  ];
}

function setPolylinePoints(selector: string, points: Point[]): void {
  const polyline = poster?.querySelector<SVGPolylineElement>(selector);
  if (polyline) polyline.setAttribute("points", points.map((point) => project(point).join(",")).join(" "));
}

function animate(timestamp: number): void {
  if (!playing || !marker || path.length === 0) return;
  if (!startedAt) startedAt = timestamp;
  const progress = Math.min((timestamp - startedAt) / 3600, 1);
  const position = progress * (path.length - 1);
  const index = Math.floor(position);
  const remainder = position - index;
  const from = project(path[index]);
  const to = project(path[Math.min(index + 1, path.length - 1)]);
  marker.setAttribute("cx", (from[0] + (to[0] - from[0]) * remainder).toFixed(2));
  marker.setAttribute("cy", (from[1] + (to[1] - from[1]) * remainder).toFixed(2));
  if (progress >= 1) {
    playing = false;
    cancelAnimationFrame(animationFrame);
    setStatus("Playback complete");
    return;
  }
  animationFrame = requestAnimationFrame(animate);
}

function stop(): void {
  playing = false;
  cancelAnimationFrame(animationFrame);
}

root?.querySelectorAll<HTMLButtonElement>("[data-stage]").forEach((button) => {
  button.addEventListener("click", () => {
    const stage = button.dataset.stage ?? "refined";
    root.dataset.stage = stage;
    root.querySelectorAll("[data-stage]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    const search = poster?.querySelector<SVGElement>("#search-path");
    const refined = poster?.querySelector<SVGElement>("#refined-path");
    if (search) search.style.opacity = stage === "search" ? "1" : "0.2";
    if (refined) refined.style.opacity = stage === "search" ? "0.2" : "1";
    setStatus(stage === "search" ? "Search path" : stage === "playback" ? "Playback path" : "Refined path");
  });
});

root?.querySelector<HTMLSelectElement>("[data-clearance]")?.addEventListener("change", (event) => {
  const value = (event.target as HTMLSelectElement).value;
  const next = pathMap[value];
  if (!next) return;
  path = next.simplifiedPath;
  root.dataset.clearance = value;
  setPolylinePoints("#search-path", next.rawPath);
  setPolylinePoints("#refined-path", next.simplifiedPath);
  stop();
  startedAt = 0;
  const first = path[0];
  if (marker && first) {
    const position = project(first);
    marker.setAttribute("cx", position[0].toFixed(2));
    marker.setAttribute("cy", position[1].toFixed(2));
  }
  interactiveLoaded = false;
  interactivePlaying = false;
  const button = root.querySelector<HTMLButtonElement>("[data-3d-play]");
  if (button) {
    button.disabled = false;
    button.textContent = "3D Play";
  }
  restoreStaticRuntime();
  document.dispatchEvent(new CustomEvent("demo:dispose"));
  setStatus(`Clearance preset ${value} demo-units`);
});

root?.querySelector<HTMLInputElement>("[data-envelope]")?.addEventListener("change", (event) => {
  const envelope = poster?.querySelector<SVGElement>("#obstacle-envelope");
  if (envelope) envelope.style.opacity = (event.target as HTMLInputElement).checked ? "1" : "0.25";
});

root?.querySelector<HTMLButtonElement>("[data-reset]")?.addEventListener("click", () => {
  stop();
  startedAt = 0;
  const first = path[0];
  if (marker && first) {
    const position = project(first);
    marker.setAttribute("cx", position[0].toFixed(2));
    marker.setAttribute("cy", position[1].toFixed(2));
  }
  setStatus("Refined path reset");
  interactivePlaying = false;
  const button = root?.querySelector<HTMLButtonElement>("[data-3d-play]");
  if (button) button.textContent = "3D Play";
  document.dispatchEvent(new CustomEvent("demo:play", { detail: { playing: false } }));
  document.dispatchEvent(new CustomEvent("demo:reset"));
});

root?.querySelector<HTMLButtonElement>("[data-static]")?.addEventListener("click", () => {
  stop();
  restoreStaticRuntime();
  setStatus("Static view");
  interactiveLoaded = false;
  interactivePlaying = false;
  const button = root?.querySelector<HTMLButtonElement>("[data-3d-play]");
  if (button) {
    button.disabled = false;
    button.textContent = "3D Play";
  }
  document.dispatchEvent(new CustomEvent("demo:dispose"));
});

root?.querySelector<HTMLButtonElement>("[data-3d-play]")?.addEventListener("click", async (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  const runtime = root?.querySelector<HTMLElement>("[data-demo-runtime]");
  if (!runtime) return;

  if (interactiveLoaded) {
    interactivePlaying = !interactivePlaying;
    button.textContent = interactivePlaying ? "3D Pause" : "3D Play";
    setStatus(interactivePlaying ? "3D playback running" : "3D playback paused");
    document.dispatchEvent(new CustomEvent("demo:play", { detail: { playing: interactivePlaying } }));
    return;
  }

  button.disabled = true;
  button.textContent = "Loading 3D";
  try {
    const module = await import("./demo-loader");
    await module.loadInteractiveDemo(runtime, root.dataset.scene ?? "", root.dataset.path ?? "");
    interactiveLoaded = true;
    interactivePlaying = true;
    button.disabled = false;
    button.textContent = "3D Pause";
    setStatus("3D playback running");
    document.dispatchEvent(new CustomEvent("demo:play", { detail: { playing: true } }));
  } catch {
    restoreStaticRuntime();
    button.disabled = false;
    button.textContent = "3D Play";
    setStatus("Interactive demo unavailable; static view retained");
  }
});

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && marker && path.length > 0) {
  playing = true;
  startedAt = 0;
  setStatus("Playback running");
  animationFrame = requestAnimationFrame(animate);
}