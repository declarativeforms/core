import type { IDeclarativeForm } from '@declarativeforms/types';
import yaml from 'js-yaml';
import md5 from 'md5';
import type { GitHubGateway } from '../gateways';
import type { GitHubFileRepository } from '../repositories';

const GITHUB_FORM_PREFIX = 'a';

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

    if (gitHubFile.access_token) {
      const text = await this.gitHubGateway.retrieveYamlFile(
        gitHubFile.owner,
        gitHubFile.repository,
        gitHubFile.file,
        gitHubFile.access_token,
      );

      if (!text) {
        return null;
      }

      return {
        ...(yaml.load(text) as IDeclarativeForm),
        id,
      };
    }

    const text = await this.gitHubGateway.retrieveYamlFile(
      gitHubFile.owner,
      gitHubFile.repository,
      gitHubFile.file,
    );

    if (!text) {
      return null;
    }

    return {
      ...(yaml.load(text) as IDeclarativeForm),
      id,
    };
  }

  public async findBySlug(
    slug: string,
    accessToken?: string,
  ): Promise<IDeclarativeForm | null> {
    const parts = slug.split('/');

    if (parts.length < 4) {
      return null;
    }

    const owner = parts[1];
    const repository = parts[2];
    const file = parts.slice(3).join('/');

    let text = await this.gitHubGateway.retrieveYamlFile(
      owner,
      repository,
      file,
    );

    if (!text && accessToken) {
      text = await this.gitHubGateway.retrieveYamlFile(
        owner,
        repository,
        file,
        accessToken,
      );
    }

    if (!text) {
      return null;
    }

    const form = yaml.load(text) as IDeclarativeForm;

    const id = `${GITHUB_FORM_PREFIX}${md5(slug).substring(0, 8)}`;

    await this.gitHubFileRepository.upsert({
      file,
      id,
      owner,
      repository,
      ...(accessToken ? { access_token: accessToken } : {}),
    });

    return {
      ...form,
      id,
    };
  }
}
