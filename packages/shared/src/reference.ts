import type { League, SupportedSport } from "@betcopilot/core-schemas";

export interface TeamReference {
  canonical: string;
  sport: SupportedSport;
  league: League;
  aliases: string[];
}

export interface PlayerReference {
  canonical: string;
  sport: SupportedSport;
  league: League;
  team: string;
  aliases: string[];
}

export const TEAM_REFERENCES: TeamReference[] = [
  {
    canonical: "Los Angeles Lakers",
    sport: "basketball",
    league: "NBA",
    aliases: ["lakers", "los angeles lakers", "la lakers"]
  },
  {
    canonical: "Golden State Warriors",
    sport: "basketball",
    league: "NBA",
    aliases: ["warriors", "golden state warriors", "gsw"]
  },
  {
    canonical: "Boston Celtics",
    sport: "basketball",
    league: "NBA",
    aliases: ["celtics", "boston celtics", "boston"]
  },
  {
    canonical: "Miami Heat",
    sport: "basketball",
    league: "NBA",
    aliases: ["heat", "miami heat", "miami"]
  },
  {
    canonical: "Arsenal",
    sport: "soccer",
    league: "EPL",
    aliases: ["arsenal", "gunners"]
  },
  {
    canonical: "Chelsea",
    sport: "soccer",
    league: "EPL",
    aliases: ["chelsea"]
  },
  {
    canonical: "Real Madrid",
    sport: "soccer",
    league: "La Liga",
    aliases: ["real madrid", "madrid", "los blancos"]
  },
  {
    canonical: "Barcelona",
    sport: "soccer",
    league: "La Liga",
    aliases: ["barcelona", "barca", "fc barcelona"]
  },
  {
    canonical: "Kansas City Chiefs",
    sport: "american_football",
    league: "NFL",
    aliases: ["chiefs", "kansas city chiefs", "kansas city"]
  },
  {
    canonical: "Buffalo Bills",
    sport: "american_football",
    league: "NFL",
    aliases: ["bills", "buffalo bills", "buffalo"]
  }
];

export const PLAYER_REFERENCES: PlayerReference[] = [
  {
    canonical: "LeBron James",
    sport: "basketball",
    league: "NBA",
    team: "Los Angeles Lakers",
    aliases: ["lebron", "lebron james"]
  },
  {
    canonical: "Jayson Tatum",
    sport: "basketball",
    league: "NBA",
    team: "Boston Celtics",
    aliases: ["tatum", "jayson tatum"]
  },
  {
    canonical: "Patrick Mahomes",
    sport: "american_football",
    league: "NFL",
    team: "Kansas City Chiefs",
    aliases: ["mahomes", "patrick mahomes"]
  }
];

const normalizeToken = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export const findTeamReference = (value: string) => {
  const wanted = normalizeToken(value);
  return TEAM_REFERENCES.find((team) => team.aliases.some((alias) => normalizeToken(alias) === wanted)) ?? null;
};

export const findTeamInText = (text: string) => {
  const lowered = normalizeToken(text);
  return TEAM_REFERENCES.filter((team) =>
    team.aliases.some((alias) => lowered.includes(normalizeToken(alias)))
  );
};

export const findPlayerReference = (value: string) => {
  const wanted = normalizeToken(value);
  return PLAYER_REFERENCES.find((player) => player.aliases.some((alias) => normalizeToken(alias) === wanted)) ?? null;
};

export const findPlayersInText = (text: string) => {
  const lowered = normalizeToken(text);
  return PLAYER_REFERENCES.filter((player) =>
    player.aliases.some((alias) => lowered.includes(normalizeToken(alias)))
  );
};

export const normalizeTokenText = normalizeToken;
