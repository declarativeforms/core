import type { IDeclarativeFormTheme } from '../schema/form-theme';
import type { IRenderableSection } from './section';

export type IRenderableForm = {
  id?: string;
  title?: string;
  description?: string;
  locale: string;
  theme?: IDeclarativeFormTheme;
  section: IRenderableSection;
};
