import { describe, expect, it } from "vitest";
import { normalizeInput } from "@betcopilot/ingestion";
import { createStructuredModel, extractBetDrafts } from "@betcopilot/llm";
import { normalizeCandidates } from "@betcopilot/tools";

describe("BetCopilot AI extraction", () => {
  it("extracts multiple candidates from one input", async () => {
    const ingestion = normalizeInput({
      rawText: "LeBron over 27.5 points and Lakers moneyline tonight",
      sourceType: "chat_text",
      sourceMetadata: {}
    });

    const model = createStructuredModel({
      provider: "deterministic",
      modelName: "rule-based-mvp",
      mockMode: true,
      maxRetries: 1
    });

    const drafts = await extractBetDrafts(model, ingestion);
    const normalized = normalizeCandidates(drafts);

    expect(drafts).toHaveLength(2);
    expect(normalized.map((candidate) => candidate.marketType)).toEqual(
      expect.arrayContaining(["player_points_over", "moneyline"])
    );
  });
});
