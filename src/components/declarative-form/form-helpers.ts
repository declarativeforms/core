import type { FieldValues } from "react-hook-form";

import type { IDeclarativeFormSection } from "./types";

export function interpolateTemplate(
  template: string,
  data: FieldValues
): string {
  return template.replace(/\{\{data\.(\w+)\}\}/g, (_, key) => data[key] ?? "");
}

export function resolveNextSectionId(
  section: IDeclarativeFormSection,
  data: FieldValues
): string {
  if (typeof section.next === "string") {
    return section.next;
  }

  for (const rule of section.next) {
    if ("when" in rule) {
      const condition = new Function("data", `return ${rule.when}`) as (
        value: FieldValues
      ) => boolean;
      if (condition(data)) {
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
