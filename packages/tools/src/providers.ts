import {
  eventResolutionSchema,
  footer,
  oddsSnapshotSchema,
  type BetCandidate,
  type EventResolution,
  type OddsSnapshot
} from "@betcopilot/core-schemas";
import { nowIso, normalizeTokenText, withBackoff } from "@betcopilot/shared";
import { SEEDED_EVENTS, type SeededEvent } from "./catalog";

export interface OddsProvider {
  name: string;
  resolveEvent(candidate: BetCandidate): Promise<EventResolution>;
  getOdds(candidate: BetCandidate, resolution: EventResolution): Promise<OddsSnapshot>;
}

export interface OddsProviderEnv {
  ODDS_API_BASE_URL?: string;
  ODDS_API_KEY?: string;
  FEATURE_ENABLE_REAL_ODDS_PROVIDER?: string;
  fetcher?: typeof fetch;
}

const eventMatchesCandidate = (event: SeededEvent, candidate: BetCandidate) => {
  const teamMatch = candidate.team
    ? [event.homeTeam, event.awayTeam].some((team) => normalizeTokenText(team) === normalizeTokenText(candidate.team ?? ""))
    : candidate.player
      ? normalizeTokenText(candidate.team ?? "") === normalizeTokenText(event.homeTeam) ||
        normalizeTokenText(candidate.team ?? "") === normalizeTokenText(event.awayTeam)
      : false;
  const opponentMatch = candidate.opponent
    ? [event.homeTeam, event.awayTeam].some((team) => normalizeTokenText(team) === normalizeTokenText(candidate.opponent ?? ""))
    : true;
  return teamMatch && opponentMatch;
};

export class SeededOddsProvider implements OddsProvider {
  name = "SeededDemoSportsbookFeed";

  async resolveEvent(candidate: BetCandidate): Promise<EventResolution> {
    const matches = SEEDED_EVENTS.filter((event) => eventMatchesCandidate(event, candidate));
    const selected = matches[0] ?? null;
    const status = !selected ? "unresolved" : matches.length > 1 || !candidate.opponent ? "tentative" : "resolved";
    const issues = [
      !selected ? "event_not_found" : null,
      matches.length > 1 ? "multiple_event_candidates" : null,
      !candidate.opponent ? "opponent_missing_in_extraction" : null
    ].filter((value): value is string => Boolean(value));

    return eventResolutionSchema.parse({
      candidateId: candidate.candidateId,
      status,
      provider: this.name,
      eventId: selected?.eventId ?? null,
      matchedEvent: selected ? `${selected.homeTeam} vs ${selected.awayTeam}` : null,
      sport: candidate.sport,
      league: candidate.league,
      team: candidate.team,
      opponent: selected
        ? [selected.homeTeam, selected.awayTeam].find((team) => normalizeTokenText(team) !== normalizeTokenText(candidate.team ?? "")) ?? candidate.opponent
        : candidate.opponent,
      commenceTime: selected?.commenceTime ?? null,
      confidence: selected ? (status === "resolved" ? 0.93 : 0.76) : 0.18,
      issues,
      footer
    });
  }

  async getOdds(candidate: BetCandidate, resolution: EventResolution): Promise<OddsSnapshot> {
    const event = SEEDED_EVENTS.find((entry) => entry.eventId === resolution.eventId);
    if (!event) {
      return oddsSnapshotSchema.parse({
        candidateId: candidate.candidateId,
        status: "not_found",
        provider: this.name,
        eventId: null,
        matchedMarket: false,
        markets: [],
        issues: ["event_not_found_for_odds"],
        footer
      });
    }

    const markets = event.markets.map((market) => ({
      ...market,
      lastUpdated: nowIso()
    }));
    const matchedMarket = markets.some(
      (market) =>
        market.marketType === candidate.marketType &&
        normalizeTokenText(market.selection) === normalizeTokenText(candidate.selection ?? "") &&
        (candidate.line === null || market.line === candidate.line)
    );

    return oddsSnapshotSchema.parse({
      candidateId: candidate.candidateId,
      status: matchedMarket ? "matched" : "partial",
      provider: this.name,
      eventId: event.eventId,
      matchedMarket,
      markets,
      issues: matchedMarket ? [] : ["market_not_found_in_seeded_feed"],
      footer
    });
  }
}

export class TheOddsApiProvider implements OddsProvider {
  name = "TheOddsAPI";

  constructor(private env: OddsProviderEnv) {}

  private getSportKey(candidate: BetCandidate) {
    if (candidate.league === "NBA") return "basketball_nba";
    if (candidate.league === "EPL") return "soccer_epl";
    if (candidate.league === "La Liga") return "soccer_spain_la_liga";
    if (candidate.league === "NFL") return "americanfootball_nfl";
    return null;
  }

  async resolveEvent(candidate: BetCandidate): Promise<EventResolution> {
    if (!this.env.ODDS_API_KEY || !this.env.ODDS_API_BASE_URL) {
      return eventResolutionSchema.parse({
        candidateId: candidate.candidateId,
        status: "unresolved",
        provider: this.name,
        eventId: null,
        matchedEvent: null,
        sport: candidate.sport,
        league: candidate.league,
        team: candidate.team,
        opponent: candidate.opponent,
        commenceTime: null,
        confidence: 0,
        issues: ["provider_not_configured"],
        footer
      });
    }

    const sportKey = this.getSportKey(candidate);
    if (!sportKey || !candidate.team) {
      return eventResolutionSchema.parse({
        candidateId: candidate.candidateId,
        status: "unresolved",
        provider: this.name,
        eventId: null,
        matchedEvent: null,
        sport: candidate.sport,
        league: candidate.league,
        team: candidate.team,
        opponent: candidate.opponent,
        commenceTime: null,
        confidence: 0,
        issues: ["unsupported_league_for_provider"],
        footer
      });
    }

    const fetcher = this.env.fetcher ?? fetch;
    const url = `${this.env.ODDS_API_BASE_URL}/sports/${sportKey}/odds/?regions=us&markets=h2h,spreads,totals&oddsFormat=american&apiKey=${this.env.ODDS_API_KEY}`;
    const entries = await withBackoff(async () => {
      const response = await fetcher(url);
      if (!response.ok) {
        throw new Error(`provider_response_${response.status}`);
      }
      return (await response.json()) as Array<Record<string, unknown>>;
    });

    const matching = entries.find((entry) => {
      const home = String(entry.home_team ?? "");
      const away = String(entry.away_team ?? "");
      const teamMatch =
        normalizeTokenText(home) === normalizeTokenText(candidate.team ?? "") ||
        normalizeTokenText(away) === normalizeTokenText(candidate.team ?? "");
      const opponentMatch = candidate.opponent
        ? normalizeTokenText(home) === normalizeTokenText(candidate.opponent) ||
          normalizeTokenText(away) === normalizeTokenText(candidate.opponent)
        : true;
      return teamMatch && opponentMatch;
    });

    return eventResolutionSchema.parse({
      candidateId: candidate.candidateId,
      status: matching ? (candidate.opponent ? "resolved" : "tentative") : "unresolved",
      provider: this.name,
      eventId: matching ? String(matching.id ?? `${sportKey}_${candidate.candidateId}`) : null,
      matchedEvent: matching ? `${String(matching.home_team)} vs ${String(matching.away_team)}` : null,
      sport: candidate.sport,
      league: candidate.league,
      team: candidate.team,
      opponent: candidate.opponent,
      commenceTime: matching ? String(matching.commence_time ?? null) : null,
      confidence: matching ? 0.81 : 0.12,
      issues: matching ? (candidate.opponent ? [] : ["opponent_missing_in_extraction"]) : ["event_not_found"],
      footer
    });
  }

  async getOdds(candidate: BetCandidate, resolution: EventResolution): Promise<OddsSnapshot> {
    if (!resolution.eventId || !this.env.ODDS_API_KEY || !this.env.ODDS_API_BASE_URL) {
      return oddsSnapshotSchema.parse({
        candidateId: candidate.candidateId,
        status: "not_found",
        provider: this.name,
        eventId: resolution.eventId,
        matchedMarket: false,
        markets: [],
        issues: ["odds_lookup_not_available"],
        footer
      });
    }

    const sportKey = this.getSportKey(candidate);
    if (!sportKey) {
      return oddsSnapshotSchema.parse({
        candidateId: candidate.candidateId,
        status: "not_found",
        provider: this.name,
        eventId: resolution.eventId,
        matchedMarket: false,
        markets: [],
        issues: ["unsupported_league_for_provider"],
        footer
      });
    }

    const fetcher = this.env.fetcher ?? fetch;
    const url = `${this.env.ODDS_API_BASE_URL}/sports/${sportKey}/odds/?regions=us&markets=h2h,spreads,totals&oddsFormat=american&apiKey=${this.env.ODDS_API_KEY}`;
    const entries = await withBackoff(async () => {
      const response = await fetcher(url);
      if (!response.ok) {
        throw new Error(`provider_response_${response.status}`);
      }
      return (await response.json()) as Array<Record<string, unknown>>;
    });

    const match = entries.find((entry) => String(entry.id ?? "") === resolution.eventId || `${String(entry.home_team)} vs ${String(entry.away_team)}` === resolution.matchedEvent);
    if (!match) {
      return oddsSnapshotSchema.parse({
        candidateId: candidate.candidateId,
        status: "not_found",
        provider: this.name,
        eventId: resolution.eventId,
        matchedMarket: false,
        markets: [],
        issues: ["event_not_found_in_provider_odds"],
        footer
      });
    }

    const bookmakers = Array.isArray(match.bookmakers) ? match.bookmakers : [];
    const markets = bookmakers.flatMap((bookmaker) => {
      const book = bookmaker as Record<string, unknown>;
      const marketList = Array.isArray(book.markets) ? (book.markets as Array<Record<string, unknown>>) : [];
      return marketList.flatMap((market) => {
        const key = String(market.key ?? "unknown");
        const canonical = key === "h2h" ? "moneyline" : key === "spreads" ? "point_spread" : "unknown";
        const outcomes = Array.isArray(market.outcomes) ? (market.outcomes as Array<Record<string, unknown>>) : [];
        return outcomes.map((outcome) => ({
          marketType: canonical,
          selection: String(outcome.name ?? "Unknown"),
          betSide: canonical === "moneyline" ? "team" : "team",
          line: typeof outcome.point === "number" ? outcome.point : null,
          oddsAmerican: Number(outcome.price ?? 0),
          bookmaker: String(book.title ?? "Unknown"),
          lastUpdated: String(book.last_update ?? nowIso())
        }));
      });
    });

    const matchedMarket = markets.some(
      (market) =>
        market.marketType === candidate.marketType &&
        normalizeTokenText(market.selection) === normalizeTokenText(candidate.selection ?? "") &&
        (candidate.line === null || market.line === candidate.line)
    );

    return oddsSnapshotSchema.parse({
      candidateId: candidate.candidateId,
      status: matchedMarket ? "matched" : markets.length > 0 ? "partial" : "not_found",
      provider: this.name,
      eventId: resolution.eventId,
      matchedMarket,
      markets,
      issues: matchedMarket ? [] : ["market_not_found_in_provider"],
      footer
    });
  }
}
