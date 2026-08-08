import type { IResolvedConnection } from './connection';

export type IResolvedWebhookConnection = Extract<
  IResolvedConnection,
  { type: 'webhook' }
>;
