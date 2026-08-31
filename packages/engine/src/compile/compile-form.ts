import type { ICompiledForm, IResolvedForm } from '../types';
import { compileConnection } from './compile-connection';
import { compileFormCompletion } from './compile-form-completion';
import { compileFormSection } from './compile-form-section';
import { DEFAULT_MESSAGES, type ValidationMessages } from './messages';
import { interpolateTemplate } from './template';

export function compile(
  resolved: IResolvedForm,
  data: Record<string, unknown>,
  messages: ValidationMessages = DEFAULT_MESSAGES,
): ICompiledForm {
  const completion = compileFormCompletion(resolved.completion, data);

  return {
    ...(resolved.id !== undefined && { id: resolved.id }),
    version: resolved.version ?? 1,
    title:
      resolved.title !== undefined
        ? interpolateTemplate(resolved.title, data)
        : '',
    ...(resolved.description !== undefined && {
      description: interpolateTemplate(resolved.description, data),
    }),
    sections: (resolved.sections ?? []).map((section) =>
      compileFormSection(section, data, messages),
    ),
    ...(completion && { completion }),
    connections: (resolved.connections ?? []).flatMap((connection) => {
      const compiled = compileConnection(connection, data);
      return compiled ? [compiled] : [];
    }),
    locale: resolved.locale ?? 'en',
    ...(resolved.measurements !== undefined && {
      measurements: resolved.measurements,
    }),
    ...(resolved.start_date !== undefined && {
      start_date: resolved.start_date,
    }),
    ...(resolved.end_date !== undefined && { end_date: resolved.end_date }),
    ...(resolved.theme !== undefined && { theme: resolved.theme }),
  };
}
