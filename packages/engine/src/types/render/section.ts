import type { IRenderableField } from './field';
import type { IRenderableNavigation } from './navigation';

/**
 * The current section, ready to render. `fields` includes hidden and
 * currently-invisible fields (carrying a `visible` flag) so the renderer can
 * filter. `next` is the provisional navigation target for the current answers,
 * recomputed per render and authoritative at submit. `canGoBack` drives the
 * Back affordance (derived from navigation history). `defaultValues` seeds the
 * section's fields (submitted answers merged with per-type empty defaults).
 */
export type IRenderableSection = {
  id: string;
  title?: string;
  fields: IRenderableField[];
  next: IRenderableNavigation;
  canGoBack: boolean;
  defaultValues: Record<string, unknown>;
};
