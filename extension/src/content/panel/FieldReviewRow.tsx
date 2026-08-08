import type { ReviewRow } from "./panelTypes";

const STATUS_STYLE: Record<ReviewRow["status"], string> = {
  suggested: "border-amber-300 bg-amber-50",
  applied: "border-green-300 bg-green-50",
  failed: "border-red-300 bg-red-50",
  invalid: "border-red-300 bg-red-50",
  applying: "border-blue-300 bg-blue-50",
  untouched: "border-gray-200 bg-white",
  acknowledged: "border-green-300 bg-green-50",
  "kept-prefilled": "border-gray-200 bg-gray-50",
};

export default function FieldReviewRow({
  row,
  onAccept,
  onEdit,
  onAcknowledge,
}: {
  row: ReviewRow;
  onAccept: (fieldId: string) => void;
  onEdit: (fieldId: string, value: string) => void;
  onAcknowledge: (fieldId: string) => void;
}) {
  return (
    <div className={`border rounded px-2 py-1.5 text-xs space-y-1 ${STATUS_STYLE[row.status]}`}>
      <div className="flex justify-between items-start gap-2">
        <span className="font-medium truncate">{row.label}</span>
        {row.resolvedBy !== "kept-prefilled" && (
          <span className="shrink-0 text-[10px] px-1 rounded bg-white border">
            {Math.round(row.confidence * 100)}%
          </span>
        )}
      </div>
      <input
        value={row.value}
        onChange={(e) => onEdit(row.fieldId, e.target.value)}
        className="w-full text-xs border border-gray-300 rounded px-1 py-0.5"
      />
      {row.status === "kept-prefilled" && <p className="text-[10px] text-gray-500">Already filled — kept as-is.</p>}
      {row.status === "suggested" && (
        <div className="flex justify-between items-center">
          <p className="text-[10px] text-amber-700">Needs your review before autofill applies it.</p>
          <button onClick={() => onAccept(row.fieldId)} className="text-[10px] text-blue-600 underline">
            Apply
          </button>
        </div>
      )}
      {row.status === "failed" && <p className="text-[10px] text-red-700">Could not auto-fill — please fill manually.</p>}
      {row.validationError && <p className="text-[10px] text-red-700">Workday: {row.validationError}</p>}
      {row.sourceFacts && row.sourceFacts.length > 0 && (
        <p className="text-[10px] text-gray-600">Based on: {row.sourceFacts.join("; ")}</p>
      )}
      {(row.status === "failed" || row.status === "suggested") && (
        <button onClick={() => onAcknowledge(row.fieldId)} className="text-[10px] text-gray-600 underline">
          I completed this manually
        </button>
      )}
    </div>
  );
}
