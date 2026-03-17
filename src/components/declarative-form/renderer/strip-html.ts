/**
 * Strips HTML tags from a string, returning plain text.
 * Used where only the text content of a localized label is needed
 * (e.g. aria-label attributes, document title).
 *
 * Note: This function is intentionally lightweight and is only used with
 * trusted HTML from the form schema — not with raw end-user input.
 */
export function stripHtml(html: string): string {
  // Match complete and incomplete HTML tags (e.g. <b>, </b>, <script src=...>
  // and also truncated tags without a closing > like <script).
  // The leading letter requirement [a-zA-Z] avoids stripping math like "a < b".
  return html.replace(/<\/?[a-zA-Z][^>]*>?/g, "");
}
