import type { FieldDescriptor } from "../../shared/types";

// Internal, content-script-only extension of FieldDescriptor that keeps the
// live DOM reference(s) needed by Filler. The plain FieldDescriptor (no DOM
// refs, JSON-serializable) is what actually crosses to the background worker.
export interface ParsedField extends FieldDescriptor {
  domRefs: Element[]; // 1 element normally, 3 for a segmented date, N for a pill group
}

export function toWireFormat(field: ParsedField): FieldDescriptor {
  const { domRefs: _domRefs, ...wire } = field;
  return wire;
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

function domPath(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  for (let depth = 0; depth < 8 && node; depth++) {
    const siblingIndex = node.parentElement
      ? [...node.parentElement.children].indexOf(node)
      : 0;
    parts.unshift(`${node.tagName}${siblingIndex}`);
    node = node.parentElement;
  }
  return parts.join(">");
}

export function makeFieldId(primaryEl: Element, label: string): string {
  return fnv1a(`${domPath(primaryEl)}::${label}`);
}
