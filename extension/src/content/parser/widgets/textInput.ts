import type { FieldType } from "../../../shared/types";

const TEXT_INPUT_TYPES = new Set(["text", "email", "tel", "number", "url", "date", ""]);

export function detect(el: Element): boolean {
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return TEXT_INPUT_TYPES.has(el.type);
  return false;
}

export function describe(el: Element): { type: FieldType; currentValue: string | null } {
  const type: FieldType = el instanceof HTMLTextAreaElement ? "textarea" : "text";
  const currentValue = (el as HTMLInputElement | HTMLTextAreaElement).value || null;
  return { type, currentValue };
}
