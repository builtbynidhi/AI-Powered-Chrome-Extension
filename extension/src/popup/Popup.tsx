import ResumeUpload from "./ResumeUpload";
import Settings from "./Settings";

export default function Popup() {
  return (
    <div className="font-sans">
      <ResumeUpload />
      <Settings />
      <p className="px-4 pb-3 text-[10px] text-gray-400">
        Open a Workday application page to see the review panel and start autofill.
      </p>
    </div>
  );
}
