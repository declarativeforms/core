import { parse, type IDeclarativeForm } from '@declarativeforms/engine';
import md5 from 'md5';
import type { GitHubGateway } from '../gateways';
import type { GitHubFileRepository } from '../repositories';
import type { InternalFormService } from './internal-form.service';

const GITHUB_FORM_PREFIX = process.env.GITHUB_FORM_PREFIX || 'a';
const DEFAULT_BRANCH = process.env.GITHUB_DEFAULT_BRANCH || 'main';
const INTERNAL_SLUG_PREFIX = 'forms/declarativeforms/internal/';

export class FormService {
  constructor(
    private gitHubFileRepository: GitHubFileRepository,
    private gitHubGateway: GitHubGateway,
    private internalFormService: InternalFormService,
  ) {}

  public async ensureIndexes(): Promise<void> {
    await this.gitHubFileRepository.ensureIndexes();
    await this.internalFormService.ensureIndexes();
  }

  public async findById(
    id: string,
    branch?: string,
  ): Promise<IDeclarativeForm | null> {
    if (this.internalFormService.isInternalId(id)) {
      return this.internalFormService.findDefinition(id, branch);
    }

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
    branch?: string,
  ): Promise<IDeclarativeForm | null> {
    if (slug.toLowerCase().startsWith(INTERNAL_SLUG_PREFIX)) {
      return this.findById(slug.slice(INTERNAL_SLUG_PREFIX.length), branch);
    }

    const parts = slug.split('/');

    if (parts.length < 4) {
      return null;
    }

    const owner = parts[1];
    const repository = parts[2];
    const file = parts.slice(3).join('/');
    const resolvedBranch = branch || DEFAULT_BRANCH;

    const text = await this.gitHubGateway.retrieveYamlFile(
      owner,
      repository,
      file,
      resolvedBranch,
    );

    if (!text) {
      return null;
    }

    const form = parse(text);

    const id = `${GITHUB_FORM_PREFIX}${md5(`${slug}@${resolvedBranch}`).substring(0, 8)}`;

    await this.gitHubFileRepository.upsert({
      branch: resolvedBranch,
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
