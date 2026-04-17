import { betCandidateSchema, footer, type BetCandidate, type ExtractedBetDraft } from "@betcopilot/core-schemas";
import { findPlayerReference, findTeamReference } from "@betcopilot/shared";

const normalizeMarketType = (draft: ExtractedBetDraft): BetCandidate["marketType"] => {
  const market = draft.marketType.toLowerCase();
  const side = draft.betSide.toLowerCase();

  if (market.includes("btts") || market.includes("both teams to score")) {
    return "both_teams_to_score";
  }
  if (draft.player) {
    if (market.includes("passing touchdowns") || market.includes("pass tds") || market.includes("td")) {
      return side === "under" ? "player_passing_touchdowns_under" : "player_passing_touchdowns_over";
    }
    if (market.includes("rebounds") || market.includes("boards")) {
      return side === "under" ? "player_rebounds_under" : "player_rebounds_over";
    }
    if (market.includes("assists")) {
      return side === "under" ? "player_assists_under" : "player_assists_over";
    }
    if (market.includes("points") || market.includes("pts")) {
      return side === "under" ? "player_points_under" : "player_points_over";
    }
  }
  if (market.includes("spread") || draft.line !== null) {
    return "point_spread";
  }
  if (market.includes("moneyline") || market.includes("ml") || market.includes("to win")) {
    return "moneyline";
  }
  return "unknown";
};

const normalizeBetSide = (draft: ExtractedBetDraft): BetCandidate["betSide"] => {
  const side = draft.betSide.toLowerCase();
  if (side === "over") return "over";
  if (side === "under") return "under";
  if (side === "yes") return "yes";
  if (side === "no") return "no";
  if (draft.player) return "player";
  if (draft.team) return "team";
  return "unknown";
};

const parseOddsText = (value: string | null) => {
  if (!value) return null;
  const match = value.match(/([+-]\d{3,4})/);
  return match?.[1] ?? null;
};

export const normalizeCandidate = (draft: ExtractedBetDraft): BetCandidate => {
  const teamRef = draft.team ? findTeamReference(draft.team) : null;
  const opponentRef = draft.opponent ? findTeamReference(draft.opponent) : null;
  const playerRef = draft.player ? findPlayerReference(draft.player) : null;
  const marketType = normalizeMarketType(draft);
  const team = teamRef?.canonical ?? playerRef?.team ?? draft.team;
  const opponent = opponentRef?.canonical ?? draft.opponent;
  const sport = draft.sport ?? playerRef?.sport ?? teamRef?.sport ?? opponentRef?.sport ?? "unknown";
  const league = draft.league ?? playerRef?.league ?? teamRef?.league ?? opponentRef?.league ?? "unknown";
  const selection =
    marketType === "both_teams_to_score"
      ? draft.selection ?? "Yes"
      : playerRef?.canonical ?? team ?? draft.selection;

  const normalizationNotes = [
    teamRef ? "team_alias_normalized" : null,
    opponentRef ? "opponent_alias_normalized" : null,
    playerRef ? "player_alias_normalized" : null,
    parseOddsText(draft.oddsText) ? "odds_text_cleaned" : null,
    marketType !== "unknown" ? `market_canonical:${marketType}` : null
  ].filter((value): value is string => Boolean(value));

  const ambiguityFlags = [...draft.ambiguityFlags];
  if (sport === "unknown") {
    ambiguityFlags.push("unsupported_sport");
  }
  if (!opponent && marketType !== "both_teams_to_score") {
    ambiguityFlags.push("ambiguous_event");
  }
  if (draft.line === null && ["point_spread", "player_points_over", "player_points_under", "player_rebounds_over", "player_rebounds_under", "player_assists_over", "player_assists_under", "player_passing_touchdowns_over", "player_passing_touchdowns_under"].includes(marketType)) {
    ambiguityFlags.push("missing_line");
  }

  return betCandidateSchema.parse({
    candidateId: draft.candidateId,
    traceId: draft.traceId,
    rawText: draft.rawText,
    sourceType: draft.sourceType,
    sport,
    league,
    event: team && opponent ? `${team} vs ${opponent}` : draft.event,
    team: team ?? null,
    opponent: opponent ?? null,
    player: playerRef?.canonical ?? draft.player,
    marketType,
    selection,
    betSide: normalizeBetSide(draft),
    line: draft.line,
    oddsText: parseOddsText(draft.oddsText),
    confidence: ambiguityFlags.length === 0 ? draft.confidence : Math.max(0.35, draft.confidence - 0.08 * ambiguityFlags.length),
    rationale: draft.rationale,
    ambiguityFlags: Array.from(new Set(ambiguityFlags)),
    normalizationNotes,
    footer
  });
};

export const normalizeCandidates = (drafts: ExtractedBetDraft[]) => drafts.map(normalizeCandidate);
