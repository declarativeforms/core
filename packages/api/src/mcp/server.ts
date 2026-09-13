import { FORM_JSON_SCHEMA } from '@declarativeforms/engine';
import { toNodeHandler } from '@modelcontextprotocol/node';
import {
  bearerAuthChallengeResponse,
  createMcpHandler,
  getOAuthProtectedResourceMetadataUrl,
  McpServer,
  OAuthError,
  OAuthErrorCode,
  verifyBearerToken,
  type AuthInfo,
  type CallToolResult,
  type OAuthTokenVerifier,
} from '@modelcontextprotocol/server';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createLocalJWKSet, jwtVerify, type JSONWebKeySet } from 'jose';
import type { IncomingMessage } from 'node:http';
import { z } from 'zod';
import type { Container } from '../core/index.js';
import type { IInternalForm, IValidationIssue } from '../core/types/index.js';
import { AUTHORING_GUIDE, AUTHORING_INSTRUCTIONS } from './authoring-guide.js';

const MCP_PATH = '/api/v1/mcp';
const MCP_SCOPE = 'forms';
const DEFAULT_BRANCH = 'main';
const ORGANIZATION_ID_SCHEMA = z
  .string()
  .trim()
  .min(1)
  .optional()
  .describe(
    'Destination organization ID from list_organizations. Defaults to the personal workspace; pass the organization explicitly selected in the conversation.',
  );
const TOOL_SECURITY = {
  securitySchemes: [{ scopes: [MCP_SCOPE], type: 'oauth2' }],
};

type IMcpIdentity = {
  email_address: string;
  organization_id: string;
};

function readRequiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function readPublicJsonWebKeySet(): JSONWebKeySet {
  const value = JSON.parse(readRequiredEnvironment('OAUTH_JWKS')) as {
    keys?: Array<Record<string, unknown>>;
  };

  if (!Array.isArray(value.keys) || value.keys.length === 0) {
    throw new Error('OAUTH_JWKS must contain at least one key');
  }

  return {
    keys: value.keys.map((key) => {
      if (key.kty === 'oct') {
        throw new Error('OAUTH_JWKS must contain only asymmetric keys');
      }

      const { d, dp, dq, key_ops, oth, p, q, qi, ...publicKey } = key;

      return publicKey;
    }),
  };
}

function buildPublicUrl(path: string): string {
  return `${readRequiredEnvironment('PUBLIC_BASE_URL').replace(/\/$/, '')}${path}`;
}

function buildFormUrl(id: string, branch = DEFAULT_BRANCH): string {
  const url = new URL(`/${id}`, readRequiredEnvironment('PUBLIC_BASE_URL'));

  if (branch !== DEFAULT_BRANCH) {
    url.searchParams.set('branch', branch);
  }

  return url.toString();
}

function success(value: Record<string, unknown>): CallToolResult {
  return {
    content: [{ text: JSON.stringify(value), type: 'text' }],
    structuredContent: value,
  };
}

function failure(message: string): CallToolResult {
  return {
    content: [{ text: message, type: 'text' }],
    isError: true,
  };
}

function validationFailure(issues: Array<IValidationIssue>): CallToolResult {
  return failure(
    `Form validation failed:\n${issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join('\n')}`,
  );
}

function toFormDetails(
  container: Container,
  form: IInternalForm,
): Record<string, unknown> {
  return {
    branch: form.branch,
    form_id: form.form_id,
    name: form.name,
    organization_id: form.organization_id,
    preview_url: buildFormUrl(form.form_id, form.branch),
    public_url: buildFormUrl(form.form_id),
    revision: form.revision,
    updated_at: form.updated_at.toISOString(),
    yaml: container.internalFormService.toYamlDefinition(form),
  };
}

function createMcpServer(
  container: Container,
  identity: IMcpIdentity,
): McpServer {
  const server = new McpServer(
    { name: 'declarative-forms', version: '1.0.0' },
    {
      instructions: AUTHORING_INSTRUCTIONS,
    },
  );

  server.registerResource(
    'form-schema',
    'declarativeforms://schema',
    {
      description: 'The current JSON Schema for Declarative Forms YAML.',
      mimeType: 'application/schema+json',
      title: 'Declarative Forms schema',
    },
    async (uri) => ({
      contents: [
        {
          mimeType: 'application/schema+json',
          text: JSON.stringify(FORM_JSON_SCHEMA),
          uri: uri.href,
        },
      ],
    }),
  );

  server.registerTool(
    'list_organizations',
    {
      _meta: TOOL_SECURITY,
      annotations: {
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
        readOnlyHint: true,
      },
      description:
        'List organizations you belong to, including your role and the default personal workspace. Use returned organization IDs in form and branch tools.',
      inputSchema: z.object({}),
      title: 'List organizations',
    },
    async () => {
      const organizations = await container.organizationService.listByMember(
        identity.email_address,
      );

      return success({
        organizations: organizations.map((organization) => ({
          organization_id: organization.id,
          name: organization.name,
          slug: organization.slug,
          role: organization.members.find(
            (member) => member.email === identity.email_address,
          )?.role,
          is_personal: organization.tags.includes('personal'),
          is_default: organization.id === identity.organization_id,
        })),
      });
    },
  );

  server.registerTool(
    'add_organization_member',
    {
      _meta: TOOL_SECURITY,
      annotations: {
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
        readOnlyHint: false,
      },
      description:
        'Add or invite a member to a specific organization. Admins only. Grants access immediately without sending email or requiring acceptance. Defaults to member; adding an existing member preserves their role.',
      inputSchema: z.object({
        organization_id: z.string().trim().min(1),
        email: z.string().trim().toLowerCase().pipe(z.email()),
        role: z.enum(['admin', 'member']).optional().default('member'),
      }),
      title: 'Add organization member',
    },
    async ({ organization_id, email, role }) => {
      const member = await container.organizationService.addMember(
        organization_id,
        identity.email_address,
        email,
        role,
      );

      return member
        ? success({ organization_id, member })
        : failure('Organization not found or admin access required.');
    },
  );

  server.registerResource(
    'form-authoring-guide',
    'declarativeforms://authoring-guide',
    {
      description:
        'Intent-aware authoring guidance, organization selection, and a complete lunch RSVP example. Read alongside the schema before creating or updating a form.',
      mimeType: 'text/markdown',
      title: 'Form authoring guide',
    },
    async (uri) => ({
      contents: [
        { mimeType: 'text/markdown', text: AUTHORING_GUIDE, uri: uri.href },
      ],
    }),
  );

  server.registerTool(
    'list_forms',
    {
      _meta: TOOL_SECURITY,
      annotations: {
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
        readOnlyHint: true,
      },
      description:
        'List every form in the selected organization, or the personal workspace by default.',
      inputSchema: z.object({ organization_id: ORGANIZATION_ID_SCHEMA }),
      title: 'List forms',
    },
    async ({ organization_id }) => {
      const organizationId = organization_id ?? identity.organization_id;
      const organization = await container.organizationService.findByMember(
        organizationId,
        identity.email_address,
      );

      if (!organization) {
        return failure('Organization not found or access denied.');
      }

      const forms =
        await container.internalFormService.listByOrganization(organizationId);

      return success({
        organization_id: organizationId,
        forms: forms.map((form) => ({
          form_id: form.form_id,
          name: form.name,
          organization_id: form.organization_id,
          public_url: buildFormUrl(form.form_id),
          revision: form.revision,
          updated_at: form.updated_at.toISOString(),
        })),
      });
    },
  );

  server.registerTool(
    'read_form',
    {
      _meta: TOOL_SECURITY,
      annotations: {
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
        readOnlyHint: true,
      },
      description: 'Read a form branch as YAML with its revision and URLs.',
      inputSchema: z.object({
        organization_id: ORGANIZATION_ID_SCHEMA,
        branch: z.string().optional().default(DEFAULT_BRANCH),
        form_id: z.string().min(1),
      }),
      title: 'Read form',
    },
    async ({ organization_id, branch, form_id }) => {
      const organizationId = organization_id ?? identity.organization_id;
      const organization = await container.organizationService.findByMember(
        organizationId,
        identity.email_address,
      );

      if (!organization) {
        return failure('Organization not found or access denied.');
      }

      const form = await container.internalFormService.findByBranch(
        organizationId,
        form_id,
        branch,
      );

      return form
        ? success(toFormDetails(container, form))
        : failure('Form branch not found.');
    },
  );

  server.registerTool(
    'create_form',
    {
      _meta: TOOL_SECURITY,
      annotations: {
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
        readOnlyHint: false,
      },
      description:
        'Create a form on main with an immediately available public URL. Read the schema and authoring guide first. Follow exact instructions, infer useful copy and presentation, and offer refinements after returning the preview. Do not add unrequested questions or invent event details.',
      inputSchema: z.object({
        organization_id: ORGANIZATION_ID_SCHEMA,
        name: z.string().trim().min(1).max(120).optional(),
        yaml: z.string().min(1),
      }),
      title: 'Create form',
    },
    async ({ organization_id, name, yaml }) => {
      const organizationId = organization_id ?? identity.organization_id;
      const organization = await container.organizationService.findByMember(
        organizationId,
        identity.email_address,
      );

      if (!organization) {
        return failure('Organization not found or access denied.');
      }

      const definition = container.internalFormService.validateDefinition(yaml);

      if (Array.isArray(definition)) {
        return validationFailure(definition);
      }

      const form = await container.internalFormService.create(
        organizationId,
        identity.email_address,
        definition,
        name || null,
      );

      return success(toFormDetails(container, form));
    },
  );

  server.registerTool(
    'update_form',
    {
      _meta: TOOL_SECURITY,
      annotations: {
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
        readOnlyHint: false,
      },
      description:
        'Replace a form branch with complete YAML, preserving requested content and branding. Use a draft branch unless the user requests a direct main update. Read the schema and authoring guide first. Updates are last-write-wins.',
      inputSchema: z.object({
        organization_id: ORGANIZATION_ID_SCHEMA,
        branch: z.string().optional().default(DEFAULT_BRANCH),
        form_id: z.string().min(1),
        yaml: z.string().min(1),
      }),
      title: 'Update form',
    },
    async ({ organization_id, branch, form_id, yaml }) => {
      const organizationId = organization_id ?? identity.organization_id;
      const organization = await container.organizationService.findByMember(
        organizationId,
        identity.email_address,
      );

      if (!organization) {
        return failure('Organization not found or access denied.');
      }

      const definition = container.internalFormService.validateDefinition(yaml);

      if (Array.isArray(definition)) {
        return validationFailure(definition);
      }

      const form = await container.internalFormService.update(
        organizationId,
        identity.email_address,
        form_id,
        branch,
        definition,
        null,
      );

      return form
        ? success(toFormDetails(container, form))
        : failure('Form branch not found.');
    },
  );

  server.registerTool(
    'rename_form',
    {
      _meta: TOOL_SECURITY,
      annotations: {
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
        readOnlyHint: false,
      },
      description: 'Rename a form across every branch.',
      inputSchema: z.object({
        organization_id: ORGANIZATION_ID_SCHEMA,
        form_id: z.string().min(1),
        name: z.string().trim().min(1).max(120),
      }),
      title: 'Rename form',
    },
    async ({ organization_id, form_id, name }) => {
      const organizationId = organization_id ?? identity.organization_id;
      const organization = await container.organizationService.findByMember(
        organizationId,
        identity.email_address,
      );

      if (!organization) {
        return failure('Organization not found or access denied.');
      }

      const renamed = await container.internalFormService.rename(
        organizationId,
        identity.email_address,
        form_id,
        name,
      );

      return renamed
        ? success({ form_id, name, organization_id: organizationId })
        : failure('Form not found.');
    },
  );

  server.registerTool(
    'delete_form',
    {
      _meta: TOOL_SECURITY,
      annotations: {
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
        readOnlyHint: false,
      },
      description: 'Delete a form and make all of its branches unavailable.',
      inputSchema: z.object({
        organization_id: ORGANIZATION_ID_SCHEMA,
        form_id: z.string().min(1),
      }),
      title: 'Delete form',
    },
    async ({ organization_id, form_id }) => {
      const organizationId = organization_id ?? identity.organization_id;
      const organization = await container.organizationService.findByMember(
        organizationId,
        identity.email_address,
      );

      if (!organization) {
        return failure('Organization not found or access denied.');
      }

      const deleted = await container.internalFormService.delete(
        organizationId,
        form_id,
      );

      return deleted
        ? success({ deleted: true, form_id, organization_id: organizationId })
        : failure('Form not found.');
    },
  );

  server.registerTool(
    'list_branches',
    {
      _meta: TOOL_SECURITY,
      annotations: {
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
        readOnlyHint: true,
      },
      description: 'List all branches and preview URLs for a form.',
      inputSchema: z.object({
        organization_id: ORGANIZATION_ID_SCHEMA,
        form_id: z.string().min(1),
      }),
      title: 'List branches',
    },
    async ({ organization_id, form_id }) => {
      const organizationId = organization_id ?? identity.organization_id;
      const organization = await container.organizationService.findByMember(
        organizationId,
        identity.email_address,
      );

      if (!organization) {
        return failure('Organization not found or access denied.');
      }

      const branches = await container.internalFormService.listBranchesById(
        organizationId,
        form_id,
      );

      if (!branches) {
        return failure('Form not found.');
      }

      return success({
        branches: branches.map((branch) => ({
          name: branch.branch,
          preview_url: buildFormUrl(branch.form_id, branch.branch),
          revision: branch.revision,
          updated_at: branch.updated_at.toISOString(),
        })),
        form_id,
        organization_id: organizationId,
      });
    },
  );

  server.registerTool(
    'create_branch',
    {
      _meta: TOOL_SECURITY,
      annotations: {
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
        readOnlyHint: false,
      },
      description:
        'Create a branch by copying an existing branch, main by default.',
      inputSchema: z.object({
        organization_id: ORGANIZATION_ID_SCHEMA,
        form_id: z.string().min(1),
        from: z.string().optional().default(DEFAULT_BRANCH),
        name: z.string().min(1),
      }),
      title: 'Create branch',
    },
    async ({ organization_id, form_id, from, name }) => {
      const organizationId = organization_id ?? identity.organization_id;
      const organization = await container.organizationService.findByMember(
        organizationId,
        identity.email_address,
      );

      if (!organization) {
        return failure('Organization not found or access denied.');
      }

      const branch = await container.internalFormService.createBranch(
        organizationId,
        identity.email_address,
        form_id,
        name,
        from,
      );

      return branch
        ? success(toFormDetails(container, branch))
        : failure(
            'Source form branch was not found, the name is invalid, or the branch already exists.',
          );
    },
  );

  server.registerTool(
    'delete_branch',
    {
      _meta: TOOL_SECURITY,
      annotations: {
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
        readOnlyHint: false,
      },
      description: 'Delete a non-main form branch.',
      inputSchema: z.object({
        organization_id: ORGANIZATION_ID_SCHEMA,
        branch: z.string().min(1),
        form_id: z.string().min(1),
      }),
      title: 'Delete branch',
    },
    async ({ organization_id, branch, form_id }) => {
      const organizationId = organization_id ?? identity.organization_id;
      const organization = await container.organizationService.findByMember(
        organizationId,
        identity.email_address,
      );

      if (!organization) {
        return failure('Organization not found or access denied.');
      }

      if (branch === DEFAULT_BRANCH) {
        return failure('The main branch cannot be deleted.');
      }

      const deleted = await container.internalFormService.deleteBranch(
        organizationId,
        form_id,
        branch,
      );

      return deleted
        ? success({
            branch,
            deleted: true,
            form_id,
            organization_id: organizationId,
          })
        : failure('Form branch not found.');
    },
  );

  server.registerTool(
    'publish_branch',
    {
      _meta: TOOL_SECURITY,
      annotations: {
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
        readOnlyHint: false,
      },
      description:
        'Publish a non-main branch to main. The source branch remains available.',
      inputSchema: z.object({
        organization_id: ORGANIZATION_ID_SCHEMA,
        branch: z.string().min(1),
        form_id: z.string().min(1),
      }),
      title: 'Publish branch',
    },
    async ({ organization_id, branch, form_id }) => {
      const organizationId = organization_id ?? identity.organization_id;
      const organization = await container.organizationService.findByMember(
        organizationId,
        identity.email_address,
      );

      if (!organization) {
        return failure('Organization not found or access denied.');
      }

      if (branch === DEFAULT_BRANCH) {
        return failure('Main cannot be published to itself.');
      }

      const form = await container.internalFormService.publish(
        organizationId,
        identity.email_address,
        form_id,
        branch,
      );

      return form
        ? success(toFormDetails(container, form))
        : failure('Form branch not found.');
    },
  );

  return server;
}

class McpTokenVerifier implements OAuthTokenVerifier {
  private keySet: ReturnType<typeof createLocalJWKSet>;

  constructor(private container: Container) {
    this.keySet = createLocalJWKSet(readPublicJsonWebKeySet());
  }

  public async verifyAccessToken(token: string): Promise<AuthInfo> {
    try {
      const verified = await jwtVerify(token, this.keySet, {
        audience: buildPublicUrl(MCP_PATH),
        issuer: buildPublicUrl('/api/v1/oauth'),
        typ: 'at+jwt',
      });
      const subject = verified.payload.sub;
      const clientId = verified.payload.client_id;
      const scopes = String(verified.payload.scope || '')
        .split(' ')
        .filter(Boolean);

      if (!subject || typeof clientId !== 'string' || !verified.payload.exp) {
        throw new Error('Access token claims are incomplete');
      }

      const account = await this.container.oauthAccountService.find(subject);

      if (!account) {
        throw new Error('OAuth account not found');
      }

      return {
        clientId,
        expiresAt: verified.payload.exp,
        extra: {
          email_address: account.email_address,
          organization_id: account.organization_id,
        },
        resource: new URL(buildPublicUrl(MCP_PATH)),
        scopes,
        token,
      };
    } catch {
      throw new OAuthError(OAuthErrorCode.InvalidToken, 'Invalid access token');
    }
  }
}

function readIdentity(authInfo: AuthInfo): IMcpIdentity {
  const emailAddress = authInfo.extra?.email_address;
  const organizationId = authInfo.extra?.organization_id;

  if (typeof emailAddress !== 'string' || typeof organizationId !== 'string') {
    throw new Error('Authenticated identity is incomplete');
  }

  return {
    email_address: emailAddress,
    organization_id: organizationId,
  };
}

async function sendAuthenticationFailure(
  error: unknown,
  reply: FastifyReply,
  resourceMetadataUrl: string,
): Promise<void> {
  const response = bearerAuthChallengeResponse(error, {
    requiredScopes: [MCP_SCOPE],
    resourceMetadataUrl,
  });

  reply.status(response.status);
  response.headers.forEach((value, name) => reply.header(name, value));
  reply.send(await response.text());
}

export async function registerMcp(
  server: FastifyInstance,
  container: Container,
): Promise<void> {
  const resourceServerUrl = new URL(buildPublicUrl(MCP_PATH));
  const resourceMetadataUrl =
    getOAuthProtectedResourceMetadataUrl(resourceServerUrl);
  const verifier = new McpTokenVerifier(container);
  const handler = createMcpHandler(
    (context) => {
      if (!context.authInfo) {
        throw new Error('Authentication is required');
      }

      return createMcpServer(container, readIdentity(context.authInfo));
    },
    { responseMode: 'json' },
  );
  const nodeHandler = toNodeHandler(handler, { onerror: console.error });
  const metadata = {
    authorization_servers: [buildPublicUrl('/api/v1/oauth')],
    bearer_methods_supported: ['header'],
    resource: resourceServerUrl.toString(),
    resource_documentation: buildPublicUrl('/docs'),
    resource_name: 'Declarative Forms',
    scopes_supported: [MCP_SCOPE],
  };

  server.get(
    '/.well-known/oauth-protected-resource',
    async (_request, reply): Promise<void> => {
      reply.status(200).send(metadata);
    },
  );
  server.get(
    '/.well-known/oauth-protected-resource/api/v1/mcp',
    async (_request, reply): Promise<void> => {
      reply.status(200).send(metadata);
    },
  );

  server.route({
    config: {
      rateLimit: {
        max: 300,
        timeWindow: '1 minute',
      },
    },
    handler: async (
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void> => {
      let authInfo: AuthInfo;

      try {
        authInfo = await verifyBearerToken(request.headers.authorization, {
          requiredScopes: [MCP_SCOPE],
          resourceMetadataUrl,
          verifier,
        });
      } catch (error) {
        await sendAuthenticationFailure(error, reply, resourceMetadataUrl);

        return;
      }

      const raw = request.raw as IncomingMessage & { auth?: AuthInfo };
      raw.auth = authInfo;
      reply.hijack();
      await nodeHandler(raw, reply.raw, request.body);
    },
    method: ['GET', 'POST', 'DELETE'],
    url: MCP_PATH,
  });
}
