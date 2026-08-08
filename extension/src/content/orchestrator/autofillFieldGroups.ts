import type { ParsedField } from "../parser/FieldDescriptor";

export interface AutofillFieldGroups {
  mappableFields: ParsedField[];
  fileFields: ParsedField[];
  repeatableFields: ParsedField[];
}

export function partitionAutofillFields(fields: ParsedField[]): AutofillFieldGroups {
  return {
    mappableFields: fields.filter((field) => field.type !== "file-upload" && field.type !== "repeatable-group"),
    fileFields: fields.filter((field) => field.type === "file-upload"),
    repeatableFields: fields.filter((field) => field.type === "repeatable-group"),
  };
}
