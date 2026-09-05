import type { IDeclarativeFormTheme } from '../schema/form-theme';
import type { IRenderableSection } from './section';
import type { IRenderableStart } from './start';

export type IRenderableForm = {
  id?: string;
  title?: string;
  description?: string;
  start?: IRenderableStart;
  locale: string;
  theme?: IDeclarativeFormTheme;
  section: IRenderableSection;
};
