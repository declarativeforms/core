import type {
  IDeclarativeForm,
  IDeclarativeFormSection,
} from "@declarativeforms/types";
import { isDeclarativeConnectionType } from "@declarativeforms/types";
import { resolveCompletion } from "../core/completion";
import { interpolateTemplate, resolveLocalizedText } from "@declarativeforms/common";
import { localizeCompletion } from "../localization";
import type { CompiledForm, CompiledSection } from "../types";
import { DEFAULT_MESSAGES, type ValidationMessages } from "../messages";
import { compileField } from "./field";

function compileSection(
  section: IDeclarativeFormSection,
  locale: string,
  data: Record<string, unknown>,
  messages: ValidationMessages,
): CompiledSection {
  return {
    id: section.id ?? "",
    title: interpolateTemplate(resolveLocalizedText(section.title, locale), data),
    fields: (section.fields ?? []).flatMap((field) => {
      const compiled = compileField(field, locale, data, messages);
      return compiled ? [compiled] : [];
    }),
  };
}

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

  const resolvedCompletion = resolveCompletion(schema.completion, data);

  return {
    id: schema.id,
    version: schema.version ?? 1,
    title: interpolateTemplate(resolveLocalizedText(schema.title, locale), data),
    description: schema.description
      ? interpolateTemplate(resolveLocalizedText(schema.description, locale), data)
      : undefined,
    activeSectionId,
    sections,
    completion: localizeCompletion(resolvedCompletion, locale),
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
