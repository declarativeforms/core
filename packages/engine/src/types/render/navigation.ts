export type IRenderableNavigation =
  | { type: 'section'; sectionId: string }
  | { type: 'complete' }
  | { type: 'redirect'; url: string };
