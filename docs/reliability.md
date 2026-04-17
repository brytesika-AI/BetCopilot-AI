# Reliability

## Patterns Implemented

- retries with backoff around live odds calls
- schema validation for requests and outputs
- trace IDs at ingestion time
- deterministic fallback model runtime for local operation
- QA gate before accepting a candidate
- explicit ambiguity flags for low-certainty extraction

## Next Reliability Steps

- queue-backed async enrichment
- circuit breaking per provider
- dead-letter handling for ingestion and eval jobs
- Durable Object coordination for long-running screenshot workflows

@BryteSikaStrategyAI
