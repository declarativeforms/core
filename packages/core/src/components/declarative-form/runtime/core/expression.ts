import { evaluateExpression } from "@declarativeforms/common"

export function evaluateValidationExpression(
  expression: string,
  data: Record<string, unknown>
): boolean {
  return evaluateExpression(expression, data, false)
}
