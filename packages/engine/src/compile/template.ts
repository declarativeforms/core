import Handlebars from 'handlebars';

/**
 * Populate a template string with the answers. Values are addressed as
 * `{{data.fieldId}}`; `context` keys (e.g. `label`, `min`, `max`) are exposed
 * at the top level for validation messages. HTML is not escaped.
 */
export function interpolateTemplate(
  template: string,
  data: Record<string, unknown>,
  context?: Record<string, unknown>,
): string {
  const compiled = Handlebars.compile(template, { noEscape: true });
  return compiled({ data, ...context });
}
