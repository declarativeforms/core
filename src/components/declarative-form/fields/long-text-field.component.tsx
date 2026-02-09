import type { ControllerRenderProps, FieldValues } from "react-hook-form";

import { fieldControlClass } from "../field-styles";
import type { IDeclarativeFormField } from "../types";
import { FormControl, Textarea } from "@/components/ui";

export function LongTextField({
  field,
  formField,
}: {
  field: IDeclarativeFormField;
  formField: ControllerRenderProps<FieldValues, string>;
}) {
  const minValidator = field.validators?.find(
    (v) => typeof v === "object" && v.type === "min"
  ) as { type: "min"; value: number | string } | undefined;

  const maxValidator = field.validators?.find(
    (v) => typeof v === "object" && v.type === "max"
  ) as { type: "max"; value: number | string } | undefined;

  const isRequired = field.validators?.some((v) => v === "required");

  return (
    <FormControl>
      <Textarea
        {...formField}
        className={`${fieldControlClass} h-32 md:h-50`}
        placeholder={field.placeholder || "Your answer"}
        required={!!isRequired}
        aria-required={!!isRequired}
        minLength={
          typeof minValidator?.value === "number"
            ? minValidator.value
            : undefined
        }
        maxLength={
          typeof maxValidator?.value === "number"
            ? maxValidator.value
            : undefined
        }
      />
    </FormControl>
  );
}
