# Drop-In Field Replacements

All declarative form fields share one interface: `DeclarativeFieldComponentProps`.

```ts
type DeclarativeFieldComponentProps = {
  controllerField: ControllerRenderProps<FieldValues, string>;
  field: IDeclarativeFormField;
  form: UseFormReturn<FieldValues, FieldValues, FieldValues>;
  meta: {
    hasPatternValidator: boolean;
    isRequired: boolean;
    minValidator?: { type: "min"; value: number | string; message?: string };
    maxValidator?: { type: "max"; value: number | string; message?: string };
  };
};
```

## How to replace a field

1. Create a new component with the same props type.
2. Update `src/components/declarative-form/field-renderers.ts`.
3. Swap the renderer entry for the relevant field type.

Example:

```ts
import { MyDropdownField } from "./fields/my-dropdown-field.component";

export const declarativeFieldRenderers = {
  // ...
  dropdown: MyDropdownField,
  // ...
};
```

## Notes

- Field visibility and validation rules are handled in `src/components/declarative-form/field.component.tsx`.
- Keep replacements focused on rendering and control wiring.
- Use `controllerField.onChange` / `controllerField.value` for form state updates.
