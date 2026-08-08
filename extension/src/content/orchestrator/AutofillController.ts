// Wires Navigator -> Parser -> Mapper -> Filler and owns the review panel's
// state. This is the only module that decides when it's safe to click
// Workday's real Submit button — see submit() at the bottom.

import React from "react";
import ReactDOM from "react-dom/client";
import Panel from "../panel/Panel";
import { mountShadowRoot } from "../panel/useShadowRoot";
import type { PanelActions, PanelState, ReviewRow } from "../panel/panelTypes";
import { Navigator } from "../navigator/Navigator";
import type { KnownStep } from "../navigator/stepDetectors";
import { parseStep } from "../parser/FieldParser";
import type { ParsedField } from "../parser/FieldDescriptor";
import { mapFields } from "../mapper/MapperClient";
import { prepareFieldsForMapping } from "../mapper/prepareFields";
import { fillField } from "../filler/FieldFiller";
import { getResumeProfile, getResumeFile } from "../../shared/storage";
import type { MapperResult, ResumeProfile } from "../../shared/types";
import type { ResumeFile } from "../../shared/storage";
import { queryDeepAll, textOf } from "../dom/queryDeep";
import { dispatchClick } from "../filler/reactValueSetter";
import { computeSubmitReadiness, isStepResolved } from "./reviewPolicy";
import { findForwardControl } from "../navigator/navigationControls";
import { repeatableTargetCount } from "./repeatableQueue";
import { partitionAutofillFields } from "./autofillFieldGroups";
import { attachResumeFields, loadStoredAutofillData } from "./resumeAttachment";
import type { FillOutcome } from "../../shared/types";

const CONFIDENCE_AUTO_APPLY_THRESHOLD = 0.6;

export class AutofillController {
  private navigator: Navigator;
  private reactRoot: ReactDOM.Root | null = null;

  private parsedFields: ParsedField[] = [];
  private mappings = new Map<string, MapperResult>();
  private rowStatus = new Map<string, ReviewRow["status"]>();
  private validationErrors = new Map<string, string>();

  private resume: ResumeProfile | null = null;
  private resumeFile: ResumeFile | null = null;

  private visitedSteps = new Set<KnownStep>();
  private reviewedSteps = new Set<KnownStep>();
  private stepHadValidationError = new Map<KnownStep, boolean>();
  private confirmedCheckbox = false;
  private repeatableAdds = new Map<KnownStep, number>();

  private currentStep: KnownStep = "Unknown";
  private isMapping = false;
  private isFilling = false;

  constructor() {
    this.navigator = new Navigator((event) => this.onStepChange(event.step));
  }

  async start(): Promise<void> {
    const { mountPoint } = mountShadowRoot();
    this.reactRoot = ReactDOM.createRoot(mountPoint);
    this.resume = await getResumeProfile();
    this.resumeFile = await getResumeFile();
    this.navigator.start();
    this.render();
  }

  private async onStepChange(step: KnownStep): Promise<void> {
    this.currentStep = step;
    if (step !== "Unknown") this.visitedSteps.add(step);
    this.resume = await getResumeProfile(); // pick up a resume uploaded after page load
    this.mappings.clear();
    this.rowStatus.clear();
    this.validationErrors.clear();

    if (!this.resume) {
      this.parsedFields = [];
      this.render();
      return;
    }

    this.parsedFields = parseStep(step);
    for (const field of this.parsedFields) {
      if (field.isPrefilled) this.rowStatus.set(field.id, "kept-prefilled");
    }
    this.render();
  }

  private async autofillStep(): Promise<void> {
    const stored = await loadStoredAutofillData();
    this.resume = stored.resume;
    this.resumeFile = stored.resumeFile;
    if (!this.resume) return;
    const unresolvedFields = this.parsedFields.filter((field) => !field.isPrefilled);
    const { mappableFields, fileFields, repeatableFields } = partitionAutofillFields(unresolvedFields);

    this.isMapping = true;
    this.render();
    const preparedFields = await prepareFieldsForMapping(mappableFields);
    const entryIndex = this.repeatableAdds.get(this.currentStep) ?? 0;
    const mappingResume: ResumeProfile = this.currentStep === "My Experience"
      ? { ...this.resume, experience: this.resume.experience[entryIndex] ? [this.resume.experience[entryIndex]] : [] }
      : this.currentStep === "Education"
        ? { ...this.resume, education: this.resume.education[entryIndex] ? [this.resume.education[entryIndex]] : [] }
        : this.resume;
    const results = await mapFields(this.currentStep, preparedFields, mappingResume);
    for (const r of results) this.mappings.set(r.fieldId, r);
    this.isMapping = false;

    this.isFilling = true;
    this.render();
    const attachmentOutcomes = await attachResumeFields(fileFields, this.resumeFile);
    attachmentOutcomes.forEach((outcome) => this.recordOutcome(outcome));
    for (const field of mappableFields) {
      const mapping = this.mappings.get(field.id);
      if (!mapping) continue;
      if (mapping.confidence < CONFIDENCE_AUTO_APPLY_THRESHOLD || mapping.needsUserReview) {
        this.rowStatus.set(field.id, "suggested"); // shown, not applied — awaits explicit Accept
        continue;
      }
      await this.applyField(field, mapping.value);
    }
    const targetCount = repeatableTargetCount(this.currentStep, this.resume);
    const additions = this.repeatableAdds.get(this.currentStep) ?? 0;
    if (repeatableFields.length > 0 && additions < Math.max(0, targetCount - 1)) {
      await this.applyField(repeatableFields[0], "add");
      this.repeatableAdds.set(this.currentStep, additions + 1);
    } else {
      repeatableFields.forEach((field) => this.rowStatus.set(field.id, "acknowledged"));
    }
    this.isFilling = false;
    if (isStepResolved(this.buildRows())) this.reviewedSteps.add(this.currentStep);
    this.render();
  }

  private async applyField(field: ParsedField, value: string): Promise<void> {
    const outcome = await fillField(field, value, this.resumeFile);
    this.recordOutcome(outcome);
  }

  private recordOutcome(outcome: FillOutcome): void {
    this.rowStatus.set(outcome.fieldId, outcome.ok ? "applied" : "failed");
    if (outcome.validationError) {
      this.validationErrors.set(outcome.fieldId, outcome.validationError);
      this.stepHadValidationError.set(this.currentStep, true);
    } else if (outcome.ok) {
      this.validationErrors.delete(outcome.fieldId);
      this.stepHadValidationError.set(this.currentStep, this.validationErrors.size > 0);
    }
  }

  private async acceptRow(fieldId: string): Promise<void> {
    const field = this.parsedFields.find((f) => f.id === fieldId);
    const mapping = this.mappings.get(fieldId);
    if (!field || !mapping) return;
    await this.applyField(field, mapping.value);
    this.render();
  }

  private editRow(fieldId: string, value: string): void {
    const existing = this.mappings.get(fieldId);
    this.mappings.set(fieldId, {
      fieldId,
      value,
      confidence: 1,
      needsUserReview: true,
      resolvedBy: existing?.resolvedBy ?? "ai",
    });
    this.render();
  }

  private acknowledgeRow(fieldId: string): void {
    if (!this.parsedFields.some((field) => field.id === fieldId)) return;
    this.rowStatus.set(fieldId, "acknowledged");
    this.validationErrors.delete(fieldId);
    this.stepHadValidationError.set(this.currentStep, this.validationErrors.size > 0);
    if (isStepResolved(this.buildRows())) this.reviewedSteps.add(this.currentStep);
    this.confirmedCheckbox = false;
    this.render();
  }

  private computeSubmitReady(): boolean {
    const nonReviewSteps = [...this.visitedSteps].filter((s) => s !== "Review");
    return computeSubmitReadiness({
      currentStep: this.currentStep,
      expectedSteps: nonReviewSteps,
      reviewedSteps: [...this.reviewedSteps],
      hasErrors: [...this.stepHadValidationError.values()].some(Boolean),
      hasUnresolvedRows: this.currentStep !== "Review" && !isStepResolved(this.buildRows()),
      confirmed: true,
    }).ready;
  }

  private submit(): void {
    // Hard gate, re-checked here (never trusted to the UI alone): both
    // structural conditions plus the user's explicit checkbox must be true.
    if (!this.computeSubmitReady() || !this.confirmedCheckbox) return;
    const buttons = queryDeepAll(document.body, "button, [role='button']");
    const submitButton = buttons.find((b) => /^submit/i.test(textOf(b)));
    if (submitButton) dispatchClick(submitButton);
  }

  private continueToNextStep(): void {
    if (this.currentStep === "Unknown" || this.currentStep === "Review" || this.isMapping || this.isFilling) return;
    if (!isStepResolved(this.buildRows())) return;
    const control = findForwardControl(document.body);
    if (control) dispatchClick(control);
  }

  private buildRows(): ReviewRow[] {
    return this.parsedFields.map((field) => {
      const status = this.rowStatus.get(field.id);
      const mapping = this.mappings.get(field.id);

      if (status === "kept-prefilled") {
        return {
          fieldId: field.id,
          label: field.label,
          type: field.type,
          value: field.currentValue ?? "",
          confidence: 1,
          needsUserReview: false,
          resolvedBy: "kept-prefilled",
          status: "kept-prefilled",
          required: field.required,
        };
      }

      return {
        fieldId: field.id,
        label: field.label,
        type: field.type,
        value: mapping?.value ?? field.currentValue ?? "",
        confidence: mapping?.confidence ?? 0,
        needsUserReview: mapping?.needsUserReview ?? false,
        resolvedBy: mapping?.resolvedBy ?? "ai",
        status: status ?? "suggested",
        validationError: this.validationErrors.get(field.id),
        sourceFacts: mapping?.sourceFacts,
        required: field.required,
      };
    });
  }

  private render(): void {
    const state: PanelState = {
      step: this.currentStep,
      hasResume: this.resume !== null,
      rows: this.buildRows(),
      isMapping: this.isMapping,
      isFilling: this.isFilling,
      reviewedSteps: [...this.reviewedSteps],
      submitReady: this.computeSubmitReady(),
      canContinue: this.currentStep !== "Unknown" && this.currentStep !== "Review" && !this.isMapping && !this.isFilling && isStepResolved(this.buildRows()),
    };
    const actions: PanelActions = {
      onAutofillStep: () => void this.autofillStep(),
      onAcceptRow: (id) => void this.acceptRow(id),
      onEditRow: (id, value) => this.editRow(id, value),
      onConfirmToggle: (checked) => {
        this.confirmedCheckbox = checked;
      },
      onSubmit: () => this.submit(),
      onContinue: () => this.continueToNextStep(),
      onAcknowledgeRow: (id) => this.acknowledgeRow(id),
    };
    this.reactRoot?.render(React.createElement(Panel, { state, actions }));
  }
}
