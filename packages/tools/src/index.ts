import { footer, type BetCandidate, type EventResolution, type OddsSnapshot } from "@betcopilot/core-schemas";
import { MCP_SERVER_DESCRIPTION } from "./catalog";
import { normalizeCandidate, normalizeCandidates } from "./normalization";
import { OddsProviderEnv, SeededOddsProvider, TheOddsApiProvider } from "./providers";

export * from "./catalog";
export * from "./normalization";
export * from "./providers";

const createProviderChain = (env: OddsProviderEnv) => {
  const providers: Array<SeededOddsProvider | TheOddsApiProvider> = [];
  if (env.FEATURE_ENABLE_REAL_ODDS_PROVIDER === "true" && env.ODDS_API_KEY) {
    providers.push(new TheOddsApiProvider(env));
  }
  providers.push(new SeededOddsProvider());
  return providers;
};

export const resolveSportEvent = async (
  candidate: BetCandidate,
  env: OddsProviderEnv = {}
): Promise<EventResolution> => {
  const chain = createProviderChain(env);
  for (const provider of chain) {
    const resolution = await provider.resolveEvent(candidate);
    if (resolution.status !== "unresolved") {
      return resolution;
    }
  }

  return chain[chain.length - 1]!.resolveEvent(candidate);
};

export const getLiveOdds = async (
  candidate: BetCandidate,
  resolution: EventResolution,
  env: OddsProviderEnv = {}
): Promise<OddsSnapshot> => {
  const chain = createProviderChain(env);
  for (const provider of chain) {
    const snapshot = await provider.getOdds(candidate, resolution);
    if (snapshot.status !== "not_found") {
      return snapshot;
    }
  }

  return chain[chain.length - 1]!.getOdds(candidate, resolution);
};

export const enrichCandidates = async (candidates: BetCandidate[], env: OddsProviderEnv = {}) => {
  const resolutions: EventResolution[] = [];
  const oddsSnapshots: OddsSnapshot[] = [];

  for (const candidate of candidates) {
    const resolution = await resolveSportEvent(candidate, env);
    const odds = await getLiveOdds(candidate, resolution, env);
    resolutions.push(resolution);
    oddsSnapshots.push(odds);
  }

  return { resolutions, oddsSnapshots };
};

export const compareCandidateToLiveMarket = (candidate: BetCandidate, odds: OddsSnapshot) => {
  const matched = odds.markets.find(
    (market) =>
      market.marketType === candidate.marketType &&
      market.selection.toLowerCase() === (candidate.selection ?? "").toLowerCase() &&
      (candidate.line === null || market.line === candidate.line)
  );

  return {
    matched: Boolean(matched),
    closestOffer: matched ?? odds.markets[0] ?? null,
    footer
  };
};

export const fetchArticleContent = async (url: string, fetcher: typeof fetch = fetch) => {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`article_fetch_failed:${response.status}`);
  }
  const html = await response.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const describeMcpTools = () => MCP_SERVER_DESCRIPTION;
export { normalizeCandidate, normalizeCandidates };
