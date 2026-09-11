'use client';
import type { ComponentProps } from 'react';
import ReactMarkdown from 'react-markdown';
import type { IRenderableTextBlockField } from '@declarativeforms/engine';
import type { FieldProps } from '@/components/declarative-form/supporting';

function resolveSafeMarkdownUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    return parsed.protocol === 'https:' || parsed.protocol === 'mailto:'
      ? url
      : null;
  } catch {
    return null;
  }
}

function MarkdownLink(props: ComponentProps<'a'>): React.JSX.Element {
  if (!props.href) {
    return <span>{props.children}</span>;
  }

  return (
    <a
      className="font-medium text-primary underline underline-offset-4"
      href={props.href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {props.children}
    </a>
  );
}

export function TextBlockField(
  props: FieldProps<IRenderableTextBlockField, string>,
): React.JSX.Element {
  return (
    <div className="text-sm leading-6 text-gray-700 [&_blockquote]:border-l-2 [&_blockquote]:border-gray-200 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_hr]:my-4 [&_hr]:border-gray-200 [&_li]:ml-5 [&_ol]:list-decimal [&_p+p]:mt-3 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:list-disc">
      <ReactMarkdown
        allowedElements={[
          'a',
          'blockquote',
          'br',
          'code',
          'em',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'hr',
          'li',
          'ol',
          'p',
          'pre',
          'strong',
          'ul',
        ]}
        components={{ a: MarkdownLink }}
        skipHtml
        urlTransform={resolveSafeMarkdownUrl}
      >
        {props.field.content}
      </ReactMarkdown>
    </div>
  );
}
