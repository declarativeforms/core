export async function fetchGitHubUser(
  accessToken: string,
): Promise<{ id: number; login: string; name: string | null; avatar_url: string; email: string | null } | null> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    return null;
  }

  const data: any = await response.json();

  return {
    id: data.id,
    login: data.login,
    name: data.name || null,
    avatar_url: data.avatar_url,
    email: data.email || null,
  };
}

export async function fetchGitHubYaml(
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

export async function hasRequiredGitHubPermissions(
  token: string,
  owner: string,
  repository: string,
): Promise<boolean> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repository}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
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
