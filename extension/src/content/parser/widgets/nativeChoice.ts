import { textOf } from "../../dom/queryDeep";

// Some Workday tenants render simple Yes/No-style questions as plain native
// <input type="radio"> (grouped by shared `name`), not the ARIA role="radio"
// pill pattern handled by pillChoice.ts. Found via real-world testing: a
// tenant's "Were you previously employed here?" question used this exact
// pattern and was silently skipped before this widget existed.

export interface NativeChoiceGroup {
  elements: HTMLInputElement[];
  label: string;
  options: string[];
  currentValue: string | null;
  isCheckbox: boolean;
}

function optionLabel(input: HTMLInputElement): string {
  const id = input.getAttribute("id");
  if (id) {
    const forLabel = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (forLabel) return textOf(forLabel);
  }
  const wrapping = input.closest("label");
  if (wrapping) return textOf(wrapping);
  return textOf(input.nextElementSibling) || input.value;
}

function commonAncestor(elements: Element[], maxDepth = 6): Element | null {
  let candidate: Element | null = elements[0];
  for (let depth = 0; depth < maxDepth && candidate; depth++) {
    if (elements.every((el) => candidate!.contains(el))) return candidate;
    candidate = candidate.parentElement;
  }
  return null;
}

function groupLabel(elements: HTMLInputElement[]): string {
  const ancestor = commonAncestor(elements) ?? elements[0].parentElement;
  const legend = ancestor?.querySelector("legend, [role='heading']");
  if (legend) return textOf(legend);

  // Fall back to the nearest preceding heading/paragraph text before the group.
  let node: Element | null = ancestor;
  for (let depth = 0; depth < 3 && node; depth++) {
    const prev = node.previousElementSibling;
    if (prev && textOf(prev)) return textOf(prev);
    node = node.parentElement;
  }
  return "Question";
}

export function collectNativeChoiceGroups(inputs: HTMLInputElement[]): NativeChoiceGroup[] {
  const radios = inputs.filter((el) => el.type === "radio" && el.name);
  const byName = new Map<string, HTMLInputElement[]>();
  for (const el of radios) {
    const list = byName.get(el.name) ?? [];
    list.push(el);
    byName.set(el.name, list);
  }

  const groups: NativeChoiceGroup[] = [];
  for (const elements of byName.values()) {
    if (elements.length < 2) continue; // a lone radio isn't a meaningful group
    const options = elements.map(optionLabel);
    const checked = elements.find((el) => el.checked);
    groups.push({
      elements,
      label: groupLabel(elements),
      options,
      currentValue: checked ? optionLabel(checked) : null,
      isCheckbox: false,
    });
  }
  return groups;
}
