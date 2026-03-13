import type { ComponentPropsWithoutRef, ElementType } from "react";

type HtmlTextProps<T extends ElementType = "span"> = {
  html: string;
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, "dangerouslySetInnerHTML" | "children">;

export function HtmlText<T extends ElementType = "span">({
  html,
  as,
  ...rest
}: HtmlTextProps<T>) {
  const Tag = as || "span";
  return <Tag dangerouslySetInnerHTML={{ __html: html }} {...rest} />;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}
