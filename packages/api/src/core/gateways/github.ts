export class GitHubGateway {
  public async retrieveYamlFile(
    owner: string,
    repository: string,
    file: string,
    branch = 'main',
  ): Promise<string | null> {
    const token = process.env.GITHUB_TOKEN;

    if (token) {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repository}/contents/${file}.yaml?ref=${branch}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3.raw',
          },
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        return null;
      }

      return response.text();
    }

    const response = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repository}/${branch}/${file}.yaml`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      return null;
    }

    return response.text();
  }

  public async isPublicRepository(
    owner: string,
    repository: string,
    token: string,
  ): Promise<boolean> {
    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
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

  public async retrieveYamlFileMetadata(
    owner: string,
    repository: string,
    file: string,
    branch: string,
    token: string,
  ): Promise<{ sha?: string } | null> {
    const response = await fetch(
      getContentsUrl(owner, repository, file, branch),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
        cache: 'no-store',
      },
    );

    if (response.status === 404) {
      return {};
    }

    if (!response.ok) {
      return null;
    }

    const value = (await response.json()) as { sha?: string };

    return value.sha ? { sha: value.sha } : null;
  }

  public async createOrUpdateYamlFile(
    owner: string,
    repository: string,
    file: string,
    content: string,
    message: string,
    branch: string,
    token: string,
    sha?: string,
  ): Promise<string | null> {
    const response = await fetch(getContentsUrl(owner, repository, file), {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
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
    });

    if (!response.ok) {
      return null;
    }

    const value = (await response.json()) as { content?: { sha?: string } };

    return value.content?.sha || null;
  }
}

function getContentsUrl(
  owner: string,
  repository: string,
  file: string,
  branch?: string,
): string {
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/contents/${encodeFile(file)}.yaml`;

  return branch ? `${url}?ref=${encodeURIComponent(branch)}` : url;
}

function encodeFile(file: string): string {
  return file.split('/').map(encodeURIComponent).join('/');
}
