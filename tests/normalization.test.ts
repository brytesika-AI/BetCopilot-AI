import { describe, expect, it } from "vitest";
import { footer, type ExtractedBetDraft } from "@betcopilot/core-schemas";
import { normalizeCandidate } from "@betcopilot/tools";

describe("BetCopilot AI normalization", () => {
  it("canonicalizes ML and team aliases", () => {
    const draft: ExtractedBetDraft = {
      candidateId: "cand_test",
      traceId: "trace_test",
      rawText: "Lakers ML",
      rawFragment: "Lakers ML",
      sourceType: "chat_text",
      sport: "basketball",
      league: "NBA",
      event: null,
      team: "Lakers",
      opponent: null,
      player: null,
      marketType: "ML",
      selection: "Lakers",
      betSide: "team",
      line: null,
      oddsText: null,
      confidence: 0.8,
      rationale: "Test draft",
      ambiguityFlags: [],
      footer
    };

    const normalized = normalizeCandidate(draft);
    expect(normalized.team).toBe("Los Angeles Lakers");
    expect(normalized.marketType).toBe("moneyline");
  });
});
