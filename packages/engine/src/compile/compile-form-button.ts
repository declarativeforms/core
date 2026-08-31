import type { ICompiledFormButton, IResolvedFormButton } from '../types';
import { interpolateTemplate } from './template';

export function compileFormButton(
  button: IResolvedFormButton,
  data: Record<string, unknown>,
): ICompiledFormButton {
  return {
    label:
      button.label !== undefined ? interpolateTemplate(button.label, data) : '',
    url: button.url !== undefined ? interpolateTemplate(button.url, data) : '',
  };
}
