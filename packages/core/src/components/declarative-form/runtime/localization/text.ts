import { resolveLocalizedText } from "@declarativeforms/common"
import type {
  IDeclarativeFormCompletion,
} from "../../types"
import type { CompiledCompletion } from "../types"

export function localizeCompletion(
  completion: IDeclarativeFormCompletion | undefined,
  locale: string
): CompiledCompletion | undefined {
  if (!completion) {
    return undefined;
  }

  return {
    title: completion.title
      ? resolveLocalizedText(completion.title, locale)
      : undefined,
    message: completion.message
      ? resolveLocalizedText(completion.message, locale)
      : undefined,
    button: completion.button
      ? {
          label: resolveLocalizedText(completion.button.label, locale),
          url: resolveLocalizedText(completion.button.url, locale),
        }
      : undefined,
  };
}
