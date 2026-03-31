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
  const record = await findForm(id);

  if (!record) {
    return null;
  }

  if (record.source === 'studio') {
    return findStudioForm(id);
  }

  // source === 'github': fetch YAML from the linked repository
  let text: string | null = null;

  if (record.connection_id) {
    const connection = await findConnection(record.connection_id);
    const token = connection?.access_token;

    if (token) {
      text = await fetchGitHubYaml(
        record.owner,
        record.repository,
        record.file,
        token,
      );
    }
  }

  if (!text) {
    text = await fetchGitHubYaml(record.owner, record.repository, record.file);
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
    source: 'github',
    owner,
    repository,
    ...(connectionId ? { connection_id: connectionId } : {}),
  });

  return {
    ...form,
    id,
  };
}

