import type { ReviewRow } from "../panel/panelTypes";

const RESOLVED = new Set<ReviewRow["status"]>(["applied", "kept-prefilled", "acknowledged"]);

export function isStepResolved(rows: ReviewRow[]): boolean {
  return rows.every((row) => RESOLVED.has(row.status));
}

export function computeSubmitReadiness(input: {
  currentStep: string;
  expectedSteps: string[];
  reviewedSteps: string[];
  hasErrors: boolean;
  hasUnresolvedRows: boolean;
  confirmed: boolean;
}): { ready: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (input.currentStep !== "Review") reasons.push("Open the Review step.");
  if (input.expectedSteps.some((step) => !input.reviewedSteps.includes(step))) reasons.push("Review every visited application step.");
  if (input.hasErrors) reasons.push("Resolve Workday validation errors.");
  if (input.hasUnresolvedRows) reasons.push("Resolve all suggested or failed fields.");
  if (!input.confirmed) reasons.push("Confirm the application is ready.");
  return { ready: reasons.length === 0, reasons };
}
