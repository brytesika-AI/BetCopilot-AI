# Solution Architecture

## Runtime

- `apps/api-edge`: Cloudflare Worker hosting the API, orchestration flow, and remote MCP endpoints
- `apps/demo-ui`: lightweight recruiter-facing frontend
- `packages/*`: shared schemas, ingestion, LLM pipeline, tools, QA, evals, and personalization

## Core Request Path

1. Request enters `/v1/extract`
2. Input normalization creates a trace ID and bronze artifact
3. Raw payload persists to R2
4. Specialized extraction agents produce a structured bet candidate
5. Sports tooling resolves the event and fetches odds
6. QA gate validates the candidate against the resolved market
7. D1 stores extraction metadata and gold outputs
8. Response returns structured intelligence and trace metadata

## Cloudflare Services

- Workers for orchestration
- Workers AI for model inference
- AI Gateway for routing and observability
- R2 for bronze storage
- D1 for silver and gold metadata
- Vectorize for analyst memory retrieval
- Queues for asynchronous ingestion and eval expansion

@BryteSikaStrategyAI
