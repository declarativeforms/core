import type { IConnection } from './connection';
import type { IDeclarativeFormCompletion } from './form-completion';
import type { IDeclarativeFormCompletionRule } from './form-completion-rule';
import type { IDeclarativeFormMeasurements } from './form-measurements';
import type { IDeclarativeFormSection } from './form-section';
import type { IDeclarativeFormTheme } from './form-theme';
import type { ILocalizedText } from './localized-text';

/** The top-level authored form schema, as parsed from a YAML definition. */
export type IDeclarativeForm = {
  id?: string;
  version?: number;
  title?: ILocalizedText;
  description?: ILocalizedText;
  completion?: IDeclarativeFormCompletion | IDeclarativeFormCompletionRule[];
  sections?: Array<IDeclarativeFormSection>;
  connections?: Array<IConnection>;
  start_date?: string;
  end_date?: string;
  locale?: string;
  measurements?: IDeclarativeFormMeasurements;
  theme?: IDeclarativeFormTheme;
};
