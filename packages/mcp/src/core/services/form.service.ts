import { parse } from '@declarativeforms/engine';
import type { GitHubGateway } from '../gateways';
import type { IFormResult } from '../types';

const DEFAULT_BRANCH = 'main';

export class FormService {
  constructor(private gitHubGateway: GitHubGateway) {}

  public async find(
    owner: string,
    repository: string,
    file: string,
    branch = DEFAULT_BRANCH,
  ): Promise<IFormResult | null> {
    if (!(await this.gitHubGateway.isPublicRepository(owner, repository))) {
      return null;
    }

    const gitHubFile = await this.gitHubGateway.retrieveYamlFile(
      owner,
      repository,
      file,
      branch,
    );

    if (!gitHubFile) {
      return null;
    }

    return {
      branch,
      file,
      owner,
      repository,
      sha: gitHubFile.sha,
      url: this.getUrl(owner, repository, file, branch),
      yaml: gitHubFile.content,
    };
  }

  public async createOrUpdate(
    owner: string,
    repository: string,
    file: string,
    yaml: string,
    branch = DEFAULT_BRANCH,
    message?: string,
    sha?: string,
  ): Promise<IFormResult | null> {
    parse(yaml);

    if (!(await this.gitHubGateway.isPublicRepository(owner, repository))) {
      return null;
    }

    const gitHubFile = await this.gitHubGateway.createOrUpdateYamlFile(
      owner,
      repository,
      file,
      yaml,
      message ||
        (sha ? 'Update Declarative Form' : 'Create Declarative Form'),
      branch,
      sha,
    );

    if (!gitHubFile) {
      return null;
    }

    return {
      branch,
      file,
      owner,
      repository,
      sha: gitHubFile.sha,
      url: this.getUrl(owner, repository, file, branch),
    };
  }

  private getUrl(
    owner: string,
    repository: string,
    file: string,
    branch: string,
  ): string {
    const baseUrl = process.env.RENDER_BASE_URL || 'https://frms.dev';
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
