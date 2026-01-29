import { FormProvider, useForm, type FieldValues } from "react-hook-form";
import { DeclarativeFormField } from "./field.component";
import type { IDeclarativeFormField, IDeclarativeFormSection } from "./types";
import { Button } from "../ui";

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
        {props.section.fields.map(
          (field: IDeclarativeFormField, index: number) => (
            <DeclarativeFormField key={index} field={field} form={form} />
          )
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4 sm:justify-end mt-10">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto text-base h-14 px-6"
            disabled={form.formState.isSubmitting}
          >
            Back
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto text-base h-14 px-6"
            disabled={form.formState.isSubmitting}
          >
            Next
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
