// Core cross-module types. Kept in one file since they're small and shared
// across content script, background worker, and popup.

export interface WorkExperience {
  title: string;
  company: string;
  location?: string;
  startDate?: string; // ISO yyyy-mm or yyyy-mm-dd
  endDate?: string; // ISO or "present"
  description?: string;
}

export interface Education {
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
}

export interface ResumeProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: { city?: string; state?: string; country?: string };
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: string[];
  links: { linkedin?: string; github?: string; other?: string[] };
}

export type FieldType =
  | "text"
  | "textarea"
  | "select-native"
  | "listbox-custom"
  | "date-segmented"
  | "radio-pill"
  | "checkbox-pill"
  | "file-upload"
  | "repeatable-group";

export type LabelSource =
  | "data-automation-id"
  | "aria-label"
  | "label-for"
  | "legend"
  | "placeholder"
  | "proximity";

export interface FieldDescriptor {
  id: string; // stable hash of dom-path + label, for this page session
  label: string;
  labelSource: LabelSource;
  type: FieldType;
  options?: string[];
  optionsLoadStrategy?: "eager" | "lazy";
  required: boolean;
  currentValue: string | null;
  isPrefilled: boolean;
  containerStep: string;
}

export interface MapperResult {
  fieldId: string;
  value: string;
  confidence: number; // 0..1
  sourceFacts?: string[];
  needsUserReview: boolean;
  resolvedBy: "heuristic" | "ai";
}

export interface FillOutcome {
  fieldId: string;
  ok: boolean;
  validationError?: string; // Workday's own inline error, if any, post-blur
}

export const CONFIDENCE_AUTO_APPLY_THRESHOLD = 0.6;
