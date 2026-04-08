import type { DeclarativeFieldComponentProps } from "../supporting/field-support";
import { buildFieldValidation } from "../supporting/validation";
import { Textarea } from "@/components/ui";
import { useFormI18n } from "../supporting/use-form-i18n";

export function LongTextField({
  field,
  controllerField,
}: DeclarativeFieldComponentProps) {
  const { t } = useFormI18n();
  const { minLength, maxLength } = buildFieldValidation(field);

  return (
    <Textarea
      {...controllerField}
      className="h-32 md:h-50 text-sm/4"
      placeholder={field.placeholder || t("long_text.placeholder")}
      required={field.required}
      aria-required={field.required}
      minLength={minLength}
      maxLength={maxLength}
    />
  );
}
