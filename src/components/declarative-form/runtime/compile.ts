import type {
  IDeclarativeForm,
  IDeclarativeFormField,
  IDeclarativeFormSection,
} from "../types";
import { compileFieldValidation } from "./compile-validation";
import { evaluateExpression } from "./evaluate";
import { localizeCompletion, localizeField, localizeSection } from "./localize";
import { interpolateTemplate } from "./template";
import type {
  CompiledField,
  CompiledForm,
  CompiledOption,
  CompiledSection,
} from "./types";

function interpolateString(
  value: string | undefined,
  data: Record<string, unknown>
): string | undefined {
  if (!value) return undefined;
  return interpolateTemplate(value, data);
}

function compileField(
  field: IDeclarativeFormField,
  locale: string,
  data: Record<string, unknown>
): CompiledField {
  const localized = localizeField(field, locale);

  const label = interpolateTemplate(localized.label, data);
  const placeholder = interpolateString(localized.placeholder, data);

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
    id: field.id,
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
    id: section.id,
    title: interpolateTemplate(localized.title, data),
    fields: section.fields.map((field) => compileField(field, locale, data)),
  };
}

export function compile(
  schema: IDeclarativeForm,
  locale: string,
  data: Record<string, unknown>,
  activeSectionId: string
): CompiledForm {
  return {
    id: schema.id,
    version: schema.version,
    title: interpolateTemplate(
      localizeSection(
        { id: "", title: schema.title, fields: [], next: "done" },
        locale
      ).title,
      data
    ),
    description: schema.description
      ? interpolateString(
          localizeSection(
            {
              id: "",
              title: schema.description,
              fields: [],
              next: "done",
            },
            locale
          ).title,
          data
        )
      : undefined,
    activeSectionId,
    sections: schema.sections.map((section) =>
      compileSection(section, locale, data)
    ),
    completion: localizeCompletion(schema.completion, locale),
    connections: schema.connections,
    locale,
    measurements: schema.measurements,
    start_date: schema.start_date,
    end_date: schema.end_date,
  };
}
