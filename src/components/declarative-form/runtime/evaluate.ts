export function evaluateExpression(
  expression: string,
  data: Record<string, unknown>
): boolean {
  try {
    const condition = new Function("data", `return ${expression}`) as (
      value: Record<string, unknown>
    ) => boolean;
    return condition(data);
  } catch (error) {
    console.warn(
      `[DeclarativeForms] Expression evaluation failed: "${expression}"`,
      error
    );
    return false;
  }
}
