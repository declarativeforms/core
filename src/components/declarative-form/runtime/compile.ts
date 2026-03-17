import type {
  IDeclarativeForm,
  IDeclarativeFormField,
  IConnection,
  IDeclarativeFormSection,
} from "../types";
import {
  isDeclarativeConnectionType,
  isDeclarativeFieldType,
} from "../types";
import { compileFieldValidation } from "./compile-validation";
import { evaluateExpression } from "./evaluate";
import {
  localizeCompletion,
  localizeField,
  localizeSection,
  resolveLocalizedText,
} from "./localize";
import { interpolateTemplate } from "./template";
import type {
  CompiledField,
  CompiledForm,
  CompiledOption,
  CompiledSection,
} from "./types";

function normalizeConnections(
  connections: IDeclarativeForm["connections"]
): IConnection[] {
  return (connections ?? []).flatMap((connection) =>
    isDeclarativeConnectionType(connection?.type) ? [connection] : []
  );
}

function compileField(
  field: IDeclarativeFormField,
  locale: string,
  data: Record<string, unknown>
): CompiledField | null {
  if (!isDeclarativeFieldType(field.type)) {
    return null;
  }

  const localized = localizeField(field, locale);
  const label = interpolateTemplate(localized.label || field.id || "", data);
  const fieldId = field.id ?? "";

  const placeholder = localized.placeholder
    ? interpolateTemplate(localized.placeholder, data)
    : undefined;

  const visible = field.visible_when
    ? evaluateExpression(field.visible_when, data)
    : true;

  const validation = compileFieldValidation(
    field.type,
    localized.validators,
    label,
    locale
  );

  const base = {
    id: fieldId,
    label,
    placeholder,
    required: validation.some((r) => r.type === "required"),
    visible,
    visible_when: field.visible_when,
    validation,
  };

  const options = localized.options?.map(
    (opt): CompiledOption => ({
      label: interpolateTemplate(opt.label, data),
      value: opt.value,
    })
  );

  switch (field.type) {
    case "email":
      return {
        ...base,
        type: field.type,
        ...(field.otp !== undefined && { otp: field.otp }),
        ...(field.block_free_email !== undefined && { block_free_email: field.block_free_email }),
      };

    case "dropdown":
      return {
        ...base,
        type: field.type,
        ...(field.searchable !== undefined && {
          searchable: field.searchable,
        }),
        ...(options && { options }),
      };

    case "rating":
      return {
        ...base,
        type: field.type,
        ...(localized.min_label && {
          min_label: interpolateTemplate(localized.min_label, data),
        }),
        ...(localized.max_label && {
          max_label: interpolateTemplate(localized.max_label, data),
        }),
      };

    case "address":
    case "address_locality":
    case "address_region":
    case "address_country":
      return {
        ...base,
        type: field.type,
        ...(field.outputFormat !== undefined && {
          outputFormat: field.outputFormat,
        }),
      };

    case "single_select":
    case "multiple_select":
      return {
        ...base,
        type: field.type,
        ...(options && { options }),
      };

    case "geolocation":
      return { ...base, type: field.type };

    case "camera":
      return {
        ...base,
        type: field.type,
        ...(field.facing_mode !== undefined && {
          facing_mode: field.facing_mode,
        }),
      };

    case "turnstile":
      return { ...base, type: field.type };

    default:
      return { ...base, type: field.type };
  }
}

function compileSection(
  section: IDeclarativeFormSection,
  locale: string,
  data: Record<string, unknown>
): CompiledSection {
  const localized = localizeSection(section, locale);

  return {
    id: section.id ?? "",
    title: interpolateTemplate(localized.title, data),
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
  const sections = (schema.sections ?? []).map((section) =>
    compileSection(section, locale, data)
  );

  return {
    id: schema.id,
    version: schema.version ?? 1,
    title: interpolateTemplate(
      resolveLocalizedText(schema.title, locale),
      data
    ),
    description: schema.description
      ? interpolateTemplate(resolveLocalizedText(schema.description, locale), data)
      : undefined,
    activeSectionId,
    sections,
    completion: localizeCompletion(schema.completion, locale),
    connections: normalizeConnections(schema.connections),
    locale,
    measurements: schema.measurements,
    start_date: schema.start_date,
    end_date: schema.end_date,
  };
}
