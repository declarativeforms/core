import { parse, type IDeclarativeForm } from '@declarativeforms/engine';
import md5 from 'md5';
import { randomBytes } from 'node:crypto';
import type { IStoredForm } from '../types';
import type { GitHubGateway } from '../gateways';
import type { FormRepository, GitHubFileRepository } from '../repositories';

const GITHUB_FORM_PREFIX = process.env.GITHUB_FORM_PREFIX || 'a';
const DEFAULT_BRANCH = process.env.GITHUB_DEFAULT_BRANCH || 'main';

export class FormService {
  constructor(
    private gitHubFileRepository: GitHubFileRepository,
    private gitHubGateway: GitHubGateway,
    private formRepository: FormRepository,
  ) {}

  public async create(
    ownerId: string,
    definition: IDeclarativeForm,
  ): Promise<IStoredForm> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const form = await this.formRepository.insert({
        id: `b${randomBytes(4).toString('hex')}`,
        ownerId,
        definition,
      });
      if (form) {
        return form;
      }
    }

    throw new Error('Unable to allocate a unique form ID');
  }

  public listByOwner(ownerId: string): Promise<Array<IStoredForm>> {
    return this.formRepository.findAllByOwner(ownerId);
  }

  public findByOwnerAndId(
    ownerId: string,
    id: string,
  ): Promise<IStoredForm | null> {
    return this.formRepository.findByOwnerAndId(ownerId, id);
  }

  public update(
    ownerId: string,
    id: string,
    definition: IDeclarativeForm,
  ): Promise<IStoredForm | null> {
    return this.formRepository.setDefinition(ownerId, id, definition);
  }

  public async findById(id: string): Promise<IDeclarativeForm | null> {
    if (id.startsWith('b')) {
      const form = await this.formRepository.findById(id);

      return form ? { ...form.definition, id: form.id } : null;
    }

    if (!id.startsWith(GITHUB_FORM_PREFIX)) {
      return null;
    }

    const gitHubFile = await this.gitHubFileRepository.findById(id);

    if (!gitHubFile) {
      return null;
    }

    const text = await this.gitHubGateway.findYamlFile(
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
    const parts = slug.split('/');

    if (parts.length < 4) {
      return null;
    }

    const owner = parts[1];
    const repository = parts[2];
    const file = parts.slice(3).join('/');
    const resolvedBranch = branch || DEFAULT_BRANCH;

    const text = await this.gitHubGateway.findYamlFile(
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
