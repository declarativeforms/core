import type { ICompiledConnection } from './connection';

export type ICompiledWebhookConnection = Extract<
  ICompiledConnection,
  { type: 'webhook' }
>;
