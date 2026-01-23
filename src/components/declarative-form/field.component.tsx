import {
  useWatch,
  type FieldValues,
  type RegisterOptions,
  type UseFormReturn,
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
  Checkbox,
  Textarea,
} from "../ui";

export function DeclarativeFormField(props: {
  field: IDeclarativeFormField;
  form: UseFormReturn<FieldValues, FieldValues, FieldValues>;
}) {
  const formData = useWatch({ control: props.form.control });

  const isVisible = (() => {
    if (!props.field.visible_when) {
      return true;
    }

    const condition = new Function(
      "data",
      `return ${props.field.visible_when}`
    );

    return condition(formData);
  })();

  if (!isVisible) {
    return null;
  }

  const isRequired = props.field.validators?.includes("required");

  const rules: RegisterOptions = {};

  if (isRequired) {
    rules.required = `${props.field.label} is required.`;
  }

  const Label = () => (
    <FormLabel className="block text-sm font-medium text-neutral-900 mb-2">
      {props.field.label}
      {isRequired && (
        <span className="text-red-500 ml-1 font-normal" aria-hidden="true">
          *
        </span>
      )}
    </FormLabel>
  );

  return (
    <FormField
      control={props.form.control}
      name={props.field.id}
      rules={rules}
      render={({ field }) => (
        <FormItem className="mb-6 group">
          {Label()}
          {props.field.type === "dropdown" ? (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="w-full !h-auto !py-3 px-3 bg-white border-neutral-200 hover:border-neutral-300 focus-visible:ring-neutral-900 focus-visible:ring-1 text-sm text-neutral-900 placeholder:text-neutral-400 rounded-md transition-colors duration-200 shadow-sm">
                  <SelectValue
                    placeholder={
                      props.field.placeholder || `Select a ${props.field.label}`
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {props.field.options?.map((option) => (
                  <SelectItem
                    key={option}
                    value={option}
                    className="py-2.5 text-sm cursor-pointer focus:bg-neutral-50 focus:text-neutral-900"
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {props.field.type === "email" ? (
            <FormControl>
              <Input
                {...field}
                className="w-full h-auto py-3 px-3 bg-white border-neutral-200 hover:border-neutral-300 focus-visible:ring-neutral-900 focus-visible:ring-1 text-sm text-neutral-900 placeholder:text-neutral-400 rounded-md transition-colors duration-200 shadow-sm"
                placeholder={props.field.placeholder || "Your answer"}
                type="email"
              />
            </FormControl>
          ) : null}
          {props.field.type === "long_text" ? (
            <FormControl>
              <Textarea
                {...field}
                className="w-full h-auto py-3 px-3 bg-white border-neutral-200 hover:border-neutral-300 focus-visible:ring-neutral-900 focus-visible:ring-1 text-sm text-neutral-900 placeholder:text-neutral-400 rounded-md transition-colors duration-200 shadow-sm min-h-32"
                placeholder={props.field.placeholder || "Your answer"}
              />
            </FormControl>
          ) : null}
          {props.field.type === "multiple_select" ? (
            <div className="flex flex-col space-y-2">
              {props.field.options?.map((option) => (
                <FormField
                  key={option}
                  control={props.form.control}
                  name={props.field.id}
                  render={({ field }) => {
                    const selectedValues = Array.isArray(field.value)
                      ? field.value
                      : [];
                    const isChecked = selectedValues.includes(option);

                    return (
                      <FormItem>
                        <FormLabel
                          className={`flex items-center space-x-3 w-full border rounded-md p-3 cursor-pointer transition-all duration-200 shadow-sm ${
                            isChecked
                              ? "border-neutral-900 ring-1 ring-neutral-900 bg-neutral-50"
                              : "border-neutral-200 hover:border-neutral-300 bg-white"
                          }`}
                        >
                          <FormControl>
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked: boolean) => {
                                if (checked) {
                                  field.onChange([...selectedValues, option]);
                                } else {
                                  field.onChange(
                                    selectedValues.filter(
                                      (value) => value !== option
                                    )
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <span className="font-normal text-sm text-neutral-700 select-none flex-1">
                            {option}
                          </span>
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
            </div>
          ) : null}
          {props.field.type === "short_text" ? (
            <FormControl>
              <Input
                {...field}
                className="w-full h-auto py-3 px-3 bg-white border-neutral-200 hover:border-neutral-300 focus-visible:ring-neutral-900 focus-visible:ring-1 text-sm text-neutral-900 placeholder:text-neutral-400 rounded-md transition-colors duration-200 shadow-sm"
                placeholder={props.field.placeholder || "Your answer"}
                type="text"
              />
            </FormControl>
          ) : null}

          {props.field.type === "single_select" ? (
            <FormControl>
              <RadioGroup
                className="flex flex-col space-y-2 gap-0"
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                {props.field.options?.map((option) => {
                  const isSelected = field.value === option;
                  return (
                    <FormItem key={option}>
                      <FormLabel
                        className={`flex items-center space-x-3 w-full border rounded-md p-3 cursor-pointer transition-all duration-200 shadow-sm ${
                          isSelected
                            ? "border-neutral-900 ring-1 ring-neutral-900 bg-neutral-50"
                            : "border-neutral-200 hover:border-neutral-300 bg-white"
                        }`}
                      >
                        <FormControl>
                          <RadioGroupItem value={option} />
                        </FormControl>
                        <span className="font-normal text-sm text-neutral-700 select-none flex-1">
                          {option}
                        </span>
                      </FormLabel>
                    </FormItem>
                  );
                })}
              </RadioGroup>
            </FormControl>
          ) : null}
        </FormItem>
      )}
    />
  );
}
