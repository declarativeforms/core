import { useFormContext, useWatch } from "react-hook-form";

import { useI18n } from "@/i18n/use-i18n";

import { interpolateTemplate } from "../runtime/core/expression";

import type { I18nContextValue } from "@/i18n/context";

export function useFormI18n(): I18nContextValue {
  const i18n = useI18n();
  const { control } = useFormContext();
  const liveData = useWatch({ control });

  return {
    ...i18n,
    t: (key, values) =>
      interpolateTemplate(i18n.t(key, values), { ...liveData }),
  };
}
