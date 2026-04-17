import type { EventResolution, OddsSnapshot } from "@betcopilot/core-schemas";
import { footer } from "@betcopilot/core-schemas";

export interface SeededMarket {
  marketType: OddsSnapshot["markets"][number]["marketType"];
  selection: string;
  betSide: OddsSnapshot["markets"][number]["betSide"];
  line: number | null;
  oddsAmerican: number;
  bookmaker: string;
}

export interface SeededEvent {
  eventId: string;
  provider: string;
  sport: EventResolution["sport"];
  league: EventResolution["league"];
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  markets: SeededMarket[];
}

export const SEEDED_EVENTS: SeededEvent[] = [
  {
    eventId: "nba_lakers_warriors_001",
    provider: "SeededDemoSportsbookFeed",
    sport: "basketball",
    league: "NBA",
    homeTeam: "Los Angeles Lakers",
    awayTeam: "Golden State Warriors",
    commenceTime: "2026-04-17T23:30:00.000Z",
    markets: [
      { marketType: "moneyline", selection: "Los Angeles Lakers", betSide: "team", line: null, oddsAmerican: -155, bookmaker: "SeededDemoBook" },
      { marketType: "moneyline", selection: "Golden State Warriors", betSide: "team", line: null, oddsAmerican: 132, bookmaker: "SeededDemoBook" },
      { marketType: "point_spread", selection: "Los Angeles Lakers", betSide: "team", line: -4.5, oddsAmerican: -110, bookmaker: "SeededDemoBook" },
      { marketType: "point_spread", selection: "Golden State Warriors", betSide: "team", line: 4.5, oddsAmerican: -110, bookmaker: "SeededDemoBook" },
      { marketType: "player_points_over", selection: "LeBron James", betSide: "over", line: 27.5, oddsAmerican: -112, bookmaker: "SeededDemoBook" },
      { marketType: "player_points_under", selection: "LeBron James", betSide: "under", line: 27.5, oddsAmerican: -108, bookmaker: "SeededDemoBook" }
    ]
  },
  {
    eventId: "nba_celtics_heat_001",
    provider: "SeededDemoSportsbookFeed",
    sport: "basketball",
    league: "NBA",
    homeTeam: "Boston Celtics",
    awayTeam: "Miami Heat",
    commenceTime: "2026-04-18T00:00:00.000Z",
    markets: [
      { marketType: "moneyline", selection: "Boston Celtics", betSide: "team", line: null, oddsAmerican: -180, bookmaker: "SeededDemoBook" },
      { marketType: "point_spread", selection: "Boston Celtics", betSide: "team", line: -4.5, oddsAmerican: -110, bookmaker: "SeededDemoBook" },
      { marketType: "point_spread", selection: "Miami Heat", betSide: "team", line: 4.5, oddsAmerican: -110, bookmaker: "SeededDemoBook" },
      { marketType: "player_points_over", selection: "Jayson Tatum", betSide: "over", line: 29.5, oddsAmerican: -106, bookmaker: "SeededDemoBook" }
    ]
  },
  {
    eventId: "epl_arsenal_chelsea_001",
    provider: "SeededDemoSportsbookFeed",
    sport: "soccer",
    league: "EPL",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    commenceTime: "2026-04-18T16:30:00.000Z",
    markets: [
      { marketType: "moneyline", selection: "Arsenal", betSide: "team", line: null, oddsAmerican: -120, bookmaker: "SeededDemoBook" },
      { marketType: "moneyline", selection: "Chelsea", betSide: "team", line: null, oddsAmerican: 145, bookmaker: "SeededDemoBook" },
      { marketType: "both_teams_to_score", selection: "Yes", betSide: "yes", line: null, oddsAmerican: -118, bookmaker: "SeededDemoBook" },
      { marketType: "both_teams_to_score", selection: "No", betSide: "no", line: null, oddsAmerican: 102, bookmaker: "SeededDemoBook" }
    ]
  },
  {
    eventId: "laliga_realmadrid_barcelona_001",
    provider: "SeededDemoSportsbookFeed",
    sport: "soccer",
    league: "La Liga",
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    commenceTime: "2026-04-19T19:00:00.000Z",
    markets: [
      { marketType: "moneyline", selection: "Real Madrid", betSide: "team", line: null, oddsAmerican: -105, bookmaker: "SeededDemoBook" },
      { marketType: "moneyline", selection: "Barcelona", betSide: "team", line: null, oddsAmerican: 160, bookmaker: "SeededDemoBook" },
      { marketType: "both_teams_to_score", selection: "Yes", betSide: "yes", line: null, oddsAmerican: -140, bookmaker: "SeededDemoBook" }
    ]
  },
  {
    eventId: "nfl_chiefs_bills_001",
    provider: "SeededDemoSportsbookFeed",
    sport: "american_football",
    league: "NFL",
    homeTeam: "Kansas City Chiefs",
    awayTeam: "Buffalo Bills",
    commenceTime: "2026-04-20T00:20:00.000Z",
    markets: [
      { marketType: "moneyline", selection: "Kansas City Chiefs", betSide: "team", line: null, oddsAmerican: -135, bookmaker: "SeededDemoBook" },
      { marketType: "player_passing_touchdowns_over", selection: "Patrick Mahomes", betSide: "over", line: 2.5, oddsAmerican: -104, bookmaker: "SeededDemoBook" },
      { marketType: "player_passing_touchdowns_under", selection: "Patrick Mahomes", betSide: "under", line: 2.5, oddsAmerican: -118, bookmaker: "SeededDemoBook" }
    ]
  }
];

export const MCP_SERVER_DESCRIPTION = {
  servers: [
    {
      name: "Sports Data MCP Server",
      tools: ["resolve_sport_event", "get_live_odds", "normalize_market", "compare_candidate_to_live_market"]
    },
    {
      name: "Content Extraction MCP Server",
      tools: ["fetch_article_content"]
    },
    {
      name: "QA / Eval MCP Server",
      tools: ["validate_bet_candidate", "run_eval_case"]
    }
  ],
  footer
};
