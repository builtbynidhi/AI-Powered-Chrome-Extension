import { describe, expect, it } from "vitest";
import { partitionAutofillFields } from "../src/content/orchestrator/autofillFieldGroups";
import type { ParsedField } from "../src/content/parser/FieldDescriptor";

function field(type: ParsedField["type"], id: string): ParsedField {
  return {
    id,
    label: id,
    labelSource: "proximity",
    type,
    required: false,
    currentValue: null,
    isPrefilled: false,
    containerStep: "My Experience",
    domRefs: [document.createElement(type === "file-upload" ? "input" : "div")],
  };
}

describe("partitionAutofillFields", () => {
  it("keeps deterministic uploads out of AI mapping", () => {
    const text = field("text", "title");
    const upload = field("file-upload", "resume");
    const repeatable = field("repeatable-group", "experience-add");

    const result = partitionAutofillFields([text, upload, repeatable]);

    expect(result.mappableFields).toEqual([text]);
    expect(result.fileFields).toEqual([upload]);
    expect(result.repeatableFields).toEqual([repeatable]);
  });
});
