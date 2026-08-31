import type { IRenderableField } from './field';
import type { IRenderableNavigation } from './navigation';

export type IRenderableSection = {
  id: string;
  title?: string;
  fields: Array<IRenderableField>;
  next: IRenderableNavigation;
  canGoBack: boolean;
  defaultValues: Record<string, unknown>;
};
