import type { ILocalizedText } from './localized-text';
import type { IDeclarativeFormValidator } from './form-validator';

/**
 * Properties shared by every field.
 *
 * Author-facing metadata stays optional so hand-authored YAML is forgiving. The
 * `type` discriminant lives on each member (not here) so the field union
 * narrows on `field.type`.
 */
export type IDeclarativeFormFieldBase = {
  id?: string;
  label?: ILocalizedText;
  placeholder?: ILocalizedText;
  validators?: Array<IDeclarativeFormValidator>;
  visible_when?: string;
};
