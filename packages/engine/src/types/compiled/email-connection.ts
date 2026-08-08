import type { ICompiledConnection } from './connection';

export type ICompiledEmailConnection = Extract<
  ICompiledConnection,
  { type: 'email' }
>;
