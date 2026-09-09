import * as yaml from 'js-yaml';

import type { IDeclarativeForm } from '../types';

export function parse(text: string): IDeclarativeForm {
  return (yaml.load(text) as IDeclarativeForm) ?? {};
}
