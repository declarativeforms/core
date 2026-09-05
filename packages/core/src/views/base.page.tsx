'use client';
import { useEffect, type ReactNode } from 'react';
import { Card } from '@/components';
import { stripHtml } from '@/lib/strip-html';
import { useI18n } from '@/i18n';
import { buildThemeStyle } from '@/lib/theme';

export function BasePage(props: {
  documentTitle: string;
  theme?: { primary?: string };
  embed?: boolean;
  children: ReactNode;
}) {
  const i18n = useI18n();

  useEffect(() => {
    document.title = `${stripHtml(props.documentTitle)} — Declarative Forms`;
  }, [props.documentTitle]);

  const themeStyle = buildThemeStyle(props.theme);

  if (props.embed) {
    return (
      <div style={themeStyle}>
        <Card className="w-full border-0 shadow-none rounded-none">
          {props.children}
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 md:py-16" style={themeStyle}>
      <Card className="mb-10 w-full bg-white border-gray-200 shadow-sm rounded-xl overflow-hidden">
        {props.children}
      </Card>

      <div className="text-center text-gray-500 text-xs tracking-wide space-x-2">
        <span>
          {i18n.t('base.powered_by')}{' '}
          <a
            href="https://frms.dev"
            className="font-medium text-gray-600 underline-offset-4 hover:text-gray-900 hover:underline transition-colors"
          >
            Declarative Forms
          </a>
        </span>
        <span>•</span>
        <a
          href={i18n.withLang('/privacy-policy')}
          className="font-medium text-gray-600 underline-offset-4 hover:text-gray-900 hover:underline transition-colors"
        >
          {i18n.t('base.privacy_policy')}
        </a>
      </div>
    </div>
  );
}
