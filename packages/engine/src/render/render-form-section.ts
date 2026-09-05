import type { ICompiledFormSection, IRenderableSection } from '../types';
import { buildDefaultValues } from './render-defaults';
import { renderFormField } from './render-form-field';
import { renderNavigation } from './render-navigation';

export function renderFormSection(
  section: ICompiledFormSection,
  data: Record<string, unknown>,
  canGoBack: boolean,
): IRenderableSection {
  return {
    id: section.id,
    ...(section.title && { title: section.title }),
    ...(section.description && { description: section.description }),
    fields: section.fields.map(renderFormField),
    next: renderNavigation(section.next),
    canGoBack,
    defaultValues: buildDefaultValues(section, data),
  };
}
