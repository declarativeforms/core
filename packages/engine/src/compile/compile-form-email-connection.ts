import type {
  ICompiledFormEmailConnection,
  IResolvedFormEmailConnection,
} from '../types';
import { interpolateTemplate } from './template';

export function compileFormEmailConnection(
  connection: IResolvedFormEmailConnection,
  data: Record<string, unknown>,
): ICompiledFormEmailConnection {
  return {
    type: 'email',
    ...(connection.to !== undefined && { to: connection.to }),
    ...(connection.subject !== undefined && {
      subject: interpolateTemplate(connection.subject, data),
    }),
    ...(connection.body !== undefined && {
      body: interpolateTemplate(connection.body, data),
    }),
    ...(connection.include_responses !== undefined && {
      include_responses: connection.include_responses,
    }),
  };
}
