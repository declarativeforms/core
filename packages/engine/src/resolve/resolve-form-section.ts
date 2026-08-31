import type { IDeclarativeFormSection, IResolvedFormSection } from '../types';
import { resolveFormField } from './resolve-form-field';
import { resolveLocalizedText } from './localize';

export function resolveFormSection(
  section: IDeclarativeFormSection,
  locale: string,
): IResolvedFormSection {
  return {
    ...(section.id !== undefined && { id: section.id }),
    ...(section.title !== undefined && {
      title: resolveLocalizedText(section.title, locale),
    }),
    ...(section.fields !== undefined && {
      fields: section.fields.flatMap((field) => {
        const resolved = resolveFormField(field, locale);
        return resolved ? [resolved] : [];
      }),
    }),
    ...(section.next !== undefined && { next: section.next }),
  };
}
