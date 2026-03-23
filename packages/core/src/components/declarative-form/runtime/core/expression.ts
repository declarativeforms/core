import { evaluateExpression, interpolateTemplate } from "@declarativeforms/common"

export { evaluateExpression, interpolateTemplate }

export function evaluateValidationExpression(
  expression: string,
  data: Record<string, unknown>
): boolean {
  return evaluateExpression(expression, data, false)
}
