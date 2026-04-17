import {
  footer,
  qaCheckResultSchema,
  type BetCandidate,
  type EventResolution,
  type OddsSnapshot,
  type QACheckResult
} from "@betcopilot/core-schemas";

const lineRequiredMarkets = new Set([
  "point_spread",
  "player_points_over",
  "player_points_under",
  "player_rebounds_over",
  "player_rebounds_under",
  "player_assists_over",
  "player_assists_under",
  "player_passing_touchdowns_over",
  "player_passing_touchdowns_under"
]);

export const validateBetCandidate = (
  candidate: BetCandidate,
  resolution: EventResolution,
  odds: OddsSnapshot,
  confidenceThreshold = 0.62
): QACheckResult => {
  const issues: QACheckResult["issues"] = [];
  const flags = [...candidate.ambiguityFlags];

  if (candidate.marketType === "unknown" || candidate.sport === "unknown") {
    issues.push({
      code: "unsupported_sport_or_market",
      severity: "error",
      message: "The extracted candidate is not in a supported MVP market or sport."
    });
    flags.push("unsupported_sport_or_market");
  }

  if (!candidate.selection) {
    issues.push({
      code: "missing_selection",
      severity: "error",
      message: "The candidate does not contain a usable selection."
    });
    flags.push("missing_selection");
  }

  if (lineRequiredMarkets.has(candidate.marketType) && candidate.line === null) {
    issues.push({
      code: "missing_line",
      severity: "error",
      message: "This market requires a numeric line."
    });
    flags.push("missing_line");
  }

  if (resolution.status === "unresolved") {
    issues.push({
      code: "event_unresolved",
      severity: "error",
      message: "The event could not be resolved against the odds provider."
    });
    flags.push("event_unresolved");
  }

  if (resolution.status === "tentative") {
    issues.push({
      code: "ambiguous_event",
      severity: "warning",
      message: "The event resolution is tentative and should be reviewed."
    });
    flags.push("ambiguous_event");
  }

  if (odds.status === "not_found") {
    issues.push({
      code: "odds_not_found",
      severity: "warning",
      message: "No live or seeded odds market could be matched."
    });
    flags.push("odds_not_found");
  }

  if (odds.status === "partial" || !odds.matchedMarket) {
    issues.push({
      code: "market_mismatch",
      severity: "warning",
      message: "The extracted market does not exactly match a live odds market."
    });
    flags.push("market_mismatch");
  }

  if (candidate.confidence < confidenceThreshold) {
    issues.push({
      code: "low_confidence",
      severity: "warning",
      message: `Candidate confidence ${candidate.confidence.toFixed(2)} is below threshold ${confidenceThreshold.toFixed(2)}.`
    });
    flags.push("low_confidence");
  }

  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const status = errorCount > 0 ? "fail" : warningCount > 0 ? "warning" : "pass";

  return qaCheckResultSchema.parse({
    candidateId: candidate.candidateId,
    status,
    pass: status !== "fail",
    confidenceScore: candidate.confidence,
    issues,
    flags: Array.from(new Set(flags)),
    footer
  });
};

export const validateCandidates = (
  candidates: BetCandidate[],
  resolutions: EventResolution[],
  oddsSnapshots: OddsSnapshot[],
  confidenceThreshold = 0.62
) =>
  candidates.map((candidate) =>
    validateBetCandidate(
      candidate,
      resolutions.find((resolution) => resolution.candidateId === candidate.candidateId)!,
      oddsSnapshots.find((snapshot) => snapshot.candidateId === candidate.candidateId)!,
      confidenceThreshold
    )
  );
