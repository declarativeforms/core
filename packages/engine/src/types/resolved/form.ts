import type { IDeclarativeFormMeasurements } from '../schema/form-measurements';
import type { IDeclarativeFormTheme } from '../schema/form-theme';
import type { IResolvedConnection } from './connection';
import type { IResolvedFormCompletion } from './form-completion';
import type { IResolvedFormCompletionRule } from './form-completion-rule';
import type { IResolvedFormSection } from './form-section';

/**
 * A form after localization has been resolved: every `ILocalizedText` from the
 * authored `IDeclarativeForm` is collapsed to a plain string. `locale` is kept
 * to record which locale was applied. All other shapes match the schema.
 */
export type IResolvedForm = {
  id?: string;
  version?: number;
  title?: string;
  description?: string;
  completion?: IResolvedFormCompletion | IResolvedFormCompletionRule[];
  sections?: Array<IResolvedFormSection>;
  connections?: Array<IResolvedConnection>;
  start_date?: string;
  end_date?: string;
  locale?: string;
  measurements?: IDeclarativeFormMeasurements;
  theme?: IDeclarativeFormTheme;
};
