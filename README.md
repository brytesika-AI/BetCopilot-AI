# BetCopilot AI

**AI-Powered Betting Intelligence**

BetCopilot AI is a production-minded applied AI repository that converts messy sports betting language into structured, validated betting intelligence. The product demo now pairs the working MVP pipeline with a polished, mobile-friendly presentation layer so the repo feels like a modern AI product instead of a developer console.

## Product Experience

The recruiter demo is designed for screenshots, portfolio use, and hiring-manager walkthroughs.

- premium hero input flow
- segmented input modes for text, URL, and screenshot context
- card-first results for bet candidates, odds, QA, and explanations
- loading skeletons and polished empty states
- technical trace and JSON available in a secondary drawer
- mobile-friendly layout that stacks cleanly on narrow screens

## MVP Pipeline

1. ingest
2. extract
3. normalize
4. resolve and enrich
5. QA
6. trace and report

## What Works Now

- text ingestion with `raw_text`, `source_type`, and optional metadata
- multi-candidate extraction from one passage
- canonical normalization for sport, league, team alias, player alias, market type, line, and odds text
- odds provider abstraction with a real The Odds API adapter and seeded fallback provider
- rule-based QA with warnings and failures
- offline eval suite with 25 synthetic cases
- modern recruiter demo UI with card-based product presentation

## Run Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the API:

   ```bash
   npm run dev:api
   ```

3. Start the UI:

   ```bash
   npm run dev:ui
   ```

4. Open:

   ```text
   http://127.0.0.1:4173
   ```

## Demo Story

Use the sample prompt:

`LeBron over 27.5 points and Lakers moneyline tonight`

BetCopilot AI presents:

- an extraction summary
- two premium bet cards
- odds enrichment cards
- QA and trust cards
- a concise explanation panel
- technical details tucked into a drawer

## Responsive UX Notes

- desktop uses a two-column product layout for fast scanning
- mobile stacks hero, results, and eval cards vertically
- buttons remain full-width and tappable on smaller screens
- raw JSON is hidden by default and only appears inside the technical drawer

## Environment

See `.env.example` for MVP configuration values.

@BryteSikaStrategyAI
