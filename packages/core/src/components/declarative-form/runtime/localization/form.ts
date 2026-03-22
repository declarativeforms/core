import type {
  IDeclarativeForm,
  IDeclarativeFormField,
  IDeclarativeFormFieldBase,
  IDeclarativeFormOption,
  IDeclarativeFormSection,
  IDeclarativeFormValidator,
  IDeclarativeFormCompletion,
  IDeclarativeFormCompletionRule,
  IDeclarativeFormRawAirtableConnection,
  IDeclarativeFormRawWebhookConnection,
  ILocalizedForm,
  ILocalizedFormCompletion,
  ILocalizedFormCompletionRule,
  ILocalizedFormConnection,
  ILocalizedFormField,
  ILocalizedFormFieldBase,
  ILocalizedFormOption,
  ILocalizedFormSection,
  ILocalizedFormValidator,
} from "../../types";
import { resolveLocalizedText } from "./text";

// Re-export ILocalized* types for consumers within this package.
export type {
  ILocalizedForm,
  ILocalizedFormCompletion,
  ILocalizedFormCompletionRule,
  ILocalizedFormConnection,
  ILocalizedFormField,
  ILocalizedFormFieldBase,
  ILocalizedFormOption,
  ILocalizedFormSection,
  ILocalizedFormValidator,
  ILocalizedRawEmailConnection,
} from "../../types";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function localizeValidator(
  validator: IDeclarativeFormValidator,
  locale: string
): ILocalizedFormValidator {
  if (validator === "required") {
    return "required";
  }

  return {
    ...validator,
    message: validator.message
      ? resolveLocalizedText(validator.message, locale)
      : undefined,
  };
}

function localizeOption(
  option: IDeclarativeFormOption,
  locale: string
): ILocalizedFormOption {
  if (typeof option === "string") {
    return option;
  }

  return {
    ...option,
    label: option.label
      ? resolveLocalizedText(option.label, locale)
      : undefined,
  };
}

function localizeFieldBase(
  field: IDeclarativeFormFieldBase,
  locale: string
): ILocalizedFormFieldBase {
  return {
    id: field.id,
    label: field.label
      ? resolveLocalizedText(field.label, locale)
      : undefined,
    placeholder: field.placeholder
      ? resolveLocalizedText(field.placeholder, locale)
      : undefined,
    validators: field.validators?.map((v) => localizeValidator(v, locale)),
    visible_when: field.visible_when,
  };
}

function localizeField(
  field: IDeclarativeFormField,
  locale: string
): ILocalizedFormField {
  const base = localizeFieldBase(field, locale);

  switch (field.type) {
    case "email":
      return {
        ...base,
        type: field.type,
        ...(field.otp !== undefined && { otp: field.otp }),
        ...(field.block_free_email !== undefined && {
          block_free_email: field.block_free_email,
        }),
      };

    case "dropdown":
      return {
        ...base,
        type: field.type,
        ...(field.searchable !== undefined && {
          searchable: field.searchable,
        }),
        ...(field.options && {
          options: field.options.map((o) => localizeOption(o, locale)),
        }),
      };

    case "rating":
      return {
        ...base,
        type: field.type,
        ...(field.min_label && {
          min_label: resolveLocalizedText(field.min_label, locale),
        }),
        ...(field.max_label && {
          max_label: resolveLocalizedText(field.max_label, locale),
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
        ...(field.options && {
          options: field.options.map((o) => localizeOption(o, locale)),
        }),
        ...(field.allow_other !== undefined && {
          allow_other: field.allow_other,
        }),
      };

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

function localizeSection(
  section: IDeclarativeFormSection,
  locale: string
): ILocalizedFormSection {
  return {
    id: section.id,
    title: section.title
      ? resolveLocalizedText(section.title, locale)
      : undefined,
    fields: section.fields?.map((f) => localizeField(f, locale)),
    next: section.next,
  };
}

function localizeCompletion(
  completion: IDeclarativeFormCompletion,
  locale: string
): ILocalizedFormCompletion {
  return {
    title: completion.title
      ? resolveLocalizedText(completion.title, locale)
      : undefined,
    message: completion.message
      ? resolveLocalizedText(completion.message, locale)
      : undefined,
    button: completion.button
      ? {
          label: completion.button.label
            ? resolveLocalizedText(completion.button.label, locale)
            : undefined,
          url: completion.button.url
            ? resolveLocalizedText(completion.button.url, locale)
            : undefined,
        }
      : undefined,
  };
}

function localizeCompletionRules(
  completion: IDeclarativeFormCompletion | IDeclarativeFormCompletionRule[],
  locale: string
): ILocalizedFormCompletion | ILocalizedFormCompletionRule[] {
  if (!Array.isArray(completion)) {
    return localizeCompletion(completion, locale);
  }

  return completion.map(
    (rule): ILocalizedFormCompletionRule => ({
      ...localizeCompletion(rule, locale),
      when: rule.when,
    })
  );
}

function localizeConnection(
  connection: NonNullable<IDeclarativeForm["connections"]>[number],
  locale: string
): ILocalizedFormConnection {
  if (connection.type !== "email") {
    return connection as IDeclarativeFormRawAirtableConnection | IDeclarativeFormRawWebhookConnection;
  }

  return {
    ...connection,
    subject: connection.subject
      ? resolveLocalizedText(connection.subject, locale)
      : undefined,
    body: connection.body
      ? resolveLocalizedText(connection.body, locale)
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compiles localization as the first step of the compilation pipeline.
 *
 * Resolves every ILocalizedText value in the form schema to a plain string
 * for the given locale. The returned structure is identical to the input
 * IDeclarativeForm except that all localized-dictionary properties have been
 * flattened into string properties. No other transformation is performed.
 */
export function localizeForm(
  schema: IDeclarativeForm,
  locale: string
): ILocalizedForm {
  return {
    id: schema.id,
    version: schema.version,
    title: schema.title
      ? resolveLocalizedText(schema.title, locale)
      : undefined,
    description: schema.description
      ? resolveLocalizedText(schema.description, locale)
      : undefined,
    completion: schema.completion
      ? localizeCompletionRules(schema.completion, locale)
      : undefined,
    sections: schema.sections?.map((s) => localizeSection(s, locale)),
    connections: schema.connections?.map((c) => localizeConnection(c, locale)),
    start_date: schema.start_date,
    end_date: schema.end_date,
    locale: schema.locale,
    measurements: schema.measurements,
    theme: schema.theme,
  };
}
