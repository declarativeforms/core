import { useCallback, useRef, useState } from "react";

import type { IDeclarativeForm } from "../../types";
import type { FormAction, FormEffect, FormState } from "@declarativeforms/runtime";
import { createRuntimeState, transitionRuntime } from "@declarativeforms/runtime";

export function useFormRuntime(
  schema: IDeclarativeForm,
  locale: string,
  initialData: Record<string, unknown>,
  initialSectionId?: string
): {
  state: FormState;
  dispatch: (action: FormAction) => FormEffect & { activeSectionId: string };
} {
  const [state, setState] = useState<FormState>(() =>
    createRuntimeState(schema, locale, initialData, initialSectionId)
  );
  const stateRef = useRef(state);

  const dispatch = useCallback(
    (action: FormAction): FormEffect & { activeSectionId: string } => {
      const result = transitionRuntime(schema, locale, stateRef.current, action);
      stateRef.current = result.state;
      setState(result.state);

      return {
        ...result.effect,
        activeSectionId: result.state.activeSectionId,
      } as FormEffect & {
        activeSectionId: string;
      };
    },
    [schema, locale]
  );

  return { state, dispatch };
}
