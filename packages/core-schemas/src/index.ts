import { z } from "zod";

export const footer = "@BryteSikaStrategyAI";

export const sourceTypeSchema = z.enum([
  "raw_text",
  "chat_text",
  "article_text",
  "social_post",
  "url",
  "screenshot"
]);

export const supportedSportSchema = z.enum(["basketball", "soccer", "american_football", "unknown"]);
export type SupportedSport = z.infer<typeof supportedSportSchema>;

export const leagueSchema = z.enum(["NBA", "EPL", "La Liga", "NFL", "unknown"]);
export type League = z.infer<typeof leagueSchema>;

export const marketTypeSchema = z.enum([
  "moneyline",
  "point_spread",
  "both_teams_to_score",
  "player_points_over",
  "player_points_under",
  "player_rebounds_over",
  "player_rebounds_under",
  "player_assists_over",
  "player_assists_under",
  "player_passing_touchdowns_over",
  "player_passing_touchdowns_under",
  "same_game_parlay",
  "unknown"
]);

export const betSideSchema = z.enum(["team", "player", "over", "under", "yes", "no", "unknown"]);

export const pipelineStatusSchema = z.enum(["ok", "warning", "failed"]);
export const resolutionStatusSchema = z.enum(["resolved", "tentative", "unresolved"]);
export const oddsStatusSchema = z.enum(["matched", "partial", "not_found"]);
export const qaStatusSchema = z.enum(["pass", "warning", "fail"]);

export const sourceMetadataSchema = z.object({
  sourceLabel: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  screenshotUrl: z.string().url().optional(),
  author: z.string().optional(),
  publishedAt: z.string().optional()
});

export const ingestionInputSchema = z.object({
  traceId: z.string(),
  rawText: z.string().min(3),
  sourceType: sourceTypeSchema,
  sourceMetadata: sourceMetadataSchema.optional(),
  receivedAt: z.string(),
  footer: z.literal(footer)
});

export type IngestionInput = z.infer<typeof ingestionInputSchema>;

export const extractedBetDraftSchema = z.object({
  candidateId: z.string(),
  traceId: z.string(),
  rawText: z.string(),
  rawFragment: z.string(),
  sourceType: sourceTypeSchema,
  sport: supportedSportSchema.nullable(),
  league: leagueSchema.nullable(),
  event: z.string().nullable(),
  team: z.string().nullable(),
  opponent: z.string().nullable(),
  player: z.string().nullable(),
  marketType: z.string(),
  selection: z.string().nullable(),
  betSide: z.string(),
  line: z.number().nullable(),
  oddsText: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  ambiguityFlags: z.array(z.string()),
  footer: z.literal(footer)
});

export type ExtractedBetDraft = z.infer<typeof extractedBetDraftSchema>;

export const betCandidateSchema = z.object({
  candidateId: z.string(),
  traceId: z.string(),
  rawText: z.string(),
  sourceType: sourceTypeSchema,
  sport: supportedSportSchema,
  league: leagueSchema,
  event: z.string().nullable(),
  team: z.string().nullable(),
  opponent: z.string().nullable(),
  player: z.string().nullable(),
  marketType: marketTypeSchema,
  selection: z.string().nullable(),
  betSide: betSideSchema,
  line: z.number().nullable(),
  oddsText: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  ambiguityFlags: z.array(z.string()),
  normalizationNotes: z.array(z.string()),
  footer: z.literal(footer)
});

export type BetCandidate = z.infer<typeof betCandidateSchema>;

export const eventResolutionSchema = z.object({
  candidateId: z.string(),
  status: resolutionStatusSchema,
  provider: z.string(),
  eventId: z.string().nullable(),
  matchedEvent: z.string().nullable(),
  sport: supportedSportSchema,
  league: leagueSchema,
  team: z.string().nullable(),
  opponent: z.string().nullable(),
  commenceTime: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  issues: z.array(z.string()),
  footer: z.literal(footer)
});

export type EventResolution = z.infer<typeof eventResolutionSchema>;

export const oddsMarketSchema = z.object({
  marketType: marketTypeSchema,
  selection: z.string(),
  betSide: betSideSchema,
  line: z.number().nullable(),
  oddsAmerican: z.number(),
  bookmaker: z.string(),
  lastUpdated: z.string()
});

export const oddsSnapshotSchema = z.object({
  candidateId: z.string(),
  status: oddsStatusSchema,
  provider: z.string(),
  eventId: z.string().nullable(),
  matchedMarket: z.boolean(),
  markets: z.array(oddsMarketSchema),
  issues: z.array(z.string()),
  footer: z.literal(footer)
});

export type OddsSnapshot = z.infer<typeof oddsSnapshotSchema>;

export const qaIssueSchema = z.object({
  code: z.string(),
  severity: z.enum(["info", "warning", "error"]),
  message: z.string()
});

export const qaCheckResultSchema = z.object({
  candidateId: z.string(),
  status: qaStatusSchema,
  pass: z.boolean(),
  confidenceScore: z.number().min(0).max(1),
  issues: z.array(qaIssueSchema),
  flags: z.array(z.string()),
  footer: z.literal(footer)
});

export type QACheckResult = z.infer<typeof qaCheckResultSchema>;

export const pipelineTraceStepSchema = z.object({
  stage: z.enum(["ingest", "extract", "normalize", "resolve_enrich", "qa", "report"]),
  status: pipelineStatusSchema,
  latencyMs: z.number(),
  detail: z.string()
});

export const pipelineTraceSchema = z.object({
  traceId: z.string(),
  status: pipelineStatusSchema,
  startedAt: z.string(),
  endedAt: z.string(),
  totalLatencyMs: z.number(),
  model: z.object({
    provider: z.string(),
    name: z.string(),
    mode: z.string()
  }),
  confidenceThreshold: z.number(),
  steps: z.array(pipelineTraceStepSchema),
  errors: z.array(z.string()),
  footer: z.literal(footer)
});

export type PipelineTrace = z.infer<typeof pipelineTraceSchema>;

export const extractionResponseSchema = z.object({
  request: ingestionInputSchema,
  extractedCandidates: z.array(extractedBetDraftSchema),
  normalizedCandidates: z.array(betCandidateSchema),
  eventResolutions: z.array(eventResolutionSchema),
  oddsSnapshots: z.array(oddsSnapshotSchema),
  qaResults: z.array(qaCheckResultSchema),
  trace: pipelineTraceSchema,
  footer: z.literal(footer)
});

export type ExtractionResponse = z.infer<typeof extractionResponseSchema>;

export const evalCaseSchema = z.object({
  caseId: z.string(),
  difficulty: z.enum(["easy", "medium", "ambiguous", "multi_bet", "noisy"]),
  input: z.object({
    rawText: z.string(),
    sourceType: sourceTypeSchema
  }),
  expectedCandidates: z.array(
    betCandidateSchema.pick({
      sport: true,
      league: true,
      team: true,
      opponent: true,
      player: true,
      marketType: true,
      selection: true,
      betSide: true,
      line: true
    }).partial()
  ),
  notes: z.string().optional(),
  footer: z.literal(footer)
});

export type EvalCase = z.infer<typeof evalCaseSchema>;

export const evalCaseResultSchema = z.object({
  caseId: z.string(),
  passed: z.boolean(),
  exactMatch: z.number().min(0).max(1),
  fieldMatchScore: z.number().min(0).max(1),
  schemaPass: z.boolean(),
  eventResolutionSuccessRate: z.number().min(0).max(1),
  qaWarningRate: z.number().min(0).max(1),
  averageConfidence: z.number().min(0).max(1),
  latencyMs: z.number(),
  output: extractionResponseSchema,
  footer: z.literal(footer)
});

export type EvalCaseResult = z.infer<typeof evalCaseResultSchema>;

export const evalRunReportSchema = z.object({
  runId: z.string(),
  suite: z.string(),
  generatedAt: z.string(),
  summary: z.object({
    totalCases: z.number(),
    passedCases: z.number(),
    exactMatchRate: z.number().min(0).max(1),
    fieldLevelMatchRate: z.number().min(0).max(1),
    schemaPassRate: z.number().min(0).max(1),
    eventResolutionSuccessRate: z.number().min(0).max(1),
    qaWarningRate: z.number().min(0).max(1),
    averageConfidence: z.number().min(0).max(1),
    averageLatencyMs: z.number()
  }),
  cases: z.array(evalCaseResultSchema),
  markdownSummary: z.string(),
  footer: z.literal(footer)
});

export type EvalRunReport = z.infer<typeof evalRunReportSchema>;

export const userPreferenceProfileSchema = z.object({
  userId: z.string(),
  favoriteTeams: z.array(z.string()),
  preferredBetTypes: z.array(marketTypeSchema),
  bankrollStyle: z.enum(["conservative", "balanced", "aggressive"]).default("balanced"),
  sessionMemory: z.array(z.string()),
  footer: z.literal(footer)
});

export type UserPreferenceProfile = z.infer<typeof userPreferenceProfileSchema>;

export const extractRequestSchema = z
  .object({
    raw_text: z.string().optional(),
    source_type: sourceTypeSchema.optional(),
    source_metadata: sourceMetadataSchema.optional(),
    content: z.string().optional(),
    inputType: sourceTypeSchema.optional(),
    screenshotUrl: z.string().url().optional(),
    traceContext: z.record(z.string(), z.string()).optional()
  })
  .superRefine((value, ctx) => {
    if (!value.raw_text && !value.content) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "raw_text or content is required"
      });
    }
    if (!value.source_type && !value.inputType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "source_type or inputType is required"
      });
    }
  })
  .transform((value) => ({
    rawText: (value.raw_text ?? value.content ?? "").trim(),
    sourceType: value.source_type ?? value.inputType ?? "raw_text",
    sourceMetadata: {
      ...(value.source_metadata ?? {}),
      ...(value.screenshotUrl ? { screenshotUrl: value.screenshotUrl } : {})
    },
    traceContext: value.traceContext ?? {}
  }));

export type ExtractRequest = z.infer<typeof extractRequestSchema>;
