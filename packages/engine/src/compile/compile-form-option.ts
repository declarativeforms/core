import type { ICompiledFormOption, IResolvedFormOption } from '../types';
import { interpolateTemplate } from './template';

export function compileFormOption(
  option: IResolvedFormOption,
  data: Record<string, unknown>,
): ICompiledFormOption {
  if (typeof option === 'string') {
    return { label: interpolateTemplate(option, data), value: option };
  }

  const label =
    option.label !== undefined ? interpolateTemplate(option.label, data) : '';

  const value = option.value ?? label;

  return { label: label || value || '', value: value || '' };
}
