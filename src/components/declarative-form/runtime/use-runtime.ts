import { useCallback, useState } from "react";

import type { IDeclarativeForm } from "../types";
import { createFormState, processAction } from "./state";
import type { FormAction, FormEffect, FormState } from "./types";

export function useFormRuntime(
  schema: IDeclarativeForm,
  locale: string,
  initialData: Record<string, unknown>,
  initialSectionId?: string
): {
  state: FormState;
  dispatch: (action: FormAction) => FormEffect;
} {
  const [state, setState] = useState<FormState>(() =>
    createFormState(schema, locale, initialData, initialSectionId)
  );

  const dispatch = useCallback(
    (action: FormAction): FormEffect => {
      let effect: FormEffect = { type: "none" };

      setState((currentState) => {
        const result = processAction(schema, locale, currentState, action);
        effect = result.effect;
        return result.state;
      });

      return effect;
    },
    [schema, locale]
  );

  return { state, dispatch };
}
