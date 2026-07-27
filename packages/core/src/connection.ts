import type { IDeclarativeForm } from './definition';

export type IConnection = NonNullable<IDeclarativeForm['connections']>[number];
export type IEmailConnection = Extract<IConnection, { type?: 'email' }>;
export type IWebhookConnection = Extract<IConnection, { type?: 'webhook' }>;
