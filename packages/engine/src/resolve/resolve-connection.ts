import type { IConnection, IResolvedConnection } from '../types';
import { resolveFormEmailConnection } from './resolve-form-email-connection';

export function resolveConnection(
  connection: IConnection,
  locale: string,
): IResolvedConnection {
  if (connection.type === 'email') {
    return resolveFormEmailConnection(connection, locale);
  }

  return connection;
}
