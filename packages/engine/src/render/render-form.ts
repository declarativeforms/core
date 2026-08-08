import type { ICompiledForm, IRenderableForm } from '../types';
import { renderFormSection } from './render-form-section';

export type RenderOptions = {
  /** The active section to render; defaults to the first section. */
  sectionId?: string;
  /** Visited section ids, used for `canGoBack` and `progress`. */
  history?: string[];
};

/**
 * Step 4 — project a compiled form into a render-ready view of the current
 * section (form chrome + one section). `data` seeds the section's values.
 */
export function render(
  compiled: ICompiledForm,
  data: Record<string, unknown>,
  options: RenderOptions = {},
): IRenderableForm {
  const section =
    (options.sectionId !== undefined
      ? compiled.sections.find((candidate) => candidate.id === options.sectionId)
      : undefined) ?? compiled.sections[0];

  if (!section) {
    throw new Error('Cannot render a form with no sections.');
  }

  const history = options.history ?? [];

  return {
    ...(compiled.id !== undefined && { id: compiled.id }),
    ...(compiled.title && { title: compiled.title }),
    ...(compiled.description !== undefined && {
      description: compiled.description,
    }),
    locale: compiled.locale,
    ...(compiled.theme !== undefined && { theme: compiled.theme }),
    section: renderFormSection(section, data, history.length > 0),
    progress: { position: history.length + 1, total: compiled.sections.length },
  };
}
