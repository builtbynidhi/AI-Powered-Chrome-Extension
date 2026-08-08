import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Workday Autofill Assistant",
  version: "0.1.0",
  description:
    "AI-assisted resume parsing and field mapping for Workday job applications. Fills forms only with your explicit confirmation before submission.",
  action: { default_popup: "src/popup/index.html" },
  background: { service_worker: "src/background/service-worker.ts", type: "module" },
  content_scripts: [
    {
      // The localhost pattern is a dev/test-only convenience so the Selenium
      // fixture harness (test-harness/) can exercise the real content script
      // against local Workday-DOM fixtures — see test-harness/README.md.
      matches: ["*://*.myworkdayjobs.com/*", "http://127.0.0.1/*"],
      js: ["src/content/index.ts"],
      run_at: "document_idle",
    },
  ],
  host_permissions: ["*://*.myworkdayjobs.com/*", "http://localhost:8000/*", "http://127.0.0.1/*"],
  permissions: ["storage"],
});
