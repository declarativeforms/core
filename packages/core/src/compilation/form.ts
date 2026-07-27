import type { IDeclarativeForm } from '../definition';
import { compileCompletion } from './completion';
import { interpolateTemplate } from '../template';
import { resolveLocalizedText } from '../localization';
import type { FormView } from '../types';
import { DEFAULT_MESSAGES, type ValidationMessages } from '../messages';
import { compileSection } from './section';

export function compile(
  schema: IDeclarativeForm,
  locale: string,
  data: Record<string, unknown>,
  activeSectionId: string,
  messages: ValidationMessages = DEFAULT_MESSAGES,
): FormView {
  const sectionDefinition =
    (schema.sections ?? []).find((section) => section.id === activeSectionId) ??
    schema.sections?.[0] ??
    {};
  const section = compileSection(sectionDefinition, locale, data, messages);

  return {
    id: schema.id,
    version: schema.version ?? 1,
    title: interpolateTemplate(
      resolveLocalizedText(schema.title, locale),
      data,
    ),
    description: schema.description
      ? interpolateTemplate(
          resolveLocalizedText(schema.description, locale),
          data,
        )
      : undefined,
    activeSectionId: section.id,
    section,
    completion: compileCompletion(schema.completion, locale, data),
    locale,
    measurements: schema.measurements,
    start_date: schema.start_date,
    end_date: schema.end_date,
    theme: schema.theme,
  };
}

export const compileFormView = compile;
