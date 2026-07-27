import {
  parseFormYaml,
  type IDeclarativeForm,
} from '@declarativeforms/core';
import { createHash } from 'node:crypto';
import type { GitHubGateway } from '../gateways';
import type {
  FormRepository,
  GitHubFileRepository,
} from '../repositories';
import type { IGitHubFile } from '../types';
import {
  InvalidFormDefinitionError,
  parseFormDefinition,
} from '../utils';

const GITHUB_FORM_PREFIX = 'a';
const MANAGED_FORM_PREFIX = 'f';

export type GitHubFormSource = {
  id: string;
  owner: string;
  repository: string;
  path: string;
  ref: string;
};

export class FormService {
  constructor(
    private gitHubFileRepository: GitHubFileRepository,
    private formRepository: FormRepository,
    private gitHubGateway: GitHubGateway,
  ) {}

  public async findById(id: string): Promise<IDeclarativeForm | null> {
    if (id.startsWith(MANAGED_FORM_PREFIX)) {
      return this.formRepository.find(id);
    }

    if (!id.startsWith(GITHUB_FORM_PREFIX)) {
      return null;
    }

    const gitHubFile = await this.gitHubFileRepository.find(id);

    if (!gitHubFile) {
      return null;
    }

    const token = process.env.GITHUB_TOKEN;
    let text: string | null;

    if (gitHubFile.private) {
      text = token
        ? await this.gitHubGateway.retrieveYamlFile(
            gitHubFile.owner,
            gitHubFile.repository,
            gitHubFile.file,
            gitHubFile.ref,
            token,
          )
        : null;
    } else {
      text = await this.gitHubGateway.retrieveYamlFile(
        gitHubFile.owner,
        gitHubFile.repository,
        gitHubFile.file,
        gitHubFile.ref,
      );

      if (!text && token) {
        text = await this.gitHubGateway.retrieveYamlFile(
          gitHubFile.owner,
          gitHubFile.repository,
          gitHubFile.file,
          gitHubFile.ref,
          token,
        );
      }
    }

    if (!text) {
      return null;
    }

    return {
      ...this.parseYaml(text),
      id,
    };
  }

  public async findBySlug(slug: string): Promise<IDeclarativeForm | null> {
    const parts = slug.split('/');

    if (parts.length < 4) {
      return null;
    }

    const owner = parts[1];
    const repository = parts[2];
    const file = normalizeYamlPath(parts.slice(3).join('/'));

    const text = await this.gitHubGateway.retrieveYamlFile(
      owner,
      repository,
      file,
    );

    if (!text) {
      return null;
    }

    const form = this.parseYaml(text);
    const id = createGitHubFormId(owner, repository, file);

    await this.gitHubFileRepository.upsert({
      file,
      id,
      owner,
      repository,
    });

    return {
      ...form,
      id,
    };
  }

  public async registerGitHubSource(input: {
    owner: string;
    repository: string;
    path: string;
    ref?: string;
  }): Promise<GitHubFormSource | null> {
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return null;
    }

    const owner = input.owner.trim();
    const repository = input.repository.trim();
    const file = normalizeYamlPath(input.path);
    const ref = input.ref?.trim() || 'main';

    if (!owner || !repository || !file) {
      return null;
    }

    const text = await this.gitHubGateway.retrieveYamlFile(
      owner,
      repository,
      file,
      ref,
      token,
    );

    if (!text) {
      return null;
    }

    this.parseYaml(text);

    const id = createGitHubFormId(owner, repository, file, ref);
    const gitHubFile: IGitHubFile = {
      file,
      id,
      owner,
      private: true,
      ref,
      repository,
    };

    await this.gitHubFileRepository.upsert(gitHubFile);

    return {
      id,
      owner,
      path: file,
      ref,
      repository,
    };
  }

  private parseYaml(text: string): IDeclarativeForm {
    try {
      return parseFormDefinition(parseFormYaml(text));
    } catch (error) {
      if (error instanceof InvalidFormDefinitionError) {
        throw error;
      }

      throw new InvalidFormDefinitionError([
        error instanceof Error ? error.message : 'The YAML could not be parsed.',
      ]);
    }
  }
}

function createGitHubFormId(
  owner: string,
  repository: string,
  file: string,
  ref = 'main',
): string {
  const slug = `forms/${owner}/${repository}/${file}`;
  const source = ref === 'main' ? slug : `${slug}@${ref}`;

  const hash = createHash('md5').update(source).digest('hex');

  return `${GITHUB_FORM_PREFIX}${hash.substring(0, 8)}`;
}

function normalizeYamlPath(path: string): string {
  return path.trim().replace(/^\/+/, '').replace(/\.yaml$/i, '');
}
