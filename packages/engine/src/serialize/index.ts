import type { IDeclarativeForm } from '../types';
import * as yaml from 'js-yaml';

export function serialize(form: IDeclarativeForm): string {
  return yaml.dump(form, {
    lineWidth: 100,
    noRefs: true,
    sortKeys: false,
  });
}
