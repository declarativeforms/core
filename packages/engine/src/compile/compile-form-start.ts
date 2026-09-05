import type { ICompiledFormStart, IResolvedForm } from '../types';
import { interpolateTemplate } from './template';

export function compileFormStart(
  form: IResolvedForm,
  data: Record<string, unknown>,
): ICompiledFormStart | undefined {
  if (form.start === false) {
    return undefined;
  }

  const title = form.start?.title ?? form.title ?? '';
  const description = form.start?.description ?? form.description;

  if (!title && !description) {
    return undefined;
  }

  return {
    title: interpolateTemplate(title, data),
    ...(description !== undefined && {
      description: interpolateTemplate(description, data),
    }),
    ...(form.start?.button !== undefined && {
      button: interpolateTemplate(form.start.button, data),
    }),
  };
}
