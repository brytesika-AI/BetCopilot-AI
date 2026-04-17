import { describe, expect, it } from "vitest";
import { runSyntheticEvalSuite } from "@betcopilot/evals";

describe("BetCopilot AI eval runner", () => {
  it("produces a summary and markdown report", async () => {
    const report = await runSyntheticEvalSuite({}, "synthetic-regression");

    expect(report.summary.totalCases).toBeGreaterThanOrEqual(25);
    expect(report.markdownSummary).toContain("BetCopilot AI Eval Summary");
    expect(report.markdownSummary).toContain("@BryteSikaStrategyAI");
  });
});
