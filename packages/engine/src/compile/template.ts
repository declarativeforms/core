import Handlebars from 'handlebars';

export function interpolateTemplate(
  template: string,
  data: Record<string, unknown>,
  context?: Record<string, unknown>,
): string {
  const compiled = Handlebars.compile(template, { noEscape: true });

  return compiled(
    { data, ...context },
    {
      helpers: {
        calculate(expression: unknown): unknown {
          if (typeof expression !== 'string') {
            return undefined;
          }

          try {
            const fn = new Function('data', `return ${expression}`) as (
              value: Record<string, unknown>,
            ) => unknown;

            return fn(data);
          } catch {
            return undefined;
          }
        },
      },
    },
  );
}
