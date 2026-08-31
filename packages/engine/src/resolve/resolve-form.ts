import type { IDeclarativeForm, IResolvedForm } from '../types';
import { isDeclarativeConnectionType } from '../types';
import { resolveConnection } from './resolve-connection';
import { resolveFormCompletion } from './resolve-form-completion';
import { resolveFormSection } from './resolve-form-section';
import { resolveLocalizedText } from './localize';

export function resolve(
  schema: IDeclarativeForm,
  locale: string,
): IResolvedForm {
  return {
    ...(schema.id !== undefined && { id: schema.id }),
    ...(schema.version !== undefined && { version: schema.version }),
    ...(schema.title !== undefined && {
      title: resolveLocalizedText(schema.title, locale),
    }),
    ...(schema.description !== undefined && {
      description: resolveLocalizedText(schema.description, locale),
    }),
    ...(schema.completion !== undefined && {
      completion: resolveFormCompletion(schema.completion, locale),
    }),
    ...(schema.sections !== undefined && {
      sections: schema.sections.map((section) =>
        resolveFormSection(section, locale),
      ),
    }),
    ...(schema.connections !== undefined && {
      connections: schema.connections
        .filter((connection) => isDeclarativeConnectionType(connection?.type))
        .map((connection) => resolveConnection(connection, locale)),
    }),
    ...(schema.start_date !== undefined && { start_date: schema.start_date }),
    ...(schema.end_date !== undefined && { end_date: schema.end_date }),
    locale,
    ...(schema.measurements !== undefined && {
      measurements: schema.measurements,
    }),
    ...(schema.theme !== undefined && { theme: schema.theme }),
  };
}
