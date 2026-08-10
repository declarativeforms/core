import type { IConnection, IResolvedConnection } from '../types';
import { resolveFormEmailConnection } from './resolve-form-email-connection';

/**
 * Localize a connection. Webhook connections carry no localizable text and are
 * passed through unchanged.
 */
export function resolveConnection(
  connection: IConnection,
  locale: string,
): IResolvedConnection {
  if (connection.type === 'email') {
    return resolveFormEmailConnection(connection, locale);
  }
  return connection;
}
