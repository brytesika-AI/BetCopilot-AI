const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const toTitle = (value = "") =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const prettyLabel = toTitle;

export const statusTone = (status = "") => {
  if (["pass", "ok", "matched", "resolved"].includes(status)) return "pass";
  if (["warning", "partial", "tentative", "needs_review"].includes(status)) return "warning";
  if (["fail", "failed", "unresolved", "not_found", "rejected"].includes(status)) return "fail";
  return "warning";
};

export const confidenceMeta = (value = 0) => {
  if (value >= 0.85) return { label: "High", tone: "high", value };
  if (value >= 0.7) return { label: "Medium", tone: "medium", value };
  return { label: "Low", tone: "low", value };
};

export const qaMeta = (status = "warning") => {
  if (status === "pass") return { label: "Validated", tone: "pass" };
  if (status === "warning") return { label: "Needs Review", tone: "warning" };
  return { label: "Failed QA", tone: "fail" };
};

export const badge = (label, modifier = "") =>
  `<span class="badge ${modifier}">${escapeHtml(label)}</span>`;

export const statusChip = (label, status) =>
  `<span class="status-chip ${statusTone(status)}">${escapeHtml(label)}</span>`;

export const confidencePill = (value) => {
  const numeric = Number(value ?? 0);
  const meta = confidenceMeta(numeric);
  return `<span class="confidence-pill ${meta.tone}">${meta.label} (${numeric.toFixed(2)})</span>`;
};

export const issueChip = (label) => `<span class="issue-chip">${escapeHtml(label)}</span>`;

export const emptyState = (title, body) => `
  <div class="empty-state">
    <div class="empty-illustration"></div>
    <h4>${escapeHtml(title)}</h4>
    <p>${escapeHtml(body)}</p>
  </div>
`;

export const loadingBlocks = (count = 3) =>
  Array.from({ length: count })
    .map(
      () => `
        <div class="skeleton-card">
          <div class="skeleton-pill"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line long"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-meter"><span></span></div>
        </div>
      `
    )
    .join("");

export const metricCard = (label, value, note) => `
  <article class="metric-card">
    <span class="metric-label">${escapeHtml(label)}</span>
    <div class="metric-value">${escapeHtml(value)}</div>
    <p class="metric-note">${escapeHtml(note)}</p>
  </article>
`;

export const summaryOverviewCard = ({
  candidateCount,
  averageConfidence,
  sourceType,
  stages,
  pipelineStatus
}) => `
  <article class="summary-card summary-card-hero">
    <div class="summary-hero-top">
      <div>
        <span class="summary-label">Extraction Summary</span>
        <h4 class="summary-hero-title">${candidateCount} Bet Candidate${candidateCount === 1 ? "" : "s"} Found</h4>
        <p class="summary-hero-note">BetCopilot AI converted unstructured input into normalized betting intelligence with validation, enrichment, and traceability.</p>
      </div>
      <div class="summary-hero-badges">
        ${confidencePill(averageConfidence)}
        ${statusChip(pipelineStatus === "ok" ? "Ready" : toTitle(pipelineStatus), pipelineStatus)}
      </div>
    </div>
    <div class="summary-hero-meta">
      <span class="meta-item">Source ${escapeHtml(sourceType)}</span>
      <span class="meta-item">Overall confidence ${(averageConfidence * 100).toFixed(0)}%</span>
    </div>
    <div class="summary-stage-row">
      ${stages
        .map(
          (stage) => `
            <div class="summary-stage ${statusTone(stage.status)}">
              <span class="summary-stage-icon">${stage.status === "ok" ? "OK" : stage.status === "warning" ? "!" : "X"}</span>
              <span>${escapeHtml(stage.label)}</span>
            </div>
          `
        )
        .join("")}
    </div>
  </article>
`;

const formatMarketTitle = (marketType = "", candidate = {}) => {
  if (marketType.startsWith("player_points_")) return "Points";
  if (marketType.startsWith("player_passing_touchdowns_")) return "Passing Touchdowns";
  if (marketType === "point_spread") return "Spread";
  if (marketType === "moneyline") return "Moneyline";
  if (marketType === "both_teams_to_score") return "Both Teams To Score";
  return toTitle(marketType || String(candidate.selection || "market"));
};

const buildBetTitle = (candidate) => {
  if (candidate.player && candidate.line !== null && ["over", "under"].includes(candidate.betSide)) {
    return `${candidate.player} - ${toTitle(candidate.betSide)} ${candidate.line} ${formatMarketTitle(candidate.marketType, candidate)}`;
  }
  if (candidate.team && candidate.marketType === "moneyline") {
    return `${candidate.team} - Moneyline`;
  }
  if (candidate.team && candidate.line !== null && candidate.marketType === "point_spread") {
    const signedLine = candidate.line > 0 ? `+${candidate.line}` : `${candidate.line}`;
    return `${candidate.team} - ${signedLine} Spread`;
  }
  if (candidate.marketType === "both_teams_to_score") {
    return `Both Teams To Score - ${candidate.selection}`;
  }
  return candidate.selection || candidate.team || candidate.player || "Bet Candidate";
};

export const betCard = (candidate, qa) => {
  const confidence = confidenceMeta(Number(candidate.confidence ?? 0));
  const qaState = qaMeta(qa?.status ?? "warning");
  return `
    <article class="bet-card">
      <div class="card-topline">
        <div>
          <h4 class="card-title">${escapeHtml(buildBetTitle(candidate))}</h4>
          <p class="card-subtitle">${escapeHtml([candidate.event, candidate.league].filter(Boolean).join(" - ") || toTitle(candidate.sport || ""))}</p>
        </div>
        <div class="badge-row">
          ${confidencePill(candidate.confidence)}
          <span class="status-chip ${qaState.tone}">${escapeHtml(qaState.label)}</span>
        </div>
      </div>
      <div class="visual-meter-block">
        <div class="visual-meter-head">
          <span>Confidence</span>
          <strong>${confidence.label}</strong>
        </div>
        <div class="visual-meter ${confidence.tone}">
          <span style="width:${Math.max(8, Number(candidate.confidence ?? 0) * 100)}%"></span>
        </div>
      </div>
      <div class="meta-grid">
        ${candidate.marketType ? `<span class="meta-item">Market ${escapeHtml(toTitle(candidate.marketType))}</span>` : ""}
        ${candidate.line !== null ? `<span class="meta-item">Line ${escapeHtml(candidate.line)}</span>` : ""}
        ${candidate.betSide ? `<span class="meta-item">Selection ${escapeHtml(toTitle(candidate.betSide))}</span>` : ""}
        ${candidate.team ? `<span class="meta-item">Team ${escapeHtml(candidate.team)}</span>` : ""}
        ${candidate.player ? `<span class="meta-item">Player ${escapeHtml(candidate.player)}</span>` : ""}
      </div>
      <p class="explanation-text">${escapeHtml(candidate.rationale)}</p>
      ${
        candidate.ambiguityFlags?.length
          ? `<div class="issue-chip-row">${candidate.ambiguityFlags.map((flag) => issueChip(toTitle(flag))).join("")}</div>`
          : ""
      }
    </article>
  `;
};

export const oddsCard = (snapshot, resolution) => {
  const leadMarket = snapshot.markets?.[0];
  const comparison = leadMarket?.line !== null ? `Line ${leadMarket.line}` : "No line";
  const oddsLabel = leadMarket
    ? leadMarket.oddsAmerican > 0
      ? `+${leadMarket.oddsAmerican}`
      : `${leadMarket.oddsAmerican}`
    : "N/A";

  return `
    <article class="odds-card">
      <div class="card-topline">
        <div>
          <h4 class="card-title">${escapeHtml(resolution?.matchedEvent || "Event unresolved")}</h4>
          <p class="card-subtitle">${escapeHtml(snapshot.provider || "Provider")} - ${escapeHtml(statusTone(snapshot.status) === "pass" ? "Matched" : statusTone(snapshot.status) === "warning" ? "Partial" : "Not found")}</p>
        </div>
        <div class="badge-row">
          ${statusChip(toTitle(snapshot.status), snapshot.status)}
          ${resolution ? statusChip(toTitle(resolution.status), resolution.status) : ""}
        </div>
      </div>
      ${
        leadMarket
          ? `<div class="odds-spotlight">
              <div>
                <span class="odds-spotlight-label">Live odds</span>
                <div class="odds-spotlight-selection">${escapeHtml(leadMarket.selection)}</div>
                <div class="odds-spotlight-subtitle">${escapeHtml(toTitle(leadMarket.marketType))} - ${escapeHtml(comparison)}</div>
              </div>
              <div class="odds-spotlight-price">${escapeHtml(oddsLabel)}</div>
            </div>`
          : ""
      }
      <div class="meta-grid">
        ${leadMarket?.bookmaker ? `<span class="meta-item">Book ${escapeHtml(leadMarket.bookmaker)}</span>` : ""}
        ${leadMarket?.lastUpdated ? `<span class="meta-item">Updated ${escapeHtml(leadMarket.lastUpdated)}</span>` : ""}
        ${resolution?.commenceTime ? `<span class="meta-item">Event ${escapeHtml(resolution.commenceTime)}</span>` : ""}
      </div>
      <p class="odds-summary">${
        snapshot.matchedMarket
          ? "The extracted market aligned with a normalized odds market."
          : "A nearby odds market was found, but the exact extracted market needs review."
      }</p>
      ${
        snapshot.issues?.length
          ? `<div class="issue-chip-row">${snapshot.issues.map((flag) => issueChip(toTitle(flag))).join("")}</div>`
          : ""
      }
    </article>
  `;
};

export const qaOverviewCard = (qaResults) => {
  const warnings = qaResults.filter((qa) => qa.status === "warning").length;
  const failures = qaResults.filter((qa) => qa.status === "fail").length;
  const label =
    failures > 0
      ? `Failed with ${failures} Issue${failures === 1 ? "" : "s"}`
      : warnings > 0
        ? `Passed with ${warnings} Warning${warnings === 1 ? "" : "s"}`
        : "Passed";
  const chips = [
    qaResults.every((qa) => !qa.flags.includes("missing_selection")) ? "Schema valid" : null,
    qaResults.every((qa) => !qa.flags.includes("unsupported_sport_or_market")) ? "Market parsed" : null,
    qaResults.some((qa) => qa.flags.includes("ambiguous_event")) ? "Event inferred" : null,
    qaResults.some((qa) => qa.flags.includes("market_mismatch")) ? "Odds partial" : "Odds matched"
  ].filter(Boolean);

  return `
    <article class="qa-overview-card">
      <div class="card-topline">
        <div>
          <h4 class="card-title">QA Status: ${escapeHtml(label)}</h4>
          <p class="card-subtitle">Automatic trust and validation checks across extracted bets</p>
        </div>
        <div class="badge-row">
          ${statusChip(failures > 0 ? "Failed" : warnings > 0 ? "Warning" : "Passed", failures > 0 ? "fail" : warnings > 0 ? "warning" : "pass")}
        </div>
      </div>
      <div class="issue-chip-row">
        ${chips.map((chip) => issueChip(chip)).join("")}
      </div>
    </article>
  `;
};

export const qaCard = (qa) => `
  <article class="qa-card">
    <div class="card-topline">
      <div>
        <h4 class="card-title">${escapeHtml(qaMeta(qa.status).label)}</h4>
        <p class="card-subtitle">Per-candidate QA result</p>
      </div>
      <div class="badge-row">
        ${statusChip(toTitle(qa.status), qa.status)}
        ${confidencePill(qa.confidenceScore)}
      </div>
    </div>
    <div class="visual-meter-block">
      <div class="visual-meter-head">
        <span>Trust score</span>
        <strong>${(Number(qa.confidenceScore ?? 0) * 100).toFixed(0)}%</strong>
      </div>
      <div class="visual-meter ${statusTone(qa.status)}">
        <span style="width:${Math.max(8, Number(qa.confidenceScore ?? 0) * 100)}%"></span>
      </div>
    </div>
    <div class="qa-stat-row">
      <div class="qa-stat">
        <span>Issues</span>
        <strong>${qa.issues.length}</strong>
      </div>
      <div class="qa-stat">
        <span>Flags</span>
        <strong>${qa.flags.length}</strong>
      </div>
    </div>
    <p class="qa-summary">${
      qa.issues.length
        ? escapeHtml(qa.issues[0].message)
        : "No blocking issues were raised for this candidate."
    }</p>
    <details class="inline-details">
      <summary>View QA details</summary>
      <div class="issue-chip-row">
        ${qa.flags.map((flag) => issueChip(toTitle(flag))).join("")}
      </div>
    </details>
  </article>
`;

export const explanationCard = (title, body, chips = []) => `
  <article class="explanation-card">
    <h4 class="card-title">${escapeHtml(title)}</h4>
    <p class="explanation-text">${escapeHtml(body)}</p>
    ${chips.length ? `<div class="issue-chip-row">${chips.map((chip) => issueChip(chip)).join("")}</div>` : ""}
  </article>
`;

export const pipelineTraceCard = (trace) => `
  <article class="trace-card">
    <div class="card-topline">
      <div>
        <h4 class="card-title">Pipeline Trace</h4>
        <p class="card-subtitle">Trace ID ${escapeHtml(trace.traceId)} - ${escapeHtml(trace.totalLatencyMs)} ms</p>
      </div>
      <div class="badge-row">
        ${statusChip(toTitle(trace.status), trace.status)}
      </div>
    </div>
    <div class="trace-meta-grid">
      <div class="trace-meta-item">
        <span>Model provider</span>
        <strong>${escapeHtml(trace.model?.provider || "n/a")}</strong>
      </div>
      <div class="trace-meta-item">
        <span>Model name</span>
        <strong>${escapeHtml(trace.model?.name || "n/a")}</strong>
      </div>
      <div class="trace-meta-item">
        <span>Mode</span>
        <strong>${escapeHtml(trace.model?.mode || "n/a")}</strong>
      </div>
      <div class="trace-meta-item">
        <span>Threshold</span>
        <strong>${escapeHtml(trace.confidenceThreshold ?? "n/a")}</strong>
      </div>
    </div>
    <div class="trace-step-list">
      ${trace.steps
        .map(
          (step) => `
            <div class="trace-step ${statusTone(step.status)}">
              <span class="trace-step-icon">${step.status === "ok" ? "OK" : step.status === "warning" ? "!" : "X"}</span>
              <div>
                <strong>${escapeHtml(toTitle(step.stage))}</strong>
                <p>${escapeHtml(step.detail)}</p>
              </div>
              <span class="trace-step-latency">${escapeHtml(step.latencyMs)} ms</span>
            </div>
          `
        )
        .join("")}
    </div>
  </article>
`;

export const evalSummary = (summary, markdown) => `
  ${metricCard("Exact Match Accuracy", `${(summary.exactMatchRate * 100).toFixed(0)}%`, "Candidate-level exact match")}
  ${metricCard("Field Accuracy", `${(summary.fieldLevelMatchRate * 100).toFixed(0)}%`, "Field-level extraction performance")}
  ${metricCard("Schema Pass Rate", `${(summary.schemaPassRate * 100).toFixed(0)}%`, "Valid structured outputs")}
  ${metricCard("Warning Rate", `${(summary.qaWarningRate * 100).toFixed(0)}%`, "Cases requiring analyst review")}
  ${metricCard("Average Latency", `${summary.averageLatencyMs.toFixed(0)} ms`, "End-to-end evaluation runtime")}
  <article class="eval-summary">
    <h4 class="card-title">Evaluation narrative</h4>
    <p>${escapeHtml(markdown)}</p>
  </article>
`;

export const technicalJson = (value) => JSON.stringify(value, null, 2);
