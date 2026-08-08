import type { IDeclarativeFormTheme } from '../schema/form-theme';
import type { IRenderableProgress } from './progress';
import type { IRenderableSection } from './section';

/**
 * Everything needed to render the form right now: the form-level chrome shown
 * once (title, description, theme) plus the current `section`. Only the active
 * section is carried; subsequent sections are irrelevant to the current render
 * and the next one is resolved from the submitted answers (see
 * `IRenderableSection.next`). Answers/values are owned by the app, not here.
 */
export type IRenderableForm = {
  id?: string;
  title?: string;
  description?: string;
  locale: string;
  theme?: IDeclarativeFormTheme;
  section: IRenderableSection;
  progress?: IRenderableProgress;
};
