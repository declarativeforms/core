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
        if (
          resolved?.type !== 'turnstile' &&
          (resolved?.type !== 'email' || resolved.otp !== true)
        ) {
          return resolved ? [resolved] : [];
        }

        const required = resolved.validators?.some(
          (validator) =>
            validator === 'required' ||
            (typeof validator === 'object' && validator.type === 'required'),
        );
        const value = `data[${JSON.stringify(resolved.id ?? '')}]`;
        const visibleWhen =
          resolved.type === 'turnstile' && !required
            ? `(${resolved.visible_when ?? 'true'}) && (${value} !== undefined && ${value} !== null && ${value} !== '')`
            : resolved.visible_when;

        return [
          resolved,
          {
            id: getTokenFieldId(resolved.id ?? ''),
            type: 'hidden' as const,
            ...(visibleWhen !== undefined && {
              visible_when: visibleWhen,
            }),
          },
        ];
      }),
    }),
    ...(section.next !== undefined && { next: section.next }),
  };
}
