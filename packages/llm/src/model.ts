import { z } from "zod";
import { withBackoff } from "@betcopilot/shared";

export interface StructuredModelConfig {
  provider: string;
  modelName: string;
  mockMode: boolean;
  maxRetries: number;
}

export interface StructuredRequest<T> {
  taskName: string;
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  fallback: () => Promise<T> | T;
}

export interface StructuredModel {
  config: StructuredModelConfig;
  runStructured<T>(request: StructuredRequest<T>): Promise<T>;
}

export class DeterministicStructuredModel implements StructuredModel {
  constructor(public config: StructuredModelConfig) {}

  async runStructured<T>(request: StructuredRequest<T>): Promise<T> {
    return withBackoff(async () => request.schema.parse(await request.fallback()), this.config.maxRetries, 25);
  }
}

export const createStructuredModel = (config: StructuredModelConfig): StructuredModel =>
  new DeterministicStructuredModel(config);
