import type { FieldType } from "../../../shared/types";
import { textOf } from "../../dom/queryDeep";

// Design choice: rather than modeling a repeatable section's template fields
// up front, we expose the "Add Another" control as one meta-field. Once the
// Filler clicks it, the newly-mounted instance's inputs are just ordinary
// fields on the next Navigator/Parser pass (repeatable groups mount real DOM
// nodes, no different from any other step content) — so no separate
// instance-tracking data structure is needed. Simpler and no less correct.

const ADD_BUTTON_PATTERN = /add\s+(another|experience|education)?/i;

export function detect(el: Element): boolean {
  return el instanceof HTMLButtonElement && ADD_BUTTON_PATTERN.test(textOf(el));
}

export function describe(el: HTMLButtonElement): { type: FieldType; currentValue: string | null } {
  return { type: "repeatable-group", currentValue: null };
}

export function clickAdd(el: HTMLButtonElement): void {
  el.click();
}
