import yaml from 'js-yaml';
import md5 from 'md5';
import { fetchGitHubYaml } from '../gateways';
import {
  findConnection,
  findForm,
  findStudioForm,
  upsertForm,
} from '../repositories';
import type { IDeclarativeForm } from '@declarativeforms/types';

export async function findFormById(
  id: string,
): Promise<IDeclarativeForm | null> {
  const form = await findForm(id);

  if (!form) {
    // Fall back to the studio_forms collection so that forms created
    // in Studio are also reachable via the public /:id route.
    return findStudioForm(id);
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

