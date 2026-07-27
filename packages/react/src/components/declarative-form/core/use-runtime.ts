import type {
  FormAction,
  FormDefinition,
  FormEffect,
  FormState,
} from '@declarativeforms/core';
import {
  createRuntimeState,
  transitionRuntime,
} from '@declarativeforms/core';
import { useEffect, useRef, useState } from 'react';

export function useFormRuntime(
  schema: FormDefinition,
  locale: string,
  initialData: Record<string, unknown>,
  initialSectionId?: string,
): {
  state: FormState;
  dispatch: (action: FormAction) => FormEffect & { activeSectionId: string };
  restore: (previousState: FormState) => void;
} {
  const [state, setState] = useState<FormState>(() =>
    createRuntimeState(schema, locale, initialData, initialSectionId),
  );
  const stateRef = useRef(state);
  const localeRef = useRef(locale);

  useEffect(() => {
    if (localeRef.current === locale) {
      return;
    }

    localeRef.current = locale;
    const result = transitionRuntime(schema, locale, stateRef.current, {
      type: 'set_locale',
      locale,
    });
    stateRef.current = result.state;
    setState(result.state);
  }, [locale, schema]);

  function dispatch(
    action: FormAction,
  ): FormEffect & { activeSectionId: string } {
    const transitionResult = transitionRuntime(
      schema,
      locale,
      stateRef.current,
      action,
    );
    stateRef.current = transitionResult.state;
    setState(transitionResult.state);

    return {
      ...transitionResult.effect,
      activeSectionId: transitionResult.state.activeSectionId,
    } as FormEffect & {
      activeSectionId: string;
    };
  }

  function restore(previousState: FormState) {
    stateRef.current = previousState;
    setState(previousState);
  }

  return { state, dispatch, restore };
}
