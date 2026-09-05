'use client';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { HtmlText } from '@/components/declarative-form/supporting';

export function DeclarativeFormHeading(props: {
  title?: string;
  description?: string;
  titleId?: string;
}) {
  if (!props.title && !props.description) {
    return null;
  }

  return (
    <CardHeader className="px-6 !pb-0 border-b border-gray-200">
      {props.title ? (
        <CardTitle id={props.titleId} className="text-2xl/7.5 font-semibold">
          <HtmlText html={props.title} />
        </CardTitle>
      ) : null}
      {props.description ? (
        <CardDescription className="mb-3 mt-2 text-sm text-gray-500">
          <HtmlText html={props.description} />
        </CardDescription>
      ) : null}
    </CardHeader>
  );
}
