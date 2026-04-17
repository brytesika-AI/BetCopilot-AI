import { Hono } from "hono";
import { cors } from "hono/cors";
import { extractRequestSchema, footer } from "@betcopilot/core-schemas";
import { runSyntheticEvalSuite } from "@betcopilot/evals";
import { normalizeInput } from "@betcopilot/ingestion";
import { createStructuredModel, extractBetDrafts } from "@betcopilot/llm";
import { validateCandidates } from "@betcopilot/qa";
import { BRAND, jsonHeaders, nowIso, resolveRuntimeConfig } from "@betcopilot/shared";
import { describeMcpTools, enrichCandidates, fetchArticleContent, normalizeCandidates } from "@betcopilot/tools";

type Bindings = {
  APP_NAME: string;
  APP_TAGLINE: string;
  BRAND_FOOTER: string;
  MODEL_PROVIDER?: string;
  MODEL_NAME?: string;
  MODEL_MOCK_MODE?: string;
  CONFIDENCE_THRESHOLD?: string;
  FEATURE_ENABLE_REAL_ODDS_PROVIDER?: string;
};

const app = new Hono<{ Bindings: Bindings }>();
app.use("*", cors());

app.get("/", (c) =>
  c.json(
    {
      name: BRAND.name,
      tagline: BRAND.tagline,
      status: "ok",
      footer
    },
    200,
    jsonHeaders
  )
);

app.get("/v1/metadata", (c) =>
  {
    const config = resolveRuntimeConfig(c.env);
    return c.json(
      {
        product: BRAND,
        runtime: {
          platform: "Cloudflare Workers",
          mode: "public_showcase",
          services: ["Workers", "Seeded showcase API"],
          modelProvider: config.modelProvider,
          modelName: config.modelName,
          modelTask: config.modelTask,
          pipeline: config.pipelineLabel
        },
        footer
      },
      200,
      jsonHeaders
    );
  }
);

app.post("/v1/extract", async (c) => {
  const startedAt = performance.now();
  const request = extractRequestSchema.parse(await c.req.json());
  const config = resolveRuntimeConfig(c.env);
  const rawText =
    request.sourceType === "url" && request.rawText.startsWith("http")
      ? await fetchArticleContent(request.rawText)
      : request.rawText;
  const ingestion = normalizeInput({
    rawText,
    sourceType: request.sourceType,
    sourceMetadata: request.sourceMetadata
  });

  const model = createStructuredModel({
    provider: config.modelProvider,
    modelName: config.modelName,
    mockMode: config.mockMode,
    maxRetries: 2
  });

  const extractedCandidates = await extractBetDrafts(model, ingestion);
  const normalizedCandidates = normalizeCandidates(extractedCandidates);
  const { resolutions, oddsSnapshots } = await enrichCandidates(normalizedCandidates, c.env);
  const qaResults = validateCandidates(
    normalizedCandidates,
    resolutions,
    oddsSnapshots,
    config.confidenceThreshold
  );

  return c.json(
    {
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
        totalLatencyMs: Math.round(performance.now() - startedAt),
        model: {
          provider: config.modelProvider,
          name: config.modelName,
          mode: config.mockMode ? "mock" : "structured"
        },
        confidenceThreshold: config.confidenceThreshold,
        steps: [
          { stage: "ingest", status: "ok", latencyMs: 5, detail: "Input normalized for the public showcase flow." },
          { stage: "extract", status: "ok", latencyMs: 20, detail: `${extractedCandidates.length} candidate bets extracted.` },
          { stage: "normalize", status: "ok", latencyMs: 8, detail: "Canonical normalization completed." },
          { stage: "resolve_enrich", status: "ok", latencyMs: 25, detail: "Seeded odds and event resolution completed." },
          { stage: "qa", status: "ok", latencyMs: 8, detail: "QA checks completed." },
          { stage: "report", status: "ok", latencyMs: 2, detail: "Public showcase response packaged." }
        ],
        errors: [],
        footer
      },
      footer
    },
    200,
    jsonHeaders
  );
});

app.post("/v1/evals/run", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { suite?: string };
  const report = await runSyntheticEvalSuite(c.env, body.suite ?? "synthetic-regression");
  return c.json(report, 200, jsonHeaders);
});

app.post("/mcp/:server", (c) =>
  c.json(
    {
      server: c.req.param("server"),
      protocol: "remote-mcp-json-rpc",
      methods: ["tools/list", "tools/call"],
      tools: describeMcpTools(),
      footer
    },
    200,
    jsonHeaders
  )
);

export default app;
