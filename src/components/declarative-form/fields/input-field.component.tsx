import type { DeclarativeFieldComponentProps } from "../view-support/field-support";
import { findValidationRule } from "../view-support/field-support";
import { FormControl, Input } from "@/components/ui";
import { useFormI18n } from "../view-support/use-form-i18n";

export function InputField({
  field,
  controllerField,
}: DeclarativeFieldComponentProps) {
  const { t } = useFormI18n();

  const inputType =
    field.type === "date"
      ? "date"
      : field.type === "email"
      ? "email"
      : field.type === "mobile_number"
      ? "tel"
      : field.type === "number"
      ? "text"
      : field.type === "url"
      ? "url"
      : "text";

  const hasPattern = field.validation.some((r) => r.type === "pattern");
  const minRule = findValidationRule(field.validation, field.type === "date" ? "min" : "min_length");
  const maxRule = findValidationRule(field.validation, field.type === "date" ? "max" : "max_length");

  return (
    <FormControl>
      <Input
        {...controllerField}
        className="text-sm/4"
        placeholder={field.placeholder || t("input.placeholder")}
        type={inputType}
        inputMode={field.type === "number" ? "numeric" : undefined}
        pattern={
          field.type === "number" && !hasPattern
            ? "^[0-9]+$"
            : undefined
        }
        required={field.required}
        aria-required={field.required}
        minLength={
          field.type !== "date" && minRule && typeof minRule.value === "number"
            ? minRule.value
            : undefined
        }
        maxLength={
          field.type !== "date" && maxRule && typeof maxRule.value === "number"
            ? maxRule.value
            : undefined
        }
        min={
          field.type === "date" && minRule
            ? String(minRule.value)
            : undefined
        }
        max={
          field.type === "date" && maxRule
            ? String(maxRule.value)
            : undefined
        }
      />
    </FormControl>
  );
}
