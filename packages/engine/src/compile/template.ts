import Handlebars from 'handlebars';

export function interpolateTemplate(
  template: string,
  data: Record<string, unknown>,
  context?: Record<string, unknown>,
): string {
  const compiled = Handlebars.compile(template, { noEscape: true });
  return compiled({ data, ...context });
}
