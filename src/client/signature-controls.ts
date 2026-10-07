import type { DemoCopy } from "../content/page-copy";
import { DEMO_TIMING, demoFrame } from "../demo/motion";
import type { SignatureData, SignatureRenderer } from "./signature-viewer";

const root = document.querySelector<HTMLElement>("[data-signature]");
if (root) {
  const host = root.querySelector<HTMLElement>("[data-scene-canvas]")!;
  const controls = root.querySelector<HTMLElement>("[data-playback-controls]")!;
  const toggle = root.querySelector<HTMLButtonElement>("[data-toggle]")!;
  const restart = root.querySelector<HTMLButtonElement>("[data-restart]")!;
  const label = root.querySelector<HTMLElement>("[data-play-label]")!;
  const symbol = root.querySelector<HTMLElement>("[data-play-symbol]")!;
  const status = root.querySelector<HTMLElement>("[data-scene-status]")!;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const data = JSON.parse(root.querySelector("[data-signature-data]")!.textContent!) as SignatureData;
  const copy = JSON.parse(root.querySelector("[data-signature-copy]")!.textContent!) as DemoCopy;
  let renderer: SignatureRenderer | null = null;
  let loading: Promise<void> | null = null;
  let elapsed = 0, previous = 0, raf = 0;
  let playing = false, visible = false, disposed = false, userChosePlayback = false;
  let phase = "";
  const messages: Record<string, string> = copy.status;
  const update = () => {
    const next = elapsed >= DEMO_TIMING.duration ? "complete" : demoFrame(elapsed).stage;
    root.dataset.stage = next;
    root.dataset.animation = playing ? "playing" : "paused";
    if (phase !== next) { status.textContent = messages[next]; phase = next; }
    const text = playing ? copy.controls.pause : elapsed >= DEMO_TIMING.duration ? copy.controls.replay : copy.controls.play;
    toggle.setAttribute("aria-label", text);
    label.textContent = text;
    symbol.textContent = playing ? "Ⅱ" : "▶";
  };
  const stopFrames = () => { cancelAnimationFrame(raf); raf = 0; previous = 0; };
  const tick = (time: number) => {
    raf = 0;
    if (disposed || !renderer || !playing || !visible || document.hidden) { previous = 0; return; }
    if (previous) elapsed = Math.min(DEMO_TIMING.duration, elapsed + Math.min((time - previous) / 1000, .1));
    previous = time;
    renderer.render(elapsed);
    if (elapsed >= DEMO_TIMING.duration) playing = false;
    update();
    if (playing) raf = requestAnimationFrame(tick);
  };
  const resumeFrames = () => {
    if (!raf && renderer && playing && visible && !document.hidden) { previous = 0; raf = requestAnimationFrame(tick); }
  };
  const fallback = () => {
    stopFrames();
    renderer?.dispose(); renderer = null;
    host.replaceChildren();
    root.dataset.renderer = "static";
    root.dataset.animation = "static";
    root.dataset.stage = "complete";
    playing = false;
    status.textContent = copy.status.fallback;
    toggle.disabled = false; label.textContent = copy.controls.retry; symbol.textContent = "▶";
    toggle.setAttribute("aria-label", copy.controls.retry);
    restart.hidden = true;
  };
  const load = (): Promise<void> => {
    if (loading) return loading;
    loading = (async () => {
      toggle.disabled = true;
      try {
        const { mountSignature } = await import("./signature-viewer");
        if (disposed) return;
        if (document.hidden || !visible || (reduced.matches && !userChosePlayback)) return;
        renderer = mountSignature(host, data, fallback);
        root.dataset.renderer = "webgl";
        restart.hidden = false;
        playing = true;
        elapsed = 0;
        update();
        resumeFrames();
      } catch { fallback(); }
      finally { toggle.disabled = false; loading = null; }
    })();
    return loading;
  };
  toggle.addEventListener("click", async () => {
    userChosePlayback = true;
    if (!renderer) { await load(); return; }
    if (elapsed >= DEMO_TIMING.duration) elapsed = 0;
    playing = !playing;
    update();
    if (playing) resumeFrames(); else stopFrames();
  });
  restart.addEventListener("click", () => {
    userChosePlayback = true;
    if (!renderer) { void load(); return; }
    elapsed = 0; previous = 0; playing = true; phase = "";
    renderer.render(0); update(); resumeFrames();
  });
  controls.hidden = false;
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) { stopFrames(); return; }
    if (!renderer && !loading && !reduced.matches && !userChosePlayback && root.dataset.renderer !== "static") void load();
    else resumeFrames();
  }, { threshold: .12 });
  intersection.observe(root);
  const onVisibility = () => {
    if (document.hidden) stopFrames();
    else if (!renderer && visible && !reduced.matches && root.dataset.renderer !== "static") void load();
    else resumeFrames();
  };
  const onMotionChange = () => {
    if (reduced.matches) { playing = false; stopFrames(); if (renderer) update(); }
    // Enabling motion does not override a user's pause.
  };
  const onPageHide = () => {
    disposed = true; stopFrames(); renderer?.dispose(); renderer = null;
    intersection.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    reduced.removeEventListener("change", onMotionChange);
  };
  document.addEventListener("visibilitychange", onVisibility);
  reduced.addEventListener("change", onMotionChange);
  window.addEventListener("pagehide", onPageHide, { once: true });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) window.location.reload();
  });
  if (reduced.matches) { status.textContent = copy.status.reduced_motion; restart.hidden = true; }
}
