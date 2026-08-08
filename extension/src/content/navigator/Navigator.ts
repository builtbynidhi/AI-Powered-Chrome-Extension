import { watchForSettle } from "./mutationDebouncer";
import { classifyCurrentStep, type KnownStep } from "./stepDetectors";
import { queryDeepAll } from "../dom/queryDeep";

export interface StepChangeEvent {
  step: KnownStep;
  possiblyIncomplete: boolean;
}

function isPageLoading(): boolean {
  return queryDeepAll(document.body, "[aria-busy='true'], [data-automation-id='loadingSpinner']").length > 0;
}

export class Navigator {
  private currentStep: KnownStep = "Unknown";
  private stopWatching: (() => void) | null = null;

  constructor(private onStepChange: (event: StepChangeEvent) => void) {}

  start(): void {
    this.watch();
  }

  stop(): void {
    this.stopWatching?.();
  }

  getCurrentStep(): KnownStep {
    return this.currentStep;
  }

  private watch(): void {
    this.stopWatching = watchForSettle(
      document.body,
      ({ timedOut }) => {
        const { step } = classifyCurrentStep();
        this.currentStep = step;
        this.onStepChange({ step, possiblyIncomplete: timedOut });
        this.watch(); // re-arm for the next transition
      },
      { isLoading: isPageLoading },
    );
  }
}
