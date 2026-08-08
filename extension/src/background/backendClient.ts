import type { FieldDescriptor, MapperResult, ResumeProfile } from "../shared/types";
import { getBackendUrl } from "../shared/storage";

async function post<T>(path: string, body: unknown): Promise<T> {
  const base = await getBackendUrl();
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Backend ${path} failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export function parseResume(fileBase64: string, fileName: string, mimeType: string) {
  return post<{ resume: ResumeProfile }>("/resume/parse", { fileBase64, fileName, mimeType });
}

export function mapFields(step: string, fields: FieldDescriptor[], resume: ResumeProfile) {
  return post<{ results: MapperResult[] }>("/mapping/map-fields", { step, fields, resume });
}

export function generateAnswer(field: FieldDescriptor, resume: ResumeProfile) {
  return post<{ result: MapperResult }>("/mapping/generate-answer", { field, resume });
}
