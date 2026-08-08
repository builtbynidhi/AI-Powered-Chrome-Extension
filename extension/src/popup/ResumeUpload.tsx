import { useEffect, useState } from "react";
import type { ResumeProfile } from "../shared/types";
import type { ExtensionResponse } from "../shared/messages";
import { getResumeProfile, setResumeProfile, clearResumeProfile, setResumeFile } from "../shared/storage";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ResumeUpload() {
  const [resume, setResume] = useState<ResumeProfile | null>(null);
  const [status, setStatus] = useState<"idle" | "parsing" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    getResumeProfile().then(setResume);
  }, []);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("parsing");
    setError("");
    try {
      const fileBase64 = await fileToBase64(file);
      const response = (await chrome.runtime.sendMessage({
        kind: "PARSE_RESUME",
        fileName: file.name,
        fileBase64,
        mimeType: file.type,
      })) as ExtensionResponse;
      if (response.kind === "ERROR") throw new Error(response.message);
      if (response.kind !== "PARSE_RESUME_OK") throw new Error("Unexpected response");
      await setResumeFile({ fileName: file.name, mimeType: file.type, fileBase64 });
      await setResumeProfile(response.resume);
      setResume(response.resume);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function onClear() {
    await clearResumeProfile();
    setResume(null);
  }

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-sm font-semibold">Resume</h1>
      {!resume && (
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={onFileChange}
          className="text-xs"
        />
      )}
      {status === "parsing" && <p className="text-xs text-gray-500">Parsing resume…</p>}
      {status === "error" && <p className="text-xs text-red-600">{error}</p>}
      {resume && (
        <div className="text-xs space-y-1">
          <p className="font-medium">
            {resume.firstName} {resume.lastName}
          </p>
          <p className="text-gray-600">{resume.email}</p>
          <p className="text-gray-600">
            {resume.experience.length} experience entr{resume.experience.length === 1 ? "y" : "ies"} ·{" "}
            {resume.education.length} education entr{resume.education.length === 1 ? "y" : "ies"} ·{" "}
            {resume.skills.length} skills
          </p>
          <button onClick={onClear} className="text-blue-600 underline">
            Replace resume
          </button>
        </div>
      )}
    </div>
  );
}
