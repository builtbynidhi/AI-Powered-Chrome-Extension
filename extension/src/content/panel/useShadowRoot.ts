import cssText from "./styles.css?inline";

// Mounts an isolated shadow root for the panel so Workday's page styles
// can't leak in (and Tailwind's reset can't leak onto Workday's page).
export function mountShadowRoot(): { host: HTMLElement; mountPoint: HTMLElement } {
  const host = document.createElement("div");
  host.id = "workday-autofill-host";
  host.style.position = "fixed";
  host.style.top = "0";
  host.style.right = "0";
  host.style.zIndex = "2147483647";
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = cssText;
  shadow.appendChild(style);

  const mountPoint = document.createElement("div");
  shadow.appendChild(mountPoint);

  return { host, mountPoint };
}
