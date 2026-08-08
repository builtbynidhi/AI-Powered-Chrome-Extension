export class RepeatableQueue<T> {
  private index = 0;
  constructor(private readonly entries: readonly T[]) {}
  peek(): T | undefined { return this.entries[this.index]; }
  advance(): void { if (!this.done) this.index += 1; }
  get done(): boolean { return this.index >= this.entries.length; }
}

export function repeatableTargetCount(
  step: string,
  resume: { experience: readonly unknown[]; education: readonly unknown[] },
): number {
  if (step === "My Experience") return resume.experience.length;
  if (step === "Education") return resume.education.length;
  return 0;
}
