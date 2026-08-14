import type { IGitHubFile } from '../types';

export class GitHubGateway {
  constructor(private token: string) {}

  public async isPublicRepository(
    owner: string,
    repository: string,
  ): Promise<boolean> {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repository}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      return false;
    }

    const value = (await response.json()) as { private?: boolean };

    return value.private === false;
  }

  public async retrieveYamlFile(
    owner: string,
    repository: string,
    file: string,
    branch = 'main',
  ): Promise<IGitHubFile | null> {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repository}/contents/${encodeFile(file)}.yaml?ref=${encodeURIComponent(branch)}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/vnd.github+json',
        },
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      return null;
    }

    const value = (await response.json()) as {
      content?: string;
      encoding?: string;
      sha?: string;
    };

    if (value.encoding !== 'base64' || !value.content || !value.sha) {
      return null;
    }

    return {
      content: Buffer.from(value.content.replace(/\n/g, ''), 'base64').toString(
        'utf8',
      ),
      sha: value.sha,
    };
  }

  public async createOrUpdateYamlFile(
    owner: string,
    repository: string,
    file: string,
    content: string,
    message: string,
    branch = 'main',
    sha?: string,
  ): Promise<IGitHubFile | null> {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repository}/contents/${encodeFile(file)}.yaml`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branch,
          content: Buffer.from(content).toString('base64'),
          message,
          ...(sha ? { sha } : {}),
        }),
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      return null;
    }

    const value = (await response.json()) as { content?: { sha?: string } };

    if (!value.content?.sha) {
      return null;
    }

    return {
      content,
      sha: value.content.sha,
    };
  }
}

function encodeFile(file: string): string {
  return file.split('/').map(encodeURIComponent).join('/');
}
