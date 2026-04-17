import {
  betCard,
  emptyState,
  evalSummary,
  explanationCard,
  loadingBlocks,
  oddsCard,
  prettyLabel,
  qaCard,
  statusChip,
  summaryCard,
  toPrettyJson
} from "./components.js";

const isLocalHost = ["127.0.0.1", "localhost"].includes(window.location.hostname);
const API_BASE = window.BETCOPILOT_API_BASE || (isLocalHost ? "http://127.0.0.1:8787" : "");

const form = document.getElementById("intake-form");
const evalButton = document.getElementById("eval-button");
const sampleButton = document.getElementById("sample-button");
const copyJsonButton = document.getElementById("copy-json-button");
const sourceTypeInput = document.getElementById("source-type");
const rawTextInput = document.getElementById("raw-text");
const sourceLabelInput = document.getElementById("source-label");
const sourceUrlInput = document.getElementById("source-url");
const screenshotFileInput = document.getElementById("screenshot-file");
const uploadFilename = document.getElementById("upload-filename");
const urlField = document.getElementById("url-field");
const uploadPanel = document.getElementById("upload-panel");

const summaryPanel = document.getElementById("summary-panel");
const betCards = document.getElementById("bet-cards");
const oddsPanel = document.getElementById("odds-panel");
const qaPanel = document.getElementById("qa-panel");
const explanationPanel = document.getElementById("explanation-panel");
const traceOutput = document.getElementById("trace-output");
const jsonOutput = document.getElementById("json-output");
const evalPanel = document.getElementById("eval-panel");

const state = {
  lastResponse: null
};

const MOCK_EXTRACTION_RESPONSE = {
  request: {
    traceId: "showcase_trace_betcopilot",
    rawText: "LeBron over 27.5 points and Lakers moneyline tonight",
    sourceType: "chat_text",
    sourceMetadata: {
      sourceLabel: "Public showcase mode"
    },
    receivedAt: "2026-04-17T02:05:00.000Z",
    footer: "@BryteSikaStrategyAI"
  },
  extractedCandidates: [
    {
      candidateId: "cand_bron_points",
      traceId: "showcase_trace_betcopilot",
      rawText: "LeBron over 27.5 points and Lakers moneyline tonight",
      rawFragment: "LeBron over 27.5 points",
      sourceType: "chat_text",
      sport: "basketball",
      league: "NBA",
      event: "Los Angeles Lakers vs Golden State Warriors",
      team: "Los Angeles Lakers",
      opponent: "Golden State Warriors",
      player: "LeBron James",
      marketType: "player_points_over",
      selection: "LeBron James",
      betSide: "over",
      line: 27.5,
      oddsText: "-112",
      confidence: 0.9,
      rationale: "Detected a player prop with explicit player, threshold, and stat category.",
      ambiguityFlags: [],
      normalizationNotes: ["player_alias_normalized", "market_canonical:player_points_over"],
      footer: "@BryteSikaStrategyAI"
    },
    {
      candidateId: "cand_lakers_ml",
      traceId: "showcase_trace_betcopilot",
      rawText: "LeBron over 27.5 points and Lakers moneyline tonight",
      sourceType: "chat_text",
      sport: "basketball",
      league: "NBA",
      event: "Los Angeles Lakers vs Golden State Warriors",
      team: "Los Angeles Lakers",
      opponent: "Golden State Warriors",
      player: null,
      marketType: "moneyline",
      selection: "Los Angeles Lakers",
      betSide: "team",
      line: null,
      oddsText: "-155",
      confidence: 0.86,
      rationale: "Detected a team win market from moneyline language.",
      ambiguityFlags: [],
      normalizationNotes: ["team_alias_normalized", "market_canonical:moneyline"],
      footer: "@BryteSikaStrategyAI"
    }
  ],
  normalizedCandidates: [],
  eventResolutions: [
    {
      candidateId: "cand_bron_points",
      status: "resolved",
      provider: "SeededDemoSportsbookFeed",
      eventId: "nba_lakers_warriors_001",
      matchedEvent: "Los Angeles Lakers vs Golden State Warriors",
      sport: "basketball",
      league: "NBA",
      team: "Los Angeles Lakers",
      opponent: "Golden State Warriors",
      commenceTime: "2026-04-17T23:30:00.000Z",
      confidence: 0.93,
      issues: [],
      footer: "@BryteSikaStrategyAI"
    },
    {
      candidateId: "cand_lakers_ml",
      status: "resolved",
      provider: "SeededDemoSportsbookFeed",
      eventId: "nba_lakers_warriors_001",
      matchedEvent: "Los Angeles Lakers vs Golden State Warriors",
      sport: "basketball",
      league: "NBA",
      team: "Los Angeles Lakers",
      opponent: "Golden State Warriors",
      commenceTime: "2026-04-17T23:30:00.000Z",
      confidence: 0.93,
      issues: [],
      footer: "@BryteSikaStrategyAI"
    }
  ],
  oddsSnapshots: [
    {
      candidateId: "cand_bron_points",
      status: "matched",
      provider: "SeededDemoSportsbookFeed",
      eventId: "nba_lakers_warriors_001",
      matchedMarket: true,
      markets: [
        {
          marketType: "player_points_over",
          selection: "LeBron James",
          betSide: "over",
          line: 27.5,
          oddsAmerican: -112,
          bookmaker: "SeededDemoBook",
          lastUpdated: "2026-04-17T02:05:00.000Z"
        },
        {
          marketType: "player_points_under",
          selection: "LeBron James",
          betSide: "under",
          line: 27.5,
          oddsAmerican: -108,
          bookmaker: "SeededDemoBook",
          lastUpdated: "2026-04-17T02:05:00.000Z"
        }
      ],
      issues: [],
      footer: "@BryteSikaStrategyAI"
    },
    {
      candidateId: "cand_lakers_ml",
      status: "matched",
      provider: "SeededDemoSportsbookFeed",
      eventId: "nba_lakers_warriors_001",
      matchedMarket: true,
      markets: [
        {
          marketType: "moneyline",
          selection: "Los Angeles Lakers",
          betSide: "team",
          line: null,
          oddsAmerican: -155,
          bookmaker: "SeededDemoBook",
          lastUpdated: "2026-04-17T02:05:00.000Z"
        },
        {
          marketType: "moneyline",
          selection: "Golden State Warriors",
          betSide: "team",
          line: null,
          oddsAmerican: 132,
          bookmaker: "SeededDemoBook",
          lastUpdated: "2026-04-17T02:05:00.000Z"
        }
      ],
      issues: [],
      footer: "@BryteSikaStrategyAI"
    }
  ],
  qaResults: [
    {
      candidateId: "cand_bron_points",
      status: "pass",
      pass: true,
      confidenceScore: 0.9,
      issues: [],
      flags: [],
      footer: "@BryteSikaStrategyAI"
    },
    {
      candidateId: "cand_lakers_ml",
      status: "pass",
      pass: true,
      confidenceScore: 0.86,
      issues: [],
      flags: [],
      footer: "@BryteSikaStrategyAI"
    }
  ],
  trace: {
    traceId: "showcase_trace_betcopilot",
    status: "ok",
    startedAt: "2026-04-17T02:05:00.000Z",
    endedAt: "2026-04-17T02:05:00.312Z",
    totalLatencyMs: 312,
    model: {
      provider: "showcase-demo",
      name: "betcopilot-ui-demo-mode",
      mode: "mock"
    },
    confidenceThreshold: 0.62,
    steps: [
      { stage: "ingest", status: "ok", latencyMs: 5, detail: "Public showcase input prepared." },
      { stage: "extract", status: "ok", latencyMs: 42, detail: "Two candidate bets identified." },
      { stage: "normalize", status: "ok", latencyMs: 21, detail: "Canonical market and entity mapping completed." },
      { stage: "resolve_enrich", status: "ok", latencyMs: 163, detail: "Seeded odds and event matches applied." },
      { stage: "qa", status: "ok", latencyMs: 62, detail: "Trust checks completed without warnings." },
      { stage: "report", status: "ok", latencyMs: 19, detail: "Showcase response packaged for the public demo." }
    ],
    errors: [],
    footer: "@BryteSikaStrategyAI"
  },
  footer: "@BryteSikaStrategyAI"
};

MOCK_EXTRACTION_RESPONSE.normalizedCandidates = MOCK_EXTRACTION_RESPONSE.extractedCandidates;

const MOCK_EVAL_REPORT = {
  runId: "eval_showcase_001",
  suite: "synthetic-regression",
  generatedAt: "2026-04-17T02:05:00.000Z",
  summary: {
    totalCases: 25,
    passedCases: 23,
    exactMatchRate: 0.92,
    fieldLevelMatchRate: 0.96,
    schemaPassRate: 1,
    eventResolutionSuccessRate: 0.92,
    qaWarningRate: 0.16,
    averageConfidence: 0.83,
    averageLatencyMs: 188
  },
  markdownSummary:
    "BetCopilot AI showcase mode is presenting a seeded evaluation summary. The public demo emphasizes extraction quality, QA discipline, and latency visibility without requiring private infrastructure bindings.\n\n@BryteSikaStrategyAI",
  footer: "@BryteSikaStrategyAI"
};

const examplePrompts = [
  "LeBron over 27.5 points and Lakers moneyline tonight",
  "Arsenal to win and both teams to score",
  "Mahomes over 2.5 passing touchdowns and Chiefs ML"
];

const renderLoading = () => {
  copyJsonButton.classList.add("is-hidden");
  summaryPanel.innerHTML = loadingBlocks(4);
  betCards.innerHTML = loadingBlocks(2);
  oddsPanel.innerHTML = loadingBlocks(2);
  qaPanel.innerHTML = loadingBlocks(2);
  explanationPanel.innerHTML = loadingBlocks(1);
};

const renderSummary = (response) => {
  const candidates = response.normalizedCandidates ?? [];
  const averageConfidence =
    candidates.length === 0
      ? 0
      : candidates.reduce((sum, candidate) => sum + candidate.confidence, 0) / candidates.length;
  const sourceType = prettyLabel(response.request?.sourceType ?? "unknown");
  const pipelineStatus = response.trace?.status ?? "warning";

  summaryPanel.innerHTML = [
    summaryCard("Bet candidates", String(candidates.length), "Structured opportunities identified"),
    summaryCard("Overall confidence", `${(averageConfidence * 100).toFixed(0)}%`, "Average across normalized candidates"),
    summaryCard("Source type", sourceType, "Input mode used for this run"),
    summaryCard("Pipeline status", pipelineStatus === "ok" ? "Ready" : prettyLabel(pipelineStatus), "Operational state after QA")
  ].join("");
};

const renderBets = (response) => {
  const candidates = response.normalizedCandidates ?? [];
  const qaResults = response.qaResults ?? [];

  if (candidates.length === 0) {
    betCards.innerHTML = emptyState("No bets extracted", "Try a clearer betting phrase or use one of the sample prompts.");
    return;
  }

  betCards.innerHTML = candidates
    .map((candidate) =>
      betCard(
        candidate,
        qaResults.find((qa) => qa.candidateId === candidate.candidateId)
      )
    )
    .join("");
};

const renderOdds = (response) => {
  const oddsSnapshots = response.oddsSnapshots ?? [];
  const resolutions = response.eventResolutions ?? [];

  if (oddsSnapshots.length === 0) {
    oddsPanel.innerHTML = emptyState("No odds available", "Odds enrichment was not available for this request.");
    return;
  }

  oddsPanel.innerHTML = oddsSnapshots
    .map((snapshot) =>
      oddsCard(
        snapshot,
        resolutions.find((resolution) => resolution.candidateId === snapshot.candidateId)
      )
    )
    .join("");
};

const renderQa = (response) => {
  const qaResults = response.qaResults ?? [];
  if (qaResults.length === 0) {
    qaPanel.innerHTML = emptyState("No QA results", "Validation signals will appear here after a run.");
    return;
  }

  qaPanel.innerHTML = qaResults.map((result) => qaCard(result)).join("");
};

const buildExplanationText = (response) => {
  const candidates = response.normalizedCandidates ?? [];
  if (candidates.length === 0) {
    return {
      title: "No confident betting interpretation",
      body: "BetCopilot AI could not identify a supported market from the submitted input.",
      chips: []
    };
  }

  const sourceType = prettyLabel(response.request?.sourceType ?? "input");
  const candidateCount = candidates.length;
  const candidateText =
    candidateCount === 1
      ? `one betting candidate from this ${sourceType.toLowerCase()} input`
      : `${candidateCount} betting candidates from this ${sourceType.toLowerCase()} input`;
  const ambiguityCount = candidates.reduce(
    (count, candidate) => count + (candidate.ambiguityFlags?.length ?? 0),
    0
  );
  const body = `BetCopilot AI inferred ${candidateText}, normalized team and market language into canonical betting objects, attempted event and odds resolution, and then applied QA before surfacing results. ${
    ambiguityCount > 0
      ? "Some ambiguity signals remain visible so analysts can review them quickly."
      : "The current output resolved cleanly without major ambiguity."
  }`;

  return {
    title: "Concise explanation",
    body,
    chips: [
      `${candidateCount} candidate${candidateCount === 1 ? "" : "s"}`,
      `${(response.trace?.totalLatencyMs ?? 0).toFixed(0)} ms total latency`,
      statusChip(prettyLabel(response.trace?.status ?? "ok"), response.trace?.status ?? "ok").replace(
        /<\/?span[^>]*>/g,
        ""
      )
    ]
  };
};

const renderExplanation = (response) => {
  const explanation = buildExplanationText(response);
  explanationPanel.innerHTML = explanationCard(
    explanation.title,
    explanation.body,
    explanation.chips
  );
};

const renderTechnical = (response) => {
  traceOutput.textContent = toPrettyJson(response.trace);
  jsonOutput.textContent = toPrettyJson(response);
  copyJsonButton.classList.remove("is-hidden");
};

const renderExtractionResponse = (response) => {
  state.lastResponse = response;
  renderSummary(response);
  renderBets(response);
  renderOdds(response);
  renderQa(response);
  renderExplanation(response);
  renderTechnical(response);
};

const renderEvalReport = (report) => {
  evalPanel.innerHTML = evalSummary(report.summary, report.markdownSummary);
};

const fetchJsonOrFallback = async (path, options, fallback) => {
  if (!API_BASE) {
    return structuredClone(fallback);
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, options);
    if (!response.ok) {
      throw new Error(`request_failed_${response.status}`);
    }
    return await response.json();
  } catch {
    return structuredClone(fallback);
  }
};

const setMode = (mode) => {
  sourceTypeInput.value = mode;
  document.querySelectorAll(".segment").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === mode);
  });
  urlField.classList.toggle("is-hidden", mode !== "url");
  uploadPanel.classList.toggle("is-hidden", mode !== "screenshot");

  if (mode === "url") {
    rawTextInput.placeholder = "Paste a URL or article text to analyze.";
  } else if (mode === "screenshot") {
    rawTextInput.placeholder = "Add optional context for the screenshot, such as the bet slip source.";
  } else {
    rawTextInput.placeholder = "Paste text, article excerpts, or social betting chatter here.";
  }
};

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

document.querySelectorAll(".example-chip").forEach((button) => {
  button.addEventListener("click", () => {
    const example = button.dataset.example || "";
    rawTextInput.value = example;
    if (example.toLowerCase().includes("screenshot")) {
      setMode("screenshot");
    } else {
      setMode("chat_text");
    }
  });
});

sampleButton.addEventListener("click", () => {
  rawTextInput.value = examplePrompts[0];
  sourceLabelInput.value = "Recruiter demo sample";
  setMode("chat_text");
});

screenshotFileInput.addEventListener("change", () => {
  const file = screenshotFileInput.files?.[0];
  uploadFilename.textContent = file ? file.name : "No file selected";
});

copyJsonButton.addEventListener("click", async () => {
  if (!state.lastResponse) return;
  await navigator.clipboard.writeText(toPrettyJson(state.lastResponse));
  copyJsonButton.textContent = "Copied";
  setTimeout(() => {
    copyJsonButton.textContent = "Copy technical JSON";
  }, 1200);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  renderLoading();

  const payload = {
    raw_text:
      sourceTypeInput.value === "url" && sourceUrlInput.value
        ? sourceUrlInput.value
        : sourceTypeInput.value === "screenshot" && !rawTextInput.value.trim()
          ? `Analyze screenshot: ${screenshotFileInput.files?.[0]?.name || "uploaded image"}`
          : rawTextInput.value,
    source_type: sourceTypeInput.value,
    source_metadata: {
      sourceLabel: sourceLabelInput.value || "Demo input",
      sourceUrl: sourceUrlInput.value || undefined,
      screenshotUrl:
        sourceTypeInput.value === "screenshot" && screenshotFileInput.files?.[0]
          ? `local://${screenshotFileInput.files[0].name}`
          : undefined
    }
  };

  const data = await fetchJsonOrFallback(
    "/v1/extract",
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    },
    MOCK_EXTRACTION_RESPONSE
  );
  renderExtractionResponse(data);
});

evalButton.addEventListener("click", async () => {
  evalPanel.innerHTML = loadingBlocks(6);

  const data = await fetchJsonOrFallback(
    "/v1/evals/run",
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ suite: "synthetic-regression" })
    },
    MOCK_EVAL_REPORT
  );
  renderEvalReport(data);
});
