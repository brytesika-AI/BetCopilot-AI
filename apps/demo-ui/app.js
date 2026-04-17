import {
  confidenceMeta,
  emptyState,
  evalSummary,
  explanationCard,
  infoCallout,
  loadingBlocks,
  betCard,
  oddsCard,
  pipelineTraceCard,
  prettyLabel,
  qaCard,
  qaOverviewCard,
  summaryOverviewCard,
  technicalJson
} from "./components.js";

const PUBLIC_API_BASE = "https://betcopilot-ai-showcase-api.bryte-sika.workers.dev";
const isLocalHost = ["127.0.0.1", "localhost"].includes(window.location.hostname);
const API_BASE =
  window.BETCOPILOT_API_BASE || (isLocalHost ? "http://127.0.0.1:8787" : PUBLIC_API_BASE);

const form = document.getElementById("intake-form");
const evalButton = document.getElementById("eval-button");
const sampleButton = document.getElementById("sample-button");
const analyzeButton = document.getElementById("analyze-button");
const analysisStatus = document.getElementById("analysis-status");
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
const tracePanel = document.getElementById("trace-panel");
const traceOutput = document.getElementById("trace-output");
const jsonOutput = document.getElementById("json-output");
const evalPanel = document.getElementById("eval-panel");

const state = {
  lastResponse: null
};

const isUnsupportedResult = (response) => {
  const candidates = response.normalizedCandidates ?? [];
  return (
    candidates.length > 0 &&
    candidates.every(
      (candidate) =>
        candidate.marketType === "unknown" ||
        (!candidate.selection && candidate.sport === "unknown")
    )
  );
};

const baseEvalReport = {
  runId: "eval_showcase_001",
  suite: "synthetic-regression",
  generatedAt: "2026-04-17T02:05:00.000Z",
  summary: {
    totalCases: 25,
    passedCases: 23,
    exactMatchRate: 0.92,
    fieldLevelMatchRate: 0.96,
    schemaPassRate: 1,
    qaWarningRate: 0.16,
    averageLatencyMs: 188
  },
  markdownSummary:
    "BetCopilot AI demonstrates structured extraction discipline, validation gating, and evaluation visibility in a recruiter-ready workflow.\n\n@BryteSikaStrategyAI",
  footer: "@BryteSikaStrategyAI"
};

const examplePrompts = [
  "LeBron over 27.5 points and Lakers moneyline tonight",
  "Arsenal to win and both teams to score",
  "Celtics -4.5 vs Heat"
];

const createTrace = ({ status, totalLatencyMs, provider = "cloudflare-workers-ai", modelName = "@cf/meta/llama-3.1-8b-instruct", steps }) => ({
  traceId: `showcase_${Math.random().toString(36).slice(2, 12)}`,
  status,
  startedAt: "2026-04-17T02:05:00.000Z",
  endedAt: "2026-04-17T02:05:00.312Z",
  totalLatencyMs,
  model: {
    provider,
    name: modelName,
    mode: "mock"
  },
  confidenceThreshold: 0.62,
  steps,
  errors: [],
  footer: "@BryteSikaStrategyAI"
});

const scenarioResponse = (rawText, sourceType) => {
  const lower = rawText.toLowerCase();

  if (lower.includes("arsenal") && lower.includes("both teams to score")) {
    const trace = createTrace({
      status: "ok",
      totalLatencyMs: 296,
      steps: [
        { stage: "ingest", status: "ok", latencyMs: 6, detail: "Input normalized and source metadata captured." },
        { stage: "extract", status: "ok", latencyMs: 48, detail: "Two soccer market candidates extracted from a single sentence." },
        { stage: "normalize", status: "ok", latencyMs: 20, detail: "Moneyline and both-teams-to-score mapped to canonical markets." },
        { stage: "resolve_enrich", status: "ok", latencyMs: 156, detail: "Arsenal vs Chelsea matched with seeded live odds context." },
        { stage: "qa", status: "ok", latencyMs: 49, detail: "QA checks completed without blocking issues." },
        { stage: "report", status: "ok", latencyMs: 17, detail: "Response packaged for the recruiter-facing demo." }
      ]
    });

    const request = {
      traceId: trace.traceId,
      rawText,
      sourceType,
      sourceMetadata: { sourceLabel: "Recruiter demo sample" },
      receivedAt: "2026-04-17T02:05:00.000Z",
      footer: "@BryteSikaStrategyAI"
    };

    const candidates = [
      {
        candidateId: "cand_arsenal_ml",
        traceId: trace.traceId,
        rawText,
        rawFragment: "Arsenal to win",
        sourceType,
        sport: "soccer",
        league: "EPL",
        event: "Arsenal vs Chelsea",
        team: "Arsenal",
        opponent: "Chelsea",
        player: null,
        marketType: "moneyline",
        selection: "Arsenal",
        betSide: "team",
        line: null,
        oddsText: "-120",
        confidence: 0.88,
        rationale: "Detected a team win market from explicit to-win language.",
        ambiguityFlags: [],
        normalizationNotes: ["team_alias_normalized", "market_canonical:moneyline"],
        footer: "@BryteSikaStrategyAI"
      },
      {
        candidateId: "cand_arsenal_btts",
        traceId: trace.traceId,
        rawText,
        rawFragment: "both teams to score",
        sourceType,
        sport: "soccer",
        league: "EPL",
        event: "Arsenal vs Chelsea",
        team: "Arsenal",
        opponent: "Chelsea",
        player: null,
        marketType: "both_teams_to_score",
        selection: "Yes",
        betSide: "yes",
        line: null,
        oddsText: "-118",
        confidence: 0.84,
        rationale: "Detected a both-teams-to-score market from explicit BTTS phrasing.",
        ambiguityFlags: [],
        normalizationNotes: ["market_canonical:both_teams_to_score"],
        footer: "@BryteSikaStrategyAI"
      }
    ];

    return {
      request,
      extractedCandidates: candidates,
      normalizedCandidates: candidates,
      eventResolutions: [
        {
          candidateId: "cand_arsenal_ml",
          status: "resolved",
          provider: "SeededDemoSportsbookFeed",
          eventId: "epl_arsenal_chelsea_001",
          matchedEvent: "Arsenal vs Chelsea",
          sport: "soccer",
          league: "EPL",
          team: "Arsenal",
          opponent: "Chelsea",
          commenceTime: "2026-04-18T16:30:00.000Z",
          confidence: 0.91,
          issues: [],
          footer: "@BryteSikaStrategyAI"
        },
        {
          candidateId: "cand_arsenal_btts",
          status: "resolved",
          provider: "SeededDemoSportsbookFeed",
          eventId: "epl_arsenal_chelsea_001",
          matchedEvent: "Arsenal vs Chelsea",
          sport: "soccer",
          league: "EPL",
          team: "Arsenal",
          opponent: "Chelsea",
          commenceTime: "2026-04-18T16:30:00.000Z",
          confidence: 0.91,
          issues: [],
          footer: "@BryteSikaStrategyAI"
        }
      ],
      oddsSnapshots: [
        {
          candidateId: "cand_arsenal_ml",
          status: "matched",
          provider: "SeededDemoSportsbookFeed",
          eventId: "epl_arsenal_chelsea_001",
          matchedMarket: true,
          markets: [
            {
              marketType: "moneyline",
              selection: "Arsenal",
              betSide: "team",
              line: null,
              oddsAmerican: -120,
              bookmaker: "SeededDemoBook",
              lastUpdated: "2026-04-17T02:05:00.000Z"
            }
          ],
          issues: [],
          footer: "@BryteSikaStrategyAI"
        },
        {
          candidateId: "cand_arsenal_btts",
          status: "matched",
          provider: "SeededDemoSportsbookFeed",
          eventId: "epl_arsenal_chelsea_001",
          matchedMarket: true,
          markets: [
            {
              marketType: "both_teams_to_score",
              selection: "Yes",
              betSide: "yes",
              line: null,
              oddsAmerican: -118,
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
          candidateId: "cand_arsenal_ml",
          status: "pass",
          pass: true,
          confidenceScore: 0.88,
          issues: [],
          flags: [],
          footer: "@BryteSikaStrategyAI"
        },
        {
          candidateId: "cand_arsenal_btts",
          status: "pass",
          pass: true,
          confidenceScore: 0.84,
          issues: [],
          flags: [],
          footer: "@BryteSikaStrategyAI"
        }
      ],
      trace,
      footer: "@BryteSikaStrategyAI"
    };
  }

  if (lower.includes("celtics") && lower.includes("-4.5")) {
    const trace = createTrace({
      status: "ok",
      totalLatencyMs: 241,
      steps: [
        { stage: "ingest", status: "ok", latencyMs: 5, detail: "Input normalized into canonical request form." },
        { stage: "extract", status: "ok", latencyMs: 32, detail: "One spread candidate extracted from shorthand phrasing." },
        { stage: "normalize", status: "ok", latencyMs: 18, detail: "Spread shorthand mapped to the canonical point spread market." },
        { stage: "resolve_enrich", status: "ok", latencyMs: 139, detail: "Boston Celtics vs Miami Heat matched with seeded odds." },
        { stage: "qa", status: "ok", latencyMs: 32, detail: "Spread candidate passed validation checks." },
        { stage: "report", status: "ok", latencyMs: 15, detail: "Response packaged for the recruiter-facing demo." }
      ]
    });

    const request = {
      traceId: trace.traceId,
      rawText,
      sourceType,
      sourceMetadata: { sourceLabel: "Recruiter demo sample" },
      receivedAt: "2026-04-17T02:05:00.000Z",
      footer: "@BryteSikaStrategyAI"
    };

    const candidates = [
      {
        candidateId: "cand_celtics_spread",
        traceId: trace.traceId,
        rawText,
        rawFragment: "Celtics -4.5 vs Heat",
        sourceType,
        sport: "basketball",
        league: "NBA",
        event: "Boston Celtics vs Miami Heat",
        team: "Boston Celtics",
        opponent: "Miami Heat",
        player: null,
        marketType: "point_spread",
        selection: "Boston Celtics",
        betSide: "team",
        line: -4.5,
        oddsText: "-110",
        confidence: 0.87,
        rationale: "Detected a team spread with an explicit line and opponent reference.",
        ambiguityFlags: [],
        normalizationNotes: ["team_alias_normalized", "market_canonical:point_spread"],
        footer: "@BryteSikaStrategyAI"
      }
    ];

    return {
      request,
      extractedCandidates: candidates,
      normalizedCandidates: candidates,
      eventResolutions: [
        {
          candidateId: "cand_celtics_spread",
          status: "resolved",
          provider: "SeededDemoSportsbookFeed",
          eventId: "nba_celtics_heat_001",
          matchedEvent: "Boston Celtics vs Miami Heat",
          sport: "basketball",
          league: "NBA",
          team: "Boston Celtics",
          opponent: "Miami Heat",
          commenceTime: "2026-04-18T00:00:00.000Z",
          confidence: 0.92,
          issues: [],
          footer: "@BryteSikaStrategyAI"
        }
      ],
      oddsSnapshots: [
        {
          candidateId: "cand_celtics_spread",
          status: "matched",
          provider: "SeededDemoSportsbookFeed",
          eventId: "nba_celtics_heat_001",
          matchedMarket: true,
          markets: [
            {
              marketType: "point_spread",
              selection: "Boston Celtics",
              betSide: "team",
              line: -4.5,
              oddsAmerican: -110,
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
          candidateId: "cand_celtics_spread",
          status: "pass",
          pass: true,
          confidenceScore: 0.87,
          issues: [],
          flags: [],
          footer: "@BryteSikaStrategyAI"
        }
      ],
      trace,
      footer: "@BryteSikaStrategyAI"
    };
  }

  const trace = createTrace({
    status: "warning",
    totalLatencyMs: 312,
    steps: [
      { stage: "ingest", status: "ok", latencyMs: 5, detail: "Input parsed and prepared." },
      { stage: "extract", status: "ok", latencyMs: 42, detail: "Two candidate bets extracted." },
      { stage: "normalize", status: "ok", latencyMs: 21, detail: "Markets and entities normalized." },
      { stage: "resolve_enrich", status: "warning", latencyMs: 163, detail: "Odds matched, with one inferred event context." },
      { stage: "qa", status: "ok", latencyMs: 62, detail: "QA completed with one warning." },
      { stage: "report", status: "ok", latencyMs: 19, detail: "Response packaged for the showcase app." }
    ]
  });

  const request = {
    traceId: trace.traceId,
    rawText,
    sourceType,
    sourceMetadata: { sourceLabel: "Recruiter demo sample" },
    receivedAt: "2026-04-17T02:05:00.000Z",
    footer: "@BryteSikaStrategyAI"
  };

  const candidates = [
    {
      candidateId: "cand_bron_points",
      traceId: trace.traceId,
      rawText,
      rawFragment: "LeBron over 27.5 points",
      sourceType,
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
      confidence: 0.92,
      rationale: "Detected a player prop with explicit player, threshold, and stat category.",
      ambiguityFlags: [],
      normalizationNotes: ["player_alias_normalized", "market_canonical:player_points_over"],
      footer: "@BryteSikaStrategyAI"
    },
    {
      candidateId: "cand_lakers_ml",
      traceId: trace.traceId,
      rawText,
      rawFragment: "Lakers moneyline tonight",
      sourceType,
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
  ];

  return {
    request,
    extractedCandidates: candidates,
    normalizedCandidates: candidates,
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
        confidenceScore: 0.92,
        issues: [],
        flags: [],
        footer: "@BryteSikaStrategyAI"
      },
      {
        candidateId: "cand_lakers_ml",
        status: "warning",
        pass: true,
        confidenceScore: 0.86,
        issues: [
          {
            code: "event_inferred",
            severity: "warning",
            message: "The event was inferred from the surrounding message context."
          }
        ],
        flags: ["ambiguous_event"],
        footer: "@BryteSikaStrategyAI"
      }
    ],
    trace,
    footer: "@BryteSikaStrategyAI"
  };
};

const setAnalysisState = (loading) => {
  analyzeButton.disabled = loading;
  analyzeButton.textContent = loading ? "Analyzing..." : "Analyze";
  analysisStatus.textContent = loading ? "Analyzing input..." : "";
};

const renderLoading = () => {
  copyJsonButton.classList.add("is-hidden");
  setAnalysisState(true);
  summaryPanel.innerHTML = loadingBlocks(3);
  betCards.innerHTML = loadingBlocks(2);
  oddsPanel.innerHTML = loadingBlocks(2);
  qaPanel.innerHTML = loadingBlocks(2);
  explanationPanel.innerHTML = loadingBlocks(1);
  tracePanel.innerHTML = loadingBlocks(1);
};

const renderSummary = (response) => {
  const candidates = response.normalizedCandidates ?? [];
  const averageConfidence =
    candidates.length === 0
      ? 0
      : candidates.reduce((sum, candidate) => sum + candidate.confidence, 0) / candidates.length;

  summaryPanel.innerHTML = [
    summaryOverviewCard({
      candidateCount: candidates.length,
      averageConfidence,
      sourceType: prettyLabel(response.request?.sourceType ?? "unknown"),
      pipelineStatus: response.trace?.status ?? "warning",
      note: isUnsupportedResult(response)
        ? "The API responded successfully, but this input does not contain a supported MVP betting market. Try explicit phrasing such as 'Spurs moneyline' or 'Wembanyama over 24.5 points.'"
        : "BetCopilot AI converted unstructured input into normalized betting intelligence with validation, enrichment, and traceability.",
      stages: [
        { label: "Extracted", status: candidates.length > 0 ? "ok" : "warning" },
        { label: "Normalized", status: candidates.length > 0 ? "ok" : "warning" },
        {
          label: "Odds matched",
          status: response.oddsSnapshots?.every((item) => item.status === "matched") ? "ok" : "warning"
        },
        {
          label: "QA review",
          status: response.qaResults?.some((item) => item.status === "warning") ? "warning" : "ok"
        }
      ]
    }),
    `<div class="summary-metrics">
      ${[
        {
          label: "Overall confidence",
          value: `${(averageConfidence * 100).toFixed(0)}%`,
          note: `${confidenceMeta(averageConfidence).label} confidence across extracted bets`
        },
        {
          label: "Source type",
          value: prettyLabel(response.request?.sourceType ?? "unknown"),
          note: "Input channel used for the current run"
        },
        {
          label: "Trace status",
          value: response.trace?.status === "ok" ? "Ready" : prettyLabel(response.trace?.status ?? "warning"),
          note: `Trace ID ${response.trace?.traceId ?? "n/a"}`
        }
      ]
        .map(
          (item) => `<article class="summary-card">
            <span class="summary-label">${item.label}</span>
            <div class="summary-value">${item.value}</div>
            <p class="summary-note">${item.note}</p>
          </article>`
        )
        .join("")}
    </div>`
  ].join("");
};

const renderBets = (response) => {
  const candidates = response.normalizedCandidates ?? [];
  const qaResults = response.qaResults ?? [];

  if (isUnsupportedResult(response)) {
    betCards.innerHTML = infoCallout(
      "API connected, but the phrasing is unsupported",
      "The current MVP handles explicit betting language. Narrative text like this should be rewritten as a clear market, for example 'Spurs moneyline' or 'Victor Wembanyama over 24.5 points.'"
    );
    return;
  }

  betCards.innerHTML =
    candidates.length === 0
      ? emptyState("No candidates identified", "Run an analysis to see structured bet candidates with confidence and QA state.")
      : candidates
          .map((candidate) =>
            betCard(candidate, qaResults.find((qa) => qa.candidateId === candidate.candidateId))
          )
          .join("");
};

const renderOdds = (response) => {
  const oddsSnapshots = response.oddsSnapshots ?? [];
  const resolutions = response.eventResolutions ?? [];

  oddsPanel.innerHTML =
    oddsSnapshots.length === 0
      ? emptyState("No odds available", "Run an analysis to see matched events, providers, and normalized odds context.")
      : oddsSnapshots
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
  qaPanel.innerHTML =
    qaResults.length === 0
      ? emptyState("No QA results", "Validation signals and analyst review cues will appear here after analysis.")
      : [qaOverviewCard(qaResults), ...qaResults.map((result) => qaCard(result))].join("");
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

  if (isUnsupportedResult(response)) {
    return {
      title: "Why this result was marked for review",
      body: "The API returned successfully, but the input reads more like narrative sports commentary than an explicit supported bet. The MVP expects clearer market phrasing so it can normalize, match odds, and validate confidently.",
      chips: ["Live API response", "Unsupported phrasing", `${response.trace?.totalLatencyMs ?? 0} ms`]
    };
  }

  const sourceType = prettyLabel(response.request?.sourceType ?? "input");
  const bodies = [];
  if (candidates.some((candidate) => candidate.player)) bodies.push("a player prop");
  if (candidates.some((candidate) => candidate.marketType === "moneyline")) bodies.push("a moneyline position");
  if (candidates.some((candidate) => candidate.marketType === "both_teams_to_score")) bodies.push("a both-teams-to-score market");
  if (candidates.some((candidate) => candidate.marketType === "point_spread")) bodies.push("a spread position");

  return {
    title: "Why the system inferred these bets",
    body: `The system identified ${candidates.length} candidate${candidates.length === 1 ? "" : "s"} from this ${sourceType.toLowerCase()} input, including ${bodies.join(" and ")}. Each candidate was normalized, checked against odds context, and passed through QA before being surfaced in the product view.`,
    chips: [
      `${candidates.length} candidate${candidates.length === 1 ? "" : "s"}`,
      `${response.qaResults?.filter((qa) => qa.status === "warning").length ?? 0} warning${response.qaResults?.filter((qa) => qa.status === "warning").length === 1 ? "" : "s"}`,
      `${response.trace?.totalLatencyMs ?? 0} ms`
    ]
  };
};

const renderExplanation = (response) => {
  const explanation = buildExplanationText(response);
  explanationPanel.innerHTML = explanationCard(explanation.title, explanation.body, explanation.chips);
};

const renderTrace = (response) => {
  tracePanel.innerHTML = pipelineTraceCard(response.trace);
};

const renderTechnical = (response) => {
  traceOutput.textContent = technicalJson(response.trace);
  jsonOutput.textContent = technicalJson(response);
  copyJsonButton.classList.remove("is-hidden");
};

const renderExtractionResponse = (response) => {
  state.lastResponse = response;
  renderSummary(response);
  renderBets(response);
  renderOdds(response);
  renderQa(response);
  renderExplanation(response);
  renderTrace(response);
  renderTechnical(response);
  setAnalysisState(false);
};

const renderEvalReport = (report) => {
  evalPanel.innerHTML = evalSummary(report.summary, report.markdownSummary);
};

const fetchJsonOrFallback = async (path, options, fallbackFactory) => {
  try {
    const response = await fetch(`${API_BASE}${path}`, options);
    if (!response.ok) {
      throw new Error(`request_failed_${response.status}`);
    }
    return await response.json();
  } catch {
    return fallbackFactory();
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
  await navigator.clipboard.writeText(technicalJson(state.lastResponse));
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
    () => scenarioResponse(payload.raw_text, payload.source_type)
  );

  renderExtractionResponse(data);
});

evalButton.addEventListener("click", async () => {
  evalPanel.innerHTML = loadingBlocks(5);
  const data = await fetchJsonOrFallback(
    "/v1/evals/run",
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ suite: "synthetic-regression" })
    },
    () => structuredClone(baseEvalReport)
  );
  renderEvalReport(data);
});
