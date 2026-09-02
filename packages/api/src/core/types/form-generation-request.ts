import type { IFormGenerationTurn } from './form-generation-turn';

export type IFormGenerationRequest = {
  prompt: string;
  definition: string | null;
  email_connections_enabled: boolean;
  history: Array<IFormGenerationTurn>;
  invalid_definition: string | null;
  validation_errors: Record<string, string> | null;
};
