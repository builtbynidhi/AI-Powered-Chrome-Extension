// Workday's frontend is React. Setting `el.value = x` directly is ignored
// because React wraps the native value setter to intercept writes — so we
// grab the *native* setter off the prototype, call that, then dispatch the
// same event sequence Workday's own validation listens to (input/change,
// then blur since a lot of Workday validation is blur-triggered).

export function setNativeInputValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

export function dispatchBlur(el: Element): void {
  el.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
}

export function dispatchClick(el: Element): void {
  el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  (el as HTMLElement).click();
}
