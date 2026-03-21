import Handlebars from "handlebars";

function executeExpression(
  expression: string,
  data: Record<string, unknown>,
  shouldLogError: boolean
): unknown {
  try {
    const fn = new Function("data", `return ${expression}`) as (
      value: Record<string, unknown>
    ) => unknown;
    return fn(data);
  } catch (error) {
    if (shouldLogError) {
      console.warn(
        `[DeclarativeForms] Expression evaluation failed: "${expression}"`,
        error
      );
    }
    return undefined;
  }
}

export function evaluateExpression(
  expression: string,
  data: Record<string, unknown>
): boolean {
  return Boolean(executeExpression(expression, data, true));
}

export function evaluateValidationExpression(
  expression: string,
  data: Record<string, unknown>
): boolean {
  return Boolean(executeExpression(expression, data, false));
}

export function interpolateTemplate(
  template: string,
  data: Record<string, unknown>
): string {
  const compiled = Handlebars.compile(template, { noEscape: true });
  return compiled({ data });
}
