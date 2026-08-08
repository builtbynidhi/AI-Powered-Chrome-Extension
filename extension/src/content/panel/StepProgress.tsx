import { KNOWN_STEPS } from "../navigator/stepDetectors";
import type { KnownStep } from "../navigator/stepDetectors";

export default function StepProgress({ step, reviewedSteps }: { step: KnownStep; reviewedSteps: KnownStep[] }) {
  return (
    <ol className="flex flex-wrap gap-1 text-[10px]">
      {KNOWN_STEPS.map((s) => {
        const isCurrent = s === step;
        const isDone = reviewedSteps.includes(s);
        return (
          <li
            key={s}
            className={
              "px-1.5 py-0.5 rounded " +
              (isCurrent ? "bg-blue-600 text-white" : isDone ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500")
            }
          >
            {s}
          </li>
        );
      })}
    </ol>
  );
}
