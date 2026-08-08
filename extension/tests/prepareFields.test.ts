import { expect, it } from "vitest";
import { prepareFieldsForMapping } from "../src/content/mapper/prepareFields";
import type { ParsedField } from "../src/content/parser/FieldDescriptor";

it("opens a lazy listbox and captures its options", async () => {
  const trigger = document.createElement("button");
  trigger.addEventListener("click", () => {
    document.body.insertAdjacentHTML("beforeend", `<div role="option">Yes</div><div role="option">No</div>`);
  });
  document.body.appendChild(trigger);
  const field: ParsedField = { id: "x", label: "Choice", labelSource: "aria-label", type: "listbox-custom", options: [], optionsLoadStrategy: "lazy", required: true, currentValue: null, isPrefilled: false, containerStep: "Questions", domRefs: [trigger] };
  const [wire] = await prepareFieldsForMapping([field], { pollMs: 1, timeoutMs: 20 });
  expect(wire.options).toEqual(["Yes", "No"]);
});
