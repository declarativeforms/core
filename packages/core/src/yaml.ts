import yaml from 'js-yaml';
import type { FormDefinition } from './definition';

export function parseFormYaml(source: string): FormDefinition {
  const parsed = yaml.load(source);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('A form definition must be a YAML object.');
  }

  return parsed as FormDefinition;
}
