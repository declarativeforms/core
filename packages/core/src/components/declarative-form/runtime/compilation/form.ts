import type { IDeclarativeForm } from "../../types";
import { isDeclarativeConnectionType } from "../../types";
import { resolveCompletion } from "../core/completion";
import { interpolateTemplate } from "../core/expression";
import type {
  ILocalizedForm,
  ILocalizedFormCompletion,
  ILocalizedFormCompletionRule,
  ILocalizedFormSection,
} from "../localization/form";
import { localizeForm } from "../localization/form";
import type { CompiledCompletion, CompiledForm, CompiledSection } from "../types";
import { compileField } from "./field";

function normalizeConnections(connections: ILocalizedForm["connections"]) {
  return (connections ?? []).flatMap((connection) =>
    isDeclarativeConnectionType(connection?.type) ? [connection] : []
  );
}

function buildCompiledCompletion(
  completion: ILocalizedFormCompletion | undefined
): CompiledCompletion | undefined {
  if (!completion) {
    return undefined;
  }

  return {
    title: completion.title,
    message: completion.message,
    button: completion.button
      ? {
          label: completion.button.label ?? "",
          url: completion.button.url ?? "",
        }
      : undefined,
  };
}

function compileSection(
  section: ILocalizedFormSection,
  locale: string,
  data: Record<string, unknown>
): CompiledSection {
  return {
    id: section.id ?? "",
    title: interpolateTemplate(section.title ?? "", data),
    fields: (section.fields ?? []).flatMap((field) => {
      const compiled = compileField(field, locale, data);
      return compiled ? [compiled] : [];
    }),
  };
}

export function compile(
  schema: IDeclarativeForm,
  locale: string,
  data: Record<string, unknown>,
  activeSectionId: string
): CompiledForm {
  // Step 1: Compile localization — flatten every ILocalizedText into a plain
  // string, preserving the exact input structure otherwise.
  const localizedSchema = localizeForm(schema, locale);

  // Step 2: Compile the localized schema into the final CompiledForm.
  const sections = (localizedSchema.sections ?? []).map((section) =>
    compileSection(section, locale, data)
  );

  const resolvedCompletion = resolveCompletion(
    localizedSchema.completion as
      | ILocalizedFormCompletion
      | ILocalizedFormCompletionRule[]
      | undefined,
    data
  );

  return {
    id: localizedSchema.id,
    version: localizedSchema.version ?? 1,
    title: interpolateTemplate(localizedSchema.title ?? "", data),
    description: localizedSchema.description
      ? interpolateTemplate(localizedSchema.description, data)
      : undefined,
    activeSectionId,
    sections,
    completion: buildCompiledCompletion(resolvedCompletion),
    connections: normalizeConnections(localizedSchema.connections),
    locale,
    measurements: localizedSchema.measurements,
    start_date: localizedSchema.start_date,
    end_date: localizedSchema.end_date,
  };
}
