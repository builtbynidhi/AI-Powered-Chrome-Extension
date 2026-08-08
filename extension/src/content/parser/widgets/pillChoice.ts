import type { FieldType } from "../../../shared/types";
import { queryDeepAll, textOf } from "../../dom/queryDeep";

// Workday styles radio/checkbox options as pills but keeps proper roles
// underneath — read accessible role/state, never the visual class names.

export function detect(el: Element): boolean {
  const role = el.getAttribute("role");
  return role === "radiogroup" || role === "group";
}

export function describe(group: Element): {
  type: FieldType;
  options: string[];
  currentValue: string | null;
} {
  const isCheckboxGroup = queryDeepAll(group, "[role='checkbox']").length > 0;
  const items = queryDeepAll(group, isCheckboxGroup ? "[role='checkbox']" : "[role='radio']");
  const options = items.map(textOf).filter(Boolean);
  const selected = items.find((el) => el.getAttribute("aria-checked") === "true");

  return {
    type: isCheckboxGroup ? "checkbox-pill" : "radio-pill",
    options,
    currentValue: selected ? textOf(selected) : null,
  };
}
