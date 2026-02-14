import { FormProvider, useForm, type FieldValues } from "react-hook-form";

import { Button } from "../ui";
import { DeclarativeFormField } from "./field.component";
import type { IDeclarativeFormField, IDeclarativeFormSection } from "./types";

export function DeclarativeFormSection(props: {
  data: FieldValues;
  section: IDeclarativeFormSection;
  onSubmit: (data: FieldValues) => void | Promise<void>;
}) {
  const form = useForm({
    defaultValues: props.section.fields.reduce((acc, field) => {
      acc[field.id] = props.data[field.id] || "";

      return acc;
    }, {} as FieldValues),
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit((data: FieldValues) =>
          props.onSubmit(data)
        )}
      >
        <div className="space-y-6">
          {props.section.fields.map((field: IDeclarativeFormField) => (
            <DeclarativeFormField key={field.id} field={field} form={form} />
          ))}
        </div>

        <div className="mt-8 flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            className="h-12 px-6 text-base font-semibold leading-none"
            disabled={form.formState.isSubmitting}
          >
            Back
          </Button>
          <Button
            type="submit"
            className="h-12 px-6 text-base font-semibold leading-none"
            disabled={form.formState.isSubmitting}
          >
            Next
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
