import type { IDeclarativeForm } from "../types";
import { isDeclarativeFieldType } from "../types";
import { compile } from "./compile";
import { compileFieldValidation } from "./compile-validation";
import { localizeField } from "./localize";
import { isExternalNextSectionId, resolveNextSectionId } from "./navigate";
import type {
  DispatchResult,
  FormAction,
  FormState,
  ValidationRule,
} from "./types";

function getInitialSectionId(
  schema: IDeclarativeForm,
  initialSectionId?: string
): string {
  if (initialSectionId) {
    return initialSectionId;
  }

  return schema.sections?.[0]?.id ?? "";
}

export function createFormState(
  schema: IDeclarativeForm,
  locale: string,
  initialData: Record<string, unknown>,
  initialSectionId?: string
): FormState {
  const activeSectionId = getInitialSectionId(schema, initialSectionId);
  const compiled = compile(schema, locale, initialData, activeSectionId);

  return {
    compiled,
    data: initialData,
    activeSectionId,
    sectionHistory: [],
    validationErrors: {},
  };
}

function validateSectionData(
  schema: IDeclarativeForm,
  locale: string,
  sectionId: string,
  sectionData: Record<string, unknown>,
  formData: Record<string, unknown>
): Record<string, string> {
  const section = (schema.sections ?? []).find((s) => s.id === sectionId);
  if (!section) return {};

  const errors: Record<string, string> = {};

  for (const field of section.fields ?? []) {
    if (!isDeclarativeFieldType(field.type)) {
      continue;
    }

    const localized = localizeField(field, locale);
    const rules = compileFieldValidation(
      field.type,
      localized.validators,
      localized.label,
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

function validateFieldValue(
  fieldType: string,
  value: unknown,
  rules: ValidationRule[],
  data: Record<string, unknown>
): string | undefined {
  const isEmpty =
    value === undefined || value === null || value === "";
  const isRequired = rules.some((r) => r.type === "required");

  if (isEmpty && isRequired) {
    const requiredRule = rules.find((r) => r.type === "required");
    return requiredRule?.message;
  }

  if (isEmpty) return undefined;

  for (const rule of rules) {
    switch (rule.type) {
      case "required":
        break;

      case "pattern": {
        const regex = new RegExp(rule.regex);
        if (!regex.test(String(value))) {
          return rule.message;
        }
        break;
      }

      case "min_length": {
        if (String(value).length < rule.value) {
          return rule.message;
        }
        break;
      }

      case "max_length": {
        if (String(value).length > rule.value) {
          return rule.message;
        }
        break;
      }

      case "min": {
        if (fieldType === "file_upload" || fieldType === "multiple_select") {
          const count = Array.isArray(value) ? value.length : value ? 1 : 0;
          if (count < Number(rule.value)) {
            return rule.message;
          }
        } else if (fieldType === "number" || fieldType === "rating") {
          const numValue = Number(value);
          if (
            Number.isFinite(numValue) &&
            numValue < Number(rule.value)
          ) {
            return rule.message;
          }
        } else {
          if (String(value) < String(rule.value)) {
            return rule.message;
          }
        }
        break;
      }

      case "max": {
        if (fieldType === "file_upload" || fieldType === "multiple_select") {
          const count = Array.isArray(value) ? value.length : value ? 1 : 0;
          if (count > Number(rule.value)) {
            return rule.message;
          }
        } else if (fieldType === "number" || fieldType === "rating") {
          const numValue = Number(value);
          if (
            Number.isFinite(numValue) &&
            numValue > Number(rule.value)
          ) {
            return rule.message;
          }
        } else {
          if (String(value) > String(rule.value)) {
            return rule.message;
          }
        }
        break;
      }

      case "expression": {
        try {
          const fn = new Function("data", `return ${rule.expression}`);
          if (!fn(data)) return rule.message;
        } catch {
          return rule.message;
        }
        break;
      }
    }
  }

  return undefined;
}

export function processAction(
  schema: IDeclarativeForm,
  locale: string,
  state: FormState,
  action: FormAction
): DispatchResult {
  switch (action.type) {
    case "update_field": {
      const newData = { ...state.data, [action.fieldId]: action.value };
      const compiled = compile(schema, locale, newData, state.activeSectionId);

      return {
        state: {
          ...state,
          data: newData,
          compiled,
          validationErrors: {},
        },
        effect: { type: "none" },
      };
    }

    case "submit_section": {
      const mergedData = { ...state.data, ...action.data };

      const errors = validateSectionData(
        schema,
        locale,
        state.activeSectionId,
        action.data,
        mergedData
      );

      if (Object.keys(errors).length > 0) {
        return {
          state: { ...state, validationErrors: errors },
          effect: { type: "none" },
        };
      }

      const section = (schema.sections ?? []).find(
        (s) => s.id === state.activeSectionId
      );
      if (!section) {
        return { state, effect: { type: "none" } };
      }

      const nextSectionId = resolveNextSectionId(section, mergedData);

      if (isExternalNextSectionId(nextSectionId)) {
        const compiled = compile(
          schema,
          locale,
          mergedData,
          state.activeSectionId
        );
        return {
          state: {
            ...state,
            data: mergedData,
            compiled,
            validationErrors: {},
          },
          effect: { type: "redirect", url: nextSectionId },
        };
      }

      if (nextSectionId === "done") {
        const compiled = compile(
          schema,
          locale,
          mergedData,
          state.activeSectionId
        );
        return {
          state: {
            ...state,
            data: mergedData,
            compiled,
            validationErrors: {},
          },
          effect: { type: "complete", data: mergedData },
        };
      }

      const compiled = compile(schema, locale, mergedData, nextSectionId);
      return {
        state: {
          ...state,
          data: mergedData,
          activeSectionId: nextSectionId,
          compiled,
          sectionHistory: [...state.sectionHistory, state.activeSectionId],
          validationErrors: {},
        },
        effect: { type: "submit", data: mergedData, isPartial: true },
      };
    }

    case "go_back": {
      const previousSectionId =
        state.sectionHistory[state.sectionHistory.length - 1];
      if (!previousSectionId) {
        return { state, effect: { type: "none" } };
      }

      const compiled = compile(
        schema,
        locale,
        state.data,
        previousSectionId
      );
      return {
        state: {
          ...state,
          activeSectionId: previousSectionId,
          compiled,
          sectionHistory: state.sectionHistory.slice(0, -1),
          validationErrors: {},
        },
        effect: { type: "none" },
      };
    }

    case "set_locale": {
      const compiled = compile(
        schema,
        action.locale,
        state.data,
        state.activeSectionId
      );
      return {
        state: { ...state, compiled },
        effect: { type: "none" },
      };
    }
  }
}
