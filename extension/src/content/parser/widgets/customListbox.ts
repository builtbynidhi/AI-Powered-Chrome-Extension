import type { FieldType } from "../../../shared/types";
import { queryDeepAll, textOf } from "../../dom/queryDeep";

// Workday dropdowns are almost never native <select> — they're a trigger
// button/input with aria-haspopup="listbox" whose options are often not in
// the DOM yet (rendered on click, sometimes in a portal). We can't read the
// option list at parse time, only at fill time — see Filler for that.

export function detect(el: Element): boolean {
  if (el instanceof HTMLSelectElement) return true;
  const role = el.getAttribute("aria-haspopup") || el.getAttribute("role");
  return role === "listbox" || role === "combobox";
}

export function describe(el: Element): {
  type: FieldType;
  options: string[];
  optionsLoadStrategy: "eager" | "lazy";
  currentValue: string | null;
} {
  if (el instanceof HTMLSelectElement) {
    return {
      type: "select-native",
      options: [...el.options].map((o) => o.text),
      optionsLoadStrategy: "eager",
      currentValue: el.value || null,
    };
  }
  // Custom combobox: options aren't mounted yet — Filler discovers them by
  // opening the trigger. We still surface the currently displayed text, if any.
  const rawDisplayed = textOf(el);
  const displayed = /^(select one|select|choose)( required)?$/i.test(rawDisplayed) ? null : rawDisplayed || null;
  return { type: "listbox-custom", options: [], optionsLoadStrategy: "lazy", currentValue: displayed };
}

export function readOpenOptions(): string[] {
  // Called by Filler once it has clicked a trigger open.
  return queryDeepAll(document.body, "[role='option']").map(textOf).filter(Boolean);
}
