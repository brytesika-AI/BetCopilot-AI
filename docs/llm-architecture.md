# LLM Architecture

BetCopilot AI uses specialized stages instead of one large prompt.

## Agents

- Input Interpreter
- Bet Extractor
- Entity Resolver
- Market Normalizer
- QA / Consistency Agent
- Explanation Generator
- Eval Judge

## Design Principles

- strict schemas at every boundary
- deterministic fallback for local development
- clear tool interfaces for external data resolution
- separate extraction from validation
- explicit ambiguity handling

## Multimodal Direction

Screenshots are first-class inputs. The intended path is upload, preprocess, multimodal extraction, QA, and storage. OCR remains the fallback when multimodal understanding confidence drops below threshold.

@BryteSikaStrategyAI
