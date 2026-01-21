import type {
  FieldValues,
  RegisterOptions,
  UseFormReturn,
} from "react-hook-form";
import type { IDeclarativeFormField } from "./types";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui";

export function DeclarativeFormField(props: {
  field: IDeclarativeFormField;
  form: UseFormReturn<FieldValues, FieldValues, FieldValues>;
}) {
  const rules: RegisterOptions = {};

  if (props.field.validators?.includes("required")) {
    rules.required = `${props.field.label} is required.`;
  }

  return (
    <FormField
      control={props.form.control}
      name={props.field.id}
      rules={rules}
      render={({ field }) => (
        <FormItem className="mb-6">
          <FormLabel className="mb-3 text-neutral-900 text-lg">
            {props.field.label}
          </FormLabel>
          {props.field.type === "select" ? (
            props.field.options && props.field.options.length <= 4 ? (
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-2"
              >
                {props.field.options.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem id={option} value={option} />
                    </FormControl>
                    <FormLabel
                      className="font-normal text-neutral-700"
                      htmlFor={option}
                    >
                      {option}
                    </FormLabel>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        props.field.placeholder ||
                        `Select a ${props.field.label}`
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {props.field.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          ) : (
            <FormControl>
              <Input
                {...field}
                className="text-neutral-900 w-full"
                placeholder={props.field.placeholder}
                type={props.field.type}
              />
            </FormControl>
          )}
          {/* <FormMessage /> */}
        </FormItem>
      )}
    />
  );
}
