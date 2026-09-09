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
}
