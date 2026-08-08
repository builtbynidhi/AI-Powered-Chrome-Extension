import type { ExtensionResponse } from "../../shared/messages";
import type { FieldDescriptor, MapperResult, ResumeProfile } from "../../shared/types";
import { resolveHeuristically } from "./heuristics";

/**
 * Heuristic-first, AI-fallback. Only fields the label-alias table can't
 * confidently resolve are sent to the backend, batched per step (one call
 * per visible step, not per field and not whole-application — later steps
 * aren't even in the DOM yet).
 */
export async function mapFields(step: string, fields: FieldDescriptor[], resume: ResumeProfile): Promise<MapperResult[]> {
  const results: MapperResult[] = [];
  const unresolved: FieldDescriptor[] = [];

  for (const field of fields) {
    const heuristic = resolveHeuristically(field, resume);
    if (heuristic) results.push(heuristic);
    else unresolved.push(field);
  }

  if (unresolved.length > 0) {
    const openEnded = unresolved.filter((field) => field.type === "textarea");
    const batchable = unresolved.filter((field) => field.type !== "textarea");
    const generated = await Promise.all(openEnded.map((field) => generateAnswer(field, resume)));
    results.push(...generated.map((result) => ({ ...result, needsUserReview: true })));

    if (batchable.length === 0) return results;
    let response: ExtensionResponse;
    try {
      response = (await chrome.runtime.sendMessage({ kind: "MAP_FIELDS", step, fields: batchable, resume })) as ExtensionResponse;
    } catch {
      response = { kind: "ERROR", message: "Backend unavailable" };
    }
    if (response.kind === "MAP_FIELDS_OK") results.push(...response.results);
    else if (response.kind === "ERROR") {
      // Backend unreachable/erroring — fail open to "needs review", never
      // silently drop the field or guess.
      for (const field of batchable) {
        results.push({
          fieldId: field.id,
          value: "",
          confidence: 0,
          needsUserReview: true,
          resolvedBy: "ai",
        });
      }
    }
  }

  return results;
}

export async function generateAnswer(field: FieldDescriptor, resume: ResumeProfile): Promise<MapperResult> {
  let response: ExtensionResponse;
  try {
    response = (await chrome.runtime.sendMessage({ kind: "GENERATE_ANSWER", field, resume })) as ExtensionResponse;
  } catch {
    response = { kind: "ERROR", message: "Backend unavailable" };
  }
  if (response.kind === "GENERATE_ANSWER_OK") return response.result;
  return { fieldId: field.id, value: "", confidence: 0, needsUserReview: true, resolvedBy: "ai" };
}
