import { beforeEach, describe, expect, it, vi } from "vitest";
import { attachResumeFields, loadStoredAutofillData } from "../src/content/orchestrator/resumeAttachment";
import type { ParsedField } from "../src/content/parser/FieldDescriptor";
import type { ResumeFile } from "../src/shared/storage";
import type { ResumeProfile } from "../src/shared/types";

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

const resume: ResumeProfile = {
  firstName: "Nidhi",
  lastName: "Kumari",
  email: "nidhi@example.com",
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  links: {},
};

const resumeFile: ResumeFile = {
  fileName: "Nidhi_Resume.pdf",
  mimeType: "application/pdf",
  fileBase64: btoa("resume bytes"),
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal("DataTransfer", TestDataTransfer);
});

describe("resume attachment orchestration", () => {
  it("loads the latest profile and cached file together", async () => {
    const get = vi.fn(async (key: string) => ({
      [key]: key === "workday_autofill_resume_profile" ? resume : resumeFile,
    }));
    vi.stubGlobal("chrome", { storage: { local: { get } } });

    await expect(loadStoredAutofillData()).resolves.toEqual({ resume, resumeFile });
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("attaches the cached file through the real file filler", async () => {
    const input = document.createElement("input");
    input.type = "file";
    Object.defineProperty(input, "files", { value: [], writable: true });
    const field: ParsedField = {
      id: "resume-upload",
      label: "Upload a file",
      labelSource: "label-for",
      type: "file-upload",
      required: true,
      currentValue: null,
      isPrefilled: false,
      containerStep: "My Experience",
      domRefs: [input],
    };

    const outcomes = await attachResumeFields([field], resumeFile);

    expect(outcomes).toEqual([{ fieldId: "resume-upload", ok: true, validationError: undefined }]);
    expect(input.files?.[0]?.name).toBe("Nidhi_Resume.pdf");
  });
});
