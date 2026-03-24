import type { IDeclarativeForm } from "@declarativeforms/types";
import { isDeclarativeConnectionType } from "@declarativeforms/types";
import { compileCompletion } from "./completion";
import { interpolateTemplate, resolveLocalizedText } from "@declarativeforms/common";
import type { CompiledForm } from "../types";
import { DEFAULT_MESSAGES, type ValidationMessages } from "../messages";
import { compileSection } from "./section";

export function compile(
  schema: IDeclarativeForm,
  locale: string,
  data: Record<string, unknown>,
  activeSectionId: string,
  messages: ValidationMessages = DEFAULT_MESSAGES,
): CompiledForm {
  const sections = (schema.sections ?? []).map((section) =>
    compileSection(section, locale, data, messages)
  );

  return {
    id: schema.id,
    version: schema.version ?? 1,
    title: interpolateTemplate(resolveLocalizedText(schema.title, locale), data),
    description: schema.description
      ? interpolateTemplate(resolveLocalizedText(schema.description, locale), data)
      : undefined,
    activeSectionId,
    sections,
    completion: compileCompletion(schema.completion, locale, data),
    connections: (schema.connections ?? []).filter((connection) =>
      isDeclarativeConnectionType(connection?.type)
    ),
    locale,
    measurements: schema.measurements,
    start_date: schema.start_date,
    end_date: schema.end_date,
    theme: schema.theme,
  };
}
