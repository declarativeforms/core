import { parse, type IDeclarativeForm } from '@declarativeforms/engine';
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

    const text = await this.gitHubGateway.retrieveYamlFile(
      gitHubFile.owner,
      gitHubFile.repository,
      gitHubFile.file,
    );

    if (!text) {
      return null;
    }

    return {
      ...parse(text),
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
    const file = parts.slice(3).join('/');

    const text = await this.gitHubGateway.retrieveYamlFile(
      owner,
      repository,
      file,
    );

    if (!text) {
      return null;
    }

    const form = parse(text);

    const id = `${GITHUB_FORM_PREFIX}${md5(slug).substring(0, 8)}`;

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
}
