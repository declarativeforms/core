import type {
  IDeclarativeFormEmailConnection,
  IResolvedFormEmailConnection,
} from '../types';
import { resolveLocalizedText } from './localize';

/** Localize an email connection's subject and body templates. */
export function resolveFormEmailConnection(
  connection: IDeclarativeFormEmailConnection,
  locale: string,
): IResolvedFormEmailConnection {
  return {
    type: 'email',
    ...(connection.to !== undefined && { to: connection.to }),
    ...(connection.subject !== undefined && {
      subject: resolveLocalizedText(connection.subject, locale),
    }),
    ...(connection.body !== undefined && {
      body: resolveLocalizedText(connection.body, locale),
    }),
    ...(connection.include_responses !== undefined && {
      include_responses: connection.include_responses,
    }),
    ...(connection.when !== undefined && { when: connection.when }),
  };
}
