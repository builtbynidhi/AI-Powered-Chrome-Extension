import { beforeEach, expect, it, vi } from "vitest";
import { mapFields } from "../src/content/mapper/MapperClient";
import type { FieldDescriptor, ResumeProfile } from "../src/shared/types";

const resume: ResumeProfile = { firstName: "Ada", lastName: "Lovelace", email: "ada@example.com", experience: [], education: [], skills: [], certifications: [], links: {} };
const base: FieldDescriptor = { id: "q", label: "Why this role?", labelSource: "aria-label", type: "textarea", required: true, currentValue: null, isPrefilled: false, containerStep: "Application Questions" };

beforeEach(() => {
  globalThis.chrome = { runtime: { sendMessage: vi.fn(async (message) => message.kind === "GENERATE_ANSWER" ? { kind: "GENERATE_ANSWER_OK", result: { fieldId: "q", value: "Grounded answer", confidence: .8, needsUserReview: true, resolvedBy: "ai" } } : { kind: "MAP_FIELDS_OK", results: [] }) } } as unknown as typeof chrome;
});

it("routes textareas through dedicated answer generation", async () => {
  const results = await mapFields("Application Questions", [base], resume);
  expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(expect.objectContaining({ kind: "GENERATE_ANSWER" }));
  expect(results[0].needsUserReview).toBe(true);
});

it("turns a rejected runtime message into a review-required result", async () => {
  vi.mocked(chrome.runtime.sendMessage).mockRejectedValueOnce(new Error("offline"));
  const result = await mapFields("Application Questions", [{ ...base, type: "text", label: "Custom question" }], resume);
  expect(result[0]).toMatchObject({ confidence: 0, needsUserReview: true });
});
