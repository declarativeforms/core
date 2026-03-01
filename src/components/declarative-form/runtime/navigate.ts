import type { IDeclarativeFormSection } from "../types";
import { evaluateExpression } from "./evaluate";

export function resolveNextSectionId(
  section: IDeclarativeFormSection,
  data: Record<string, unknown>
): string {
  if (typeof section.next === "string") {
    return section.next;
  }

  for (const rule of section.next) {
    if ("when" in rule) {
      if (evaluateExpression(rule.when, data)) {
        return rule.go;
      }
    } else if ("else" in rule) {
      return rule.else;
    }
  }

  return "done";
}

export function isExternalNextSectionId(nextSectionId: string): boolean {
  return nextSectionId.startsWith("https://");
}
