import { describe, expect, it } from "vitest";
import { footer, type BetCandidate } from "@betcopilot/core-schemas";
import { getLiveOdds, resolveSportEvent } from "@betcopilot/tools";

describe("BetCopilot AI odds provider", () => {
  it("resolves seeded events and returns matched odds", async () => {
    const candidate: BetCandidate = {
      candidateId: "cand_1",
      traceId: "trace_1",
      rawText: "LeBron over 27.5 points and Lakers moneyline tonight",
      sourceType: "chat_text",
      sport: "basketball",
      league: "NBA",
      event: "Los Angeles Lakers vs Golden State Warriors",
      team: "Los Angeles Lakers",
      opponent: "Golden State Warriors",
      player: "LeBron James",
      marketType: "player_points_over",
      selection: "LeBron James",
      betSide: "over",
      line: 27.5,
      oddsText: null,
      confidence: 0.88,
      rationale: "Test",
      ambiguityFlags: [],
      normalizationNotes: [],
      footer
    };

    const resolution = await resolveSportEvent(candidate, {});
    const odds = await getLiveOdds(candidate, resolution, {});

    expect(resolution.status).not.toBe("unresolved");
    expect(odds.markets.some((market) => market.selection === "LeBron James")).toBe(true);
  });
});
