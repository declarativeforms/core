import type { DeclarativeFieldComponentProps } from "../view-support/field-support";
import { findValidationRule } from "../view-support/field-support";
import { FormControl, Textarea } from "@/components/ui";
import { useFormI18n } from "../view-support/use-form-i18n";

export function LongTextField({
  field,
  controllerField,
}: DeclarativeFieldComponentProps) {
  const { t } = useFormI18n();

  const minRule = findValidationRule(field.validation, "min_length");
  const maxRule = findValidationRule(field.validation, "max_length");

  return (
    <FormControl>
      <Textarea
        {...controllerField}
        className="h-32 md:h-50 text-sm/4"
        placeholder={field.placeholder || t("long_text.placeholder")}
        required={field.required}
        aria-required={field.required}
        minLength={
          minRule && typeof minRule.value === "number"
            ? minRule.value
            : undefined
        }
        maxLength={
          maxRule && typeof maxRule.value === "number"
            ? maxRule.value
            : undefined
        }
      />
    </FormControl>
  );
}
