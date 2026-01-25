import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import { FormControl, Input } from "@/components/ui";
import type { IDeclarativeFormField } from "../types";

export function InputField({
  field,
  formField,
  type,
}: {
  field: IDeclarativeFormField;
  formField: ControllerRenderProps<FieldValues, string>;
  type: string;
}) {
  return (
    <FormControl>
      <Input
        {...formField}
        className="w-full h-auto py-3 px-3 bg-white border-neutral-200 hover:border-neutral-300 focus-visible:ring-neutral-900 focus-visible:ring-1 text-sm text-neutral-900 placeholder:text-neutral-400 rounded-md transition-colors duration-200 shadow-sm"
        placeholder={field.placeholder || "Your answer"}
        type={type}
      />
    </FormControl>
  );
}
