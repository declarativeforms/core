import type { IDeclarativeFormMeasurements } from '../schema/form-measurements';
import type { IDeclarativeFormTheme } from '../schema/form-theme';
import type { ICompiledConnection } from './connection';
import type { ICompiledFormCompletion } from './form-completion';
import type { ICompiledFormSection } from './form-section';

/**
 * A form fully compiled against a set of answers (data/submission): every
 * dynamic aspect is resolved. Localization is removed and templates are
 * interpolated (text is plain string), `visible_when` conditions are assessed
 * into per-field `visible` booleans, validators are normalized, options are
 * concretized, the completion rule is selected, and connection gates are
 * assessed. Navigation state (which section is active) is intentionally NOT
 * here: the engine is pure and the app owns that state.
 */
export type ICompiledForm = {
  id?: string;
  version: number;
  title: string;
  description?: string;
  sections: ICompiledFormSection[];
  completion?: ICompiledFormCompletion;
  connections: ICompiledConnection[];
  locale: string;
  measurements?: IDeclarativeFormMeasurements;
  start_date?: string;
  end_date?: string;
  theme?: IDeclarativeFormTheme;
};
