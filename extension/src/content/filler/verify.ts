import { queryDeepAll, textOf } from "../dom/queryDeep";

const BACKOFF_MS = [150, 400, 900];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SetAndVerifyResult {
  ok: boolean;
  validationError?: string;
}

/**
 * Runs `apply()`, then confirms the field actually stuck via `readback()`.
 * Retries with backoff on mismatch (Workday's own re-renders can occasionally
 * clobber a just-set value). After a successful set, checks Workday's own
 * inline validation state — this is what "validate inputs before submission"
 * means literally, not just our own readback check.
 */
export async function setAndVerify(
  apply: () => void,
  readback: () => string,
  expected: string,
  el: Element,
): Promise<SetAndVerifyResult> {
  for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
    apply();
    await sleep(30);
    if (readback().trim() === expected.trim()) {
      return { ok: true, validationError: readWorkdayValidationError(el) };
    }
    if (attempt < BACKOFF_MS.length) await sleep(BACKOFF_MS[attempt]);
  }
  return { ok: false };
}

export function readWorkdayValidationError(el: Element): string | undefined {
  if (el.getAttribute("aria-invalid") === "true") {
    const describedBy = el.getAttribute("aria-describedby");
    if (describedBy) {
      const text = describedBy
        .split(/\s+/)
        .map((id) => textOf(document.getElementById(id)))
        .filter(Boolean)
        .join(" ");
      if (text) return text;
    }
    const nearbyError = el.parentElement?.querySelector("[role='alert'], .error, [data-automation-id*='error' i]");
    if (nearbyError) return textOf(nearbyError);
    return "Workday flagged this field as invalid";
  }
  const container = el.closest("fieldset, div");
  const alert = container ? queryDeepAll(container, "[role='alert']")[0] : undefined;
  return alert ? textOf(alert) : undefined;
}
