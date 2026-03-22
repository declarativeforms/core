import type { DeclarativeFieldComponentProps } from "../view-support/field-support";
import { getNumericRuleValue } from "../validation";
import { FormControl, Textarea } from "@/components/ui";
import { useFormI18n } from "../view-support/use-form-i18n";

export function LongTextField({
  field,
  controllerField,
}: DeclarativeFieldComponentProps) {
  const { t } = useFormI18n();

  return (
    <FormControl>
      <Textarea
        {...controllerField}
        className="h-32 md:h-50 text-sm/4"
        placeholder={field.placeholder || t("long_text.placeholder")}
        required={field.required}
        aria-required={field.required}
        minLength={getNumericRuleValue(field.validation, "min_length")}
        maxLength={getNumericRuleValue(field.validation, "max_length")}
      />
    </FormControl>
  );
}
