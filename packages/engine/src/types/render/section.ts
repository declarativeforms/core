import type { IResolvedAdaptive } from '../resolved';
import type { IRenderableField } from './field';
import type { IRenderableNavigation } from './navigation';

export type IRenderableSection = {
  adaptive?: IResolvedAdaptive;
  id: string;
  title?: string;
  description?: string;
  button?: string;
  fields: Array<IRenderableField>;
  next: IRenderableNavigation;
  canGoBack: boolean;
  defaultValues: Record<string, unknown>;
};
