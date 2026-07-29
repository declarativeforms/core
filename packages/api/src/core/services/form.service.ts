import {
  FormYamlParseError,
  parseFormYaml,
  type IDeclarativeForm,
} from '@declarativeforms/core';
import type { GitHubGateway, GitHubFileResult } from '../gateways';
import { InvalidFormDefinitionError, parseFormDefinition } from '../utils';

const GITHUB_FORM_PREFIX = 'g.';

export type GitHubFormSource = {
  owner: string;
  repository: string;
  path: string;
  ref?: string;
};

export type GitHubSourceConfig = {
  token?: string;
  trustedRepositories: ReadonlySet<string>;
};

export type ResolvedForm = {
  definition: IDeclarativeForm;
  trusted: boolean;
};

export type FormSourceErrorCode =
  | 'GITHUB_AUTH_FAILED'
  | 'GITHUB_RATE_LIMITED'
  | 'GITHUB_SOURCE_NOT_FOUND'
  | 'GITHUB_SOURCE_TOO_LARGE'
  | 'GITHUB_UNAVAILABLE';

export class FormSourceError extends Error {
  constructor(
    public readonly code: FormSourceErrorCode,
    message: string,
    public readonly retryAfter?: string,
  ) {
    super(message);
    this.name = 'FormSourceError';
  }
}

export class InvalidGitHubSourceError extends Error {
  constructor() {
    super('The GitHub source reference is invalid.');
    this.name = 'InvalidGitHubSourceError';
  }
}

export class FormService {
  constructor(
    private gitHubGateway: GitHubGateway,
    private gitHubConfig: GitHubSourceConfig,
  ) {}

  public async findForRenderingById(
    id: string,
  ): Promise<IDeclarativeForm | null> {
    const resolved = await this.resolveById(id);
    return resolved
      ? toPublicFormDefinition(resolved.definition, resolved.trusted)
      : null;
  }

  public async resolveById(id: string): Promise<ResolvedForm | null> {
    const source = decodeGitHubFormId(id);
    return source ? this.resolveSource(source) : null;
  }

  public async findBySource(
    input: GitHubFormSource,
  ): Promise<IDeclarativeForm> {
    const resolved = await this.resolveSource(normalizeGitHubSource(input));
    return toPublicFormDefinition(resolved.definition, resolved.trusted);
  }

  private async resolveSource(
    source: GitHubFormSource,
  ): Promise<ResolvedForm> {
    const trusted = this.gitHubConfig.trustedRepositories.has(
      repositoryKey(source.owner, source.repository),
    );
    const result = await this.gitHubGateway.retrieveYamlFile(
      source.owner,
      source.repository,
      source.path,
      source.ref,
      trusted ? this.gitHubConfig.token : undefined,
    );

    if (!result.ok) {
      throw toFormSourceError(result);
    }

    const id = encodeGitHubFormId(source);
    return {
      definition: {
        ...this.parseYaml(result.text),
        id,
      },
      trusted,
    };
  }

  private parseYaml(text: string): IDeclarativeForm {
    try {
      return parseFormDefinition(parseFormYaml(text));
    } catch (error) {
      if (error instanceof InvalidFormDefinitionError) {
        throw error;
      }
      if (error instanceof FormYamlParseError) {
        throw error;
      }

      throw new InvalidFormDefinitionError([
        error instanceof Error
          ? error.message
          : 'The YAML could not be parsed.',
      ]);
    }
  }
}

export function encodeGitHubFormId(input: GitHubFormSource): string {
  const source = normalizeGitHubSource(input);
  const encoded = Buffer.from(
    JSON.stringify([
      source.owner,
      source.repository,
      source.path,
      source.ref ?? null,
    ]),
    'utf8',
  ).toString('base64url');

  return `${GITHUB_FORM_PREFIX}${encoded}`;
}

export function decodeGitHubFormId(id: string): GitHubFormSource | null {
  if (!id.startsWith(GITHUB_FORM_PREFIX) || id.length > 1200) {
    return null;
  }

  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(id.slice(GITHUB_FORM_PREFIX.length), 'base64url').toString(
        'utf8',
      ),
    );
    if (
      !Array.isArray(decoded) ||
      decoded.length !== 4 ||
      typeof decoded[0] !== 'string' ||
      typeof decoded[1] !== 'string' ||
      typeof decoded[2] !== 'string' ||
      (decoded[3] !== null && typeof decoded[3] !== 'string')
    ) {
      return null;
    }

    return normalizeGitHubSource({
      owner: decoded[0],
      repository: decoded[1],
      path: decoded[2],
      ...(decoded[3] ? { ref: decoded[3] } : {}),
    });
  } catch {
    return null;
  }
}

export function normalizeGitHubSource(
  input: GitHubFormSource,
): GitHubFormSource {
  const owner = input.owner.trim();
  const repository = input.repository.trim();
  const rawPath = input.path.trim().replace(/^\/+/, '');
  const path = /\.ya?ml$/i.test(rawPath) ? rawPath : `${rawPath}.yaml`;
  const ref = input.ref?.trim() || undefined;

  if (
    !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(owner) ||
    !/^[A-Za-z0-9._-]{1,100}$/.test(repository) ||
    repository === '.' ||
    repository === '..' ||
    !path ||
    path.length > 512 ||
    path.includes('\\') ||
    path.split('/').some((part) => !part || part === '.' || part === '..') ||
    /[\u0000-\u001f\u007f]/.test(path) ||
    (ref !== undefined &&
      (ref.length > 255 || /[\u0000-\u001f\u007f]/.test(ref)))
  ) {
    throw new InvalidGitHubSourceError();
  }

  return {
    owner,
    repository,
    path,
    ...(ref ? { ref } : {}),
  };
}

export function repositoryKey(owner: string, repository: string): string {
  return `${owner}/${repository}`.toLowerCase();
}

function toFormSourceError(result: Exclude<GitHubFileResult, { ok: true }>) {
  switch (result.reason) {
    case 'not_found':
      return new FormSourceError(
        'GITHUB_SOURCE_NOT_FOUND',
        'The GitHub repository, ref, or YAML file could not be found.',
      );
    case 'unauthorized':
      return new FormSourceError(
        'GITHUB_AUTH_FAILED',
        'GitHub did not authorize access to this form source.',
      );
    case 'rate_limited':
      return new FormSourceError(
        'GITHUB_RATE_LIMITED',
        'GitHub rate-limited this deployment. Try again later.',
        result.retryAfter,
      );
    case 'too_large':
      return new FormSourceError(
        'GITHUB_SOURCE_TOO_LARGE',
        'The GitHub form definition exceeds the 1 MB limit.',
      );
    case 'unavailable':
      return new FormSourceError(
        'GITHUB_UNAVAILABLE',
        'GitHub could not be reached. Try again later.',
      );
  }
}

function toPublicFormDefinition(
  definition: IDeclarativeForm,
  allowExternalProviders: boolean,
): IDeclarativeForm {
  const {
    connections: _connections,
    created_at: _createdAt,
    updated_at: _updatedAt,
    collaborators: _collaborators,
    _id: _mongoId,
    ...publicDefinition
  } = definition as IDeclarativeForm & Record<string, unknown>;

  if (!allowExternalProviders) {
    delete publicDefinition.measurements;
  }

  return publicDefinition;
}
