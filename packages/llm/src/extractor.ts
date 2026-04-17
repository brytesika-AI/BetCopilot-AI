import {
  extractedBetDraftSchema,
  footer,
  type ExtractedBetDraft,
  type IngestionInput
} from "@betcopilot/core-schemas";
import {
  createId,
  findPlayersInText,
  findTeamInText,
  findTeamReference,
  normalizeTokenText
} from "@betcopilot/shared";
import type { StructuredModel } from "./model";
import { buildExtractionPrompt, EXTRACTION_SYSTEM_PROMPT } from "./prompts";

const marketTerms = [
  "moneyline",
  "ml",
  "spread",
  "points",
  "pts",
  "rebounds",
  "boards",
  "assists",
  "passing touchdowns",
  "both teams to score",
  "btts",
  "to win"
];

const parseOddsText = (text: string) => text.match(/([+-]\d{3,4})/)?.[1] ?? null;

const inferOpponent = (text: string, currentTeam: string | null) => {
  const teams = findTeamInText(text).map((team) => team.canonical);
  return teams.find((team) => team !== currentTeam) ?? null;
};

const inferEventText = (team: string | null, opponent: string | null) =>
  team && opponent ? `${team} vs ${opponent}` : null;

const createDraft = (params: Omit<ExtractedBetDraft, "footer">): ExtractedBetDraft =>
  extractedBetDraftSchema.parse({
    ...params,
    footer
  });

const buildPlayerPropDrafts = (input: IngestionInput): ExtractedBetDraft[] => {
  const playerPattern =
    /(LeBron(?: James)?|Patrick Mahomes|Mahomes|Jayson Tatum|Tatum|Victor Wembanyama|Wembanyama|Wemby)\s+(over|under|o|u)\s*(\d+(?:\.\d+)?)\s*(points|pts|rebounds|boards|assists|passing touchdowns|pass tds|tds?)/gi;
  const drafts: ExtractedBetDraft[] = [];

  for (const match of input.rawText.matchAll(playerPattern)) {
    const playerToken = match[1] ?? "";
    const sideToken = match[2] ?? "over";
    const line = Number(match[3] ?? "0");
    const statToken = match[4] ?? "";
    const playerRef = findPlayersInText(playerToken)[0] ?? null;
    const team = playerRef?.team ?? null;
    const opponent = inferOpponent(input.rawText, team);
    const marketLabel = `${statToken.toLowerCase()} ${sideToken.toLowerCase()}`;

    drafts.push(
      createDraft({
        candidateId: createId("cand"),
        traceId: input.traceId,
        rawText: input.rawText,
        rawFragment: match[0],
        sourceType: input.sourceType,
        sport: playerRef?.sport ?? null,
        league: playerRef?.league ?? null,
        event: inferEventText(team, opponent),
        team,
        opponent,
        player: playerRef?.canonical ?? playerToken,
        marketType: marketLabel,
        selection: playerRef?.canonical ?? playerToken,
        betSide: /under|^u$/i.test(sideToken) ? "under" : "over",
        line,
        oddsText: parseOddsText(match[0]),
        confidence: opponent ? 0.9 : 0.77,
        rationale: "Detected a player prop with explicit player, threshold, and stat category.",
        ambiguityFlags: opponent ? [] : ["missing_opponent"]
      })
    );
  }

  return drafts;
};

const buildBttsDrafts = (input: IngestionInput): ExtractedBetDraft[] => {
  const pattern = /\b(both teams to score|btts)(?:\s*(yes|no))?/gi;
  const match = pattern.exec(input.rawText);
  if (!match) {
    return [];
  }

  const teams = findTeamInText(input.rawText);
  const team = teams[0]?.canonical ?? null;
  const opponent = teams[1]?.canonical ?? null;

  return [
    createDraft({
      candidateId: createId("cand"),
      traceId: input.traceId,
      rawText: input.rawText,
      rawFragment: match[0],
      sourceType: input.sourceType,
      sport: team ? findTeamReference(team)?.sport ?? null : null,
      league: team ? findTeamReference(team)?.league ?? null : null,
      event: inferEventText(team, opponent),
      team,
      opponent,
      player: null,
      marketType: "btts",
      selection: /no/i.test(match[2] ?? "") ? "No" : "Yes",
      betSide: /no/i.test(match[2] ?? "") ? "no" : "yes",
      line: null,
      oddsText: parseOddsText(input.rawText),
      confidence: team && opponent ? 0.84 : 0.68,
      rationale: "Detected a both-teams-to-score market from the passage.",
      ambiguityFlags: team && opponent ? [] : ["missing_event_context"]
    })
  ];
};

const buildTeamDrafts = (input: IngestionInput): ExtractedBetDraft[] => {
  const teams = findTeamInText(input.rawText);
  const teamPattern =
    /(Los Angeles Lakers|Lakers|Golden State Warriors|Warriors|Boston Celtics|Celtics|Miami Heat|Heat|San Antonio Spurs|Spurs|Portland Trail Blazers|Blazers|Balzers|Arsenal|Chelsea|Real Madrid|Barcelona|Chiefs|Kansas City Chiefs|Bills|Buffalo Bills)(?:\s+(moneyline|ml|to win)\b|\s*([+-]\d+(?:\.\d+)?))/gi;
  const drafts: ExtractedBetDraft[] = [];

  for (const match of input.rawText.matchAll(teamPattern)) {
    const rawTeam = match[1] ?? "";
    const marketToken = match[2] ?? "";
    const spreadToken = match[3] ?? "";
    const teamRef = findTeamReference(rawTeam);
    const opponent = inferOpponent(input.rawText, teamRef?.canonical ?? null);
    const explicitToWin = /\bto win\b/i.test(match[0]);

    drafts.push(
      createDraft({
        candidateId: createId("cand"),
        traceId: input.traceId,
        rawText: input.rawText,
        rawFragment: match[0],
        sourceType: input.sourceType,
        sport: teamRef?.sport ?? null,
        league: teamRef?.league ?? null,
        event: inferEventText(teamRef?.canonical ?? null, opponent),
        team: teamRef?.canonical ?? rawTeam,
        opponent,
        player: null,
        marketType: spreadToken ? "spread" : explicitToWin || marketToken ? "moneyline" : "unknown",
        selection: teamRef?.canonical ?? rawTeam,
        betSide: "team",
        line: spreadToken ? Number(spreadToken) : null,
        oddsText: parseOddsText(match[0]),
        confidence: opponent ? 0.87 : 0.74,
        rationale: spreadToken
          ? "Detected a team spread with an explicit line."
          : "Detected a team win market from moneyline language.",
        ambiguityFlags: opponent ? [] : ["missing_opponent"]
      })
    );
  }

  const [singleTeam] = teams;
  if (drafts.length === 0 && singleTeam && teams.length === 1 && /\b(ml|moneyline|to win)\b/i.test(input.rawText)) {
    const team = singleTeam;
    drafts.push(
      createDraft({
        candidateId: createId("cand"),
        traceId: input.traceId,
        rawText: input.rawText,
        rawFragment: input.rawText,
        sourceType: input.sourceType,
        sport: team.sport,
        league: team.league,
        event: null,
        team: team.canonical,
        opponent: null,
        player: null,
        marketType: "moneyline",
        selection: team.canonical,
        betSide: "team",
        line: null,
        oddsText: parseOddsText(input.rawText),
        confidence: 0.7,
        rationale: "Detected a moneyline reference for a single team without explicit event details.",
        ambiguityFlags: ["missing_opponent", "ambiguous_event"]
      })
    );
  }

  return drafts;
};

const buildFallbackDraft = (input: IngestionInput): ExtractedBetDraft =>
  createDraft({
    candidateId: createId("cand"),
    traceId: input.traceId,
    rawText: input.rawText,
    rawFragment: input.rawText,
    sourceType: input.sourceType,
    sport: null,
    league: null,
    event: null,
    team: null,
    opponent: null,
    player: null,
    marketType: "unknown",
    selection: null,
    betSide: "unknown",
    line: null,
    oddsText: parseOddsText(input.rawText),
    confidence: 0.3,
    rationale: "No supported betting market could be extracted confidently from the text.",
    ambiguityFlags: ["unsupported_or_unrecognized_market"]
  });

const dedupeDrafts = (drafts: ExtractedBetDraft[]) => {
  const seen = new Set<string>();
  return drafts.filter((draft) => {
    const signature = [
      normalizeTokenText(draft.team ?? ""),
      normalizeTokenText(draft.player ?? ""),
      normalizeTokenText(draft.marketType),
      draft.line ?? "none"
    ].join("|");
    if (seen.has(signature)) {
      return false;
    }
    seen.add(signature);
    return true;
  });
};

export const extractBetDrafts = async (
  model: StructuredModel,
  input: IngestionInput
): Promise<ExtractedBetDraft[]> =>
  model.runStructured({
    taskName: "bet-extraction",
    systemPrompt: EXTRACTION_SYSTEM_PROMPT,
    userPrompt: buildExtractionPrompt(input.rawText, input.sourceType),
    schema: extractedBetDraftSchema.array(),
    fallback: () => {
      const drafts = dedupeDrafts([
        ...buildPlayerPropDrafts(input),
        ...buildBttsDrafts(input),
        ...buildTeamDrafts(input)
      ]);

      if (drafts.length > 0) {
        return drafts;
      }

      const looksLikeBet = marketTerms.some((term) => input.rawText.toLowerCase().includes(term));
      return looksLikeBet ? [buildFallbackDraft(input)] : [buildFallbackDraft(input)];
    }
  });
