import type { IDeclarativeFormOption, IResolvedFormOption } from '../types';
import { resolveLocalizedText } from './localize';

export function resolveFormOption(
  option: IDeclarativeFormOption,
  locale: string,
): IResolvedFormOption {
  if (typeof option === 'string') {
    return option;
  }

  return {
    ...(option.label !== undefined && {
      label: resolveLocalizedText(option.label, locale),
    }),
    ...(option.value !== undefined && { value: option.value }),
  };
}
