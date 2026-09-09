import type { IDeclarativeFormButton, IResolvedFormButton } from '../types';
import { resolveLocalizedText } from './localize';

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
