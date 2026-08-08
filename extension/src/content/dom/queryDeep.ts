// Shadow-DOM-safe DOM traversal. Workday's current frontend renders mostly in
// light DOM, but the assignment explicitly requires shadow-DOM handling, and
// this is cheap defensive coverage against any web-component usage.

export function queryDeepAll(root: ParentNode, selector: string): Element[] {
  const results: Element[] = [...root.querySelectorAll(selector)];
  const allElements = root.querySelectorAll("*");
  for (const el of allElements) {
    if (el.shadowRoot) {
      results.push(...queryDeepAll(el.shadowRoot, selector));
    }
  }
  return results;
}

export function textOf(el: Element | null | undefined): string {
  return (el?.textContent ?? "").trim().replace(/\s+/g, " ");
}
