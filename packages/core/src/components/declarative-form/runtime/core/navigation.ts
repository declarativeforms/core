import type { IDeclarativeFormSection } from "../../types";
import { evaluateExpression } from "@declarativeforms/common";

export function resolveNextSectionId(
  section: IDeclarativeFormSection,
  data: Record<string, unknown>
): string {
  if (typeof section.next === "string") {
    return section.next;
  }

  for (const rule of section.next ?? []) {
    if ("when" in rule) {
      if (rule.when && rule.go && evaluateExpression(rule.when, data)) {
        return rule.go;
      }
    } else if ("else" in rule && rule.else) {
      return rule.else;
    }
  }

  return "done";
}

export function isExternalNextSectionId(nextSectionId: string): boolean {
  return nextSectionId.startsWith("https://");
}
