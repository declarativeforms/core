import type { IDeclarativeFormField } from "../../types";
import { isDeclarativeFieldType } from "../../types";
import { evaluateExpression, interpolateTemplate } from "../core/expression";
import { localizeFieldContent } from "../localization/field";
import type { CompiledField, CompiledOption } from "../types";
import { buildValidationRules } from "./validation-rules";

function interpolateString(
  value: string | undefined,
  data: Record<string, unknown>
): string | undefined {
  if (!value) {
    return undefined;
  }

  return interpolateTemplate(value, data);
}

export function compileField(
  field: IDeclarativeFormField,
  locale: string,
  data: Record<string, unknown>
): CompiledField | null {
  if (!isDeclarativeFieldType(field.type)) {
    return null;
  }

  const localized = localizeFieldContent(field, locale);
  const label = interpolateTemplate(localized.label, data);
  const validation = buildValidationRules(
    field.type,
    field.validators,
    label,
    locale
  );

  const base = {
    id: field.id ?? "",
    label,
    placeholder: interpolateString(localized.placeholder, data),
    required: validation.some((rule) => rule.type === "required"),
    visible: field.visible_when
      ? evaluateExpression(field.visible_when, data)
      : true,
    visible_when: field.visible_when,
    validation,
  };

  const options = localized.options?.map(
    (option): CompiledOption => ({
      label: interpolateTemplate(option.label, data),
      value: option.value,
    })
  );

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
        ...(field.allow_other !== undefined && { allow_other: field.allow_other }),
      };

    case "camera":
      return {
        ...base,
        type: field.type,
        ...(field.facing_mode !== undefined && {
          facing_mode: field.facing_mode,
        }),
      };

    case "geolocation":
    case "turnstile":
      return { ...base, type: field.type };

    default:
      return { ...base, type: field.type };
  }
}
