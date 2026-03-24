import type { IDeclarativeForm } from "@declarativeforms/types";
import { compile } from "../compilation/form";
import type { DispatchResult, FormAction, FormState } from "../types";
import { DEFAULT_MESSAGES, type ValidationMessages } from "../messages";
import { validateSectionData } from "../validation";
import { isExternalNextSectionId, resolveNextSectionId } from "./navigation";

function getInitialSectionId(
  schema: IDeclarativeForm,
  initialSectionId?: string
): string {
  if (initialSectionId) {
    return initialSectionId;
  }

  return schema.sections?.[0]?.id ?? "";
}

export function createRuntimeState(
  schema: IDeclarativeForm,
  locale: string,
  initialData: Record<string, unknown>,
  initialSectionId?: string,
  messages: ValidationMessages = DEFAULT_MESSAGES,
): FormState {
  const activeSectionId = getInitialSectionId(schema, initialSectionId);

  return {
    compiled: compile(schema, locale, initialData, activeSectionId, messages),
    data: initialData,
    activeSectionId,
    sectionHistory: [],
    validationErrors: {},
  };
}

export function transitionRuntime(
  schema: IDeclarativeForm,
  locale: string,
  state: FormState,
  action: FormAction,
  messages: ValidationMessages = DEFAULT_MESSAGES,
): DispatchResult {
  switch (action.type) {
    case "update_field": {
      const data = { ...state.data, [action.fieldId]: action.value };
      return {
        state: {
          ...state,
          data,
          compiled: compile(schema, locale, data, state.activeSectionId, messages),
          validationErrors: {},
        },
        effect: { type: "none" },
      };
    }

    case "submit_section": {
      const data = { ...state.data, ...action.data };
      const errors = validateSectionData(
        schema,
        locale,
        state.activeSectionId,
        action.data,
        data,
        messages,
      );

      if (Object.keys(errors).length > 0) {
        return {
          state: { ...state, validationErrors: errors },
          effect: { type: "none" },
        };
      }

      const section = (schema.sections ?? []).find(
        (candidate) => candidate.id === state.activeSectionId
      );
      if (!section) {
        return { state, effect: { type: "none" } };
      }

      const nextSectionId = resolveNextSectionId(section, data);
      const currentCompiled = compile(
        schema,
        locale,
        data,
        state.activeSectionId,
        messages,
      );

      if (isExternalNextSectionId(nextSectionId)) {
        return {
          state: {
            ...state,
            data,
            compiled: currentCompiled,
            validationErrors: {},
          },
          effect: { type: "redirect", url: nextSectionId },
        };
      }

      if (nextSectionId === "done") {
        return {
          state: {
            ...state,
            data,
            compiled: currentCompiled,
            validationErrors: {},
          },
          effect: { type: "complete", data },
        };
      }

      return {
        state: {
          ...state,
          data,
          activeSectionId: nextSectionId,
          compiled: compile(schema, locale, data, nextSectionId, messages),
          sectionHistory: [...state.sectionHistory, state.activeSectionId],
          validationErrors: {},
        },
        effect: { type: "submit", data, isPartial: true },
      };
    }

    case "go_back": {
      const previousSectionId =
        state.sectionHistory[state.sectionHistory.length - 1];
      if (!previousSectionId) {
        return { state, effect: { type: "none" } };
      }

      return {
        state: {
          ...state,
          activeSectionId: previousSectionId,
          compiled: compile(schema, locale, state.data, previousSectionId, messages),
          sectionHistory: state.sectionHistory.slice(0, -1),
          validationErrors: {},
        },
        effect: { type: "none" },
      };
    }

    case "set_locale":
      return {
        state: {
          ...state,
          compiled: compile(
            schema,
            action.locale,
            state.data,
            state.activeSectionId,
            messages,
          ),
        },
        effect: { type: "none" },
      };
  }
}
