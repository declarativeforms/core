import type { IResolvedConnection } from './connection';

export type IResolvedEmailConnection = Extract<IResolvedConnection, { type: 'email' }>;
