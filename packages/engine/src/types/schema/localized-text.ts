/**
 * A piece of user-facing text.
 *
 * Either a plain string, or a map of locale code to translated string
 * (for example `{ en: 'Name', de: 'Name' }`).
 */
export type ILocalizedText = Record<string, string> | string;
