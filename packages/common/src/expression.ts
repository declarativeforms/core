export function evaluateExpression(
  expression: string,
  data: Record<string, unknown>,
): boolean {
  try {
    const fn = new Function("data", `return ${expression}`) as (
      value: Record<string, unknown>,
    ) => unknown;

    return Boolean(fn(data));
  } catch (error) {
    return false;
  }
}
