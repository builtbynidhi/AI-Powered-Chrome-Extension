// Waits for a burst of DOM mutations to "settle" before firing a callback,
// instead of reacting to every individual mutation (Workday's SPA re-renders
// in bursts as each step mounts). Also respects visible loading indicators
// and has a hard timeout so we never wait forever on a stuck page.

export interface SettleWatcherOptions {
  quietMs?: number;
  hardTimeoutMs?: number;
  isLoading?: () => boolean;
}

export function watchForSettle(
  target: Node,
  onSettle: (opts: { timedOut: boolean }) => void,
  { quietMs = 400, hardTimeoutMs = 15000, isLoading = () => false }: SettleWatcherOptions = {},
): () => void {
  let quietTimer: ReturnType<typeof setTimeout> | null = null;
  let settled = false;

  const hardTimer = setTimeout(() => fire(true), hardTimeoutMs);

  function fire(timedOut: boolean) {
    if (settled) return;
    settled = true;
    clearTimeout(hardTimer);
    if (quietTimer) clearTimeout(quietTimer);
    observer.disconnect();
    onSettle({ timedOut });
  }

  function scheduleQuietCheck() {
    if (quietTimer) clearTimeout(quietTimer);
    quietTimer = setTimeout(() => {
      if (isLoading()) {
        scheduleQuietCheck(); // still busy — keep waiting
      } else {
        fire(false);
      }
    }, quietMs);
  }

  const observer = new MutationObserver(() => scheduleQuietCheck());
  observer.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "aria-busy", "aria-invalid"] });
  scheduleQuietCheck(); // in case the DOM is already settled at call time

  return () => {
    settled = true;
    clearTimeout(hardTimer);
    if (quietTimer) clearTimeout(quietTimer);
    observer.disconnect();
  };
}
