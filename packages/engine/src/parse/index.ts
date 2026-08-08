import yaml from 'js-yaml';

import type { IDeclarativeForm } from '../types';

/**
 * Step 1 — parse a raw YAML form definition into the authored schema.
 *
 * The YAML is trusted (authored in a repo) and cast without schema validation,
 * mirroring how the API loads forms today.
 */
export function parse(text: string): IDeclarativeForm {
  return (yaml.load(text) as IDeclarativeForm) ?? {};
}
