import { textOf } from "../../dom/queryDeep";

// Workday date fields are usually 3 separate sub-inputs (month/day/year)
// under one shared container. We must merge them into a single logical
// FieldDescriptor — handing the Mapper 3 orphan "Month"/"Day"/"Year" fields
// would be ambiguous across every date field on a page (DOB vs start date...).

export interface SegmentedDateGroup {
  elements: HTMLInputElement[]; // [month, day, year]
  label: string;
  currentValue: string | null;
}

function quickLabel(el: Element): string {
  return (
    el.getAttribute("aria-label") ||
    el.getAttribute("placeholder") ||
    el.getAttribute("data-automation-id") ||
    ""
  );
}

function commonAncestor(elements: Element[], maxDepth = 5): Element | null {
  let candidate: Element | null = elements[0];
  for (let depth = 0; depth < maxDepth && candidate; depth++) {
    if (elements.every((el) => candidate!.contains(el))) return candidate;
    candidate = candidate.parentElement;
  }
  return null;
}

export function collectSegmentedDateGroups(inputs: HTMLInputElement[]): SegmentedDateGroup[] {
  const months = inputs.filter((el) => /month/i.test(quickLabel(el)));
  const days = inputs.filter((el) => /\bday\b/i.test(quickLabel(el)));
  const years = inputs.filter((el) => /year/i.test(quickLabel(el)));
  const groups: SegmentedDateGroup[] = [];

  for (const month of months) {
    let ancestor: Element | null = month.parentElement;
    for (let depth = 0; depth < 6 && ancestor; depth++) {
      if (days.some((el) => ancestor!.contains(el)) && years.some((el) => ancestor!.contains(el))) break;
      ancestor = ancestor.parentElement;
    }
    if (!ancestor) continue;
    const day = days.find((el) => ancestor.contains(el));
    const year = years.find((el) => ancestor.contains(el));
    if (!day || !year) continue;

    const container = commonAncestor([month, day, year]) ?? ancestor;
    const legend = container.querySelector("legend, [role='heading'], label");
    const label = textOf(legend) || "Date";
    const currentValue =
      month.value && day.value && year.value ? `${year.value}-${month.value}-${day.value}` : null;

    groups.push({ elements: [month, day, year], label, currentValue });
  }

  return groups;
}
