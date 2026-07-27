export class GitHubGateway {
  public async retrieveYamlFile(
    owner: string,
    repository: string,
    file: string,
    branch = 'main',
    token?: string,
  ): Promise<string | null> {
    const yamlFile = /\.ya?ml$/i.test(file) ? file : `${file}.yaml`;
    const yamlPath = yamlFile
      .split('/')
      .map(encodeURIComponent)
      .join('/');

    if (token) {
      const response = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/contents/${yamlPath}?ref=${encodeURIComponent(branch)}`,
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
      `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/${encodeURIComponent(branch)}/${yamlPath}`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      return null;
    }

    return response.text();
  }
}
