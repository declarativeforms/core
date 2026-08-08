import type { IConnection } from './connection';

export type IWebhookConnection = Extract<IConnection, { type: 'webhook' }>;
