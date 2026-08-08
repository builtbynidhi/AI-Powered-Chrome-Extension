import type { ResumeFile } from "../../shared/storage";
import { getResumeFile, getResumeProfile } from "../../shared/storage";
import type { FillOutcome, ResumeProfile } from "../../shared/types";
import { fillField } from "../filler/FieldFiller";
import type { ParsedField } from "../parser/FieldDescriptor";

export interface StoredAutofillData {
  resume: ResumeProfile | null;
  resumeFile: ResumeFile | null;
}

export async function loadStoredAutofillData(): Promise<StoredAutofillData> {
  const [resume, resumeFile] = await Promise.all([getResumeProfile(), getResumeFile()]);
  return { resume, resumeFile };
}

export function attachResumeFields(
  fields: ParsedField[],
  resumeFile: ResumeFile | null,
): Promise<FillOutcome[]> {
  return Promise.all(fields.map((field) => fillField(field, resumeFile?.fileName ?? "", resumeFile)));
}
