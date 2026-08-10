import type { IDeclarativeFormButton, IResolvedFormButton } from '../types';
import { resolveLocalizedText } from './localize';

/** Localize a completion button's label and URL. */
export function resolveFormButton(
  button: IDeclarativeFormButton,
  locale: string,
): IResolvedFormButton {
  return {
    ...(button.label !== undefined && {
      label: resolveLocalizedText(button.label, locale),
    }),
    ...(button.url !== undefined && {
      url: resolveLocalizedText(button.url, locale),
    }),
  };
}
