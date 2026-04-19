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

    const payload: any = await response.json();

    return payload.access_token || null;
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

    const payload = (await response.json()) as any;

    if (payload.email) {
      return {
        username: payload.email,
      };
    }

    const primaryEmail = await this.findPrimaryEmail(accessToken);

    if (!primaryEmail) {
      return null;
    }

    return {
      username: primaryEmail,
    };
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

  private async findPrimaryEmail(accessToken: string): Promise<string | null> {
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const emails = (await response.json()) as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;

    const primaryEmail = emails.find(
      (entry) => entry.primary && entry.verified,
    );

    return primaryEmail?.email ?? null;
  }
}
