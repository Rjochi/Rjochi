import * as THREE from "three";
import type { DemoSceneDraft } from "../schema/types";
import type { Vec3 } from "../demo/path";
import { CAMERA, PALETTE } from "../demo/presentation";
import { demoFrame, measurePath, pointAtDistance } from "../demo/motion";

export interface SignatureData { canvasDescription: string; scene: DemoSceneDraft; rawPath: Vec3[]; smoothPath: Vec3[] }
export interface SignatureRenderer { render: (seconds: number) => void; dispose: () => void }

export function mountSignature(host: HTMLElement, data: SignatureData, onLost: () => void): SignatureRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(PALETTE.background, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-label", data.canvasDescription);
  renderer.domElement.setAttribute("role", "img");
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, 0.1, 100);
  camera.position.set(...CAMERA.target).add(new THREE.Vector3(...CAMERA.offset));
  camera.lookAt(...CAMERA.target);
  scene.add(new THREE.HemisphereLight("#d1ece4", "#0a1420", 2.8));
  const key = new THREE.DirectionalLight("#edf8f1", 3.2);
  key.position.set(-3, 12, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight("#759caa", 1.8);
  rim.position.set(12, 5, -8);
  scene.add(rim);
  const world = (point: Vec3) => new THREE.Vector3(point[0], point[2], point[1]);
  const addLine = (points: THREE.Vector3[], color: string, opacity = 1) => {
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
    scene.add(line);
    return line;
  };
  // A quiet reference plane. No decorative telemetry or simulated sensor readings.
  const gridPoints: THREE.Vector3[] = [];
  for (let x = 0; x <= 12; x++) gridPoints.push(new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, 0, 8));
  for (let y = 0; y <= 8; y++) gridPoints.push(new THREE.Vector3(0, 0, y), new THREE.Vector3(12, 0, y));
  scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gridPoints), new THREE.LineBasicMaterial({ color: "#33464d", transparent: true, opacity: 0.48 })));
  const corners = [[0, 0], [12, 0], [0, 8], [12, 8]];
  for (const [x, z] of corners) {
    addLine([new THREE.Vector3(x + (x === 0 ? .45 : -.45), .01, z), new THREE.Vector3(x, .01, z), new THREE.Vector3(x, .01, z + (z === 0 ? .45 : -.45))], "#76938b", .7);
  }
  for (const obstacle of data.scene.obstacles) {
    const size = new THREE.Vector3(obstacle.max[0] - obstacle.min[0], obstacle.max[2] - obstacle.min[2], obstacle.max[1] - obstacle.min[1]);
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const box = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: "#1b2a30", roughness: .78, metalness: .12 }));
    box.position.set((obstacle.min[0] + obstacle.max[0]) / 2, (obstacle.min[2] + obstacle.max[2]) / 2, (obstacle.min[1] + obstacle.max[1]) / 2);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: "#637f85", transparent: true, opacity: .62 }));
    box.add(edges);
    scene.add(box);
  }
  // Floor projection helps the viewer read the route's height without moving the camera.
  const groundPath = data.smoothPath.map(([x, y]) => new THREE.Vector3(x, .015, y));
  const shadow = addLine(groundPath, "#668a7e", .16);
  const arc = measurePath(data.smoothPath);
  class DistanceCurve extends THREE.Curve<THREE.Vector3> {
    constructor() { super(); }
    getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 { return target.copy(world(pointAtDistance(arc, t))); }
  }
  const curve = new DistanceCurve();
  const tubeGeometry = new THREE.TubeGeometry(curve, 640, .032, 6, false);
  const pathMaterial = new THREE.MeshBasicMaterial({ color: PALETTE.accent, transparent: true, opacity: .55 });
  const tube = new THREE.Mesh(tubeGeometry, pathMaterial);
  scene.add(tube);
  // Very faint occluded line preserves spatial continuity behind the solid obstacles.
  const ghost = addLine(data.smoothPath.map(world), PALETTE.accent, .12);
  ghost.material.depthTest = false;
  const trailGeometry = tubeGeometry.clone();
  const trail = new THREE.Mesh(trailGeometry, new THREE.MeshBasicMaterial({ color: "#d7ffe7" }));
  trail.renderOrder = 1;
  scene.add(trail);
  const rawGeometry = new THREE.BufferGeometry().setFromPoints(data.rawPath.map(world));
  const rawMaterial = new THREE.LineDashedMaterial({ color: "#c3b78e", dashSize: .12, gapSize: .075, transparent: true, opacity: .6 });
  const raw = new THREE.Line(rawGeometry, rawMaterial);
  raw.computeLineDistances();
  scene.add(raw);
  const endpoint = (point: Vec3, goal: boolean) => {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(goal ? .18 : .11, .015, 6, 36), new THREE.MeshBasicMaterial({ color: goal ? PALETTE.accent : "#a1b5b4" }));
    ring.quaternion.copy(camera.quaternion);
    group.add(ring);
    if (goal) {
      const inner = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), new THREE.MeshBasicMaterial({ color: PALETTE.accent }));
      group.add(inner);
    }
    group.position.copy(world(point));
    scene.add(group);
    addLine([world(point), new THREE.Vector3(point[0], .03, point[1])], "#76938b", .22);
  };
  endpoint(data.scene.start, false);
  endpoint(data.scene.goal, true);
  // An original open coordinate marker, deliberately not a model of a real robot.
  const marker = new THREE.Group();
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(.17), new THREE.MeshStandardMaterial({ color: "#e7fff0", emissive: PALETTE.accent, emissiveIntensity: .3, roughness: .3, metalness: .2 }));
  marker.add(core);
  const openRing = new THREE.Mesh(new THREE.TorusGeometry(.3, .02, 6, 40, Math.PI * 1.55), new THREE.MeshBasicMaterial({ color: PALETTE.accent }));
  openRing.rotation.z = .35;
  marker.add(openRing);
  const secondRing = new THREE.Mesh(new THREE.TorusGeometry(.2, .011, 6, 32, Math.PI * 1.15), new THREE.MeshBasicMaterial({ color: "#88b7a4" }));
  secondRing.rotation.set(Math.PI / 2, .25, .8);
  marker.add(secondRing);
  const axis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -.32), new THREE.Vector3(0, 0, .38)]), new THREE.LineBasicMaterial({ color: PALETTE.accent }));
  marker.add(axis);
  scene.add(marker);
  let disposed = false, lastTime = 0;
  const totalIndices = tubeGeometry.index!.count;
  const forward = new THREE.Vector3(0, 0, 1);
  const render = (seconds: number): void => {
    if (disposed) return;
    lastTime = seconds;
    const frame = demoFrame(seconds);
    rawGeometry.setDrawRange(0, Math.max(2, Math.floor(frame.search * data.rawPath.length)));
    rawMaterial.opacity = .55 * (1 - frame.refine * .9);
    raw.visible = frame.stage !== "playback";
    tubeGeometry.setDrawRange(0, Math.floor(frame.refine * totalIndices / 36) * 36);
    trailGeometry.setDrawRange(0, Math.floor(frame.travel * totalIndices / 36) * 36);
    pathMaterial.opacity = frame.stage === "playback" ? .62 : .75;
    ghost.visible = frame.refine >= 1;
    shadow.visible = frame.refine >= 1;
    marker.visible = frame.stage === "playback";
    marker.position.copy(world(pointAtDistance(arc, frame.travel)));
    const a = world(pointAtDistance(arc, Math.max(0, frame.travel - .002)));
    const b = world(pointAtDistance(arc, Math.min(1, frame.travel + .002)));
    marker.quaternion.setFromUnitVectors(forward, b.sub(a).normalize());
    renderer.render(scene, camera);
  };
  const resize = (): void => {
    const width = host.clientWidth || 640, height = host.clientHeight || 440;
    const aspect = width / height, extent = Math.max(CAMERA.height, CAMERA.width / aspect);
    camera.left = -extent * aspect / 2; camera.right = extent * aspect / 2;
    camera.top = extent / 2; camera.bottom = -extent / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render(lastTime);
  };
  const observer = new ResizeObserver(resize);
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    renderer.domElement.removeEventListener("webglcontextlost", lost);
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.LineSegments) {
        object.geometry.dispose();
        (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => material.dispose());
      }
    });
    renderer.dispose();
    renderer.domElement.remove();
  };
  const lost = (event: Event) => { event.preventDefault(); dispose(); onLost(); };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  observer.observe(host);
  resize();
  return { render, dispose };
}
