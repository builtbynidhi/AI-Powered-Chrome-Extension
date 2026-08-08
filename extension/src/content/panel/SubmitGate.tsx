import { useState } from "react";

export default function SubmitGate({
  submitReady,
  onConfirmToggle,
  onSubmit,
}: {
  submitReady: boolean;
  onConfirmToggle: (checked: boolean) => void;
  onSubmit: () => void;
}) {
  const [checked, setChecked] = useState(false);

  function toggle(next: boolean) {
    setChecked(next);
    onConfirmToggle(next);
  }

  const canSubmit = submitReady && checked;

  return (
    <div className="border-t border-gray-200 p-3 space-y-2">
      {!submitReady && (
        <p className="text-[10px] text-amber-700">
          Revisit any step with unresolved or flagged fields before you can submit.
        </p>
      )}
      <label className="flex items-start gap-2 text-xs">
        <input type="checkbox" checked={checked} onChange={(e) => toggle(e.target.checked)} disabled={!submitReady} />
        <span>I've reviewed every step and confirm this application is ready to submit.</span>
      </label>
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full text-xs rounded py-1.5 bg-blue-600 text-white disabled:bg-gray-300"
      >
        Submit application
      </button>
    </div>
  );
}
