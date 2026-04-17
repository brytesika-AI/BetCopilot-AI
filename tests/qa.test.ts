import { describe, expect, it } from "vitest";
import { footer, type BetCandidate, type EventResolution, type OddsSnapshot } from "@betcopilot/core-schemas";
import { validateBetCandidate } from "@betcopilot/qa";

describe("BetCopilot AI QA", () => {
  it("warns when odds do not match the extracted market", () => {
    const candidate: BetCandidate = {
      candidateId: "cand_1",
      traceId: "trace_1",
      rawText: "Lakers -4.5",
      sourceType: "chat_text",
      sport: "basketball",
      league: "NBA",
      event: "Los Angeles Lakers vs Golden State Warriors",
      team: "Los Angeles Lakers",
      opponent: "Golden State Warriors",
      player: null,
      marketType: "point_spread",
      selection: "Los Angeles Lakers",
      betSide: "team",
      line: -4.5,
      oddsText: null,
      confidence: 0.8,
      rationale: "Test",
      ambiguityFlags: [],
      normalizationNotes: [],
      footer
    };

    const resolution: EventResolution = {
      candidateId: "cand_1",
      status: "resolved",
      provider: "SeededDemoSportsbookFeed",
      eventId: "event_1",
      matchedEvent: "Los Angeles Lakers vs Golden State Warriors",
      sport: "basketball",
      league: "NBA",
      team: "Los Angeles Lakers",
      opponent: "Golden State Warriors",
      commenceTime: "2026-04-17T23:30:00.000Z",
      confidence: 0.9,
      issues: [],
      footer
    };

    const odds: OddsSnapshot = {
      candidateId: "cand_1",
      status: "partial",
      provider: "SeededDemoSportsbookFeed",
      eventId: "event_1",
      matchedMarket: false,
      markets: [],
      issues: ["market_not_found"],
      footer
    };

    const qa = validateBetCandidate(candidate, resolution, odds, 0.62);
    expect(qa.status).toBe("warning");
    expect(qa.flags).toContain("market_mismatch");
  });
});
