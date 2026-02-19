import type { DeclarativeFieldComponentProps } from "../field-contract";
import { FormControl, Textarea } from "@/components/ui";
import { useI18n } from "@/i18n";

export function LongTextField({
  field,
  controllerField,
  meta,
}: DeclarativeFieldComponentProps) {
  const { t } = useI18n();

  return (
    <FormControl>
      <Textarea
        {...controllerField}
        className="h-32 md:h-50 text-sm/4"
        placeholder={field.placeholder || t("long_text.placeholder")}
        required={meta.isRequired}
        aria-required={meta.isRequired}
        minLength={
          typeof meta.minValidator?.value === "number"
            ? meta.minValidator.value
            : undefined
        }
        maxLength={
          typeof meta.maxValidator?.value === "number"
            ? meta.maxValidator.value
            : undefined
        }
      />
    </FormControl>
  );
}
