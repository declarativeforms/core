import type {
  FormAction,
  FormEffect,
  FormState,
} from '@declarativeforms/runtime';
import {
  createRuntimeState,
  transitionRuntime,
} from '@declarativeforms/runtime';
import { useRef, useState } from 'react';
import type { IDeclarativeForm } from '../supporting/types';

export function useFormRuntime(
  schema: IDeclarativeForm,
  locale: string,
  initialData: Record<string, unknown>,
  initialSectionId?: string,
): {
  state: FormState;
  dispatch: (action: FormAction) => FormEffect & { activeSectionId: string };
} {
  const [state, setState] = useState<FormState>(() =>
    createRuntimeState(schema, locale, initialData, initialSectionId),
  );
  const stateRef = useRef(state);

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

  return { state, dispatch };
}
