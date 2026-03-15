import type {
  ICompletion,
  IDeclarativeFormField,
  IDeclarativeFormOption,
  IDeclarativeFormSection,
  IDeclarativeFormValidator,
  ILocalizedText,
} from "../types";
import type {
  CompiledCompletion,
  CompiledOption,
} from "./types";

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

export function resolveLocalizedOption(
  option: IDeclarativeFormOption,
  locale: string
): CompiledOption {
  if (typeof option === "string") {
    return { label: option, value: option };
  }

  const label = resolveLocalizedText(option.label, locale);
  const value = option.value ?? label;
  return {
    label: label || value || "",
    value: value || "",
  };
}

export type LocalizedValidator =
  | "required"
  | { type: "pattern"; regex: string; message?: string }
  | { type: "min"; value: number | string; message?: string }
  | { type: "max"; value: number | string; message?: string }
  | { type: "min_length"; value: number; message?: string }
  | { type: "max_length"; value: number; message?: string }
  | { type: "expression"; expression: string; message?: string };

export function resolveValidator(
  validator: IDeclarativeFormValidator,
  locale: string
): LocalizedValidator | null {
  if (validator === "required") {
    return validator;
  }

  if (!validator.type) {
    return null;
  }

  const localizedMessage = resolveLocalizedText(validator.message, locale);
  switch (validator.type) {
    case "pattern":
      if (!validator.regex) {
        return null;
      }
      return {
        type: "pattern",
        regex: validator.regex,
        message: localizedMessage || undefined,
      };

    case "min":
      if (validator.value === undefined) {
        return null;
      }
      return {
        type: "min",
        value: validator.value,
        message: localizedMessage || undefined,
      };

    case "max":
      if (validator.value === undefined) {
        return null;
      }
      return {
        type: "max",
        value: validator.value,
        message: localizedMessage || undefined,
      };

    case "min_length":
      if (typeof validator.value !== "number") {
        return null;
      }
      return {
        type: "min_length",
        value: validator.value,
        message: localizedMessage || undefined,
      };

    case "max_length":
      if (typeof validator.value !== "number") {
        return null;
      }
      return {
        type: "max_length",
        value: validator.value,
        message: localizedMessage || undefined,
      };

    case "expression":
      if (!validator.expression) {
        return null;
      }
      return {
        type: "expression",
        expression: validator.expression,
        message: localizedMessage || undefined,
      };
  }
}

export function localizeField(
  field: IDeclarativeFormField,
  locale: string
): {
  label: string;
  placeholder?: string;
  options?: CompiledOption[];
  min_label?: string;
  max_label?: string;
  validators: LocalizedValidator[];
} {
  return {
    label: resolveLocalizedText(field.label, locale) || field.id || "",
    placeholder: field.placeholder
      ? resolveLocalizedText(field.placeholder, locale)
      : undefined,
    ...("options" in field && field.options
      ? {
          options: field.options.map((option) =>
            resolveLocalizedOption(option, locale)
          ),
        }
      : {}),
    ...("min_label" in field && field.min_label
      ? { min_label: resolveLocalizedText(field.min_label, locale) }
      : {}),
    ...("max_label" in field && field.max_label
      ? { max_label: resolveLocalizedText(field.max_label, locale) }
      : {}),
    validators: (field.validators ?? []).flatMap((validator) => {
      const resolved = resolveValidator(validator, locale);
      return resolved ? [resolved] : [];
    }),
  };
}

export function localizeSection(
  section: IDeclarativeFormSection,
  locale: string
): { title: string } {
  return {
    title: resolveLocalizedText(section.title, locale),
  };
}

export function localizeCompletion(
  completion: ICompletion | undefined,
  locale: string
): CompiledCompletion | undefined {
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
