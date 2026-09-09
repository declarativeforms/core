import type { ICompiledFormSection, IResolvedFormSection } from '../types';
import { compileFormField } from './compile-form-field';
import { DEFAULT_MESSAGES, type ValidationMessages } from './messages';
import { resolveNextSectionId } from './next';
import { interpolateTemplate } from './template';

export function compileFormSection(
  section: IResolvedFormSection,
  data: Record<string, unknown>,
  messages: ValidationMessages = DEFAULT_MESSAGES,
): ICompiledFormSection {
  return {
    id: section.id ?? '',
    title:
      section.title !== undefined
        ? interpolateTemplate(section.title, data)
        : '',
    ...(section.description !== undefined && {
      description: interpolateTemplate(section.description, data),
    }),
    fields: (section.fields ?? []).map((field) =>
      compileFormField(field, data, messages),
    ),
    next: resolveNextSectionId(section, data),
  };
}
