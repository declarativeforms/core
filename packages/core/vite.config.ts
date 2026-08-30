import fs from "node:fs";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { Ajv } from "ajv";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

import {
  DECLARATIVE_FIELD_TYPES,
  FORM_JSON_SCHEMA,
  assertJsonSchemaCoverage,
  parse,
} from "../engine/src/index";

const SCHEMA_FILE = "schema.json";

// The agent instruction pack. Vite serves and publishes `public/` for us; this
// build only has to keep its contents honest.
const AGENT_INSTRUCTIONS = "public/AGENTS.md";

// Real forms, committed at the repo root and linked from the README. They are
// the corpus the schema is checked against.
const EXAMPLE_FORMS = ["contact.yaml", "kitchen-sink.yaml"];

/**
 * Every field type must be named in the agent instructions.
 *
 * `AGENTS.md` is what a coding agent reads to author a form, so a type added to
 * the engine but never documented there ships an instruction set that silently
 * omits it.
 */
function assertFieldTypesDocumented(): void {
  const instructions = fs.readFileSync(
    path.resolve(__dirname, AGENT_INSTRUCTIONS),
    "utf8",
  );

  const undocumented = DECLARATIVE_FIELD_TYPES.filter(
    (fieldType) => !instructions.includes(fieldType),
  );

  if (undocumented.length > 0) {
    throw new Error(
      `${AGENT_INSTRUCTIONS} does not document: ${undocumented.join(", ")}.`,
    );
  }
}

/**
 * Serve the form JSON Schema at /schema.json, generated from the engine.
 *
 * Generating it at build time rather than committing it means the published
 * schema and the engine can never disagree. The three checks below are the point
 * of doing it here: the coverage guard fails the build when a field type has no
 * schema branch, the agent instructions fail it when a field type is not
 * documented, and the example forms fail it when a schema change would reject a
 * form that works today.
 */
function formJsonSchema(): Plugin {
  const generate = (): string => {
    assertJsonSchemaCoverage();
    assertFieldTypesDocumented();

    const validate = new Ajv({ allErrors: true, strict: false }).compile(
      FORM_JSON_SCHEMA,
    );

    for (const example of EXAMPLE_FORMS) {
      const file = path.resolve(__dirname, "../..", example);
      if (validate(parse(fs.readFileSync(file, "utf8")))) continue;

      const errors = (validate.errors ?? [])
        .map((error) => `  ${error.instancePath || "/"} ${error.message}`)
        .join("\n");
      throw new Error(`${example} no longer matches the schema:\n${errors}`);
    }

    return `${JSON.stringify(FORM_JSON_SCHEMA, null, 2)}\n`;
  };

  return {
    name: "form-json-schema",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: SCHEMA_FILE,
        source: generate(),
      });
    },
    configureServer(server) {
      server.middlewares.use(`/${SCHEMA_FILE}`, (_request, response) => {
        response.setHeader("Content-Type", "application/json");
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.end(generate());
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), formJsonSchema()],
  resolve: {
    alias: {
      "@declarativeforms/engine": path.resolve(
        __dirname,
        "../engine/src/index.ts",
      ),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
