# MCP Architecture

Remote MCP servers are hosted on Cloudflare and exposed through the Worker.

## Servers

- Sports Data MCP Server
  - `resolve_sport_event`
  - `get_live_odds`
  - `normalize_market`
  - `compare_candidate_to_live_market`
- Content Extraction MCP Server
  - `fetch_article_content`
- QA / Eval MCP Server
  - `validate_bet_candidate`
  - `run_eval_case`

## Protocol Shape

The Worker exposes `tools/list` and `tools/call` methods over JSON-RPC-style payloads. This keeps the repository deployable today while remaining compatible with a remote MCP hosting model on Cloudflare.

@BryteSikaStrategyAI
