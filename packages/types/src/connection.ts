import type { IDeclarativeForm } from './form';

export type IConnection = NonNullable<IDeclarativeForm['connections']>[number];
export type IEmailConnection = Extract<IConnection, { type?: 'email' }>;
export type IWebhookConnection = Extract<IConnection, { type?: 'webhook' }>;
