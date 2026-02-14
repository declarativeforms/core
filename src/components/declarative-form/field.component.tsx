import {
  useWatch,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";

import { FormField, FormItem, FormLabel, FormMessage } from "../ui";
import { fieldContainerClass, fieldLabelClass } from "./field-styles";
import { getFieldMeta } from "./field-contract";
import { declarativeFieldRenderers } from "./field-renderers";
import { buildFieldRules } from "./field-validation";
import type { IDeclarativeFormField } from "./types";

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

  const meta = getFieldMeta(props.field);
  const rules = buildFieldRules(props.field, meta);
  const Renderer = declarativeFieldRenderers[props.field.type];
  const isHiddenField = props.field.type === "hidden";

  const Label = () => (
    <FormLabel className={fieldLabelClass}>
      {props.field.label}
      {meta.isRequired && (
        <span className="font-medium text-sm ml-1 text-red-500" aria-hidden="true">
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
      render={({ field }) =>
        isHiddenField ? (
          <Renderer
            controllerField={field}
            field={props.field}
            form={props.form}
            meta={meta}
          />
        ) : (
          <FormItem className={`${fieldContainerClass} group`}>
            {Label()}
            <Renderer
              controllerField={field}
              field={props.field}
              form={props.form}
              meta={meta}
            />
            <FormMessage />
          </FormItem>
        )
      }
    />
  );
}
