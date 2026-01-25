import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import { FormControl, Textarea } from "@/components/ui";
import type { IDeclarativeFormField } from "../types";

export function LongTextField({
  field,
  formField,
}: {
  field: IDeclarativeFormField;
  formField: ControllerRenderProps<FieldValues, string>;
}) {
  return (
    <FormControl>
      <Textarea
        {...formField}
        className="w-full h-auto py-3 px-3 bg-white border-neutral-200 hover:border-neutral-300 focus-visible:ring-neutral-900 focus-visible:ring-1 text-sm text-neutral-900 placeholder:text-neutral-400 rounded-md transition-colors duration-200 shadow-sm min-h-32"
        placeholder={field.placeholder || "Your answer"}
      />
    </FormControl>
  );
}
