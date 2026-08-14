import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { FormService, IFormResult } from '../core';

const name = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/);
const file = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/)
  .refine(
    (value) =>
      !value.endsWith('.yaml') &&
      value.split('/').every((part) => part && part !== '.' && part !== '..'),
    'Provide a file path without the .yaml extension',
  );
const branch = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/)
  .default('main');

const location = {
  owner: name.describe('GitHub repository owner'),
  repository: name.describe('GitHub repository name'),
  file: file.describe('Form file path without the .yaml extension'),
  branch: branch.describe('GitHub branch'),
};

export function createDeclarativeFormsServer(
  formService: FormService,
): McpServer {
  const server = new McpServer(
    {
      name: 'declarative-forms',
      version: '0.1.0',
    },
    {
      instructions:
        'Forms are YAML files in public GitHub repositories. Read a form before updating it and use its sha. Return the url after creating or updating a form.',
    },
  );

  server.registerTool(
    'get_form',
    {
      description:
        'Read a form from a public GitHub repository, including the sha required for updates.',
      inputSchema: z.object(location),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ owner, repository, file, branch }) =>
      run(() => formService.find(owner, repository, file, branch)),
  );

  server.registerTool(
    'create_form',
    {
      description:
        'Create a form in a public GitHub repository and return its public frms.dev URL.',
      inputSchema: z.object({
        ...location,
        yaml: z.string().min(1).describe('Complete form YAML'),
        message: z.string().min(1).optional().describe('Git commit message'),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ owner, repository, file, yaml, branch, message }) =>
      run(() =>
        formService.createOrUpdate(
          owner,
          repository,
          file,
          yaml,
          branch,
          message,
        ),
      ),
  );

  server.registerTool(
    'update_form',
    {
      description:
        'Update a form after reading it with get_form. GitHub uses the sha to prevent concurrent overwrites.',
      inputSchema: z.object({
        ...location,
        yaml: z.string().min(1).describe('Complete replacement form YAML'),
        sha: z.string().min(1).describe('Current sha returned by get_form'),
        message: z.string().min(1).optional().describe('Git commit message'),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ owner, repository, file, yaml, sha, branch, message }) =>
      run(() =>
        formService.createOrUpdate(
          owner,
          repository,
          file,
          yaml,
          branch,
          message,
          sha,
        ),
      ),
  );

  return server;
}

async function run(action: () => Promise<IFormResult | null>) {
  const result = await action();

  if (!result) {
    return {
      content: [{ type: 'text' as const, text: 'The operation failed' }],
      isError: true,
    };
  }

  return {
    content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    structuredContent: result,
  };
}
