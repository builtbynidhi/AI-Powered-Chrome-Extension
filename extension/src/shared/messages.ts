// chrome.runtime message contracts between content script <-> background worker.
// Content script never calls the network directly; every AI call is routed
// through the background worker so the backend URL/key handling stays in one place.

import type { FieldDescriptor, MapperResult, ResumeProfile } from "./types";

export type ExtensionMessage =
  | { kind: "PARSE_RESUME"; fileName: string; fileBase64: string; mimeType: string }
  | { kind: "MAP_FIELDS"; step: string; fields: FieldDescriptor[]; resume: ResumeProfile }
  | { kind: "GENERATE_ANSWER"; field: FieldDescriptor; resume: ResumeProfile };

export type ExtensionResponse =
  | { kind: "PARSE_RESUME_OK"; resume: ResumeProfile }
  | { kind: "MAP_FIELDS_OK"; results: MapperResult[] }
  | { kind: "GENERATE_ANSWER_OK"; result: MapperResult }
  | { kind: "ERROR"; message: string };
