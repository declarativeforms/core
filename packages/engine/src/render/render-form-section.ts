import type { ICompiledFormSection, IRenderableSection } from '../types';
import { buildDefaultValues } from './render-defaults';
import { renderFormField } from './render-form-field';
import { renderNavigation } from './render-navigation';

/**
 * Build the render-ready section: project its fields, map its resolved `next`
 * to a navigation outcome, seed its initial values, and set the Back affordance.
 */
export function renderFormSection(
  section: ICompiledFormSection,
  data: Record<string, unknown>,
  canGoBack: boolean,
): IRenderableSection {
  return {
    id: section.id,
    ...(section.title && { title: section.title }),
    fields: section.fields.map(renderFormField),
    next: renderNavigation(section.next),
    canGoBack,
    defaultValues: buildDefaultValues(section, data),
  };
}
