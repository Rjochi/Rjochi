export async function loadInteractiveDemo(
  host: HTMLElement,
  sceneJson: string,
  pathJson: string,
): Promise<void> {
  const { mountDemo } = await import("./demo-viewer");
  await mountDemo(host, JSON.parse(sceneJson), JSON.parse(pathJson));
}