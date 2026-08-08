import type { ICompiledConnection, IResolvedConnection } from '../types';
import { compileFormEmailConnection } from './compile-form-email-connection';
import { evaluateExpression } from './expression';

/**
 * Assess a connection's `when` gate against the answers. Returns the compiled
 * connection when it should fire, otherwise `null` (dropped). The `when` is not
 * part of the compiled shape.
 */
export function compileConnection(
  connection: IResolvedConnection,
  data: Record<string, unknown>,
): ICompiledConnection | null {
  if (connection.when && !evaluateExpression(connection.when, data)) {
    return null;
  }
  if (connection.type === 'email') {
    return compileFormEmailConnection(connection, data);
  }
  return {
    type: 'webhook',
    ...(connection.url !== undefined && { url: connection.url }),
  };
}
