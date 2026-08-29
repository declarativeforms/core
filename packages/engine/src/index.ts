import type { IRenderableForm } from './types';
import { compile } from './compile';
import { parse } from './parse';
import { render } from './render';
import { resolve } from './resolve';

export * from './types';

export { parse } from './parse';
export { resolve } from './resolve';
export { compile, DEFAULT_MESSAGES } from './compile';
export type { ValidationMessages } from './compile';
export { render } from './render';
export type { RenderOptions } from './render';
export { findPreviousSectionId } from './render';

// Standalone utilities (used across the pipeline; exposed for consumers).
export { resolveLocalizedText } from './resolve/localize';
export { interpolateTemplate } from './compile/template';
export { evaluateExpression } from './compile/expression';
export { validateField } from './validate/validate-field';

// The published JSON Schema for the authored YAML (https://frms.dev/schema.json).
export { FORM_JSON_SCHEMA, assertJsonSchemaCoverage } from './json-schema';

export type ToRenderableFormOptions = {
  locale: string;
  data?: Record<string, unknown>;
  sectionId?: string;
};

/**
 * The full pipeline in one call: raw YAML → renderable current-section view.
 * `parse → resolve(locale) → compile(data) → render(data, section)`.
 */
export function toRenderableForm(
  yaml: string,
  options: ToRenderableFormOptions,
): IRenderableForm {
  const data = options.data ?? {};
  const schema = parse(yaml);
  const resolved = resolve(schema, options.locale);
  const compiled = compile(resolved, data);
  return render(compiled, data, {
    sectionId: options.sectionId,
  });
}
