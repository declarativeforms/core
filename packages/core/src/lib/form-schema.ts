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

// The agent instruction pack, served from `public/`. This build only has to
// keep its contents honest.
const AGENT_INSTRUCTIONS = 'public/AGENTS.md';

// Real forms, committed at the repo root and linked from the README. They are
// the corpus the schema is checked against.
const EXAMPLE_FORMS = ['contact.yaml', 'kitchen-sink.yaml'];

// `next build` runs from the package directory, so the repo root is two up.
const packageDirectory = process.cwd();
const repositoryRoot = path.resolve(packageDirectory, '..', '..');

/**
 * Every field type must be named in the agent instructions.
 *
 * `AGENTS.md` is what a coding agent reads to author a form, so a type added to
 * the engine but never documented there ships an instruction set that silently
 * omits it.
 */
function assertFieldTypesDocumented(): void {
  const instructions = fs.readFileSync(
    path.resolve(/*turbopackIgnore: true*/ packageDirectory, AGENT_INSTRUCTIONS),
    'utf8',
  );

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

  for (const example of EXAMPLE_FORMS) {
    // These reads happen only while prerendering `/schema.json` during the
    // build, so the tracer must not pull the whole repo into the output.
    const file = path.resolve(/*turbopackIgnore: true*/ repositoryRoot, example);
    if (validate(parse(fs.readFileSync(file, 'utf8')))) continue;

    const errors = (validate.errors ?? [])
      .map((error) => `  ${error.instancePath || '/'} ${error.message}`)
      .join('\n');
    throw new Error(`${example} no longer matches the schema:\n${errors}`);
  }
}

/**
 * The form JSON Schema, generated from the engine and served at /schema.json.
 *
 * Generating it rather than committing it means the published schema and the
 * engine can never disagree. The three checks below are the point of doing it
 * here: the coverage guard fails the build when a field type has no schema
 * branch, the agent instructions fail it when a field type is not documented,
 * and the example forms fail it when a schema change would reject a form that
 * works today.
 *
 * The route that calls this is `force-static`, so it is prerendered during
 * `next build` and a throw fails the build, exactly as the Vite plugin did.
 */
export function buildFormJsonSchema(): string {
  assertJsonSchemaCoverage();
  assertFieldTypesDocumented();
  assertExampleFormsValid();

  return `${JSON.stringify(FORM_JSON_SCHEMA, null, 2)}\n`;
}
