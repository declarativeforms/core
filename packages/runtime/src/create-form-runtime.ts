import type { IDeclarativeForm } from "@declarativeforms/types";
import { createRuntimeState, transitionRuntime } from "./core/runtime";
import { DEFAULT_MESSAGES, type ValidationMessages } from "./messages";
import type { CompiledSection, FormEffect, FormState } from "./types";

export type FormRuntimeOptions = {
  locale: string;
  initialData?: Record<string, unknown>;
  initialSectionId?: string;
  messages?: Partial<ValidationMessages>;
};

export type FormRuntime = {
  readonly state: FormState;
  readonly activeSection: CompiledSection;
  readonly data: Record<string, unknown>;
  readonly validationErrors: Record<string, string>;
  updateField(fieldId: string, value: unknown): FormEffect;
  submitSection(data: Record<string, unknown>): FormEffect;
  goBack(): FormEffect;
  setLocale(locale: string): FormEffect;
  subscribe(listener: (state: FormState) => void): () => void;
};

export function createFormRuntime(
  schema: IDeclarativeForm,
  options: FormRuntimeOptions,
): FormRuntime {
  const messages: ValidationMessages = { ...DEFAULT_MESSAGES, ...options.messages };
  let currentState = createRuntimeState(
    schema,
    options.locale,
    options.initialData ?? {},
    options.initialSectionId,
    messages,
  );
  let locale = options.locale;
  const listeners = new Set<(state: FormState) => void>();

  function notify(): void {
    for (const listener of listeners) {
      listener(currentState);
    }
  }

  function dispatch(action: Parameters<typeof transitionRuntime>[3]): FormEffect {
    const result = transitionRuntime(schema, locale, currentState, action, messages);
    currentState = result.state;
    notify();
    return result.effect;
  }

  function getActiveSection(): CompiledSection {
    return (
      currentState.compiled.sections.find(
        (s) => s.id === currentState.activeSectionId,
      ) ?? currentState.compiled.sections[0]
    );
  }

  return {
    get state() {
      return currentState;
    },
    get activeSection() {
      return getActiveSection();
    },
    get data() {
      return currentState.data;
    },
    get validationErrors() {
      return currentState.validationErrors;
    },

    updateField(fieldId: string, value: unknown): FormEffect {
      return dispatch({ type: "update_field", fieldId, value });
    },

    submitSection(data: Record<string, unknown>): FormEffect {
      return dispatch({ type: "submit_section", data });
    },

    goBack(): FormEffect {
      return dispatch({ type: "go_back" });
    },

    setLocale(newLocale: string): FormEffect {
      locale = newLocale;
      return dispatch({ type: "set_locale", locale: newLocale });
    },

    subscribe(listener: (state: FormState) => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
