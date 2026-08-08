import { setNativeInputValue, dispatchBlur } from "../reactValueSetter";
import { readWorkdayValidationError, type SetAndVerifyResult } from "../verify";

// Expects an ISO-ish "YYYY-MM-DD" value (that's what parse_chain.py normalizes
// resume dates to) and the [month, day, year] element triplet from segmentedDate.ts.
export async function setSegmentedDate(
  elements: HTMLInputElement[],
  isoValue: string,
): Promise<SetAndVerifyResult> {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(isoValue) ?? /^(\d{4})-(\d{1,2})$/.exec(isoValue);
  if (!match) return { ok: false };
  const [, year, month, day = "01"] = match;
  const [monthEl, dayEl, yearEl] = elements;

  setNativeInputValue(monthEl, month.padStart(2, "0"));
  setNativeInputValue(dayEl, day.padStart(2, "0"));
  setNativeInputValue(yearEl, year);
  elements.forEach(dispatchBlur);

  const ok = monthEl.value.includes(month.padStart(2, "0")) && yearEl.value.includes(year);
  return { ok, validationError: elements.map(readWorkdayValidationError).find(Boolean) };
}
