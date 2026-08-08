import type { FieldType } from "../../../shared/types";

// The real <input type=file> is usually visually hidden behind a styled
// dropzone; the label comes from the dropzone container, not the input itself.

export function detect(el: Element): boolean {
  return el instanceof HTMLInputElement && el.type === "file";
}

export function describe(el: HTMLInputElement): { type: FieldType; currentValue: string | null } {
  return { type: "file-upload", currentValue: el.files?.[0]?.name ?? null };
}
