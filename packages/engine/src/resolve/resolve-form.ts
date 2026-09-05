import type { IDeclarativeForm, IResolvedForm } from '../types';
import { isDeclarativeConnectionType } from '../types';
import { resolveConnection } from './resolve-connection';
import { resolveFormCompletion } from './resolve-form-completion';
import { resolveFormSection } from './resolve-form-section';
import { resolveFormStart } from './resolve-form-start';
import { resolveLocalizedText } from './localize';
import { getTokenFieldId } from './token-field-id';

function assertTokenFieldIdsAvailable(schema: IDeclarativeForm): void {
  const fieldIds = new Set(
    (schema.sections ?? []).flatMap((section) =>
      (section.fields ?? []).flatMap((field) =>
        field.id === undefined ? [] : [field.id],
      ),
    ),
  );

  for (const section of schema.sections ?? []) {
    for (const field of section.fields ?? []) {
      if (field.type !== 'email' || field.otp !== true) {
        continue;
      }

      const tokenFieldId = getTokenFieldId(field.id ?? '');
      if (fieldIds.has(tokenFieldId)) {
        throw new Error(
          `Field id "${tokenFieldId}" is reserved for verification`,
        );
      }
    }
  }
}

export function resolve(
  schema: IDeclarativeForm,
  locale: string,
): IResolvedForm {
  assertTokenFieldIdsAvailable(schema);

  return {
    ...(schema.id !== undefined && { id: schema.id }),
    ...(schema.version !== undefined && { version: schema.version }),
    ...(schema.title !== undefined && {
      title: resolveLocalizedText(schema.title, locale),
    }),
    ...(schema.description !== undefined && {
      description: resolveLocalizedText(schema.description, locale),
    }),
    ...(schema.start !== undefined && {
      start: resolveFormStart(schema.start, locale),
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
