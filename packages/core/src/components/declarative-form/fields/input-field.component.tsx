import type { DeclarativeFieldComponentProps } from "../view-support/field-support";
import { findValidationRule, getNumericRuleValue } from "../view-support/field-support";
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
      : field.type === "date_month"
      ? "month"
      : field.type === "time"
      ? "time"
      : field.type === "email"
      ? "email"
      : field.type === "mobile_number"
      ? "tel"
      : field.type === "number"
      ? "text"
      : field.type === "url"
      ? "url"
      : "text";

  const isDate = field.type === "date" || field.type === "date_month" || field.type === "time";
  const hasPattern = field.validation.some((r) => r.type === "pattern");
  const minRule = isDate ? findValidationRule(field.validation, "min") : undefined;
  const maxRule = isDate ? findValidationRule(field.validation, "max") : undefined;

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
        minLength={isDate ? undefined : getNumericRuleValue(field.validation, "min_length")}
        maxLength={isDate ? undefined : getNumericRuleValue(field.validation, "max_length")}
        min={minRule ? String(minRule.value) : undefined}
        max={maxRule ? String(maxRule.value) : undefined}
      />
    </FormControl>
  );
}
