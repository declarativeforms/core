import type { IDeclarativeFormSection, IResolvedFormSection } from '../types';
import { resolveFormField } from './resolve-form-field';
import { resolveLocalizedText } from './localize';
import { getTokenFieldId } from './token-field-id';

export function resolveFormSection(
  section: IDeclarativeFormSection,
  locale: string,
): IResolvedFormSection {
  return {
    ...(section.id !== undefined && { id: section.id }),
    ...(section.title !== undefined && {
      title: resolveLocalizedText(section.title, locale),
    }),
    ...(section.description !== undefined && {
      description: resolveLocalizedText(section.description, locale),
    }),
    ...(section.fields !== undefined && {
      fields: section.fields.flatMap((field) => {
        const resolved = resolveFormField(field, locale);
        if (resolved?.type !== 'email' || resolved.otp !== true) {
          return resolved ? [resolved] : [];
        }

        return [
          resolved,
          {
            id: getTokenFieldId(resolved.id ?? ''),
            type: 'hidden' as const,
            ...(resolved.visible_when !== undefined && {
              visible_when: resolved.visible_when,
            }),
          },
        ];
      }),
    }),
    ...(section.next !== undefined && { next: section.next }),
  };
}
