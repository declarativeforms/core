import type { IDeclarativeForm } from '../definition';
import { evaluateExpression } from '../expression';
import { compile } from '../compilation/form';
import type { DispatchResult, FormAction, FormState } from '../types';
import { DEFAULT_MESSAGES, type ValidationMessages } from '../messages';
import { validateSectionData } from '../validation';
import {
  buildSectionHistory,
  isExternalNextSectionId,
  resolveNextSectionId,
} from '../navigation';

export { isExternalNextSectionId, resolveNextSectionId } from '../navigation';

function removeHiddenValues(
  schema: IDeclarativeForm,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const nextData = { ...data };
  let changed: boolean;

  do {
    changed = false;
    for (const section of schema.sections ?? []) {
      for (const field of section.fields ?? []) {
        if (
          field.id &&
          field.visible_when &&
          !evaluateExpression(field.visible_when, nextData)
        ) {
          if (field.id in nextData || `${field.id}_token` in nextData) {
            changed = true;
          }
          delete nextData[field.id];
          delete nextData[`${field.id}_token`];
        }
      }
    }
  } while (changed);

  return nextData;
}

function getInitialSectionId(
  schema: IDeclarativeForm,
  initialSectionId?: string,
): string {
  if (initialSectionId) {
    return initialSectionId;
  }

  return schema.sections?.[0]?.id ?? '';
}

export function createRuntimeState(
  schema: IDeclarativeForm,
  locale: string,
  initialData: Record<string, unknown>,
  initialSectionId?: string,
  messages: ValidationMessages = DEFAULT_MESSAGES,
): FormState {
  const activeSectionId = getInitialSectionId(schema, initialSectionId);
  const data = removeHiddenValues(schema, initialData);
  const view = compile(schema, locale, data, activeSectionId, messages);

  return {
    view,
    data,
    activeSectionId: view.section.id,
    sectionHistory: buildSectionHistory(schema, data, view.section.id),
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
    case 'update_field': {
      const formData = removeHiddenValues(schema, {
        ...state.data,
        [action.fieldId]: action.value,
      });
      return {
        state: {
          ...state,
          data: formData,
          view: compile(
            schema,
            locale,
            formData,
            state.activeSectionId,
            messages,
          ),
          validationErrors: {},
        },
        effect: { type: 'none' },
      };
    }

    case 'submit_section': {
      const formData = removeHiddenValues(schema, {
        ...state.data,
        ...action.data,
      });
      const validationErrors = validateSectionData(
        schema,
        locale,
        state.activeSectionId,
        action.data,
        formData,
        messages,
      );

      if (Object.keys(validationErrors).length > 0) {
        return {
          state: { ...state, validationErrors },
          effect: { type: 'none' },
        };
      }

      const section = (schema.sections ?? []).find(
        (candidate) => candidate.id === state.activeSectionId,
      );
      if (!section) {
        return { state, effect: { type: 'none' } };
      }

      const nextSectionId = resolveNextSectionId(section, formData);
      const view = compile(
        schema,
        locale,
        formData,
        state.activeSectionId,
        messages,
      );

      if (isExternalNextSectionId(nextSectionId)) {
        return {
          state: {
            ...state,
            data: formData,
            view,
            validationErrors: {},
          },
          effect: { type: 'redirect', url: nextSectionId },
        };
      }

      if (nextSectionId === 'done') {
        return {
          state: {
            ...state,
            data: formData,
            view,
            validationErrors: {},
          },
          effect: { type: 'complete', data: formData },
        };
      }

      return {
        state: {
          ...state,
          data: formData,
          activeSectionId: nextSectionId,
          view: compile(schema, locale, formData, nextSectionId, messages),
          sectionHistory: [...state.sectionHistory, state.activeSectionId],
          validationErrors: {},
        },
        effect: { type: 'submit', data: formData, isPartial: true },
      };
    }

    case 'go_back': {
      const previousSectionId =
        state.sectionHistory[state.sectionHistory.length - 1];
      if (!previousSectionId) {
        return { state, effect: { type: 'none' } };
      }

      return {
        state: {
          ...state,
          activeSectionId: previousSectionId,
          view: compile(
            schema,
            locale,
            state.data,
            previousSectionId,
            messages,
          ),
          sectionHistory: state.sectionHistory.slice(0, -1),
          validationErrors: {},
        },
        effect: { type: 'none' },
      };
    }

    case 'set_locale':
      return {
        state: {
          ...state,
          view: compile(
            schema,
            action.locale,
            state.data,
            state.activeSectionId,
            messages,
          ),
        },
        effect: { type: 'none' },
      };
  }
}
