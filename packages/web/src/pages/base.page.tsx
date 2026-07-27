import { useEffect, type ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components';
import { HtmlText } from '@declarativeforms/react';
import { stripHtml } from '@declarativeforms/core';
import { useI18n } from '@declarativeforms/react';
import { buildThemeStyle } from '@declarativeforms/react';

export function BasePage(props: {
  title: string;
  description?: string;
  theme?: { primary?: string };
  embed?: boolean;
  children: ReactNode;
}) {
  const { t, withLang } = useI18n();

  useEffect(() => {
    document.title = `${stripHtml(props.title)} — Declarative Forms`;
  }, [props.title]);

  const themeStyle = buildThemeStyle(props.theme);

  if (props.embed) {
    return (
      <div style={themeStyle}>
        <Card className="w-full border-0 shadow-none rounded-none">
          <CardHeader className="px-6 !pb-0 border-b border-gray-200">
            <CardTitle className="text-2xl/7.5 font-semibold">
              <HtmlText html={props.title} />
            </CardTitle>
            {props.description ? (
              <CardDescription className="mb-3 mt-2 text-sm text-gray-500">
                <HtmlText html={props.description} />
              </CardDescription>
            ) : null}
          </CardHeader>

          <CardContent className="px-6">{props.children}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 md:py-16" style={themeStyle}>
      <Card className="mb-10 w-full bg-white border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="px-6 !pb-0 border-b border-gray-200">
          <CardTitle className="text-2xl/7.5 font-semibold">
            <HtmlText html={props.title} />
          </CardTitle>
          {props.description ? (
            <CardDescription className="mb-3 mt-2 text-sm text-gray-500">
              <HtmlText html={props.description} />
            </CardDescription>
          ) : null}
        </CardHeader>

        <CardContent className="px-6">{props.children}</CardContent>
      </Card>

      <div className="text-center text-gray-500 text-xs tracking-wide space-x-2">
        <span>
          {t('base.powered_by')}{' '}
          <a
            href="https://docs.declarativeforms.com"
            className="font-medium text-gray-600 underline-offset-4 hover:text-gray-900 hover:underline transition-colors"
          >
            Declarative Forms
          </a>
        </span>
        <span>•</span>
        <a
          href={withLang('/privacy-policy')}
          className="font-medium text-gray-600 underline-offset-4 hover:text-gray-900 hover:underline transition-colors"
        >
          {t('base.privacy_policy')}
        </a>
      </div>
    </div>
  );
}
