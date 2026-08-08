// Step detection is signal-based, not a fixed sequence: different Workday
// tenants order/omit steps differently, so we score which known step best
// matches what's currently visible rather than assuming a linear walk.

import { queryDeepAll, textOf } from "../dom/queryDeep";

export const KNOWN_STEPS = [
  "My Information",
  "My Experience",
  "Education",
  "Application Questions",
  "Voluntary Disclosures",
  "Self Identify",
  "Review",
] as const;

export type KnownStep = (typeof KNOWN_STEPS)[number] | "Unknown";

interface StepSignature {
  step: (typeof KNOWN_STEPS)[number];
  patterns: RegExp[];
}

const SIGNATURES: StepSignature[] = [
  { step: "My Information", patterns: [/^my information$/i, /legal name/i, /given name/i, /source tracking/i, /how did you hear/i] },
  { step: "My Experience", patterns: [/^my experience$/i, /work experience/i, /job title/i, /experience summary/i] },
  { step: "Education", patterns: [/^education$/i, /school or university/i, /degree/i, /field of study/i] },
  { step: "Application Questions", patterns: [/application questions/i, /screening question/i] },
  { step: "Voluntary Disclosures", patterns: [/voluntary disclosures/i, /veteran status/i, /race\/?ethnicity/i] },
  { step: "Self Identify", patterns: [/self.?identify/i, /gender/i, /disability status/i] },
  { step: "Review", patterns: [/^review$/i, /submit application/i, /^review and submit$/i] },
];

const SCORE_THRESHOLD = 1;

function visibleText(): string[] {
  const nodes = queryDeepAll(document.body, "h1, h2, h3, legend, [role='heading']");
  return nodes.map(textOf).filter(Boolean);
}

export function classifyCurrentStep(): { step: KnownStep; score: number } {
  const texts = visibleText();
  let best: { step: KnownStep; score: number } = { step: "Unknown", score: 0 };

  for (const sig of SIGNATURES) {
    let score = 0;
    for (const pattern of sig.patterns) {
      if (texts.some((t) => pattern.test(t))) score += 1;
    }
    if (score > best.score) best = { step: sig.step, score };
  }

  return best.score >= SCORE_THRESHOLD ? best : { step: "Unknown", score: 0 };
}
