import type {
  FormAction,
  FormDefinition,
  FormEffect,
  FormState,
} from '@declarativeforms/core';
import { createRuntimeState, transitionRuntime } from '@declarativeforms/core';
import { useEffect, useRef, useState } from 'react';

type PreparedTransition = {
  effect: FormEffect & { activeSectionId: string };
  state: FormState;
};

export function useFormRuntime(
  schema: FormDefinition,
  locale: string,
  initialData: Record<string, unknown>,
  initialSectionId?: string,
): {
  state: FormState;
  dispatch: (action: FormAction) => FormEffect & { activeSectionId: string };
  prepare: (action: FormAction) => PreparedTransition;
  commit: (nextState: FormState) => void;
} {
  const [state, setState] = useState<FormState>(() =>
    createRuntimeState(schema, locale, initialData, initialSectionId),
  );
  const stateRef = useRef(state);
  const localeRef = useRef(locale);
  const schemaRef = useRef(schema);
  const initialSectionIdRef = useRef(initialSectionId);
  const initialDataFingerprintRef = useRef(JSON.stringify(initialData));

  useEffect(() => {
    const initialDataFingerprint = JSON.stringify(initialData);
    if (
      schemaRef.current !== schema ||
      initialSectionIdRef.current !== initialSectionId ||
      initialDataFingerprintRef.current !== initialDataFingerprint
    ) {
      schemaRef.current = schema;
      initialSectionIdRef.current = initialSectionId;
      initialDataFingerprintRef.current = initialDataFingerprint;
      localeRef.current = locale;
      const nextState = createRuntimeState(
        schema,
        locale,
        initialData,
        initialSectionId,
      );
      stateRef.current = nextState;
      setState(nextState);
      return;
    }

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
  }, [initialData, initialSectionId, locale, schema]);

  function prepare(action: FormAction): PreparedTransition {
    const transitionResult = transitionRuntime(
      schema,
      locale,
      stateRef.current,
      action,
    );

    return {
      state: transitionResult.state,
      effect: {
        ...transitionResult.effect,
        activeSectionId: transitionResult.state.activeSectionId,
      } as FormEffect & { activeSectionId: string },
    };
  }

  function commit(nextState: FormState) {
    stateRef.current = nextState;
    setState(nextState);
  }

  function dispatch(
    action: FormAction,
  ): FormEffect & { activeSectionId: string } {
    const transition = prepare(action);
    commit(transition.state);
    return transition.effect;
  }

  return { state, dispatch, prepare, commit };
}
