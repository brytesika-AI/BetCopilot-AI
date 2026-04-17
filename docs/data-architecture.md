# Data Architecture

## Bronze, Silver, Gold

- Bronze: raw inputs in R2, including text payloads, screenshots, and fetched article bodies
- Silver: extracted structured candidates, intermediate agent outputs, and normalized artifacts
- Gold: validated bets, live odds snapshots, QA outcomes, and operational traces

## Canonical Schemas

- `BetCandidate`
- `EventResolution`
- `OddsSnapshot`
- `ExtractionRun`
- `QACheckResult`
- `EvalCase`
- `EvalRun`
- `UserPreferenceProfile`

## Storage Mapping

- R2: raw files and payloads
- D1: extraction runs, QA payloads, user profiles
- Vectorize: retrieval embeddings for historical cases and analyst memory

@BryteSikaStrategyAI
