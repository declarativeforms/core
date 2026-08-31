import type { ICompiledForm, IRenderableForm } from '../types';
import { findPreviousSectionId } from './find-previous-section';
import { renderFormSection } from './render-form-section';

export type RenderOptions = {
  sectionId?: string;
};

export function render(
  compiled: ICompiledForm,
  data: Record<string, unknown>,
  options: RenderOptions = {},
): IRenderableForm {
  const section =
    (options.sectionId !== undefined
      ? compiled.sections.find(
          (candidate) => candidate.id === options.sectionId,
        )
      : undefined) ?? compiled.sections[0];

  if (!section) {
    throw new Error('Cannot render a form with no sections.');
  }

  return {
    ...(compiled.id !== undefined && { id: compiled.id }),
    ...(compiled.title && { title: compiled.title }),
    ...(compiled.description !== undefined && {
      description: compiled.description,
    }),
    locale: compiled.locale,
    ...(compiled.theme !== undefined && { theme: compiled.theme }),
    section: renderFormSection(
      section,
      data,
      findPreviousSectionId(compiled, section.id) !== undefined,
    ),
  };
}
