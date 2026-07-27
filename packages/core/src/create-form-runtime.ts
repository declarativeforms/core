import type { IDeclarativeForm } from './definition';
import { createRuntimeState, transitionRuntime } from './core/runtime';
import { DEFAULT_MESSAGES, type ValidationMessages } from './messages';
import type { FormEffect, FormState, SectionView } from './types';

export type FormRuntimeOptions = {
  locale: string;
  initialData?: Record<string, unknown>;
  initialSectionId?: string;
  messages?: Partial<ValidationMessages>;
};

export type FormRuntime = {
  readonly state: FormState;
  readonly activeSection: SectionView;
  readonly data: Record<string, unknown>;
  readonly validationErrors: Record<string, string>;
  updateField(fieldId: string, value: unknown): FormEffect;
  submitSection(sectionData: Record<string, unknown>): FormEffect;
  goBack(): FormEffect;
  setLocale(locale: string): FormEffect;
  subscribe(listener: (state: FormState) => void): () => void;
};

export function createFormRuntime(
  schema: IDeclarativeForm,
  options: FormRuntimeOptions,
): FormRuntime {
  const messages: ValidationMessages = {
    ...DEFAULT_MESSAGES,
    ...options.messages,
  };
  let runtimeState = createRuntimeState(
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
      listener(runtimeState);
    }
  }

  function dispatch(
    action: Parameters<typeof transitionRuntime>[3],
  ): FormEffect {
    const transitionResult = transitionRuntime(
      schema,
      locale,
      runtimeState,
      action,
      messages,
    );
    runtimeState = transitionResult.state;
    notify();

    return transitionResult.effect;
  }

  function getActiveSection(): SectionView {
    return runtimeState.view.section;
  }

  return {
    get state() {
      return runtimeState;
    },
    get activeSection() {
      return getActiveSection();
    },
    get data() {
      return runtimeState.data;
    },
    get validationErrors() {
      return runtimeState.validationErrors;
    },

    updateField(fieldId: string, value: unknown): FormEffect {
      return dispatch({ type: 'update_field', fieldId, value });
    },

    submitSection(sectionData: Record<string, unknown>): FormEffect {
      return dispatch({ type: 'submit_section', data: sectionData });
    },

    goBack(): FormEffect {
      return dispatch({ type: 'go_back' });
    },

    setLocale(newLocale: string): FormEffect {
      locale = newLocale;
      return dispatch({ type: 'set_locale', locale: newLocale });
    },

    subscribe(listener: (state: FormState) => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
