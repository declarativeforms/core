import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { Ajv } from 'ajv';
import {
  DECLARATIVE_FIELD_TYPES,
  FORM_JSON_SCHEMA,
  assertJsonSchemaCoverage,
  parse,
} from '@declarativeforms/engine';

const AGENT_INSTRUCTIONS = 'public/AGENTS.md';

const packageDirectory = process.cwd();
const repositoryRoot = path.resolve(packageDirectory, '..', '..');
const agentInstructionsPath = path.resolve(
  /*turbopackIgnore: true*/ packageDirectory,
  AGENT_INSTRUCTIONS,
);
const exampleForms = [
  {
    name: 'examples/contact.yaml',
    file: path.resolve(
      /*turbopackIgnore: true*/ repositoryRoot,
      'examples/contact.yaml',
    ),
  },
  {
    name: 'examples/kitchen-sink.yaml',
    file: path.resolve(
      /*turbopackIgnore: true*/ repositoryRoot,
      'examples/kitchen-sink.yaml',
    ),
  },
];

function assertFieldTypesDocumented(): void {
  const instructions = fs.readFileSync(agentInstructionsPath, 'utf8');

  const undocumented = DECLARATIVE_FIELD_TYPES.filter(
    (fieldType) => !instructions.includes(fieldType),
  );

  if (undocumented.length > 0) {
    throw new Error(
      `${AGENT_INSTRUCTIONS} does not document: ${undocumented.join(', ')}.`,
    );
  }
}

function assertExampleFormsValid(): void {
  const validate = new Ajv({ allErrors: true, strict: false }).compile(
    FORM_JSON_SCHEMA,
  );

  for (const example of exampleForms) {
    if (validate(parse(fs.readFileSync(example.file, 'utf8')))) {
      continue;
    }

    const errors = (validate.errors ?? [])
      .map((error) => `  ${error.instancePath || '/'} ${error.message}`)
      .join('\n');
    throw new Error(`${example.name} no longer matches the schema:\n${errors}`);
  }
}

export function buildFormJsonSchema(): string {
  assertJsonSchemaCoverage();
  assertFieldTypesDocumented();
  assertExampleFormsValid();

  return `${JSON.stringify(FORM_JSON_SCHEMA, null, 2)}\n`;
}
