import type { User } from '../types';

export class GitHubGateway {
  public async findAccessToken(code: string): Promise<string | null> {
    const response = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.STUDIO_GITHUB_CLIENT_ID as string,
          client_secret: process.env.STUDIO_GITHUB_CLIENT_SECRET as string,
          code,
        }),
      },
    );

    const data: any = await response.json();

    return data.access_token || null;
  }

  public async findUser(accessToken: string): Promise<User | null> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as any;

    return {
      username: data.email,
    };
  }

  public async hasAdminOrPushPermissions(
    accessToken: string,
    owner: string,
    repository: string,
  ): Promise<boolean> {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repository}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      return false;
    }

    const data: any = await response.json();

    const permissions = data.permissions;

    return Boolean(
      permissions && (permissions.admin === true || permissions.push === true),
    );
  }

  public async retrieveYamlFile(
    owner: string,
    repository: string,
    file: string,
    token?: string,
    branch = 'main',
  ): Promise<string | null> {
    if (token) {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repository}/contents/${file}.yaml`,
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
