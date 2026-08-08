import { describe, it, expect, beforeEach } from "vitest";
import { parseStep } from "../src/content/parser/FieldParser";

describe("parseStep", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("does not parse job-search controls on an unknown non-application page", () => {
    document.body.innerHTML = `<input data-automation-id="keywordsSearchInput" />`;
    expect(parseStep("Unknown")).toEqual([]);
  });

  it("prioritizes data-automation-id over other label signals", () => {
    document.body.innerHTML = `<input data-automation-id="legalNameSection_firstName" />`;
    const [field] = parseStep("My Information");
    expect(field.label).toBe("legalNameSection_firstName");
    expect(field.labelSource).toBe("data-automation-id");
    expect(field.type).toBe("text");
  });

  it("resolves a <label for> association and detects a trailing-* required marker", () => {
    document.body.innerHTML = `
      <label for="phone">Phone Number*</label>
      <input id="phone" type="tel" />
    `;
    const [field] = parseStep("My Information");
    expect(field.label).toBe("Phone Number*");
    expect(field.labelSource).toBe("label-for");
    expect(field.required).toBe(true);
  });

  it("merges a month/day/year triplet into one date-segmented field", () => {
    document.body.innerHTML = `
      <fieldset>
        <legend>Date of Birth</legend>
        <input aria-label="Month" />
        <input aria-label="Day" />
        <input aria-label="Year" />
      </fieldset>
    `;
    const fields = parseStep("My Information");
    expect(fields).toHaveLength(1);
    expect(fields[0].type).toBe("date-segmented");
    expect(fields[0].label).toBe("Date of Birth");
    expect(fields[0].domRefs).toHaveLength(3);
  });

  it("merges date segments wrapped in separate nested divs", () => {
    document.body.innerHTML = `<fieldset><legend>Start Date</legend><div><input aria-label="Month" /></div><div><input aria-label="Day" /></div><div><input aria-label="Year" /></div></fieldset>`;
    const fields = parseStep("My Experience");
    expect(fields).toHaveLength(1);
    expect(fields[0].type).toBe("date-segmented");
  });

  it("detects a native date input", () => {
    document.body.innerHTML = `<label for="start">Start Date</label><input id="start" type="date" />`;
    const [field] = parseStep("My Experience");
    expect(field.label).toBe("Start Date");
    expect(field.type).toBe("text");
  });

  it("does not treat a custom-listbox placeholder as prefilled", () => {
    document.body.innerHTML = `<span id="question">Will you require sponsorship?</span><button aria-haspopup="listbox" aria-label="Select One Required" aria-labelledby="question">Select One</button>`;
    const [field] = parseStep("Application Questions");
    expect(field.label).toBe("Will you require sponsorship?");
    expect(field.currentValue).toBeNull();
    expect(field.isPrefilled).toBe(false);
  });

  it("reads a pill-style radiogroup via role/aria-checked, not visual styling", () => {
    document.body.innerHTML = `
      <div role="radiogroup" aria-label="Work authorization">
        <div role="radio" aria-checked="false">Yes</div>
        <div role="radio" aria-checked="true">No</div>
      </div>
    `;
    const [field] = parseStep("My Information");
    expect(field.type).toBe("radio-pill");
    expect(field.options).toEqual(["Yes", "No"]);
    expect(field.currentValue).toBe("No");
    expect(field.isPrefilled).toBe(true);
  });

  it("groups plain native <input type=radio> options into one field (regression: these were silently skipped entirely)", () => {
    document.body.innerHTML = `
      <p>Were you previously employed at Remitly?</p>
      <div>
        <label for="prev-yes"><input id="prev-yes" type="radio" name="prevEmployed" value="yes" /> Yes</label>
        <label for="prev-no"><input id="prev-no" type="radio" name="prevEmployed" value="no" checked /> No</label>
      </div>
    `;
    const fields = parseStep("My Information");
    expect(fields).toHaveLength(1);
    expect(fields[0].type).toBe("radio-pill");
    expect(fields[0].options).toEqual(["Yes", "No"]);
    expect(fields[0].currentValue).toBe("No");
    expect(fields[0].domRefs).toHaveLength(2);
  });

  it("ignores page-chrome controls outside the main application landmark", () => {
    document.body.innerHTML = `
      <header><button data-automation-id="utilityMenuButton">Settings</button></header>
      <main><input data-automation-id="email" /></main>
    `;
    const fields = parseStep("My Information");
    expect(fields).toHaveLength(1);
    expect(fields[0].label).toBe("email");
  });

  it("marks a field with an existing value as prefilled", () => {
    document.body.innerHTML = `<input data-automation-id="email" value="a@b.com" />`;
    const [field] = parseStep("My Information");
    expect(field.isPrefilled).toBe(true);
    expect(field.currentValue).toBe("a@b.com");
  });
});
