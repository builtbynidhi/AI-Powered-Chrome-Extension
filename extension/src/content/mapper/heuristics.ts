import type { FieldDescriptor, MapperResult, ResumeProfile } from "../../shared/types";

// Entirely client-side, zero network calls. Only fields that don't match one
// of these common aliases get batched to the AI backend — this keeps cost
// and latency down for the ~80% of a Workday form that's boilerplate contact info.
interface HeuristicRule {
  pattern: RegExp;
  exclude?: RegExp;
  resolve: (resume: ResumeProfile) => string | undefined;
}

// Labels that merely *contain* "phone" but aren't the phone number itself —
// found via real-world testing: a broad /phone/i rule was matching "Phone
// Extension" and copying the phone number into it.
const PHONE_LABEL_EXCLUDE = /extension|device|type|code|fax/i;

// Workday commonly pairs a "Country Phone Code" selector with a "Phone
// Number" text field that expects LOCAL digits only — filling it with a
// full "+<code>..." number gets rejected by Workday's own validation (seen
// in testing). Best-effort strip of a recognized dial code; falls back to a
// generic "+<1-3 digits>" strip if the country isn't in this small table.
const DIAL_CODES: Record<string, string> = {
  india: "+91",
  "united states": "+1",
  usa: "+1",
  "united kingdom": "+44",
  uk: "+44",
  canada: "+1",
  australia: "+61",
  germany: "+49",
  poland: "+48",
  pakistan: "+92",
};

function localPhone(resume: ResumeProfile): string | undefined {
  const phone = resume.phone;
  if (!phone) return undefined;
  const country = resume.location?.country?.trim().toLowerCase();
  const dial = country ? DIAL_CODES[country] : undefined;
  // Only strip when we recognize the country's dial code — guessing a
  // generic "+<n digits>" prefix risks mangling numbers for codes we don't
  // have in the table (e.g. "+1" vs "+91" vs "+44" aren't a fixed length).
  if (dial && phone.startsWith(dial)) return phone.slice(dial.length).replace(/^[\s-]+/, "");
  return phone;
}

const RULES: HeuristicRule[] = [
  { pattern: /given name|first name/i, resolve: (r) => r.firstName },
  { pattern: /family name|last name|surname/i, resolve: (r) => r.lastName },
  { pattern: /e-?mail/i, resolve: (r) => r.email },
  { pattern: /phone|mobile|cell/i, exclude: PHONE_LABEL_EXCLUDE, resolve: localPhone },
  { pattern: /city/i, resolve: (r) => r.location?.city },
  { pattern: /state|province/i, resolve: (r) => r.location?.state },
  { pattern: /country/i, resolve: (r) => r.location?.country },
  { pattern: /linkedin/i, resolve: (r) => r.links.linkedin },
  { pattern: /github/i, resolve: (r) => r.links.github },
];

export function resolveHeuristically(field: FieldDescriptor, resume: ResumeProfile): MapperResult | null {
  // Heuristics only handle plain text fields — choice/date/file fields need
  // either the AI's semantic matching (custom question wording varies too
  // much) or their own widget-specific fill logic upstream.
  if (field.type !== "text") return null;

  for (const rule of RULES) {
    if (rule.exclude?.test(field.label)) continue;
    if (rule.pattern.test(field.label)) {
      const value = rule.resolve(resume);
      if (value) {
        return {
          fieldId: field.id,
          value,
          confidence: 1,
          needsUserReview: false,
          resolvedBy: "heuristic",
        };
      }
    }
  }
  return null;
}
