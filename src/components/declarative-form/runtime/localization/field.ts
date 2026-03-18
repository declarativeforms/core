import type { IDeclarativeFormField } from "../../types";
import type { CompiledOption } from "../types";
import { resolveLocalizedOption, resolveLocalizedText } from "./text";
import {
  resolveLocalizedValidators,
  type LocalizedValidator,
} from "./validators";

export type LocalizedFieldContent = {
  label: string;
  placeholder?: string;
  options?: CompiledOption[];
  min_label?: string;
  max_label?: string;
  validators: LocalizedValidator[];
};

export function localizeFieldContent(
  field: IDeclarativeFormField,
  locale: string
): LocalizedFieldContent {
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
    validators: resolveLocalizedValidators(field.validators, locale),
  };
}
