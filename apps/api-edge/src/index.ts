import { Hono } from "hono";
import { cors } from "hono/cors";
import { extractRequestSchema, footer } from "@betcopilot/core-schemas";
import { runSyntheticEvalSuite } from "@betcopilot/evals";
import { createBronzeObject, normalizeInput } from "@betcopilot/ingestion";
import { createStructuredModel, extractBetDrafts } from "@betcopilot/llm";
import { createDefaultProfile } from "@betcopilot/personalization";
import { validateCandidates } from "@betcopilot/qa";
import { BRAND, jsonHeaders, nowIso, resolveRuntimeConfig } from "@betcopilot/shared";
import {
  compareCandidateToLiveMarket,
  describeMcpTools,
  enrichCandidates,
  fetchArticleContent,
  getLiveOdds,
  normalizeCandidate,
  normalizeCandidates,
  resolveSportEvent
} from "@betcopilot/tools";

type Bindings = {
  AI: Ai;
  DB: D1Database;
  RAW_BUCKET: R2Bucket;
  BET_MEMORY_INDEX: VectorizeIndex;
  INGESTION_QUEUE: Queue;
  EVAL_QUEUE: Queue;
  APP_NAME: string;
  APP_TAGLINE: string;
  BRAND_FOOTER: string;
  MODEL_PROVIDER?: string;
  MODEL_NAME?: string;
  MODEL_MOCK_MODE?: string;
  CONFIDENCE_THRESHOLD?: string;
  FEATURE_ENABLE_REAL_ODDS_PROVIDER?: string;
  ODDS_API_BASE_URL?: string;
  ODDS_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();
app.use("*", cors());

const writeBronze = async (env: Bindings, key: string, body: string) => {
  try {
    await env.RAW_BUCKET.put(key, body, {
      httpMetadata: {
        contentType: "application/json"
      }
    });
  } catch (error) {
    console.warn("bronze_write_failed", error);
  }
};

const persistMetadata = async (env: Bindings, traceId: string, sourceType: string, payload: string) => {
  try {
    const statement = env.DB.prepare(
      `INSERT INTO extraction_runs (trace_id, source_type, silver_payload, gold_payload, qa_payload, trace_payload, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    );
    await statement.bind(traceId, sourceType, payload, payload, payload, payload, nowIso()).run();
  } catch (error) {
    console.warn("metadata_persist_failed", error);
  }
};

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
          services: ["Workers AI", "AI Gateway", "R2", "D1", "Vectorize", "Queues"],
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
  const runtimeConfig = resolveRuntimeConfig(c.env);
  const rawText =
    request.sourceType === "url" && request.rawText.startsWith("http")
      ? await fetchArticleContent(request.rawText)
      : request.rawText;
  const ingestion = normalizeInput({
    ...request,
    rawText
  });
  const bronze = createBronzeObject(ingestion);
  await writeBronze(c.env, bronze.key, bronze.body);

  const model = createStructuredModel({
    provider: runtimeConfig.modelProvider,
    modelName: runtimeConfig.modelName,
    mockMode: runtimeConfig.mockMode,
    maxRetries: 2
  });

  const extractedStarted = performance.now();
  const extractedCandidates = await extractBetDrafts(model, ingestion);
  const extractLatency = Math.round(performance.now() - extractedStarted);

  const normalizedStarted = performance.now();
  const normalizedCandidates = normalizeCandidates(extractedCandidates);
  const normalizeLatency = Math.round(performance.now() - normalizedStarted);

  const resolveStarted = performance.now();
  const { resolutions, oddsSnapshots } = await enrichCandidates(normalizedCandidates, c.env);
  const resolveLatency = Math.round(performance.now() - resolveStarted);

  const qaStarted = performance.now();
  const qaResults = validateCandidates(
    normalizedCandidates,
    resolutions,
    oddsSnapshots,
    runtimeConfig.confidenceThreshold
  );
  const qaLatency = Math.round(performance.now() - qaStarted);

  const response = {
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
        provider: runtimeConfig.modelProvider,
        name: runtimeConfig.modelName,
        mode: runtimeConfig.mockMode ? "mock" : "structured"
      },
      confidenceThreshold: runtimeConfig.confidenceThreshold,
      steps: [
        { stage: "ingest", status: "ok", latencyMs: 5, detail: "Input normalized into canonical ingestion packet." },
        { stage: "extract", status: extractedCandidates.length > 0 ? "ok" : "warning", latencyMs: extractLatency, detail: `${extractedCandidates.length} draft candidates extracted.` },
        { stage: "normalize", status: normalizedCandidates.length > 0 ? "ok" : "warning", latencyMs: normalizeLatency, detail: "Canonical normalization applied to extracted drafts." },
        { stage: "resolve_enrich", status: resolutions.some((resolution) => resolution.status === "unresolved") ? "warning" : "ok", latencyMs: resolveLatency, detail: "Event resolution and odds enrichment completed." },
        { stage: "qa", status: qaResults.some((result) => result.status === "fail") ? "failed" : qaResults.some((result) => result.status === "warning") ? "warning" : "ok", latencyMs: qaLatency, detail: "Rule-based QA checks completed." },
        { stage: "report", status: "ok", latencyMs: 2, detail: "Response packaged for BetCopilot AI UI and API consumers." }
      ],
      errors: [],
      footer
    },
    footer
  };

  await persistMetadata(c.env, ingestion.traceId, ingestion.sourceType, JSON.stringify(response));
  return c.json(response, 200, jsonHeaders);
});

app.post("/v1/evals/run", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { suite?: string };
  const result = await runSyntheticEvalSuite(c.env, body.suite ?? "synthetic-regression");
  return c.json(result, 200, jsonHeaders);
});

app.get("/v1/profile/:userId", (c) => c.json(createDefaultProfile(c.req.param("userId")), 200, jsonHeaders));

app.post("/mcp/:server", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    method?: string;
    params?: Record<string, unknown>;
  };

  if (body.method === "tools/list") {
    return c.json(describeMcpTools(), 200, jsonHeaders);
  }

  if (body.method === "tools/call") {
    const name = String(body.params?.name ?? "");
    const args = (body.params?.arguments ?? {}) as Record<string, unknown>;

    switch (name) {
      case "resolve_sport_event":
        return c.json(await resolveSportEvent(args.candidate as never, c.env), 200, jsonHeaders);
      case "get_live_odds":
        return c.json(await getLiveOdds(args.candidate as never, args.resolution as never, c.env), 200, jsonHeaders);
      case "normalize_market":
        return c.json(normalizeCandidate(args.draft as never), 200, jsonHeaders);
      case "fetch_article_content":
        return c.json({ content: await fetchArticleContent(String(args.url ?? "")), footer }, 200, jsonHeaders);
      case "validate_bet_candidate":
        return c.json(
          validateCandidates(
            [args.candidate as never],
            [args.resolution as never],
            [args.odds as never],
            resolveRuntimeConfig(c.env).confidenceThreshold
          )[0],
          200,
          jsonHeaders
        );
      case "compare_candidate_to_live_market":
        return c.json(compareCandidateToLiveMarket(args.candidate as never, args.odds as never), 200, jsonHeaders);
      case "run_eval_case":
        return c.json(await runSyntheticEvalSuite(c.env, String(args.suite ?? "synthetic-regression")), 200, jsonHeaders);
      default:
        return c.json({ error: `Unknown tool ${name}`, footer }, 400, jsonHeaders);
    }
  }

  return c.json({ server: c.req.param("server"), methods: ["tools/list", "tools/call"], footer }, 200, jsonHeaders);
});

export default app;
