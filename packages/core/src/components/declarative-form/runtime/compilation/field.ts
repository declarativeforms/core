import { isDeclarativeFieldType } from "../../types";
import { evaluateExpression, interpolateTemplate } from "../core/expression";
import type {
  ILocalizedFormField,
  ILocalizedFormOption,
} from "../localization/form";
import type { CompiledField, CompiledOption } from "../types";
import { buildValidationRules } from "../validation/rules";

function interpolateString(
  value: string | undefined,
  data: Record<string, unknown>
): string | undefined {
  if (!value) {
    return undefined;
  }

  return interpolateTemplate(value, data);
}

function compileOption(
  option: ILocalizedFormOption,
  data: Record<string, unknown>
): CompiledOption {
  if (typeof option === "string") {
    return { label: interpolateTemplate(option, data), value: option };
  }

  const label = option.label ? interpolateTemplate(option.label, data) : "";
  const value = option.value ?? label;
  return { label: label || value || "", value: value || "" };
}

export function compileField(
  field: ILocalizedFormField,
  locale: string,
  data: Record<string, unknown>
): CompiledField | null {
  if (!isDeclarativeFieldType(field.type)) {
    return null;
  }

  const label = interpolateTemplate(field.label ?? "", data);
  const validation = buildValidationRules(
    field.type,
    field.validators ?? [],
    label,
    locale
  );

  const base = {
    id: field.id ?? "",
    label,
    placeholder: interpolateString(field.placeholder, data),
    required: validation.some((rule) => rule.type === "required"),
    visible: field.visible_when
      ? evaluateExpression(field.visible_when, data)
      : true,
    visible_when: field.visible_when,
    validation,
  };

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

    case "dropdown": {
      const options = field.options?.map((o) => compileOption(o, data));
      return {
        ...base,
        type: field.type,
        ...(field.searchable !== undefined && {
          searchable: field.searchable,
        }),
        ...(options && { options }),
      };
    }

    case "rating":
      return {
        ...base,
        type: field.type,
        ...(field.min_label && {
          min_label: interpolateTemplate(field.min_label, data),
        }),
        ...(field.max_label && {
          max_label: interpolateTemplate(field.max_label, data),
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
    case "multiple_select": {
      const options = field.options?.map((o) => compileOption(o, data));
      return {
        ...base,
        type: field.type,
        ...(options && { options }),
        ...(field.allow_other !== undefined && {
          allow_other: field.allow_other,
        }),
      };
    }

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
