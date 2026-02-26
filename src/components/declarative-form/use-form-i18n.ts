import { useContext } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { useI18n } from "@/i18n/use-i18n";

import { AccumulatedDataContext } from "./accumulated-data-context";
import { interpolateTemplate } from "./form-helpers";

import type { I18nContextValue } from "@/i18n/context";

export function useFormI18n(): I18nContextValue {
  const i18n = useI18n();
  const { control } = useFormContext();
  const liveData = useWatch({ control });
  const accumulatedData = useContext(AccumulatedDataContext);

  return {
    ...i18n,
    t: (key, values) =>
      interpolateTemplate(i18n.t(key, values), { ...accumulatedData, ...liveData }),
  };
}
