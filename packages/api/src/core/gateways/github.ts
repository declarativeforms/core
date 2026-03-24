export async function fetchGitHubYaml(
  owner: string,
  repository: string,
  file: string,
  token?: string,
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
    `https://raw.githubusercontent.com/${owner}/${repository}/main/${file}.yaml`,
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
