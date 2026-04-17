# Recruiter Demo Guide

## What BetCopilot AI Is

BetCopilot AI is an applied AI product that turns noisy sports betting language into structured, validated betting intelligence. It combines Cloudflare-native orchestration, LLM extraction, deterministic normalization, odds enrichment, QA gating, and evaluation workflows in a recruiter-friendly interface.

## What Problem It Solves

Sports betting inputs are messy. Users describe bets with shorthand, partial event references, screenshots, copied articles, and social-style phrasing. BetCopilot AI converts those inputs into structured bet candidates, attaches confidence and QA signals, and shows the operational trace behind the result.

## Best Demo Setup

1. Open the demo UI.
2. Keep the first view on the hero and input card for a clean product impression.
3. Use one of the polished example prompts below.
4. Click **Analyze**.
5. Walk down the page in order: summary, bet cards, odds, QA, explanation, trace, then technical drawer.
6. Click **Run eval demo** to show the offline evaluation framework.

## Demo Scenario 1

**Prompt**

`LeBron over 27.5 points and Lakers moneyline tonight`

**What to click**

- choose `Text`
- paste the prompt
- click `Analyze`

**What the recruiter should notice**

- two bet candidates are extracted from one input
- the system separates a player prop from a team moneyline
- confidence and QA are visible without opening raw JSON
- trace metadata shows provider, model, stage timing, and trace ID

## Demo Scenario 2

**Prompt**

`Arsenal to win and both teams to score`

**What to click**

- keep `Text` selected
- paste the prompt
- click `Analyze`

**What the recruiter should notice**

- the system handles a soccer market and a same-event companion market
- normalization maps the phrasing into canonical market types
- odds enrichment shows event match and bookmaker context
- QA highlights any inferred context instead of hiding ambiguity

## Demo Scenario 3

**Prompt**

`Celtics -4.5 vs Heat`

**What to click**

- keep `Text` selected
- paste the prompt
- click `Analyze`

**What the recruiter should notice**

- spread parsing is handled deterministically after extraction
- the output remains concise and product-like even for technical workflows
- the trust panel and trace panel make system reasoning visible

## Key Technical Talking Points

- Cloudflare Workers handles API orchestration and remote MCP-style tool endpoints
- Cloudflare Workers AI powers structured extraction rather than a generic chat response
- deterministic normalization and schema validation reduce ambiguity and improve reliability
- provider-based odds enrichment keeps external integrations swappable
- QA checks gate confidence and surface unresolved conditions explicitly
- offline evals make the system measurable across exact match, field accuracy, warnings, and latency

## What To Show In The UI

- premium input shell with example chips
- extraction summary and confidence state
- polished bet cards instead of raw JSON
- visible technical trace card with model provider, model name, pipeline stages, latency, and trace ID
- eval dashboard with recruiter-readable metrics

## Screenshot Moments

Capture these views for README or outreach:

- hero plus input card
- results section after Scenario 1
- QA and trace sections on mobile width
- eval dashboard after running the synthetic suite

@BryteSikaStrategyAI
