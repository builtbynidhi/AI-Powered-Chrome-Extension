import type { KnownStep } from "../navigator/stepDetectors";
import type { MapperResult } from "../../shared/types";

export interface ReviewRow {
  fieldId: string;
  label: string;
  type: string;
  value: string;
  confidence: number;
  needsUserReview: boolean;
  resolvedBy: MapperResult["resolvedBy"] | "kept-prefilled";
  status: "untouched" | "suggested" | "applying" | "applied" | "failed" | "invalid" | "acknowledged" | "kept-prefilled";
  validationError?: string;
  sourceFacts?: string[];
  required?: boolean;
}

export interface PanelState {
  step: KnownStep;
  hasResume: boolean;
  rows: ReviewRow[];
  isMapping: boolean;
  isFilling: boolean;
  reviewedSteps: KnownStep[];
  submitReady: boolean; // reviewedAllSteps && noUnresolvedValidationErrors — computed, never set by AI
  canContinue: boolean;
}

export interface PanelActions {
  onAutofillStep: () => void;
  onAcceptRow: (fieldId: string) => void;
  onEditRow: (fieldId: string, value: string) => void;
  onConfirmToggle: (checked: boolean) => void;
  onSubmit: () => void;
  onContinue: () => void;
  onAcknowledgeRow: (fieldId: string) => void;
}
