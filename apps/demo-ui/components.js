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

export const statusTone = (status = "") => {
  if (status === "pass" || status === "ok" || status === "matched") return "pass";
  if (status === "warning" || status === "partial" || status === "tentative") return "warning";
  if (status === "fail" || status === "failed" || status === "unresolved" || status === "not_found") return "fail";
  return "warning";
};

export const badge = (label) => `<span class="badge">${escapeHtml(label)}</span>`;

export const confidencePill = (value) =>
  `<span class="confidence-pill">Confidence ${(Number(value ?? 0) * 100).toFixed(0)}%</span>`;

export const statusChip = (label, status) =>
  `<span class="status-chip ${statusTone(status)}">${escapeHtml(label)}</span>`;

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

export const summaryCard = (label, value, note) => `
  <article class="summary-card">
    <span class="summary-label">${escapeHtml(label)}</span>
    <div class="summary-value">${escapeHtml(value)}</div>
    <p class="summary-note">${escapeHtml(note)}</p>
  </article>
`;

export const metricCard = (label, value, note) => `
  <article class="metric-card">
    <span class="metric-label">${escapeHtml(label)}</span>
    <div class="metric-value">${escapeHtml(value)}</div>
    <p class="metric-note">${escapeHtml(note)}</p>
  </article>
`;

export const betCard = (candidate, qa) => `
  <article class="bet-card">
    <div class="card-topline">
      <div>
        <h4 class="card-title">${escapeHtml(candidate.selection || candidate.team || candidate.player || "Candidate")}</h4>
        <p class="card-subtitle">${escapeHtml(toTitle(candidate.marketType))}</p>
      </div>
      <div class="badge-row">
        ${confidencePill(candidate.confidence)}
        ${statusChip(qa ? toTitle(qa.status) : "Pending", qa?.status || "warning")}
      </div>
    </div>
    <div class="visual-meter-block">
      <div class="visual-meter-head">
        <span>Confidence</span>
        <strong>${(Number(candidate.confidence ?? 0) * 100).toFixed(0)}%</strong>
      </div>
      <div class="visual-meter">
        <span style="width:${Math.max(8, Number(candidate.confidence ?? 0) * 100)}%"></span>
      </div>
    </div>
    <div class="meta-grid">
      ${candidate.sport ? `<span class="meta-item">${escapeHtml(toTitle(candidate.sport))}</span>` : ""}
      ${candidate.league ? `<span class="meta-item">${escapeHtml(candidate.league)}</span>` : ""}
      ${candidate.event ? `<span class="meta-item">${escapeHtml(candidate.event)}</span>` : ""}
      ${candidate.line !== null ? `<span class="meta-item">Line ${escapeHtml(candidate.line)}</span>` : ""}
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

export const oddsCard = (snapshot, resolution) => {
  const leadMarket = snapshot.markets?.[0];
  const spotlightMarkets = (snapshot.markets || []).slice(0, 3);
  return `
    <article class="odds-card">
      <div class="card-topline">
        <div>
          <h4 class="card-title">${escapeHtml(resolution?.matchedEvent || "Event resolution pending")}</h4>
          <p class="card-subtitle">${escapeHtml(snapshot.provider || "Provider")}</p>
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
                <span class="odds-spotlight-label">Best available signal</span>
                <div class="odds-spotlight-selection">${escapeHtml(leadMarket.selection)}</div>
                <div class="odds-spotlight-subtitle">${escapeHtml(toTitle(leadMarket.marketType))}${leadMarket.line !== null ? ` · ${escapeHtml(leadMarket.line)}` : ""}</div>
              </div>
              <div class="odds-spotlight-price">${escapeHtml(leadMarket.oddsAmerican > 0 ? `+${leadMarket.oddsAmerican}` : leadMarket.oddsAmerican)}</div>
            </div>`
          : ""
      }
      <div class="odds-mini-grid">
        ${spotlightMarkets
          .map(
            (market) => `
              <div class="odds-mini-card">
                <span>${escapeHtml(market.selection)}</span>
                <strong>${escapeHtml(market.oddsAmerican > 0 ? `+${market.oddsAmerican}` : market.oddsAmerican)}</strong>
              </div>
            `
          )
          .join("")}
      </div>
      <p class="odds-summary">${
        snapshot.matchedMarket
          ? "A market aligned with the extracted candidate was found."
          : "No exact market match was found, but nearby market context is available."
      }</p>
      ${
        snapshot.issues?.length
          ? `<div class="issue-chip-row">${snapshot.issues.map((flag) => issueChip(toTitle(flag))).join("")}</div>`
          : ""
      }
    </article>
  `;
};

export const qaCard = (qa) => `
  <article class="qa-card">
    <div class="card-topline">
      <div>
        <h4 class="card-title">${escapeHtml(toTitle(qa.status))}</h4>
        <p class="card-subtitle">Quality and trust assessment</p>
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
        : "No issues were raised for this candidate."
    }</p>
    <div class="issue-chip-row">
      ${qa.flags.map((flag) => issueChip(toTitle(flag))).join("")}
    </div>
  </article>
`;

export const explanationCard = (title, body, chips = []) => `
  <article class="explanation-card">
    <h4 class="card-title">${escapeHtml(title)}</h4>
    <p class="explanation-text">${escapeHtml(body)}</p>
    ${chips.length ? `<div class="issue-chip-row">${chips.map((chip) => issueChip(chip)).join("")}</div>` : ""}
  </article>
`;

export const evalSummary = (summary, markdown) => `
  ${metricCard("Exact Match", `${(summary.exactMatchRate * 100).toFixed(0)}%`, "Candidate-level exact match")}
  ${metricCard("Field Accuracy", `${(summary.fieldLevelMatchRate * 100).toFixed(0)}%`, "Field-level extraction quality")}
  ${metricCard("Schema Pass", `${(summary.schemaPassRate * 100).toFixed(0)}%`, "Valid structured outputs")}
  ${metricCard("Resolution Rate", `${(summary.eventResolutionSuccessRate * 100).toFixed(0)}%`, "Resolved or tentatively matched events")}
  ${metricCard("Avg Latency", `${summary.averageLatencyMs.toFixed(0)} ms`, "End-to-end eval latency")}
  ${metricCard("Warning Rate", `${(summary.qaWarningRate * 100).toFixed(0)}%`, "Cases that triggered QA review")}
  <article class="eval-summary">
    <h4 class="card-title">Eval narrative</h4>
    <p>${escapeHtml(markdown)}</p>
  </article>
`;

export const toPrettyJson = (value) => JSON.stringify(value, null, 2);
export const prettyLabel = toTitle;
