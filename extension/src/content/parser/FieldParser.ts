import type { LabelSource } from "../../shared/types";
import { queryDeepAll, textOf } from "../dom/queryDeep";
import { makeFieldId, type ParsedField } from "./FieldDescriptor";
import * as textInput from "./widgets/textInput";
import * as customListbox from "./widgets/customListbox";
import * as pillChoice from "./widgets/pillChoice";
import * as fileUpload from "./widgets/fileUpload";
import * as repeatableSection from "./widgets/repeatableSection";
import { collectSegmentedDateGroups } from "./widgets/segmentedDate";
import { collectNativeChoiceGroups } from "./widgets/nativeChoice";

const CANDIDATE_SELECTOR =
  "input, textarea, select, button, [role='radio'], [role='checkbox'], " +
  "[role='radiogroup'], [role='group'], [aria-haspopup='listbox'], [role='combobox']";

// Found via real-world testing: scanning the whole page (including header/nav
// chrome like an account "Settings" menu) surfaced page-chrome controls as if
// they were application fields. Scope to the nearest semantic landmark that
// wraps the actual application content — a Workday application is either
// inside <main>/role="main" or a <form>; document.body is the last resort,
// not the default.
function findScanRoot(): ParentNode {
  return (
    document.querySelector("[role='main']") ??
    document.querySelector("main") ??
    document.querySelector("form") ??
    document.body
  );
}

// Priority order per the assignment's "no hardcoded selectors only" constraint:
// semantic signals first, generated CSS class names never.
function resolveLabel(el: Element): { label: string; source: LabelSource } {
  const automationId = el.getAttribute("data-automation-id");
  if (automationId) return { label: automationId, source: "data-automation-id" };

  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel && !/^(select one|select|choose)( required)?$/i.test(ariaLabel.trim())) {
    return { label: ariaLabel, source: "aria-label" };
  }

  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => textOf(document.getElementById(id)))
      .filter(Boolean)
      .join(" ");
    if (text) return { label: text, source: "aria-label" };
  }

  const id = el.getAttribute("id");
  if (id) {
    const forLabel = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (forLabel) return { label: textOf(forLabel), source: "label-for" };
  }
  const wrappingLabel = el.closest("label");
  if (wrappingLabel) return { label: textOf(wrappingLabel), source: "label-for" };

  const legend = el.closest("fieldset")?.querySelector("legend");
  if (legend) return { label: textOf(legend), source: "legend" };

  const placeholder = el.getAttribute("placeholder");
  if (placeholder) return { label: placeholder, source: "placeholder" };

  // Last resort: nearest preceding text node within a depth-capped ancestor walk.
  let node: Element | null = el;
  for (let depth = 0; depth < 4 && node; depth++) {
    const prev = node.previousElementSibling;
    if (prev && textOf(prev)) return { label: textOf(prev), source: "proximity" };
    node = node.parentElement;
  }
  return { label: "(unlabeled field)", source: "proximity" };
}

function isRequired(el: Element, label: string): boolean {
  if (el.getAttribute("aria-required") === "true") return true;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    if (el.required) return true;
  }
  return /\*\s*$/.test(label);
}

export function parseStep(containerStep: string): ParsedField[] {
  if (containerStep === "Unknown") return [];
  const root = findScanRoot();
  const candidates = queryDeepAll(root, CANDIDATE_SELECTOR);
  const consumed = new Set<Element>();
  const fields: ParsedField[] = [];

  // Pass 1: segmented dates (3 inputs merged into 1 logical field).
  const allInputs = candidates.filter((el): el is HTMLInputElement => el instanceof HTMLInputElement);
  for (const group of collectSegmentedDateGroups(allInputs)) {
    group.elements.forEach((el) => consumed.add(el));
    fields.push({
      id: makeFieldId(group.elements[0], group.label),
      label: group.label,
      labelSource: "legend",
      type: "date-segmented",
      required: group.elements.some((el) => isRequired(el, group.label)),
      currentValue: group.currentValue,
      isPrefilled: group.currentValue !== null,
      containerStep,
      domRefs: group.elements,
    });
  }

  // Pass 2a: plain native <input type=radio> groups (grouped by shared
  // `name`) — Workday's ARIA pill pattern (Pass 2b below) doesn't cover every
  // tenant; some render simple Yes/No questions as native radio inputs.
  for (const group of collectNativeChoiceGroups(allInputs)) {
    group.elements.forEach((el) => consumed.add(el));
    fields.push({
      id: makeFieldId(group.elements[0], group.label),
      label: group.label,
      labelSource: "proximity",
      type: "radio-pill",
      options: group.options,
      required: group.elements.some((el) => el.required),
      currentValue: group.currentValue,
      isPrefilled: group.currentValue !== null,
      containerStep,
      domRefs: group.elements,
    });
  }

  // Pass 2b: ARIA pill radio/checkbox groups (consume their descendant items).
  for (const el of candidates) {
    if (consumed.has(el) || !pillChoice.detect(el)) continue;
    const descendants = queryDeepAll(el, "[role='radio'], [role='checkbox']");
    if (descendants.length === 0) continue;
    descendants.forEach((d) => consumed.add(d));
    consumed.add(el);
    const { label, source } = resolveLabel(el);
    const described = pillChoice.describe(el);
    fields.push({
      id: makeFieldId(el, label),
      label,
      labelSource: source,
      required: isRequired(el, label),
      isPrefilled: described.currentValue !== null,
      containerStep,
      domRefs: [el],
      ...described,
    });
  }

  // Pass 3: everything else — file upload, custom listbox/select, repeatable
  // "Add" buttons, and plain text/textarea as the fallback.
  for (const el of candidates) {
    if (consumed.has(el)) continue;
    if (el.closest("[role='radiogroup'], [role='group']") && consumed.has(el.closest("[role='radiogroup'], [role='group']")!)) continue;

    let described: { type: ParsedField["type"]; options?: string[]; optionsLoadStrategy?: "eager" | "lazy"; currentValue: string | null } | null =
      null;

    if (fileUpload.detect(el)) described = fileUpload.describe(el as HTMLInputElement);
    else if (customListbox.detect(el)) described = customListbox.describe(el);
    else if (repeatableSection.detect(el)) described = repeatableSection.describe(el as HTMLButtonElement);
    else if (textInput.detect(el)) described = textInput.describe(el);

    if (!described) continue; // e.g. a button that isn't an Add control — not a fillable field
    consumed.add(el);

    const { label, source } = resolveLabel(el);
    fields.push({
      id: makeFieldId(el, label),
      label,
      labelSource: source,
      required: isRequired(el, label),
      isPrefilled: described.currentValue !== null && described.currentValue !== "",
      containerStep,
      domRefs: [el],
      ...described,
    });
  }

  return fields;
}
