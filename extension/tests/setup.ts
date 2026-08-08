// jsdom doesn't implement CSS.escape; real Chrome does. Polyfill only for tests.
if (typeof CSS === "undefined") {
  // @ts-expect-error - minimal test-env polyfill
  globalThis.CSS = {};
}
if (!CSS.escape) {
  CSS.escape = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);
}
if (typeof PointerEvent === "undefined") {
  globalThis.PointerEvent = MouseEvent as typeof PointerEvent;
}
