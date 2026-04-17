import { footer, ingestionInputSchema, type IngestionInput } from "@betcopilot/core-schemas";
import { collapseWhitespace, createTraceId, nowIso } from "@betcopilot/shared";

export const normalizeInput = (request: {
  rawText: string;
  sourceType: IngestionInput["sourceType"];
  sourceMetadata?: IngestionInput["sourceMetadata"];
}): IngestionInput =>
  ingestionInputSchema.parse({
    traceId: createTraceId("ing"),
    rawText: collapseWhitespace(request.rawText),
    sourceType: request.sourceType,
    sourceMetadata: request.sourceMetadata,
    receivedAt: nowIso(),
    footer
  });

export const createBronzeObject = (normalized: IngestionInput) => ({
  key: `bronze/${normalized.traceId}.json`,
  body: JSON.stringify(normalized, null, 2)
});
