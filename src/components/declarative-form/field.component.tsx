import {
  useWatch,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";

import { FormField, FormItem, FormLabel, FormMessage } from "../ui";
import { getFieldMeta } from "./field-contract";
import { declarativeFieldRenderers } from "./field-renderers";
import { buildFieldRules } from "./field-validation";
import type { IResolvedDeclarativeFormField } from "./localized-content";
import { useFormI18n } from "./use-form-i18n";

export function DeclarativeFormField(props: {
  field: IResolvedDeclarativeFormField;
  form: UseFormReturn<FieldValues, FieldValues, FieldValues>;
}) {
  const { t } = useFormI18n();
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

  const resolvedField = props.field;
  const meta = getFieldMeta(resolvedField);
  const rules = buildFieldRules(resolvedField, meta, t);
  const Renderer = declarativeFieldRenderers[resolvedField.type];
  const isHiddenField = resolvedField.type === "hidden";

  const Label = () => (
    <FormLabel className="text-sm/4.5">
      {resolvedField.label}
      {meta.isRequired && (
        <span
          className="font-medium text-red-500"
          aria-hidden="true"
        >
          *
        </span>
      )}
    </FormLabel>
  );

  return (
    <FormField
      control={props.form.control}
      name={resolvedField.id}
      rules={rules}
      render={({ field }) =>
        isHiddenField ? (
          <Renderer
            controllerField={field}
            field={resolvedField}
            form={props.form}
            meta={meta}
          />
        ) : (
          <FormItem>
            {Label()}
            <Renderer
              controllerField={field}
              field={resolvedField}
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
