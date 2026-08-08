import type { ResumeFile } from "../../../shared/storage";
import { readWorkdayValidationError, type SetAndVerifyResult } from "../verify";

function base64ToFile(resumeFile: ResumeFile): File {
  const binary = atob(resumeFile.fileBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], resumeFile.fileName, { type: resumeFile.mimeType });
}

export async function setFileUpload(input: HTMLInputElement, resumeFile: ResumeFile): Promise<SetAndVerifyResult> {
  const file = base64ToFile(resumeFile);
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return { ok: input.files?.[0]?.name === resumeFile.fileName, validationError: readWorkdayValidationError(input) };
}
