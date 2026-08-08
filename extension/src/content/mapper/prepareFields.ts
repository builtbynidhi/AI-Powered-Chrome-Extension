import type { FieldDescriptor } from "../../shared/types";
import { queryDeepAll, textOf } from "../dom/queryDeep";
import { dispatchClick } from "../filler/reactValueSetter";
import { toWireFormat, type ParsedField } from "../parser/FieldDescriptor";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function prepareFieldsForMapping(
  fields: ParsedField[],
  { pollMs = 50, timeoutMs = 1500 } = {},
): Promise<FieldDescriptor[]> {
  const prepared: FieldDescriptor[] = [];
  for (const field of fields) {
    const wire = toWireFormat(field);
    if (field.type === "listbox-custom" && field.optionsLoadStrategy === "lazy") {
      dispatchClick(field.domRefs[0]);
      const deadline = Date.now() + timeoutMs;
      let options: string[] = [];
      while (Date.now() < deadline) {
        options = [...new Set(queryDeepAll(document.body, "[role='option']").map(textOf).filter(Boolean))];
        if (options.length) break;
        await sleep(pollMs);
      }
      wire.options = options;
      field.options = options;
      field.domRefs[0].dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    }
    prepared.push(wire);
  }
  return prepared;
}
