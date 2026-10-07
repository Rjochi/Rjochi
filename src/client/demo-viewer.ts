import * as THREE from "three";

interface DemoSceneData {
  workspace: { min: [number, number, number]; max: [number, number, number] };
  obstacles: Array<{ min: [number, number, number]; max: [number, number, number] }>;
}

type Point = [number, number, number];

export async function mountDemo(host: HTMLElement, sceneData: DemoSceneData, path: Point[]): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-label", "Interactive geometric path demonstration");
  host.replaceChildren(canvas);
  try {
    const width = host.clientWidth || 640;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, 360, false);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0B1220");
    const camera = new THREE.PerspectiveCamera(38, width / 360, 0.1, 100);
    camera.position.set(12, 10, 14);
    camera.lookAt(5, 2, 3);

    const group = new THREE.Group();
    for (const obstacle of sceneData.obstacles) {
      const size = new THREE.Vector3(
        obstacle.max[0] - obstacle.min[0],
        obstacle.max[2] - obstacle.min[2],
        obstacle.max[1] - obstacle.min[1],
      );
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, size.y, size.z),
        new THREE.MeshBasicMaterial({ color: "#344359", wireframe: true }),
      );
      mesh.position.set(
        (obstacle.min[0] + obstacle.max[0]) / 2,
        (obstacle.min[2] + obstacle.max[2]) / 2,
        (obstacle.min[1] + obstacle.max[1]) / 2,
      );
      group.add(mesh);
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(path.map(([x, y, z]) => new THREE.Vector3(x, z, y))),
      new THREE.LineBasicMaterial({ color: "#5DE2D1" }),
    );
    group.add(line);
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 12, 8),
      new THREE.MeshBasicMaterial({ color: "#5DE2D1", wireframe: true }),
    );
    group.add(marker);
    scene.add(group);

    const scenePoint = (point: Point): THREE.Vector3 => new THREE.Vector3(point[0], point[2], point[1]);
    const setMarker = (point: Point): void => {
      marker.position.copy(scenePoint(point));
    };
    setMarker(path[0] ?? [0, 0, 0]);
    let playing = false;
    let startedAt = 0;
    let disposed = false;
    const render = (timestamp: number): void => {
      if (disposed || !playing) return;
      if (!startedAt) startedAt = timestamp;
      const progress = ((timestamp - startedAt) / 5000) % 1;
      const position = progress * Math.max(path.length - 1, 1);
      const index = Math.floor(position);
      const remainder = position - index;
      const from = new THREE.Vector3(...scenePoint(path[index] ?? path[0] ?? [0, 0, 0]).toArray());
      const to = new THREE.Vector3(...scenePoint(path[Math.min(index + 1, path.length - 1)] ?? path[0] ?? [0, 0, 0]).toArray());
      marker.position.lerpVectors(from, to, remainder);
      renderer.render(scene, camera);
    };
    const renderOnce = (): void => renderer.render(scene, camera);
    renderOnce();
    const onPlay = (event: Event): void => {
      playing = (event as CustomEvent<{ playing: boolean }>).detail.playing;
      if (!playing) {
        renderer.setAnimationLoop(null);
        renderOnce();
        return;
      }
      startedAt = 0;
      renderer.setAnimationLoop(render);
    };
    const onReset = (): void => {
      playing = false;
      renderer.setAnimationLoop(null);
      startedAt = 0;
      setMarker(path[0] ?? [0, 0, 0]);
      renderOnce();
    };
    const onDispose = (): void => {
      disposed = true;
      renderer.setAnimationLoop(null);
      group.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else material.dispose();
        }
      });
      renderer.dispose();
      document.removeEventListener("demo:play", onPlay);
      document.removeEventListener("demo:reset", onReset);
      document.removeEventListener("demo:dispose", onDispose);
      resizeObserver.disconnect();
    };
    const onVisibility = (): void => {
      if (document.hidden && playing) document.dispatchEvent(new CustomEvent("demo:play", { detail: { playing: false } }));
    };
    const resizeObserver = new ResizeObserver(() => {
      const nextWidth = host.clientWidth || width;
      camera.aspect = nextWidth / 360;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, 360, false);
      if (!playing) renderOnce();
    });
    resizeObserver.observe(host);
    document.addEventListener("demo:play", onPlay);
    document.addEventListener("demo:reset", onReset);
    document.addEventListener("demo:dispose", onDispose);
    document.addEventListener("visibilitychange", onVisibility);

    canvas.addEventListener("webglcontextlost", () => {
      onDispose();
      host.replaceChildren(document.createTextNode("Interactive rendering unavailable. Static view remains available."));
    }, { once: true });
  } catch {
    host.replaceChildren(document.createTextNode("Interactive rendering unavailable. Static view remains available."));
  }
}