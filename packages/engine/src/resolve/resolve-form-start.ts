import type { IDeclarativeFormStart, IResolvedFormStart } from '../types';
import { resolveLocalizedText } from './localize';

export function resolveFormStart(
  start: IDeclarativeFormStart | false,
  locale: string,
): IResolvedFormStart | false {
  if (start === false) {
    return false;
  }

  return {
    ...(start.title !== undefined && {
      title: resolveLocalizedText(start.title, locale),
    }),
    ...(start.description !== undefined && {
      description: resolveLocalizedText(start.description, locale),
    }),
    ...(start.button !== undefined && {
      button: resolveLocalizedText(start.button, locale),
    }),
  };
}
