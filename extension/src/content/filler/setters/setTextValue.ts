import { setNativeInputValue, dispatchBlur } from "../reactValueSetter";
import { setAndVerify, type SetAndVerifyResult } from "../verify";

export async function setTextValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): Promise<SetAndVerifyResult> {
  const result = await setAndVerify(
    () => {
      setNativeInputValue(el, value);
      dispatchBlur(el);
    },
    () => el.value,
    value,
    el,
  );
  return result;
}
