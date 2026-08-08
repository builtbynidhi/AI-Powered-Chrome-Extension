// Sole network egress point for the extension. The content script (isolated
// world, runs on the Workday page) sends typed messages here rather than
// calling fetch() itself — keeps the backend URL/key handling in one place
// and gives us a single spot to audit for "does this ever touch the network."

import type { ExtensionMessage, ExtensionResponse } from "../shared/messages";
import { parseResume, mapFields, generateAnswer } from "./backendClient";

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  handle(message)
    .then(sendResponse)
    .catch((err: Error) => sendResponse({ kind: "ERROR", message: err.message } satisfies ExtensionResponse));
  return true; // keep the message channel open for the async response
});

async function handle(message: ExtensionMessage): Promise<ExtensionResponse> {
  switch (message.kind) {
    case "PARSE_RESUME": {
      const { resume } = await parseResume(message.fileBase64, message.fileName, message.mimeType);
      return { kind: "PARSE_RESUME_OK", resume };
    }
    case "MAP_FIELDS": {
      const { results } = await mapFields(message.step, message.fields, message.resume);
      return { kind: "MAP_FIELDS_OK", results };
    }
    case "GENERATE_ANSWER": {
      const { result } = await generateAnswer(message.field, message.resume);
      return { kind: "GENERATE_ANSWER_OK", result };
    }
  }
}
