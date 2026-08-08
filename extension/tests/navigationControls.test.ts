import { beforeEach, expect, it } from "vitest";
import { findForwardControl } from "../src/content/navigator/navigationControls";

beforeEach(() => document.body.innerHTML = "");

it("finds a visible enabled Next control", () => {
  document.body.innerHTML = `<button>Next</button>`;
  expect(findForwardControl(document.body)?.textContent).toBe("Next");
});

it.each(["Submit", "Sign In", "Create Account", "Log In"])("rejects %s", (label) => {
  document.body.innerHTML = `<button>${label}</button>`;
  expect(findForwardControl(document.body)).toBeNull();
});

it("rejects disabled controls", () => {
  document.body.innerHTML = `<button disabled>Continue</button>`;
  expect(findForwardControl(document.body)).toBeNull();
});
