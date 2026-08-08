import { queryDeepAll, textOf } from "../dom/queryDeep";

const FORWARD = /^(next|continue|save and continue)$/i;
const BLOCKED = /submit|sign\s*in|log\s*in|create\s+account|captcha|verify/i;

export function findForwardControl(root: ParentNode): HTMLElement | null {
  const controls = queryDeepAll(root, "button, [role='button']") as HTMLElement[];
  return controls.find((control) => {
    const label = control.getAttribute("aria-label") || textOf(control);
    const disabled = (control as HTMLButtonElement).disabled || control.getAttribute("aria-disabled") === "true";
    const hidden = control.hidden || control.getAttribute("aria-hidden") === "true";
    return !disabled && !hidden && !BLOCKED.test(label) && FORWARD.test(label.trim());
  }) ?? null;
}
