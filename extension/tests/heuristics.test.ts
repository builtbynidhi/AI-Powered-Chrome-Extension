import { describe, it, expect } from "vitest";
import { resolveHeuristically } from "../src/content/mapper/heuristics";
import type { FieldDescriptor, ResumeProfile } from "../src/shared/types";

const resume: ResumeProfile = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "+1234567890",
  location: { city: "London", state: "", country: "UK" },
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  links: { linkedin: "linkedin.com/in/ada" },
};

function field(label: string, type: FieldDescriptor["type"] = "text"): FieldDescriptor {
  return { id: "f1", label, labelSource: "aria-label", type, required: false, currentValue: null, isPrefilled: false, containerStep: "My Information" };
}

describe("resolveHeuristically", () => {
  it("resolves common label variants without calling the AI backend", () => {
    expect(resolveHeuristically(field("Given Name"), resume)?.value).toBe("Ada");
    expect(resolveHeuristically(field("E-mail Address"), resume)?.value).toBe("ada@example.com");
    expect(resolveHeuristically(field("LinkedIn Profile"), resume)?.value).toBe("linkedin.com/in/ada");
  });

  it("returns null for a field it can't confidently resolve, leaving it for the AI mapper", () => {
    expect(resolveHeuristically(field("Why do you want this role?"), resume)).toBeNull();
  });

  it("never resolves non-text field types (dates, choices, files) — those need widget-aware handling", () => {
    expect(resolveHeuristically(field("Given Name", "date-segmented"), resume)).toBeNull();
  });

  it("always returns full confidence and resolvedBy: heuristic when it does match", () => {
    const result = resolveHeuristically(field("Phone Number"), resume);
    expect(result?.confidence).toBe(1);
    expect(result?.resolvedBy).toBe("heuristic");
    expect(result?.needsUserReview).toBe(false);
  });

  it("never matches 'Phone Extension' against the phone rule (regression: was copying the phone number into it)", () => {
    expect(resolveHeuristically(field("Phone Extension"), resume)).toBeNull();
  });

  it("never matches 'Phone Device Type' against the phone rule", () => {
    expect(resolveHeuristically(field("Phone Device Type"), resume)).toBeNull();
  });

  it("strips a recognized country dial code from the phone value (Workday's Phone Number field expects local digits when paired with a separate Country Phone Code selector)", () => {
    const indiaResume: ResumeProfile = { ...resume, phone: "+917758810269", location: { city: "Pune", state: "Maharashtra", country: "India" } };
    const result = resolveHeuristically(field("Phone Number"), indiaResume);
    expect(result?.value).toBe("7758810269");
  });

  it("leaves the phone unchanged when it doesn't actually start with the country's dial code, rather than guessing wrong", () => {
    const result = resolveHeuristically(field("Phone Number"), resume); // resume.phone doesn't start with UK's "+44"
    expect(result?.value).toBe(resume.phone);
  });
});
