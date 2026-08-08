import { queryDeepAll, textOf } from "../../dom/queryDeep";
import { dispatchClick } from "../reactValueSetter";
import { readWorkdayValidationError, type SetAndVerifyResult } from "../verify";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchOption(options: Element[], value: string): Element | undefined {
  const normalize = (s: string) => s.trim().toLowerCase();
  return (
    options.find((o) => textOf(o) === value) ||
    options.find((o) => normalize(textOf(o)) === normalize(value)) ||
    options.find((o) => normalize(textOf(o)).includes(normalize(value)))
  );
}

export async function setNativeSelectValue(el: HTMLSelectElement, value: string): Promise<SetAndVerifyResult> {
  const option = [...el.options].find(
    (o) => o.text === value || o.text.trim().toLowerCase() === value.trim().toLowerCase(),
  );
  if (!option) return { ok: false };
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
  setter?.call(el, option.value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return { ok: el.value === option.value, validationError: readWorkdayValidationError(el) };
}

export async function setCustomListboxValue(
  trigger: Element,
  value: string,
  { pollMs = 100, timeoutMs = 3000 } = {},
): Promise<SetAndVerifyResult> {
  dispatchClick(trigger);

  const deadline = Date.now() + timeoutMs;
  let options: Element[] = [];
  while (Date.now() < deadline) {
    options = queryDeepAll(document.body, "[role='option']");
    if (options.length > 0) break;
    await sleep(pollMs);
  }
  if (options.length === 0) return { ok: false };

  const match = matchOption(options, value);
  if (!match) return { ok: false };

  dispatchClick(match);
  await sleep(150);
  const displayed = textOf(trigger).toLowerCase();
  const matchedText = textOf(match).toLowerCase();
  return { ok: displayed.includes(matchedText), validationError: readWorkdayValidationError(trigger) };
}
