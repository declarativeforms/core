import {
  parse,
  toRenderableForm,
  type IDeclarativeForm,
} from '@declarativeforms/engine';
import md5 from 'md5';
import type { GitHubGateway } from '../gateways';
import type { GitHubFileRepository } from '../repositories';

const GITHUB_FORM_PREFIX = 'a';
const DEFAULT_BRANCH = 'main';

export type PublishedForm = {
  branch: string;
  file: string;
  owner: string;
  repository: string;
  sha: string;
  url: string;
};

export type FormSource = Omit<PublishedForm, 'sha'> & { yaml: string };

export class FormService {
  constructor(
    private gitHubFileRepository: GitHubFileRepository,
    private gitHubGateway: GitHubGateway,
  ) {}

  public async findById(id: string): Promise<IDeclarativeForm | null> {
    if (!id.startsWith(GITHUB_FORM_PREFIX)) {
      return null;
    }

    const gitHubFile = await this.gitHubFileRepository.find(id);

    if (!gitHubFile) {
      return null;
    }

    const text = await this.gitHubGateway.retrieveYamlFile(
      gitHubFile.owner,
      gitHubFile.repository,
      gitHubFile.file,
      gitHubFile.branch || DEFAULT_BRANCH,
    );

    if (!text) {
      return null;
    }

    return {
      ...parse(text),
      id,
    };
  }

  public async findBySlug(
    slug: string,
    branch: string = DEFAULT_BRANCH,
  ): Promise<IDeclarativeForm | null> {
    const parts = slug.split('/');

    if (parts.length < 4) {
      return null;
    }

    const owner = parts[1];
    const repository = parts[2];
    const file = parts.slice(3).join('/');

    const text = await this.gitHubGateway.retrieveYamlFile(
      owner,
      repository,
      file,
      branch,
    );

    if (!text) {
      return null;
    }

    const form = parse(text);

    // The branch is part of the form's identity, so the same file on two
    // branches resolves to two stable short ids.
    const id = `${GITHUB_FORM_PREFIX}${md5(`${slug}@${branch}`).substring(0, 8)}`;

    await this.gitHubFileRepository.upsert({
      branch,
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

  public async publish(
    owner: string,
    repository: string,
    file: string,
    yaml: string,
    token: string,
    branch: string = DEFAULT_BRANCH,
    message?: string,
  ): Promise<PublishedForm | null> {
    toRenderableForm(yaml, { locale: 'en' });

    if (
      !(await this.gitHubGateway.isPublicRepository(owner, repository, token))
    ) {
      return null;
    }

    const metadata = await this.gitHubGateway.retrieveYamlFileMetadata(
      owner,
      repository,
      file,
      branch,
      token,
    );

    if (!metadata) {
      return null;
    }

    const sha = await this.gitHubGateway.createOrUpdateYamlFile(
      owner,
      repository,
      file,
      yaml,
      message ||
        (metadata.sha ? 'Update Declarative Form' : 'Create Declarative Form'),
      branch,
      token,
      metadata.sha,
    );

    if (!sha) {
      return null;
    }

    return {
      branch,
      file,
      owner,
      repository,
      sha,
      url: this.getUrl(owner, repository, file, branch),
    };
  }

  public async findSource(
    owner: string,
    repository: string,
    file: string,
    branch: string = DEFAULT_BRANCH,
  ): Promise<FormSource | null> {
    const yaml = await this.gitHubGateway.retrieveYamlFile(
      owner,
      repository,
      file,
      branch,
    );

    if (!yaml) {
      return null;
    }

    return {
      branch,
      file,
      owner,
      repository,
      url: this.getUrl(owner, repository, file, branch),
      yaml,
    };
  }

  private getUrl(
    owner: string,
    repository: string,
    file: string,
    branch: string,
  ): string {
    const baseUrl = process.env.PUBLIC_BASE_URL || 'https://frms.dev';
    const url = new URL(
      `${owner}/${repository}/${file}`,
      `${baseUrl.replace(/\/$/, '')}/`,
    );

    if (branch !== DEFAULT_BRANCH) {
      url.searchParams.set('branch', branch);
    }

    return url.toString();
  }
}
