import { queryDeepAll, textOf } from "../../dom/queryDeep";
import { dispatchClick } from "../reactValueSetter";
import { readWorkdayValidationError, type SetAndVerifyResult } from "../verify";

export async function setPillChoice(group: Element, value: string): Promise<SetAndVerifyResult> {
  const items = queryDeepAll(group, "[role='radio'], [role='checkbox']");
  const normalize = (s: string) => s.trim().toLowerCase();
  const match =
    items.find((el) => textOf(el) === value) || items.find((el) => normalize(textOf(el)) === normalize(value));
  if (!match) return { ok: false };

  if (match.getAttribute("aria-checked") === "true") return { ok: true }; // don't toggle off an already-correct pill

  dispatchClick(match);
  await new Promise((r) => setTimeout(r, 100));
  return { ok: match.getAttribute("aria-checked") === "true", validationError: readWorkdayValidationError(group) };
}

function optionLabelForInput(input: HTMLInputElement): string {
  const id = input.getAttribute("id");
  if (id) {
    const forLabel = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (forLabel) return textOf(forLabel);
  }
  return textOf(input.closest("label")) || textOf(input.nextElementSibling) || input.value;
}

// Plain native <input type=radio> group (see parser/widgets/nativeChoice.ts) —
// clicking is enough to let any framework listeners pick it up naturally,
// verified via the native .checked property rather than an ARIA attribute.
export async function setNativeRadioGroup(elements: HTMLInputElement[], value: string): Promise<SetAndVerifyResult> {
  const normalize = (s: string) => s.trim().toLowerCase();
  const match =
    elements.find((el) => optionLabelForInput(el) === value) ||
    elements.find((el) => normalize(optionLabelForInput(el)) === normalize(value));
  if (!match) return { ok: false };

  if (match.checked) return { ok: true };

  dispatchClick(match);
  await new Promise((r) => setTimeout(r, 100));
  return { ok: match.checked, validationError: readWorkdayValidationError(match) };
}
