import type {
  ICompiledFormOption,
  IRenderableDropdownField,
} from '@declarativeforms/engine';

export function getDropdownOptions(
  field: IRenderableDropdownField,
  parentValue: unknown,
): Array<ICompiledFormOption> {
  if (!field.dependsOn) {
    return field.options;
  }

  return typeof parentValue === 'string'
    ? (field.optionsByParent[parentValue] ?? [])
    : [];
}
