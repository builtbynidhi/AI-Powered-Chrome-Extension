import type { FillOutcome } from "../../shared/types";
import type { ParsedField } from "../parser/FieldDescriptor";
import type { ResumeFile } from "../../shared/storage";
import { setTextValue } from "./setters/setTextValue";
import { setNativeSelectValue, setCustomListboxValue } from "./setters/setListboxValue";
import { setSegmentedDate } from "./setters/setSegmentedDate";
import { setPillChoice, setNativeRadioGroup } from "./setters/setPillChoice";
import { setFileUpload } from "./setters/setFileUpload";
import { clickAdd } from "../parser/widgets/repeatableSection";

/**
 * Fills one field with one value. Never called for a field the caller hasn't
 * already decided should be applied (that policy — prefilled skip, confidence
 * gate — lives in the Mapper/orchestrator, not here). This module's only job
 * is "given a field and a value, get it into the DOM correctly."
 */
export async function fillField(field: ParsedField, value: string, resumeFile: ResumeFile | null): Promise<FillOutcome> {
  const [primary] = field.domRefs;

  switch (field.type) {
    case "text":
    case "textarea": {
      const result = await setTextValue(primary as HTMLInputElement | HTMLTextAreaElement, value);
      return { fieldId: field.id, ok: result.ok, validationError: result.validationError };
    }
    case "select-native": {
      const result = await setNativeSelectValue(primary as HTMLSelectElement, value);
      return { fieldId: field.id, ok: result.ok, validationError: result.validationError };
    }
    case "listbox-custom": {
      const result = await setCustomListboxValue(primary, value);
      return { fieldId: field.id, ok: result.ok, validationError: result.validationError };
    }
    case "date-segmented": {
      const result = await setSegmentedDate(field.domRefs as HTMLInputElement[], value);
      return { fieldId: field.id, ok: result.ok, validationError: result.validationError };
    }
    case "radio-pill":
    case "checkbox-pill": {
      // Two possible shapes: a plain native <input type=radio> group (one
      // domRef per option — see nativeChoice.ts) or an ARIA pill group (one
      // domRef: the role="radiogroup"/"group" container — see pillChoice.ts).
      const result =
        field.domRefs.length > 1 && field.domRefs[0] instanceof HTMLInputElement
          ? await setNativeRadioGroup(field.domRefs as HTMLInputElement[], value)
          : await setPillChoice(primary, value);
      return { fieldId: field.id, ok: result.ok, validationError: result.validationError };
    }
    case "file-upload": {
      if (!resumeFile) return { fieldId: field.id, ok: false, validationError: "No resume file cached" };
      const result = await setFileUpload(primary as HTMLInputElement, resumeFile);
      return { fieldId: field.id, ok: result.ok, validationError: result.validationError };
    }
    case "repeatable-group": {
      clickAdd(primary as HTMLButtonElement);
      return { fieldId: field.id, ok: true };
    }
  }
}
