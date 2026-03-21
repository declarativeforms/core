import yaml from 'js-yaml';
import md5 from 'md5';
import { findConnection, findForm, upsertForm } from '../repositories';
import type { IDeclarativeForm } from '../types';

async function fetchGitHubYaml(
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

export async function findFormById(
  id: string,
): Promise<IDeclarativeForm | null> {
  const form = await findForm(id);

  if (!form) {
    return null;
  }

  let text: string | null = null;

  if (form.connection_id) {
    const connection = await findConnection(form.connection_id);
    const token = connection?.access_token;

    if (token) {
      text = await fetchGitHubYaml(
        form.owner,
        form.repository,
        form.file,
        token,
      );
    }
  }

  if (!text) {
    text = await fetchGitHubYaml(form.owner, form.repository, form.file);
  }

  if (!text) {
    return null;
  }

  const result = yaml.load(text) as IDeclarativeForm;

  return {
    ...result,
    id,
  };
}

export async function findFormBySlug(
  slug: string,
  connectionId?: string,
): Promise<IDeclarativeForm | null> {
  const parts = slug.split('/');

  if (parts.length < 4) {
    return null;
  }

  const owner = parts[1];
  const repository = parts[2];
  const file = parts.slice(3).join('/');

  let text = await fetchGitHubYaml(owner, repository, file);

  if (!text && connectionId) {
    const connection = await findConnection(connectionId);
    const token = connection?.access_token;

    if (token) {
      text = await fetchGitHubYaml(owner, repository, file, token);
    }
  }

  if (!text) {
    return null;
  }

  const form = yaml.load(text) as IDeclarativeForm;

  const id = md5(slug).substring(0, 8);

  await upsertForm({
    file,
    id,
    owner,
    repository,
    ...(connectionId ? { connection_id: connectionId } : {}),
  });

  return {
    ...form,
    id,
  };
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
