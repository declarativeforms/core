import type {
  IDeclarativeForm,
  IDeclarativeFormField,
  IDeclarativeFormFieldBase,
  IDeclarativeFormOption,
  IDeclarativeFormSection,
  IDeclarativeFormValidator,
  ICompletion,
  ICompletionRule,
  IRawAirtableConnection,
  IRawEmailConnection,
  IRawWebhookConnection,
} from "../../types";
import { resolveLocalizedText } from "./text";

// ---------------------------------------------------------------------------
// Localized validator — same shape as IDeclarativeFormValidator but with
// ILocalizedText resolved to string.
// ---------------------------------------------------------------------------

export type LocalizedFormValidator =
  | "required"
  | { type?: "pattern"; regex?: string; message?: string }
  | { type?: "min"; value?: number | string; message?: string }
  | { type?: "max"; value?: number | string; message?: string }
  | { type?: "min_length"; value?: number; message?: string }
  | { type?: "max_length"; value?: number; message?: string }
  | { type?: "expression"; expression?: string; message?: string };

// ---------------------------------------------------------------------------
// Localized option — same shape as IDeclarativeFormOption but with
// ILocalizedText resolved to string.
// ---------------------------------------------------------------------------

export type LocalizedFormOption = string | { label?: string; value?: string };

// ---------------------------------------------------------------------------
// Localized field types — same shape as their IDeclarativeFormField
// counterparts but with ILocalizedText resolved to string.
// ---------------------------------------------------------------------------

type LocalizedFormFieldBase = {
  id?: string;
  label?: string;
  placeholder?: string;
  validators?: LocalizedFormValidator[];
  visible_when?: string;
};

export type LocalizedEmailField = LocalizedFormFieldBase & {
  type?: "email";
  otp?: boolean;
  block_free_email?: boolean;
};

export type LocalizedDropdownField = LocalizedFormFieldBase & {
  type?: "dropdown";
  searchable?: boolean;
  options?: LocalizedFormOption[];
};

export type LocalizedRatingField = LocalizedFormFieldBase & {
  type?: "rating";
  min_label?: string;
  max_label?: string;
};

export type LocalizedAddressField = LocalizedFormFieldBase & {
  type?: "address" | "address_locality" | "address_region" | "address_country";
  outputFormat?: "string" | "structured";
};

export type LocalizedSelectField = LocalizedFormFieldBase & {
  type?: "single_select" | "multiple_select";
  options?: LocalizedFormOption[];
  allow_other?: boolean;
};

export type LocalizedGeolocationField = LocalizedFormFieldBase & {
  type?: "geolocation";
};

export type LocalizedCameraField = LocalizedFormFieldBase & {
  type?: "camera";
  facing_mode?: "front" | "rear";
};

export type LocalizedTurnstileField = LocalizedFormFieldBase & {
  type?: "turnstile";
};

export type LocalizedGenericField = LocalizedFormFieldBase & {
  type?:
    | "date"
    | "date_month"
    | "file_upload"
    | "hidden"
    | "long_text"
    | "mobile_number"
    | "number"
    | "signature"
    | "short_text"
    | "time"
    | "url";
};

export type LocalizedFormField =
  | LocalizedEmailField
  | LocalizedDropdownField
  | LocalizedRatingField
  | LocalizedAddressField
  | LocalizedSelectField
  | LocalizedGeolocationField
  | LocalizedCameraField
  | LocalizedTurnstileField
  | LocalizedGenericField;

// ---------------------------------------------------------------------------
// Localized section — same shape as IDeclarativeFormSection but with
// ILocalizedText resolved to string.
// ---------------------------------------------------------------------------

export type LocalizedFormSection = {
  id?: string;
  title?: string;
  fields?: LocalizedFormField[];
  next?: IDeclarativeFormSection["next"];
};

// ---------------------------------------------------------------------------
// Localized completion — same shape as ICompletion / ICompletionRule but
// with ILocalizedText resolved to string.
// ---------------------------------------------------------------------------

export type LocalizedFormCompletion = {
  title?: string;
  message?: string;
  button?: { label?: string; url?: string };
};

export type LocalizedFormCompletionRule = LocalizedFormCompletion & {
  when?: string;
};

// ---------------------------------------------------------------------------
// Localized connections — IRawEmailConnection subject/body resolved to string.
// ---------------------------------------------------------------------------

export type LocalizedRawEmailConnection = {
  type?: "email";
  to?: string;
  subject?: string;
  body?: string;
  include_responses?: boolean;
  when?: string;
};

export type LocalizedFormConnection =
  | IRawAirtableConnection
  | IRawWebhookConnection
  | LocalizedRawEmailConnection;

// ---------------------------------------------------------------------------
// LocalizedForm — exactly the same structure as IDeclarativeForm but with
// every ILocalizedText property resolved to a plain string.
// ---------------------------------------------------------------------------

export type LocalizedForm = {
  id?: string;
  version?: number;
  title?: string;
  description?: string;
  completion?: LocalizedFormCompletion | LocalizedFormCompletionRule[];
  sections?: LocalizedFormSection[];
  connections?: LocalizedFormConnection[];
  start_date?: string;
  end_date?: string;
  locale?: string;
  measurements?: { mixpanel?: string };
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function localizeValidator(
  validator: IDeclarativeFormValidator,
  locale: string
): LocalizedFormValidator {
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
): LocalizedFormOption {
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
): LocalizedFormFieldBase {
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
): LocalizedFormField {
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
): LocalizedFormSection {
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
  completion: ICompletion,
  locale: string
): LocalizedFormCompletion {
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
  completion: ICompletion | ICompletionRule[],
  locale: string
): LocalizedFormCompletion | LocalizedFormCompletionRule[] {
  if (!Array.isArray(completion)) {
    return localizeCompletion(completion, locale);
  }

  return completion.map(
    (rule): LocalizedFormCompletionRule => ({
      ...localizeCompletion(rule, locale),
      when: rule.when,
    })
  );
}

function localizeConnection(
  connection: IRawAirtableConnection | IRawWebhookConnection | IRawEmailConnection,
  locale: string
): LocalizedFormConnection {
  if (connection.type !== "email") {
    return connection as IRawAirtableConnection | IRawWebhookConnection;
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
): LocalizedForm {
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
  };
}
