// Thin wrapper around chrome.storage.local — the only persistence this
// extension uses (see docs/limitations.md for why there's no backend DB).

import type { ResumeProfile } from "./types";

export interface ResumeFile {
  fileName: string;
  mimeType: string;
  fileBase64: string;
}

const RESUME_KEY = "workday_autofill_resume_profile";
const RESUME_FILE_KEY = "workday_autofill_resume_file";
const BACKEND_URL_KEY = "workday_autofill_backend_url";

export async function getResumeProfile(): Promise<ResumeProfile | null> {
  const { [RESUME_KEY]: value } = await chrome.storage.local.get(RESUME_KEY);
  return value ?? null;
}

export async function setResumeProfile(profile: ResumeProfile): Promise<void> {
  await chrome.storage.local.set({ [RESUME_KEY]: profile });
}

export async function clearResumeProfile(): Promise<void> {
  await chrome.storage.local.remove([RESUME_KEY, RESUME_FILE_KEY]);
}

// The raw resume file (not just the parsed JSON) is kept so the Filler can
// re-attach it on Workday's own resume-upload step, without re-prompting the user.
export async function getResumeFile(): Promise<ResumeFile | null> {
  const { [RESUME_FILE_KEY]: value } = await chrome.storage.local.get(RESUME_FILE_KEY);
  return value ?? null;
}

export async function setResumeFile(file: ResumeFile): Promise<void> {
  await chrome.storage.local.set({ [RESUME_FILE_KEY]: file });
}

export async function getBackendUrl(): Promise<string> {
  const { [BACKEND_URL_KEY]: value } = await chrome.storage.local.get(BACKEND_URL_KEY);
  return value ?? "http://localhost:8000";
}

export async function setBackendUrl(url: string): Promise<void> {
  await chrome.storage.local.set({ [BACKEND_URL_KEY]: url });
}
