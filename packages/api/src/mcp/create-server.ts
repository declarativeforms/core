import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DECLARATIVE_FIELD_TYPES } from '@declarativeforms/engine';
import * as z from 'zod/v4';
import type { FormService } from '../core';

const owner = z
  .string()
  .trim()
  .max(39)
  .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/)
  .describe('GitHub repository owner');
const repository = z
  .string()
  .trim()
  .max(100)
  .regex(/^[a-zA-Z0-9._-]+$/)
  .describe('GitHub repository name');
const file = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/)
  .refine(
    (value) =>
      !value.endsWith('.yaml') &&
      value.split('/').every((part) => part && part !== '.' && part !== '..'),
    'Provide a file path without the .yaml extension',
  )
  .describe('Form file path without the .yaml extension');
const branch = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/)
  .refine(
    (value) =>
      value.split('/').every((part) => part && part !== '.' && part !== '..'),
    'Provide a valid GitHub branch',
  )
  .default('main')
  .describe('GitHub branch');

const location = { branch, file, owner, repository };

const schemaGuide = {
  documentation: 'https://github.com/declarativeforms/core/blob/main/SCHEMA.md',
  fieldTypes: [...DECLARATIVE_FIELD_TYPES],
  guidance:
    'Write one YAML document with version, title, and sections. Each section contains fields with unique ids, a supported type, a label, and optional validators. Use validators: [required] for required fields. Choice fields use options. Keep the form as simple as the user request permits.',
  example: `version: 1
title: "Contact us"
sections:
  - id: contact
    fields:
      - id: name
        type: short_text
        label: "Name"
        validators: [required]
      - id: email
        type: email
        label: "Email"
        validators: [required]
      - id: message
        type: long_text
        label: "Message"
        validators: [required]
completion:
  title: "Thank you"
  message: "Your response has been received."`,
};

export function createDeclarativeFormsServer(
  formService: FormService,
  gitHubToken: string,
): McpServer {
  const server = new McpServer(
    {
      name: 'declarative-forms',
      version: '1.0.0',
    },
    {
      instructions:
        'Create and update forms hosted by frms.dev. Call get_form_schema before authoring YAML. Call get_form before changing an existing form. publish_form writes the YAML file to the authenticated user’s public GitHub repository and returns its public frms.dev URL.',
    },
  );

  server.registerTool(
    'get_form_schema',
    {
      title: 'Get form schema',
      description:
        'Get the Declarative Forms YAML format, supported field types, and a valid example.',
      outputSchema: {
        documentation: z.string(),
        example: z.string(),
        fieldTypes: z.array(z.string()),
        guidance: z.string(),
      },
      annotations: {
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async () => success(schemaGuide),
  );

  server.registerTool(
    'get_form',
    {
      title: 'Get form',
      description:
        'Read an existing form YAML file and its public frms.dev URL before making changes.',
      inputSchema: location,
      outputSchema: {
        branch: z.string(),
        file: z.string(),
        owner: z.string(),
        repository: z.string(),
        url: z.string(),
        yaml: z.string(),
      },
      annotations: {
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
        readOnlyHint: true,
      },
    },
    async ({ owner, repository, file, branch }) => {
      const result = await formService.findSource(
        owner,
        repository,
        file,
        branch,
      );

      return result
        ? success(result)
        : failure('The form could not be found in that public repository.');
    },
  );

  server.registerTool(
    'publish_form',
    {
      title: 'Publish form',
      description:
        'Create or update a Declarative Forms YAML file in a public GitHub repository and return its public frms.dev URL.',
      inputSchema: {
        ...location,
        message: z
          .string()
          .trim()
          .min(1)
          .optional()
          .describe('Git commit message'),
        yaml: z
          .string()
          .refine(
            (value) => Boolean(value.trim()),
            'Provide complete form YAML',
          )
          .describe('Complete form YAML'),
      },
      outputSchema: {
        branch: z.string(),
        file: z.string(),
        owner: z.string(),
        repository: z.string(),
        sha: z.string(),
        url: z.string(),
      },
      annotations: {
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
      },
    },
    async ({ owner, repository, file, yaml, branch, message }) => {
      try {
        const result = await formService.publish(
          owner,
          repository,
          file,
          yaml,
          gitHubToken,
          branch,
          message,
        );

        return result
          ? success(result)
          : failure(
              'The form could not be published. Confirm that the repository is public and the authenticated GitHub user can write to it.',
            );
      } catch (error) {
        return failure(
          error instanceof Error ? error.message : 'The form YAML is invalid.',
        );
      }
    },
  );

  return server;
}

function success(value: object) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
    structuredContent: value as Record<string, unknown>,
  };
}

function failure(message: string) {
  return {
    content: [{ type: 'text' as const, text: message }],
    isError: true,
  };
}
