import { expect, it } from "vitest";
import { RepeatableQueue, repeatableTargetCount } from "../src/content/orchestrator/repeatableQueue";

it("advances one repeatable resume entry at a time", () => {
  const queue = new RepeatableQueue(["first", "second"]);
  expect(queue.peek()).toBe("first");
  queue.advance();
  expect(queue.peek()).toBe("second");
  queue.advance();
  expect(queue.done).toBe(true);
  expect(queue.peek()).toBeUndefined();
});

it("uses resume entry counts only on matching steps", () => {
  expect(repeatableTargetCount("My Experience", { experience: [1, 2], education: [1] })).toBe(2);
  expect(repeatableTargetCount("Education", { experience: [1], education: [1, 2, 3] })).toBe(3);
  expect(repeatableTargetCount("Application Questions", { experience: [1], education: [1] })).toBe(0);
});
