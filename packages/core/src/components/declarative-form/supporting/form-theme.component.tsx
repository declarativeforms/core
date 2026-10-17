'use client';
import { createContext, useLayoutEffect, type ReactNode } from 'react';
import type { IDeclarativeFormTheme } from '@declarativeforms/engine';
import { applyFormTheme } from '@/lib/theme';

export const FormThemeContext =
  createContext<NonNullable<IDeclarativeFormTheme['mode']>>('light');

export function FormTheme(props: {
  theme?: IDeclarativeFormTheme;
  children: ReactNode;
}): React.JSX.Element {
  useLayoutEffect(() => applyFormTheme(props.theme), [props.theme]);

  return (
    <FormThemeContext value={props.theme?.mode ?? 'light'}>
      {props.children}
    </FormThemeContext>
  );
}
