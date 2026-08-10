/**
 * Evaluate a boolean expression (used for `visible_when`, `next` rules,
 * completion/connection `when`, and expression validators). The expression sees
 * the answers as `data`. Any error evaluates to `false`.
 */
export function evaluateExpression(
  expression: string,
  data: Record<string, unknown>,
): boolean {
  try {
    const fn = new Function('data', `return ${expression}`) as (
      value: Record<string, unknown>,
    ) => unknown;
    return Boolean(fn(data));
  } catch {
    return false;
  }
}
