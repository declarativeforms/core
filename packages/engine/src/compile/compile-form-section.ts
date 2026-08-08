import type { ICompiledFormSection, IResolvedFormSection } from '../types';
import { compileFormField } from './compile-form-field';
import { DEFAULT_MESSAGES, type ValidationMessages } from './messages';
import { resolveNextSectionId } from './next';
import { interpolateTemplate } from './template';

/**
 * Compile a section: interpolate its title, compile its fields, and resolve its
 * `next` target against the answers (`'done'` when it terminates the form).
 */
export function compileFormSection(
  section: IResolvedFormSection,
  data: Record<string, unknown>,
  messages: ValidationMessages = DEFAULT_MESSAGES,
): ICompiledFormSection {
  return {
    id: section.id ?? '',
    title:
      section.title !== undefined ? interpolateTemplate(section.title, data) : '',
    fields: (section.fields ?? []).map((field) =>
      compileFormField(field, data, messages),
    ),
    next: resolveNextSectionId(section, data),
  };
}
