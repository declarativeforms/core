import yaml from 'js-yaml';
import type { FormDefinition } from './definition';

export class FormYamlParseError extends Error {
  readonly line?: number;
  readonly column?: number;

  constructor(message: string, line?: number, column?: number) {
    super(message);
    this.name = 'FormYamlParseError';
    this.line = line;
    this.column = column;
  }
}

export function parseFormYaml(source: string): FormDefinition {
  let parsed: unknown;

  try {
    parsed = yaml.load(source, { schema: yaml.JSON_SCHEMA });
  } catch (error) {
    if (error instanceof yaml.YAMLException) {
      const line =
        typeof error.mark?.line === 'number' ? error.mark.line + 1 : undefined;
      const column =
        typeof error.mark?.column === 'number'
          ? error.mark.column + 1
          : undefined;
      const location =
        line !== undefined && column !== undefined
          ? ` at line ${line}, column ${column}`
          : '';
      throw new FormYamlParseError(
        `YAML syntax error${location}: ${error.reason || 'invalid YAML'}`,
        line,
        column,
      );
    }
    throw error;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new FormYamlParseError('A form definition must be a YAML object.');
  }

  return parsed as FormDefinition;
}
