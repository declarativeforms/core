export function evaluateExpression(
  expression: string,
  data: Record<string, unknown>,
  logErrors = true,
): boolean {
  try {
    const fn = new Function("data", `return ${expression}`) as (
      value: Record<string, unknown>,
    ) => unknown
    return Boolean(fn(data))
  } catch (error) {
    if (logErrors) {
      console.warn(
        `[DeclarativeForms] Expression evaluation failed: "${expression}"`,
        error,
      )
    }
    return false
  }
}
