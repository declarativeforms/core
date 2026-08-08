import type { IConnection } from './connection';

export type IEmailConnection = Extract<IConnection, { type: 'email' }>;
