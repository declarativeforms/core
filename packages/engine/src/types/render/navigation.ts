/**
 * Where the form goes after the current section is submitted.
 *
 * This is resolved against the current answers and recomputed on every data
 * change; because the view re-renders per change, it is authoritative at the
 * moment the section is submitted. `complete` means the form is finished;
 * `redirect` means send the user to an external URL.
 */
export type IRenderableNavigation =
  | { type: 'section'; sectionId: string }
  | { type: 'complete' }
  | { type: 'redirect'; url: string };
