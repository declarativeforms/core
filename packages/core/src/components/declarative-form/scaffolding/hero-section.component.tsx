'use client';
import { useEffect } from 'react';
import { Button } from '@/components';
import { FormTheme, HtmlText } from '@/components/declarative-form/supporting';
import { useI18n } from '@/i18n';
import type { IDeclarativeFormTheme } from '@declarativeforms/engine';
import { stripHtml } from '@/lib/strip-html';
import { FormLogo } from './form-logo.component';

export function HeroSection(props: {
  title: string;
  description?: string;
  onAction?: () => void;
  buttonLabel?: string;
  buttonHref?: string;
  theme?: IDeclarativeFormTheme;
}): React.JSX.Element {
  const i18n = useI18n();

  useEffect(() => {
    document.title = `${stripHtml(props.title)} — Declarative Forms`;
  }, [props.title]);

  return (
    <FormTheme theme={props.theme}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
        <div className="w-full max-w-2xl mx-auto text-center px-6 md:px-0">
          <FormLogo className="mb-6 px-0 pt-0" url={props.theme?.logo} />
          <h1 className="text-2xl/8 font-semibold text-foreground mb-4">
            <HtmlText html={props.title} />
          </h1>

          {props.description ? (
            <p className="text-sm text-muted-foreground mb-8">
              <HtmlText html={props.description} />
            </p>
          ) : null}

          {props.buttonHref ? (
            <Button asChild className="w-full">
              <a href={props.buttonHref}>
                {props.buttonLabel ? (
                  <HtmlText html={props.buttonLabel} />
                ) : (
                  i18n.t('hero.continue')
                )}
              </a>
            </Button>
          ) : props.onAction ? (
            <Button className="w-full" onClick={() => props.onAction?.()}>
              {props.buttonLabel ? (
                <HtmlText html={props.buttonLabel} />
              ) : (
                i18n.t('hero.continue')
              )}
            </Button>
          ) : null}
        </div>

        <div className="absolute bottom-8 text-center w-full px-4">
          <p className="text-xs text-muted-foreground">
            {i18n.t('base.powered_by')}{' '}
            <a
              href="https://frms.dev"
              className="font-medium text-foreground hover:underline underline-offset-4"
            >
              Declarative Forms
            </a>
          </p>
        </div>
      </div>
    </FormTheme>
  );
}
