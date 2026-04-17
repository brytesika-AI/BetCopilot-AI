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

const API_BASE = window.BETCOPILOT_API_BASE || "http://127.0.0.1:8787";

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

  const response = await fetch(`${API_BASE}/v1/extract`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  renderExtractionResponse(data);
});

evalButton.addEventListener("click", async () => {
  evalPanel.innerHTML = loadingBlocks(6);

  const response = await fetch(`${API_BASE}/v1/evals/run`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ suite: "synthetic-regression" })
  });

  const data = await response.json();
  renderEvalReport(data);
});
