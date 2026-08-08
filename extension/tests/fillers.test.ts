import { describe, expect, it, vi } from "vitest";
import { setTextValue } from "../src/content/filler/setters/setTextValue";
import { setNativeSelectValue } from "../src/content/filler/setters/setListboxValue";
import { setSegmentedDate } from "../src/content/filler/setters/setSegmentedDate";
import { setFileUpload } from "../src/content/filler/setters/setFileUpload";

class TestDataTransfer {
  private filesArray: File[] = [];
  items = {
    add: (file: File) => {
      this.filesArray.push(file);
    },
  };
  get files(): FileList {
    return this.filesArray as unknown as FileList;
  }
}

describe("widget setters", () => {
  it("checks Workday validation after blur", async () => {
    const input = document.createElement("input");
    input.addEventListener("blur", () => input.setAttribute("aria-invalid", "true"));
    const result = await setTextValue(input, "Ada");
    expect(result.validationError).toBe("Workday flagged this field as invalid");
  });

  it("sets a native select through its own value setter", async () => {
    document.body.innerHTML = `<select><option value="">Choose</option><option value="yes">Yes</option></select>`;
    const select = document.querySelector("select")!;
    const result = await setNativeSelectValue(select, "Yes");
    expect(result.ok).toBe(true);
    expect(select.value).toBe("yes");
  });

  it("reports Workday validation for a native select", async () => {
    document.body.innerHTML = `<select aria-invalid="true"><option value="yes">Yes</option></select>`;
    const result = await setNativeSelectValue(document.querySelector("select")!, "Yes");
    expect(result.validationError).toBe("Workday flagged this field as invalid");
  });

  it("verifies every segmented-date input", async () => {
    const inputs = ["Month", "Day", "Year"].map((label) => {
      const input = document.createElement("input");
      input.setAttribute("aria-label", label);
      return input;
    });
    const result = await setSegmentedDate(inputs, "2026-08-07");
    expect(result.ok).toBe(true);
    expect(inputs.map((input) => input.value)).toEqual(["08", "07", "2026"]);
  });

  it("attaches the cached resume and emits bubbling browser events", async () => {
    vi.stubGlobal("DataTransfer", TestDataTransfer);
    const container = document.createElement("div");
    const input = document.createElement("input");
    input.type = "file";
    Object.defineProperty(input, "files", { value: [], writable: true });
    container.append(input);
    const events: string[] = [];
    container.addEventListener("input", () => events.push("input"));
    container.addEventListener("change", () => events.push("change"));

    const result = await setFileUpload(input, {
      fileName: "Nidhi_Resume.pdf",
      mimeType: "application/pdf",
      fileBase64: btoa("resume bytes"),
    });

    expect(result.ok).toBe(true);
    expect(input.files?.[0]?.name).toBe("Nidhi_Resume.pdf");
    expect(input.files?.[0]?.type).toBe("application/pdf");
    expect(input.files?.[0]?.size).toBe(12);
    expect(events).toEqual(["input", "change"]);
  });

  it("reports validation raised by Workday during file attachment", async () => {
    vi.stubGlobal("DataTransfer", TestDataTransfer);
    const input = document.createElement("input");
    input.type = "file";
    Object.defineProperty(input, "files", { value: [], writable: true });
    input.addEventListener("change", () => input.setAttribute("aria-invalid", "true"));

    const result = await setFileUpload(input, {
      fileName: "Nidhi_Resume.pdf",
      mimeType: "application/pdf",
      fileBase64: btoa("resume bytes"),
    });

    expect(result.validationError).toBe("Workday flagged this field as invalid");
  });
});
