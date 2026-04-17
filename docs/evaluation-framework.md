# Evaluation Framework

BetCopilot AI includes a real offline MVP evaluation loop, not a placeholder.

## Included in Phase 1

- 25 synthetic eval cases
- easy, medium, ambiguous, multi-bet, and noisy text examples
- JSON eval report
- human-readable markdown summary report

## Metrics

- exact match
- field-level match
- schema pass rate
- event resolution success rate
- QA warning rate
- average confidence
- latency per case

## Why This Matters

The eval framework keeps extraction quality measurable as prompts, heuristics, normalization rules, and provider adapters evolve. It is designed to feel like applied AI engineering rather than a one-off demo.

## Current Implementation

The eval cases live in `packages/evals/src/cases.ts`, and the runner plus report generator live in `packages/evals/src/index.ts`.

@BryteSikaStrategyAI
