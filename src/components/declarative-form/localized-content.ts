import type {
  ICompletion,
  IDeclarativeFormField,
  IDeclarativeFormOption,
  IDeclarativeFormSection,
  IDeclarativeFormValidator,
  ILocalizedText,
} from "./types";

export type IResolvedDeclarativeFormOption = {
  label: string;
  value: string;
};

export type IResolvedDeclarativeFormValidator =
  | "required"
  | {
      type: "pattern";
      regex: string;
      message?: string;
    }
  | {
      type: "min";
      value: number | string;
      message?: string;
    }
  | {
      type: "max";
      value: number | string;
      message?: string;
    };

type ResolveField<T extends IDeclarativeFormField> = T extends any
  ? Omit<
      T,
      | "label"
      | "max_label"
      | "min_label"
      | "options"
      | "placeholder"
      | "validators"
    > & {
      label: string;
      max_label?: string;
      min_label?: string;
      options?: Array<IResolvedDeclarativeFormOption>;
      placeholder?: string;
      validators?: Array<IResolvedDeclarativeFormValidator>;
    }
  : never;

export type IResolvedDeclarativeFormField = ResolveField<IDeclarativeFormField>;

export type IResolvedDeclarativeFormSection = Omit<
  IDeclarativeFormSection,
  "fields" | "title"
> & {
  fields: Array<IResolvedDeclarativeFormField>;
  title: string;
};

export type IResolvedCompletion = {
  title?: string;
  message?: string;
  button?: {
    label: string;
    url: string;
  };
};

function normalizeLocaleKey(locale: string): string {
  return locale.trim().toLowerCase().replace("_", "-");
}

function getObjectLocalizedValue(
  input: Record<string, string>,
  locale: string
): string | undefined {
  const normalizedLocale = normalizeLocaleKey(locale);
  const normalizedEntries = Object.entries(input).reduce(
    (acc, [key, value]) => {
      acc[normalizeLocaleKey(key)] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  const baseLocale = normalizedLocale.split("-")[0];
  const candidates = [normalizedLocale, baseLocale, "en"];

  for (const candidate of candidates) {
    const value = normalizedEntries[candidate];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  for (const value of Object.values(normalizedEntries)) {
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return undefined;
}

export function resolveLocalizedText(
  input: ILocalizedText | undefined,
  locale: string
): string {
  if (typeof input === "string") {
    return input;
  }

  if (!input) {
    return "";
  }

  return getObjectLocalizedValue(input, locale) ?? "";
}

function resolveLocalizedOption(
  option: IDeclarativeFormOption,
  locale: string
): IResolvedDeclarativeFormOption {
  if (typeof option === "string") {
    return { label: option, value: option };
  }

  const label = resolveLocalizedText(option.label, locale);
  return {
    label: label || option.value,
    value: option.value,
  };
}

function resolveValidator(
  validator: IDeclarativeFormValidator,
  locale: string
): IResolvedDeclarativeFormValidator {
  if (validator === "required") {
    return validator;
  }

  const localizedMessage = resolveLocalizedText(validator.message, locale);
  return {
    ...validator,
    message: localizedMessage || undefined,
  };
}

export function resolveFieldContent(
  field: IDeclarativeFormField,
  locale: string
): IResolvedDeclarativeFormField {
  return {
    ...field,
    label: resolveLocalizedText(field.label, locale) || field.id,
    ...("max_label" in field && {
      max_label: field.max_label
        ? resolveLocalizedText(field.max_label, locale)
        : undefined,
    }),
    ...("min_label" in field && {
      min_label: field.min_label
        ? resolveLocalizedText(field.min_label, locale)
        : undefined,
    }),
    ...("options" in field && {
      options: field.options?.map((option) =>
        resolveLocalizedOption(option, locale)
      ),
    }),
    placeholder: field.placeholder
      ? resolveLocalizedText(field.placeholder, locale)
      : undefined,
    validators: field.validators?.map((validator) =>
      resolveValidator(validator, locale)
    ),
  } as IResolvedDeclarativeFormField;
}

export function resolveSectionContent(
  section: IDeclarativeFormSection,
  locale: string
): IResolvedDeclarativeFormSection {
  return {
    ...section,
    title: resolveLocalizedText(section.title, locale),
    fields: section.fields.map((field) => resolveFieldContent(field, locale)),
  };
}

export function resolveCompletionContent(
  completion: ICompletion | undefined,
  locale: string
): IResolvedCompletion | undefined {
  if (!completion) {
    return undefined;
  }

  return {
    title: completion.title
      ? resolveLocalizedText(completion.title, locale)
      : undefined,
    message: completion.message
      ? resolveLocalizedText(completion.message, locale)
      : undefined,
    button: completion.button
      ? {
          label: resolveLocalizedText(completion.button.label, locale),
          url: resolveLocalizedText(completion.button.url, locale),
        }
      : undefined,
  };
}
