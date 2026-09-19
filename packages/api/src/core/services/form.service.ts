import { parse, type IDeclarativeForm } from '@declarativeforms/engine';
import md5 from 'md5';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { GitHubGateway } from '../gateways';
import type { GitHubFileRepository } from '../repositories';

const GITHUB_FORM_PREFIX = process.env.GITHUB_FORM_PREFIX || 'a';
const DEFAULT_BRANCH = process.env.GITHUB_DEFAULT_BRANCH || 'main';
const AUTHENTICATION_MESSAGE = 'frms.dev authentication';

function isAuthenticationValid(
  authentication: unknown,
  accessKey: string,
): boolean {
  if (
    typeof authentication !== 'object' ||
    authentication === null ||
    !('verifier' in authentication) ||
    typeof authentication.verifier !== 'string' ||
    !/^[a-f0-9]{64}$/.test(authentication.verifier) ||
    !/^[A-Za-z0-9+/]{43}=$/.test(accessKey)
  ) {
    return false;
  }

  const decoded = Buffer.from(accessKey, 'base64');

  if (decoded.length !== 32 || decoded.toString('base64') !== accessKey) {
    return false;
  }

  const expected = createHmac('sha256', accessKey)
    .update(AUTHENTICATION_MESSAGE)
    .digest();
  const configured = Buffer.from(authentication.verifier, 'hex');

  return timingSafeEqual(expected, configured);
}

export class FormService {
  constructor(
    private gitHubFileRepository: GitHubFileRepository,
    private gitHubGateway: GitHubGateway,
  ) {}

  public async findById(id: string): Promise<IDeclarativeForm | null> {
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

  public async isAuthenticated(
    id: string,
    accessKey: string,
  ): Promise<boolean> {
    const form = await this.findById(id);

    if (!form) {
      return false;
    }

    return isAuthenticationValid(form.authentication, accessKey);
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
