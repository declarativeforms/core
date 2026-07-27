import type { IDeclarativeFormSection } from '../definition';
import { interpolateTemplate } from '../template';
import { resolveLocalizedText } from '../localization';
import type { CompiledSection } from '../types';
import type { ValidationMessages } from '../messages';
import { compileField } from './field';

export function compileSection(
  section: IDeclarativeFormSection,
  locale: string,
  data: Record<string, unknown>,
  messages: ValidationMessages,
): CompiledSection {
  return {
    id: section.id ?? '',
    title: interpolateTemplate(
      resolveLocalizedText(section.title, locale),
      data,
    ),
    fields: (section.fields ?? []).flatMap((field) => {
      const compiled = compileField(field, locale, data, messages);
      return compiled ? [compiled] : [];
    }),
  };
}
