import { footer } from "@betcopilot/core-schemas";

export * from "./reference";

export const BRAND = {
  name: "BetCopilot AI",
  tagline: "AI-Powered Betting Intelligence",
  footer
} as const;

export interface RuntimeConfig {
  modelProvider: string;
  modelName: string;
  mockMode: boolean;
  confidenceThreshold: number;
  enableRealOddsProvider: boolean;
}

export const nowIso = () => new Date().toISOString();

export const createTraceId = (prefix = "trace") =>
  `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

export const createId = (prefix = "id") =>
  `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;

export const withBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 2,
  initialDelayMs = 150
): Promise<T> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, initialDelayMs * Math.pow(2, attempt)));
      attempt += 1;
    }
  }

  throw lastError;
};

export const jsonHeaders = {
  "content-type": "application/json; charset=utf-8"
};

export const estimateCostUsd = (tokens: number, ratePer1k = 0.0009) =>
  Number(((tokens / 1000) * ratePer1k).toFixed(6));

export const safeJsonParse = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const collapseWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

export const parseBoolean = (value: string | undefined, fallback: boolean) =>
  value === undefined ? fallback : ["true", "1", "yes", "on"].includes(value.toLowerCase());

export const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readEnvString = (env: Record<string, unknown>, key: string) =>
  typeof env[key] === "string" ? (env[key] as string) : undefined;

export const resolveRuntimeConfig = (env: Record<string, unknown>): RuntimeConfig => ({
  modelProvider: readEnvString(env, "MODEL_PROVIDER") ?? "deterministic",
  modelName: readEnvString(env, "MODEL_NAME") ?? "rule-based-mvp",
  mockMode: parseBoolean(readEnvString(env, "MODEL_MOCK_MODE"), true),
  confidenceThreshold: parseNumber(readEnvString(env, "CONFIDENCE_THRESHOLD"), 0.62),
  enableRealOddsProvider: parseBoolean(readEnvString(env, "FEATURE_ENABLE_REAL_ODDS_PROVIDER"), false)
});
