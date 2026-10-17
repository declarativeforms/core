'use client';
import { useEffect, type ReactNode } from 'react';
import { Card } from '@/components';
import { FormLogo } from '@/components/declarative-form/scaffolding/form-logo.component';
import { useI18n } from '@/i18n';
import type { IDeclarativeFormTheme } from '@declarativeforms/engine';
import { FormTheme } from '@/components/declarative-form/supporting';
import { stripHtml } from '@/lib/strip-html';

export function BasePage(props: {
  documentTitle: string;
  theme?: IDeclarativeFormTheme;
  embed?: boolean;
  children: ReactNode;
}): React.JSX.Element {
  const i18n = useI18n();

  useEffect(() => {
    document.title = `${stripHtml(props.documentTitle)} — Declarative Forms`;
  }, [props.documentTitle]);

  if (props.embed) {
    return (
      <FormTheme theme={props.theme}>
        <Card className="form-embed w-full border-0 shadow-none rounded-none">
          <FormLogo url={props.theme?.logo} />
          {props.children}
        </Card>
      </FormTheme>
    );
  }

  return (
    <FormTheme theme={props.theme}>
      <div className="max-w-lg mx-auto px-4 py-12 md:py-16">
        <Card className="mb-10 w-full bg-card border-border shadow-sm rounded-xl overflow-hidden">
          <FormLogo url={props.theme?.logo} />
          {props.children}
        </Card>

        <div className="text-center text-muted-foreground text-xs tracking-wide space-x-2">
          <span>
            {i18n.t('base.powered_by')}{' '}
            <a
              href="https://frms.dev"
              className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors"
            >
              Declarative Forms
            </a>
          </span>
        </div>
      </div>
    </FormTheme>
  );
}
