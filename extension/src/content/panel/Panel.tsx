import type { PanelActions, PanelState } from "./panelTypes";
import StepProgress from "./StepProgress";
import FieldReviewRow from "./FieldReviewRow";
import SubmitGate from "./SubmitGate";

export default function Panel({ state, actions }: { state: PanelState; actions: PanelActions }) {
  return (
    <div className="w-80 max-h-[80vh] flex flex-col bg-white border border-gray-300 shadow-xl rounded-bl-lg font-sans text-gray-900">
      <div className="p-3 space-y-2 border-b border-gray-200">
        <h1 className="text-sm font-semibold">Workday Autofill Assistant</h1>
        <StepProgress step={state.step} reviewedSteps={state.reviewedSteps} />
      </div>

      {!state.hasResume && (
        <p className="p-3 text-xs text-gray-600">Upload your resume from the extension popup to get started.</p>
      )}

      {state.hasResume && (
        <>
          <div className="p-3">
            <button
              onClick={actions.onAutofillStep}
              disabled={state.step === "Unknown" || state.isMapping || state.isFilling}
              className="w-full text-xs rounded py-1.5 bg-gray-900 text-white disabled:bg-gray-300"
            >
              {state.step === "Unknown" ? "Open or continue an application" : state.isMapping ? "Analyzing fields…" : state.isFilling ? "Filling…" : `Autofill: ${state.step}`}
            </button>
            {state.step !== "Review" && (
              <button
                onClick={actions.onContinue}
                disabled={!state.canContinue}
                className="w-full mt-2 text-xs rounded py-1.5 bg-blue-600 text-white disabled:bg-gray-300"
              >
                Continue to next step
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
            {state.rows.map((row) => (
              <FieldReviewRow key={row.fieldId} row={row} onAccept={actions.onAcceptRow} onEdit={actions.onEditRow} onAcknowledge={actions.onAcknowledgeRow} />
            ))}
            {state.rows.length === 0 && !state.isMapping && (
              <p className="text-xs text-gray-400">No fields detected on this step yet.</p>
            )}
          </div>

          {state.step === "Review" && (
            <SubmitGate submitReady={state.submitReady} onConfirmToggle={actions.onConfirmToggle} onSubmit={actions.onSubmit} />
          )}
        </>
      )}
    </div>
  );
}
