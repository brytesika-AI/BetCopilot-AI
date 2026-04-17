import {
  evalCaseResultSchema,
  evalRunReportSchema,
  extractionResponseSchema,
  footer,
  type BetCandidate,
  type EvalCase,
  type EvalCaseResult,
  type EvalRunReport,
  type ExtractionResponse
} from "@betcopilot/core-schemas";
import { normalizeInput } from "@betcopilot/ingestion";
import { createStructuredModel, extractBetDrafts } from "@betcopilot/llm";
import { validateCandidates } from "@betcopilot/qa";
import { nowIso, resolveRuntimeConfig } from "@betcopilot/shared";
import { enrichCandidates, normalizeCandidates, type OddsProviderEnv } from "@betcopilot/tools";
import { SYNTHETIC_EVAL_CASES } from "./cases";

export * from "./cases";

const trackedFields: Array<keyof BetCandidate> = [
  "sport",
  "league",
  "team",
  "opponent",
  "player",
  "marketType",
  "selection",
  "betSide",
  "line"
];

const partialMatchScore = (actual: BetCandidate, expected: Partial<BetCandidate>) => {
  const keys = trackedFields.filter((field) => expected[field] !== undefined);
  if (keys.length === 0) {
    return 1;
  }
  const matches = keys.filter((field) => actual[field] === expected[field]).length;
  return matches / keys.length;
};

const compareCandidateSets = (actual: BetCandidate[], expected: Array<Partial<BetCandidate>>) => {
  const scores = expected.map((expectedCandidate) => {
    const best = actual.reduce((max, candidate) => Math.max(max, partialMatchScore(candidate, expectedCandidate)), 0);
    return best;
  });

  const fieldMatchScore =
    scores.length === 0 ? 1 : Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(4));
  const exactMatch =
    scores.length === actual.length && scores.every((score) => score === 1) ? 1 : 0;
  return { fieldMatchScore, exactMatch };
};

export const runPipelineForEval = async (
  evalCase: EvalCase,
  env: OddsProviderEnv & Record<string, unknown>
): Promise<ExtractionResponse> => {
  const config = resolveRuntimeConfig(env);
  const request = {
    rawText: evalCase.input.rawText,
    sourceType: evalCase.input.sourceType,
    sourceMetadata: {}
  };
  const ingestion = normalizeInput(request);
  const model = createStructuredModel({
    provider: config.modelProvider,
    modelName: config.modelName,
    mockMode: config.mockMode,
    maxRetries: 2
  });

  const started = performance.now();
  const extractedCandidates = await extractBetDrafts(model, ingestion);
  const normalizedCandidates = normalizeCandidates(extractedCandidates);
  const { resolutions, oddsSnapshots } = await enrichCandidates(normalizedCandidates, env);
  const qaResults = validateCandidates(normalizedCandidates, resolutions, oddsSnapshots, config.confidenceThreshold);
  const totalLatencyMs = Math.round(performance.now() - started);

  return extractionResponseSchema.parse({
    request: ingestion,
    extractedCandidates,
    normalizedCandidates,
    eventResolutions: resolutions,
    oddsSnapshots,
    qaResults,
    trace: {
      traceId: ingestion.traceId,
      status: qaResults.some((result) => result.status === "fail")
        ? "failed"
        : qaResults.some((result) => result.status === "warning")
          ? "warning"
          : "ok",
      startedAt: ingestion.receivedAt,
      endedAt: nowIso(),
      totalLatencyMs,
      model: {
        provider: config.modelProvider,
        name: config.modelName,
        mode: config.mockMode ? "mock" : "structured"
      },
      confidenceThreshold: config.confidenceThreshold,
      steps: [
        { stage: "ingest", status: "ok", latencyMs: 5, detail: "Input normalized." },
        { stage: "extract", status: "ok", latencyMs: 25, detail: `${extractedCandidates.length} candidates extracted.` },
        { stage: "normalize", status: "ok", latencyMs: 10, detail: "Canonical normalization completed." },
        { stage: "resolve_enrich", status: "ok", latencyMs: 30, detail: "Odds enrichment attempted for each candidate." },
        { stage: "qa", status: "ok", latencyMs: 8, detail: "QA rules evaluated." },
        { stage: "report", status: "ok", latencyMs: 3, detail: "Trace packaged for output." }
      ],
      errors: [],
      footer
    },
    footer
  });
};

const createMarkdownSummary = (report: EvalRunReport) => `# BetCopilot AI Eval Summary

**Suite:** ${report.suite}
**Generated:** ${report.generatedAt}

| Metric | Value |
| --- | ---: |
| Total cases | ${report.summary.totalCases} |
| Passed cases | ${report.summary.passedCases} |
| Exact match rate | ${report.summary.exactMatchRate.toFixed(2)} |
| Field-level match rate | ${report.summary.fieldLevelMatchRate.toFixed(2)} |
| Schema pass rate | ${report.summary.schemaPassRate.toFixed(2)} |
| Event resolution success rate | ${report.summary.eventResolutionSuccessRate.toFixed(2)} |
| QA warning rate | ${report.summary.qaWarningRate.toFixed(2)} |
| Average confidence | ${report.summary.averageConfidence.toFixed(2)} |
| Average latency ms | ${report.summary.averageLatencyMs.toFixed(0)} |

@BryteSikaStrategyAI`;

export const runEvalCase = async (
  evalCase: EvalCase,
  env: OddsProviderEnv & Record<string, unknown>
): Promise<EvalCaseResult> => {
  const output = await runPipelineForEval(evalCase, env);
  const comparison = compareCandidateSets(output.normalizedCandidates, evalCase.expectedCandidates);
  const schemaPass = output.normalizedCandidates.length > 0;
  const eventResolutionSuccessRate =
    output.eventResolutions.length === 0
      ? 0
      : output.eventResolutions.filter((resolution) => resolution.status !== "unresolved").length /
        output.eventResolutions.length;
  const qaWarningRate =
    output.qaResults.length === 0
      ? 0
      : output.qaResults.filter((qa) => qa.status !== "pass").length / output.qaResults.length;
  const averageConfidence =
    output.normalizedCandidates.length === 0
      ? 0
      : output.normalizedCandidates.reduce((sum, candidate) => sum + candidate.confidence, 0) /
        output.normalizedCandidates.length;

  return evalCaseResultSchema.parse({
    caseId: evalCase.caseId,
    passed: comparison.exactMatch === 1 && schemaPass,
    exactMatch: comparison.exactMatch,
    fieldMatchScore: comparison.fieldMatchScore,
    schemaPass,
    eventResolutionSuccessRate: Number(eventResolutionSuccessRate.toFixed(4)),
    qaWarningRate: Number(qaWarningRate.toFixed(4)),
    averageConfidence: Number(averageConfidence.toFixed(4)),
    latencyMs: output.trace.totalLatencyMs,
    output,
    footer
  });
};

export const runSyntheticEvalSuite = async (
  env: OddsProviderEnv & Record<string, unknown>,
  suite = "synthetic-regression"
): Promise<EvalRunReport> => {
  const cases: EvalCaseResult[] = [];

  for (const evalCase of SYNTHETIC_EVAL_CASES) {
    cases.push(await runEvalCase(evalCase, env));
  }

  const totalCases = cases.length;
  const passedCases = cases.filter((result) => result.passed).length;
  const summary = {
    totalCases,
    passedCases,
    exactMatchRate: Number((cases.reduce((sum, result) => sum + result.exactMatch, 0) / totalCases).toFixed(4)),
    fieldLevelMatchRate: Number((cases.reduce((sum, result) => sum + result.fieldMatchScore, 0) / totalCases).toFixed(4)),
    schemaPassRate: Number((cases.filter((result) => result.schemaPass).length / totalCases).toFixed(4)),
    eventResolutionSuccessRate: Number((cases.reduce((sum, result) => sum + result.eventResolutionSuccessRate, 0) / totalCases).toFixed(4)),
    qaWarningRate: Number((cases.reduce((sum, result) => sum + result.qaWarningRate, 0) / totalCases).toFixed(4)),
    averageConfidence: Number((cases.reduce((sum, result) => sum + result.averageConfidence, 0) / totalCases).toFixed(4)),
    averageLatencyMs: Number((cases.reduce((sum, result) => sum + result.latencyMs, 0) / totalCases).toFixed(2))
  };

  const baseReport = evalRunReportSchema.parse({
    runId: `eval_${crypto.randomUUID().slice(0, 8)}`,
    suite,
    generatedAt: nowIso(),
    summary,
    cases,
    markdownSummary: "",
    footer
  });

  return evalRunReportSchema.parse({
    ...baseReport,
    markdownSummary: createMarkdownSummary(baseReport)
  });
};
