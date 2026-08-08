import { useEffect, useState } from "react";
import { getBackendUrl, setBackendUrl } from "../shared/storage";

export default function Settings() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    getBackendUrl().then(setUrl);
  }, []);

  async function onSave() {
    await setBackendUrl(url);
  }

  return (
    <div className="p-4 pt-0 space-y-2 border-t border-gray-200">
      <h2 className="text-xs font-semibold text-gray-500">Backend URL</h2>
      <div className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="text-xs border border-gray-300 rounded px-2 py-1 flex-1"
        />
        <button onClick={onSave} className="text-xs bg-gray-800 text-white rounded px-2 py-1">
          Save
        </button>
      </div>
    </div>
  );
}
