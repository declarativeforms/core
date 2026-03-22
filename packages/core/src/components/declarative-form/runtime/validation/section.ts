import type { IDeclarativeForm } from "../../types";
import { isDeclarativeFieldType } from "../../types";
import { localizeForm } from "../localization/form";
import { validateFieldValue } from "./execute";
import { buildValidationRules } from "./rules";

export function validateSectionData(
  schema: IDeclarativeForm,
  locale: string,
  sectionId: string,
  sectionData: Record<string, unknown>,
  formData: Record<string, unknown>
): Record<string, string> {
  const localizedSchema = localizeForm(schema, locale);
  const section = (localizedSchema.sections ?? []).find(
    (candidate) => candidate.id === sectionId
  );
  if (!section) {
    return {};
  }

  const errors: Record<string, string> = {};

  for (const field of section.fields ?? []) {
    if (!isDeclarativeFieldType(field.type)) {
      continue;
    }

    const rules = buildValidationRules(
      field.type,
      field.validators ?? [],
      field.label ?? "",
      locale
    );
    const fieldId = field.id ?? "";
    const value = sectionData[fieldId];
    const error = validateFieldValue(field.type, value, rules, formData);
    if (error) {
      errors[fieldId] = error;
    }
  }

  return errors;
}
