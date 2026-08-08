import { describe, expect, it } from "vitest";
import { computeSubmitReadiness, isStepResolved } from "../src/content/orchestrator/reviewPolicy";
import type { ReviewRow } from "../src/content/panel/panelTypes";

const row = (status: ReviewRow["status"]): ReviewRow => ({ fieldId: "x", label: "Name", type: "text", value: "Ada", confidence: 1, needsUserReview: status === "suggested", resolvedBy: "ai", status });

describe("review policy", () => {
  it.each(["suggested", "applying", "failed", "invalid"] as const)("blocks %s fields", (status) => {
    expect(isStepResolved([row(status)])).toBe(false);
  });
  it("allows only resolved fields", () => expect(isStepResolved([row("applied"), row("kept-prefilled")])).toBe(true));
  it("requires Review, resolved steps, no errors, and confirmation", () => {
    const base = { currentStep: "Review", expectedSteps: ["My Information"], reviewedSteps: ["My Information"], hasErrors: false, hasUnresolvedRows: false };
    expect(computeSubmitReadiness({ ...base, confirmed: false }).ready).toBe(false);
    expect(computeSubmitReadiness({ ...base, confirmed: true }).ready).toBe(true);
  });
});
